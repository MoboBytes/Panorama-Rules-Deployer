using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using PanoramaBackend.Services;

namespace PanoramaBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CreateServicesController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly PanoramaSessionCache _sessionCache;

        public CreateServicesController(
            IHttpClientFactory httpClientFactory,
            PanoramaSessionCache sessionCache)
        {
            _httpClientFactory = httpClientFactory;
            _sessionCache = sessionCache;
        }

        // ---------------- Models ----------------

        public class GetServicesRequest
        {
            public string DeviceGroup { get; set; } = string.Empty;
        }

        public class PanoramaServiceEntry
        {
            public string Name { get; set; } = string.Empty;
            public string Location { get; set; } = string.Empty;
            public string DeviceGroup { get; set; } = string.Empty;
            public string EntryType { get; set; } = string.Empty; // built-in | service-object | service-group
        }

        private class ServicesApiResponse
        {
            [JsonPropertyName("@status")]
            public string? Status { get; set; }

            [JsonPropertyName("@code")]
            public string? Code { get; set; }

            [JsonPropertyName("result")]
            public ServicesApiResult? Result { get; set; }
        }

        private class ServicesApiResult
        {
            [JsonPropertyName("@total-count")]
            public string? TotalCount { get; set; }

            [JsonPropertyName("@count")]
            public string? Count { get; set; }

            [JsonPropertyName("entry")]
            public List<ServicesApiEntry>? Entry { get; set; }
        }

        private class ServicesApiEntry
        {
            [JsonPropertyName("@name")]
            public string? Name { get; set; }

            [JsonPropertyName("@location")]
            public string? Location { get; set; }

            [JsonPropertyName("@device-group")]
            public string? DeviceGroup { get; set; }
        }

        // ---------------- Public Endpoint ----------------

        /// <summary>
        /// Returns a combined list of:
        /// - built-in service values: application-default, any
        /// - predefined/shared/device-group service objects
        /// - predefined/shared/device-group service groups
        /// </summary>
        [HttpPost("all")]
        public async Task<IActionResult> GetAllServices([FromBody] GetServicesRequest request)
        {
            if (!_sessionCache.HasValidSession)
            {
                return BadRequest("No Panorama session is available. Please log in first.");
            }

            if (string.IsNullOrWhiteSpace(request.DeviceGroup))
            {
                return BadRequest("DeviceGroup is required.");
            }

            var host = _sessionCache.Host;
            var apiKey = _sessionCache.BearerToken;

            try
            {
                var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Clear();
                client.DefaultRequestHeaders.Add("X-PAN-KEY", apiKey);

                var baseHost = NormalizeHost(host);

                var serviceObjectsPredefinedUrl =
                    $"{baseHost}/restapi/v11.2/Objects/Services?location=predefined";

                var serviceObjectsSharedUrl =
                    $"{baseHost}/restapi/v11.2/Objects/Services?location=shared";

                var serviceObjectsDeviceGroupUrl =
                    $"{baseHost}/restapi/v11.2/Objects/Services?location=device-group&device-group={Uri.EscapeDataString(request.DeviceGroup)}";

                var serviceGroupsPredefinedUrl =
                    $"{baseHost}/restapi/v11.2/Objects/ServiceGroups?location=predefined";

                var serviceGroupsSharedUrl =
                    $"{baseHost}/restapi/v11.2/Objects/ServiceGroups?location=shared";

                var serviceGroupsDeviceGroupUrl =
                    $"{baseHost}/restapi/v11.2/Objects/ServiceGroups?location=device-group&device-group={Uri.EscapeDataString(request.DeviceGroup)}";

                var serviceObjectsPredefinedTask =
                    FetchServicesAsync(client, serviceObjectsPredefinedUrl, "service-object");
                var serviceObjectsSharedTask =
                    FetchServicesAsync(client, serviceObjectsSharedUrl, "service-object");
                var serviceObjectsDeviceGroupTask =
                    FetchServicesAsync(client, serviceObjectsDeviceGroupUrl, "service-object");

                var serviceGroupsPredefinedTask =
                    FetchServicesAsync(client, serviceGroupsPredefinedUrl, "service-group");
                var serviceGroupsSharedTask =
                    FetchServicesAsync(client, serviceGroupsSharedUrl, "service-group");
                var serviceGroupsDeviceGroupTask =
                    FetchServicesAsync(client, serviceGroupsDeviceGroupUrl, "service-group");

                await Task.WhenAll(
                    serviceObjectsPredefinedTask,
                    serviceObjectsSharedTask,
                    serviceObjectsDeviceGroupTask,
                    serviceGroupsPredefinedTask,
                    serviceGroupsSharedTask,
                    serviceGroupsDeviceGroupTask
                );

                var combined = new List<PanoramaServiceEntry>
                {
                    new PanoramaServiceEntry
                    {
                        Name = "application-default",
                        Location = "built-in",
                        DeviceGroup = string.Empty,
                        EntryType = "built-in"
                    },
                    new PanoramaServiceEntry
                    {
                        Name = "any",
                        Location = "built-in",
                        DeviceGroup = string.Empty,
                        EntryType = "built-in"
                    }
                };

                combined.AddRange(serviceObjectsPredefinedTask.Result);
                combined.AddRange(serviceObjectsSharedTask.Result);
                combined.AddRange(serviceObjectsDeviceGroupTask.Result);
                combined.AddRange(serviceGroupsPredefinedTask.Result);
                combined.AddRange(serviceGroupsSharedTask.Result);
                combined.AddRange(serviceGroupsDeviceGroupTask.Result);

                var deduped = combined
                    .GroupBy(s => new
                    {
                        Name = s.Name,
                        Location = s.Location,
                        DeviceGroup = s.DeviceGroup,
                        EntryType = s.EntryType
                    })
                    .Select(g => g.First())
                    .OrderBy(s => s.Name)
                    .ToList();

                return Ok(deduped);
            }
            catch (Exception ex)
            {
                return Problem($"Error retrieving Panorama services: {ex.Message}");
            }
        }

        // ---------------- Private Helpers ----------------

        private static string NormalizeHost(string host)
        {
            return host.EndsWith("/")
                ? host[..^1]
                : host;
        }

        private async Task<List<PanoramaServiceEntry>> FetchServicesAsync(
            HttpClient client,
            string url,
            string entryType)
        {
            var response = await client.GetAsync(url);
            var body = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"Panorama services API error from {url}: {body}");
            }

            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            var parsed = JsonSerializer.Deserialize<ServicesApiResponse>(body, options);

            if (parsed?.Result?.Entry == null || !parsed.Result.Entry.Any())
            {
                return new List<PanoramaServiceEntry>();
            }

            return parsed.Result.Entry.Select(entry => new PanoramaServiceEntry
            {
                Name = entry.Name ?? string.Empty,
                Location = entry.Location ?? string.Empty,
                DeviceGroup = entry.DeviceGroup ?? string.Empty,
                EntryType = entryType
            }).ToList();
        }
    }
}