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
    public class PanoramaCacheController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly PanoramaSessionCache _sessionCache;

        // Tune this as needed.
        // Start conservative, then increase if Panorama handles it well.
        private const int MaxParallelDevices = 5;

        public PanoramaCacheController(
            IHttpClientFactory httpClientFactory,
            PanoramaSessionCache sessionCache)
        {
            _httpClientFactory = httpClientFactory;
            _sessionCache = sessionCache;
        }

        // ---------------- Public Endpoints ----------------

        /// <summary>
        /// Builds in-memory Panorama metadata cache:
        /// - Devices
        /// - Device group per device
        /// - Virtual routers per device
        /// - Full interface-to-zone mapping per device
        /// </summary>
        [HttpPost("build")]
        public async Task<IActionResult> BuildCache()
        {
            if (!_sessionCache.HasValidSession)
            {
                return BadRequest("No Panorama session is available.");
            }

            if (_sessionCache.IsCacheBuilding)
            {
                return BadRequest("A cache build is already in progress.");
            }

            var host = _sessionCache.Host;
            var apiKey = _sessionCache.BearerToken;

            try
            {
                _sessionCache.SetCacheBuilding(true);

                // Step 1: Get all devices once
                var devices = await FetchDevicesAsync(host, apiKey);

                if (devices == null || devices.Count == 0)
                {
                    _sessionCache.ClearMetadataCache();
                    return NotFound("No devices were returned from Panorama.");
                }

                // Step 2: Get all device groups once and flatten to serial -> device group
                var serialToDeviceGroup = await FetchDeviceGroupMappingsAsync(host, apiKey);

                var semaphore = new SemaphoreSlim(MaxParallelDevices);

                var tasks = devices.Select(async device =>
                {
                    await semaphore.WaitAsync();

                    try
                    {
                        // Run both per-device calls in parallel
                        var vrTask = GetVirtualRoutersAsync(host, apiKey, device.Serial);
                        var zoneTask = GetAllInterfaceZonesAsync(host, apiKey, device.Serial);

                        await Task.WhenAll(vrTask, zoneTask);

                        var vrs = vrTask.Result ?? new List<string>();
                        var interfaceToZone = zoneTask.Result ?? new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

                        // Fallback: if nothing returned, assume VR1
                        if (vrs.Count == 0)
                        {
                            vrs = new List<string> { "VR1" };
                        }

                        return new CachedPanoramaDevice
                        {
                            Serial = device.Serial,
                            Hostname = device.Hostname,
                            IpAddress = device.IpAddress,
                            Connected = device.Connected,
                            DeviceGroup = serialToDeviceGroup.TryGetValue(device.Serial, out var dg) ? dg : string.Empty,
                            VirtualRouters = vrs,
                            InterfaceToZone = interfaceToZone
                        };
                    }
                    catch
                    {
                        // Keep the device in cache even if its metadata fetch fails
                        // so the system can still show partial state.
                        return new CachedPanoramaDevice
                        {
                            Serial = device.Serial,
                            Hostname = device.Hostname,
                            IpAddress = device.IpAddress,
                            Connected = device.Connected,
                            DeviceGroup = serialToDeviceGroup.TryGetValue(device.Serial, out var dg) ? dg : string.Empty,
                            VirtualRouters = new List<string> { "VR1" },
                            InterfaceToZone = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                        };
                    }
                    finally
                    {
                        semaphore.Release();
                    }
                });

                var cachedDevices = (await Task.WhenAll(tasks)).ToList();

                _sessionCache.SaveMetadataCache(cachedDevices);

                return Ok(new
                {
                    success = true,
                    message = "Panorama metadata cache built successfully.",
                    builtAtUtc = _sessionCache.CacheBuiltAtUtc,
                    totalDevices = cachedDevices.Count,
                    connectedDevices = cachedDevices.Count(d => d.Connected),
                    totalDevicesWithDeviceGroup = cachedDevices.Count(d => !string.IsNullOrWhiteSpace(d.DeviceGroup)),
                    totalVirtualRouters = cachedDevices.Sum(d => d.VirtualRouters.Count),
                    totalInterfaceZoneMappings = cachedDevices.Sum(d => d.InterfaceToZone.Count)
                });
            }
            catch (Exception ex)
            {
                _sessionCache.SetCacheBuildError(ex.Message);
                return Problem($"Error building Panorama cache: {ex.Message}");
            }
            finally
            {
                _sessionCache.SetCacheBuilding(false);
            }
        }

        /// <summary>
        /// Returns the current cache status and summary.
        /// </summary>
        [HttpGet("status")]
        public IActionResult GetCacheStatus()
        {
            var cachedDevices = _sessionCache.GetCachedDevices();

            return Ok(new
            {
                hasValidSession = _sessionCache.HasValidSession,
                isCacheBuilding = _sessionCache.IsCacheBuilding,
                hasMetadataCache = _sessionCache.HasMetadataCache,
                builtAtUtc = _sessionCache.CacheBuiltAtUtc,
                lastError = _sessionCache.CacheBuildError,
                totalDevices = cachedDevices.Count,
                connectedDevices = cachedDevices.Count(d => d.Connected),
                totalDevicesWithDeviceGroup = cachedDevices.Count(d => !string.IsNullOrWhiteSpace(d.DeviceGroup)),
                totalVirtualRouters = cachedDevices.Sum(d => d.VirtualRouters.Count),
                totalInterfaceZoneMappings = cachedDevices.Sum(d => d.InterfaceToZone.Count)
            });
        }

        /// <summary>
        /// Clears only the metadata cache. Does not log out the Panorama session.
        /// </summary>
        [HttpPost("clear")]
        public IActionResult ClearCache()
        {
            _sessionCache.ClearMetadataCache();

            return Ok(new
            {
                success = true,
                message = "Panorama metadata cache cleared."
            });
        }

        /// <summary>
        /// Returns the currently cached devices with device group, VR, and interface/zone metadata.
        /// Helpful for debugging.
        /// </summary>
        [HttpGet("devices")]
        public IActionResult GetCachedDevices()
        {
            if (!_sessionCache.HasMetadataCache)
            {
                return NotFound("No Panorama metadata cache is currently loaded.");
            }

            return Ok(_sessionCache.GetCachedDevices());
        }

        // ---------------- Private Helpers ----------------

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
                throw new Exception($"Panorama error while fetching devices: {body}");
            }

            var rawXml = await response.Content.ReadAsStringAsync();
            var doc = XDocument.Parse(rawXml);

            var devices = new List<PanoramaDeviceInfo>();

            var deviceEntries = doc.Descendants("devices").Elements("entry");

            foreach (var entry in deviceEntries)
            {
                var serial = (string?)entry.Attribute("name") ?? string.Empty;
                var hostname = (string?)entry.Element("hostname") ?? string.Empty;
                var ip = (string?)entry.Element("ip-address") ?? string.Empty;
                var connectedStr = (string?)entry.Element("connected") ?? string.Empty;
                var connected = connectedStr.Equals("yes", StringComparison.OrdinalIgnoreCase);

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
        /// Calls Panorama to get all device groups and returns:
        /// serial -> device group
        /// </summary>
        private async Task<Dictionary<string, string>> FetchDeviceGroupMappingsAsync(string host, string apiKey)
        {
            if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(apiKey))
                throw new ArgumentException("Host and ApiKey are required.");

            var baseUri = host.EndsWith("/")
                ? host[..^1]
                : host;

            var cmdXml = "<show><devicegroups></devicegroups></show>";

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
                throw new Exception($"Panorama error while fetching device groups: {body}");
            }

            var rawXml = await response.Content.ReadAsStringAsync();
            var doc = XDocument.Parse(rawXml);

            var serialToDeviceGroup = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

            var deviceGroupEntries = doc.Descendants("devicegroups").Elements("entry");

            foreach (var dgEntry in deviceGroupEntries)
            {
                var deviceGroupName = (string?)dgEntry.Attribute("name");
                if (string.IsNullOrWhiteSpace(deviceGroupName))
                    continue;

                var deviceEntries = dgEntry.Element("devices")?.Elements("entry")
                    ?? Enumerable.Empty<XElement>();

                foreach (var deviceEntry in deviceEntries)
                {
                    var serial =
                        ((string?)deviceEntry.Element("serial"))?.Trim()
                        ?? ((string?)deviceEntry.Attribute("name"))?.Trim()
                        ?? string.Empty;

                    if (string.IsNullOrWhiteSpace(serial))
                        continue;

                    serialToDeviceGroup[serial] = deviceGroupName;
                }
            }

            return serialToDeviceGroup;
        }

        /// <summary>
        /// Gets all virtual router names for a given device via `show routing summary`.
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

            var vrNames = doc
                .Descendants("result")
                .Elements("entry")
                .Where(e => e.Attribute("name") != null)
                .Select(e => (string?)e.Attribute("name"))
                .Where(name => !string.IsNullOrWhiteSpace(name))
                .Distinct()
                .ToList()!;

            return vrNames;
        }

        /// <summary>
        /// Gets all zone entries for a device and builds:
        /// interface name -> zone name
        ///
        /// This avoids doing one config call per interface later.
        /// </summary>
        private async Task<Dictionary<string, string>> GetAllInterfaceZonesAsync(
            string host,
            string apiKey,
            string deviceSerial)
        {
            var baseUri = host.EndsWith("/")
                ? host[..^1]
                : host;

            var xpath = "/config/devices/entry[@name='localhost.localdomain']/vsys/entry/zone";

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
            response.EnsureSuccessStatusCode();

            var rawXml = await response.Content.ReadAsStringAsync();
            var doc = XDocument.Parse(rawXml);

            var interfaceToZone = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

            var zoneEntries = doc.Descendants("zone").Elements("entry");

            foreach (var zoneEntry in zoneEntries)
            {
                var zoneName = (string?)zoneEntry.Attribute("name");
                if (string.IsNullOrWhiteSpace(zoneName))
                    continue;

                var members = zoneEntry
                    .Descendants("layer3")
                    .Elements("member")
                    .Select(m => m.Value?.Trim())
                    .Where(v => !string.IsNullOrWhiteSpace(v));

                foreach (var iface in members)
                {
                    interfaceToZone[iface!] = zoneName;
                }
            }

            return interfaceToZone;
        }

        // ---------------- Local Models ----------------

        private class PanoramaDeviceInfo
        {
            public string Serial { get; set; } = string.Empty;
            public string Hostname { get; set; } = string.Empty;
            public string IpAddress { get; set; } = string.Empty;
            public bool Connected { get; set; }
        }
    }
}