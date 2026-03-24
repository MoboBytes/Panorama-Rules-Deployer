using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;
using System.Xml.Linq;
using Microsoft.AspNetCore.Mvc;
using PanoramaBackend.Services;

namespace PanoramaBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PanoramaZoneCollectorController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly PanoramaSessionCache _sessionCache;

        public PanoramaZoneCollectorController(
             IHttpClientFactory httpClientFactory,
             PanoramaSessionCache sessionCache)
        {
            _httpClientFactory = httpClientFactory;
            _sessionCache = sessionCache;
        }

        // ----------- Models -----------

        // Request model for getting devices
        public class PanoramaDevicesRequest
        {
            
        }

        // Response model for a single device
        public class PanoramaDeviceInfo
        {
            public string Serial { get; set; } = string.Empty;
            public string Hostname { get; set; } = string.Empty;
            public string IpAddress { get; set; } = string.Empty;
            public bool Connected { get; set; }
        }

        // Request model for zone-by-ip
        public class ZoneByIpRequest
        {
            public string Ip { get; set; } = string.Empty;       // Target IP behind firewall
        }

        // Response model for zone-by-ip result
        public class ZoneByIpResult
        {
            public string DeviceSerial { get; set; } = string.Empty;
            public string DeviceHostname { get; set; } = string.Empty;
            public string DeviceIpAddress { get; set; } = string.Empty;
            public string VirtualRouter { get; set; } = string.Empty;
            public string EgressInterface { get; set; } = string.Empty;
            public string Zone { get; set; } = string.Empty;
        }

        // ----------- Public endpoints -----------

        /// <summary>
        /// Returns a list of devices managed by Panorama 
        /// (based on `show devices all`).
        /// </summary>
        [HttpPost("devices")]
        public async Task<IActionResult> GetDevices([FromBody] PanoramaDevicesRequest request)
        {
            if (!_sessionCache.HasValidSession)
            {
                return BadRequest("No Panorama session is available. Please log in first.");
            }

            try
            {
                var devices = await FetchDevicesAsync(_sessionCache.Host, _sessionCache.BearerToken);
                return Ok(devices);
            }
            catch (Exception ex)
            {
                return Problem($"Error fetching devices: {ex.Message}");
            }
        }

        /// <summary>
        /// Given an IP (behind a firewall), finds which firewall, virtual router,
        /// interface, and zone would be used to reach it.
        /// - Skips zones named "inside" while searching.
        /// - If all matches are "inside", returns the first "inside" match
        ///   with a note that it needs verification.
        /// </summary>

        [HttpPost("zone-by-ip")]
        public async Task<IActionResult> GetZoneByIp([FromBody] ZoneByIpRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Ip))
            {
                return BadRequest("Ip is required.");
            }

            if (!_sessionCache.HasValidSession)
            {
                return BadRequest("No Panorama session is available. Please log in first.");
            }

            var host = _sessionCache.Host;
            var apiKey = _sessionCache.BearerToken;

            List<PanoramaDeviceInfo> devices;
            try
            {
                devices = await FetchDevicesAsync(host, apiKey);
            }
            catch (Exception ex)
            {
                return Problem($"Error fetching devices: {ex.Message}");
            }

            var connectedDevices = devices.Where(d => d.Connected).ToList();
            if (!connectedDevices.Any())
                return NotFound("No connected devices found.");

            ZoneByIpResult? firstInsideResult = null;

            foreach (var device in connectedDevices)
            {
                try
                {
                    var result = await TryResolveOnDeviceAsync(
                        host,
                        apiKey,
                        device,
                        request.Ip);

                    if (result == null)
                        continue;

                    if (!string.Equals(result.Zone, "inside", StringComparison.OrdinalIgnoreCase)
                        && !string.Equals(result.Zone, "outside", StringComparison.OrdinalIgnoreCase)
                        && !string.Equals(result.Zone, "extranet-firewall", StringComparison.OrdinalIgnoreCase))
                    {
                        return Ok(result);
                    }

                    if (firstInsideResult == null)
                    {
                        firstInsideResult = result;
                    }
                }
                catch
                {
                    continue;
                }
            }

            if (firstInsideResult != null)
            {
                return Ok(new
                {
                    deviceSerial = firstInsideResult.DeviceSerial,
                    deviceHostname = firstInsideResult.DeviceHostname,
                    deviceIpAddress = firstInsideResult.DeviceIpAddress,
                    virtualRouter = firstInsideResult.VirtualRouter,
                    egressInterface = firstInsideResult.EgressInterface,
                    zone = firstInsideResult.Zone,
                    note = "Zone = inside so needs verification"
                });
            }

            return NotFound($"No firewall route found for IP {request.Ip}");
        }

        // ----------- Private helpers -----------

        /// <summary>
        /// Calls Panorama to get all devices from `show devices all`.
        /// </summary>
        private async Task<List<PanoramaDeviceInfo>> FetchDevicesAsync(string host, string apiKey)
        {
            if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(apiKey))
                throw new ArgumentException("Host and ApiKey are required.");

            var baseUri = host.EndsWith("/")
                ? host[..^1]
                : host;

            var cmdXml = "<show><devices><all></all></devices></show>";

            var query = HttpUtility.ParseQueryString(string.Empty);
            query["type"] = "op";
            query["cmd"] = cmdXml;
            query["key"] = apiKey;

            var uriBuilder = new UriBuilder(new Uri(new Uri(baseUri), "/api/"))
            {
                Query = query.ToString()
            };

            var client = _httpClientFactory.CreateClient();
            var response = await client.GetAsync(uriBuilder.Uri);

            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync();
                throw new Exception($"Panorama error: {body}");
            }

            var rawXml = await response.Content.ReadAsStringAsync();
            var doc = XDocument.Parse(rawXml);

            var devices = new List<PanoramaDeviceInfo>();

            // Expected structure: <response><result><devices><entry ...>...</entry></devices></result></response>
            var deviceEntries = doc.Descendants("devices").Elements("entry");

            foreach (var entry in deviceEntries)
            {
                var serial = (string?)entry.Attribute("name") ?? string.Empty;
                var hostname = (string?)entry.Element("hostname") ?? string.Empty;
                var ip = (string?)entry.Element("ip-address") ?? string.Empty;
                var connectedStr = (string?)entry.Element("connected") ?? string.Empty;
                bool connected = connectedStr.Equals("yes", StringComparison.OrdinalIgnoreCase);

                devices.Add(new PanoramaDeviceInfo
                {
                    Serial = serial,
                    Hostname = hostname,
                    IpAddress = ip,
                    Connected = connected
                });
            }

            return devices;
        }

        /// <summary>
        /// Gets all virtual router names for a given device (via `show routing summary`).
        /// </summary>
        private async Task<List<string>> GetVirtualRoutersAsync(string host, string apiKey, string deviceSerial)
        {
            var baseUri = host.EndsWith("/")
                ? host[..^1]
                : host;

            var cmdXml = "<show><routing><summary></summary></routing></show>";

            var query = HttpUtility.ParseQueryString(string.Empty);
            query["type"] = "op";
            query["cmd"] = cmdXml;
            query["target"] = deviceSerial;
            query["key"] = apiKey;

            var uriBuilder = new UriBuilder(new Uri(new Uri(baseUri), "/api/"))
            {
                Query = query.ToString()
            };

            var client = _httpClientFactory.CreateClient();
            var response = await client.GetAsync(uriBuilder.Uri);
            response.EnsureSuccessStatusCode();

            var rawXml = await response.Content.ReadAsStringAsync();
            var doc = XDocument.Parse(rawXml);

            // Structure:
            // <response><result>
            //   <entry>...summary...</entry>
            //   <entry name="VR1"/>
            //   <entry name="VR-902"/>
            //   ...
            // </result></response>
            var vrNames = doc
                .Descendants("result")
                .Elements("entry")
                .Where(e => e.Attribute("name") != null) // only VR entries
                .Select(e => (string?)e.Attribute("name"))
                .Where(name => !string.IsNullOrWhiteSpace(name))
                .Distinct()
                .ToList()!;

            return vrNames;
        }

        /// <summary>
        /// Runs fib-lookup for a given device+VR+IP and returns the egress interface, or null if no route.
        /// </summary>
        private async Task<string?> FibLookupAsync(
            string host,
            string apiKey,
            string deviceSerial,
            string vrName,
            string ip)
        {
            var baseUri = host.EndsWith("/")
                ? host[..^1]
                : host;

            var cmdXml =
                $"<test><routing><fib-lookup><virtual-router>{vrName}</virtual-router><ip>{ip}</ip></fib-lookup></routing></test>";

            var query = HttpUtility.ParseQueryString(string.Empty);
            query["type"] = "op";
            query["cmd"] = cmdXml;
            query["target"] = deviceSerial;
            query["key"] = apiKey;

            var uriBuilder = new UriBuilder(new Uri(new Uri(baseUri), "/api/"))
            {
                Query = query.ToString()
            };

            var client = _httpClientFactory.CreateClient();
            var response = await client.GetAsync(uriBuilder.Uri);
            if (!response.IsSuccessStatusCode)
                return null;

            var rawXml = await response.Content.ReadAsStringAsync();
            var doc = XDocument.Parse(rawXml);

            // Your PAN‑OS returns: <response><result><interface>aeX.Y</interface>...</result></response>
            var result = doc.Descendants("result").FirstOrDefault();
            if (result == null)
                return null;

            var iface = (string?)result.Element("interface")
                        ?? (string?)result.Element("egress-interface");

            return string.IsNullOrWhiteSpace(iface) ? null : iface;
        }

        /// <summary>
        /// Uses config XPath (via Panorama target) to get the zone name that contains the given interface
        /// as a layer3 member.
        /// </summary>
        private async Task<string?> GetZoneForInterfaceAsync(
            string host,
            string apiKey,
            string deviceSerial,
            string interfaceName)
        {
            var baseUri = host.EndsWith("/")
                ? host[..^1]
                : host;

            var xpath =
                $"/config/devices/entry[@name='localhost.localdomain']/vsys/entry/zone/entry[network/layer3/member='{interfaceName}']";

            var query = HttpUtility.ParseQueryString(string.Empty);
            query["type"] = "config";
            query["action"] = "get";
            query["xpath"] = xpath;
            query["target"] = deviceSerial;
            query["key"] = apiKey;

            var uriBuilder = new UriBuilder(new Uri(new Uri(baseUri), "/api/"))
            {
                Query = query.ToString()
            };

            var client = _httpClientFactory.CreateClient();
            var response = await client.GetAsync(uriBuilder.Uri);
            if (!response.IsSuccessStatusCode)
                return null;

            var rawXml = await response.Content.ReadAsStringAsync();
            var doc = XDocument.Parse(rawXml);

            var zoneEntry = doc.Descendants("result").Elements("entry").FirstOrDefault();
            if (zoneEntry == null)
                return null;

            return (string?)zoneEntry.Attribute("name");
        }

        /// <summary>
        /// For a given device, tries each VR and returns:
        /// - First non-"inside" match if found, else
        /// - First "inside" match if any, else null.
        /// </summary>
        private async Task<ZoneByIpResult?> TryResolveOnDeviceAsync(
            string host,
            string apiKey,
            PanoramaDeviceInfo device,
            string ip)
        {
            var vrNames = await GetVirtualRoutersAsync(host, apiKey, device.Serial);
            if (vrNames == null || vrNames.Count == 0)
                return null;

            ZoneByIpResult? insideFallback = null;

            foreach (var vr in vrNames)
            {
                var iface = await FibLookupAsync(host, apiKey, device.Serial, vr, ip);
                if (string.IsNullOrWhiteSpace(iface))
                    continue;

                var zone = await GetZoneForInterfaceAsync(host, apiKey, device.Serial, iface);
                if (string.IsNullOrWhiteSpace(zone))
                    continue;

                var result = new ZoneByIpResult
                {
                    DeviceSerial = device.Serial,
                    DeviceHostname = device.Hostname,
                    DeviceIpAddress = device.IpAddress,
                    VirtualRouter = vr,
                    EgressInterface = iface,
                    Zone = zone
                };

                if (!string.Equals(zone, "inside", StringComparison.OrdinalIgnoreCase) && !string.Equals(zone, "outside", StringComparison.OrdinalIgnoreCase) && !string.Equals(zone, "extranet-firewall", StringComparison.OrdinalIgnoreCase))
                {
                    // Non-"inside" match: return immediately.
                    return result;
                }

                // Zone is "inside": remember as fallback, but keep searching other VRs.
                if (insideFallback == null)
                {
                    insideFallback = result;
                }
            }

            // Only "inside" matches, or none at all.
            return insideFallback;
        }
    }
}