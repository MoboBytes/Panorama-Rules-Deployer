using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using System.Web;
using System.Xml.Linq;
using Microsoft.AspNetCore.Mvc;
using PanoramaBackend.Services;

namespace PanoramaBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PanoramaIPtoZoneController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly PanoramaSessionCache _sessionCache;

        // Tune as needed
        private const int MaxParallelDevices = 5;

        public PanoramaIPtoZoneController(
            IHttpClientFactory httpClientFactory,
            PanoramaSessionCache sessionCache)
        {
            _httpClientFactory = httpClientFactory;
            _sessionCache = sessionCache;
        }

        // ---------------- Models ----------------

        public class ZoneByIpRequest
        {
            public string Ip { get; set; } = string.Empty;
        }

        public class ZoneByIpResult
        {
            public string DeviceSerial { get; set; } = string.Empty;
            public string DeviceHostname { get; set; } = string.Empty;
            public string DeviceIpAddress { get; set; } = string.Empty;
            public string DeviceGroup { get; set; } = string.Empty;
            public string VirtualRouter { get; set; } = string.Empty;
            public string EgressInterface { get; set; } = string.Empty;
            public string Zone { get; set; } = string.Empty;
        }

        // ---------------- Public Endpoint ----------------

        /// <summary>
        /// Given an IP behind a firewall, finds which firewall, virtual router,
        /// egress interface, zone, and device group would be used to reach it.
        ///
        /// Uses cached:
        /// - devices
        /// - device groups
        /// - VRs
        /// - interface -> zone mappings
        ///
        /// Performs live:
        /// - fib-lookup
        ///
        /// Zones named inside, outside, or internet are skipped and never returned.
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

            if (_sessionCache.IsCacheBuilding)
            {
                return BadRequest("Panorama metadata cache is still building. Please wait and try again.");
            }

            if (!_sessionCache.HasMetadataCache)
            {
                return BadRequest("No Panorama metadata cache is available. Please build the cache first.");
            }

            var host = _sessionCache.Host;
            var apiKey = _sessionCache.BearerToken;

            var cachedDevices = _sessionCache
                .GetCachedDevices()
                .Where(d => d.Connected)
                .ToList();

            if (!cachedDevices.Any())
            {
                return NotFound("No connected cached devices found.");
            }

            var semaphore = new SemaphoreSlim(MaxParallelDevices);

            var tasks = cachedDevices.Select(async device =>
            {
                await semaphore.WaitAsync();
                try
                {
                    return await TryResolveOnDeviceAsync(host, apiKey, device, request.Ip);
                }
                catch
                {
                    return null;
                }
                finally
                {
                    semaphore.Release();
                }
            });

            var results = (await Task.WhenAll(tasks))
                .Where(r => r != null)
                .Cast<ZoneByIpResult>()
                .ToList();

            if (!results.Any())
            {
                return NotFound($"No non-generic zone found for IP {request.Ip}");
            }

            // Any returned result is already guaranteed to be valid
            return Ok(results.First());
        }

        // ---------------- Private Helpers ----------------

        /// <summary>
        /// For a given cached device, tries each cached VR and resolves:
        /// IP -> fib-lookup -> interface -> cached zone
        ///
        /// Zones inside, outside, extranet-firewall, and internet are skipped.
        /// Returns the first valid non-generic zone found, else null.
        /// </summary>
        private async Task<ZoneByIpResult?> TryResolveOnDeviceAsync(
            string host,
            string apiKey,
            CachedPanoramaDevice device,
            string ip)
        {
            var vrNames = (device.VirtualRouters != null && device.VirtualRouters.Any())
                ? device.VirtualRouters
                : new List<string> { "VR1" };

            foreach (var vr in vrNames)
            {
                var iface = await FibLookupAsync(host, apiKey, device.Serial, vr, ip);
                if (string.IsNullOrWhiteSpace(iface))
                    continue;

                if (!device.InterfaceToZone.TryGetValue(iface, out var zone) ||
                    string.IsNullOrWhiteSpace(zone))
                {
                    continue;
                }

                // Skip generic zones completely
                if (IsSkippedZone(zone))
                {
                    continue;
                }

                return new ZoneByIpResult
                {
                    DeviceSerial = device.Serial,
                    DeviceHostname = device.Hostname,
                    DeviceIpAddress = device.IpAddress,
                    DeviceGroup = device.DeviceGroup,
                    VirtualRouter = vr,
                    EgressInterface = iface,
                    Zone = zone
                };
            }

            return null;
        }

        /// <summary>
        /// Runs fib-lookup for a given device+VR+IP and returns the egress interface,
        /// or null if no route exists.
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

            var result = doc.Descendants("result").FirstOrDefault();
            if (result == null)
                return null;

            var iface =
                (string?)result.Element("interface") ??
                (string?)result.Element("egress-interface");

            return string.IsNullOrWhiteSpace(iface) ? null : iface;
        }

        private static bool IsSkippedZone(string zone)
        {
            return string.Equals(zone, "inside", StringComparison.OrdinalIgnoreCase)
                || string.Equals(zone, "outside", StringComparison.OrdinalIgnoreCase)
                || string.Equals(zone, "extranet-firewall", StringComparison.OrdinalIgnoreCase)
                || string.Equals(zone, "internet", StringComparison.OrdinalIgnoreCase);
        }
    }
}