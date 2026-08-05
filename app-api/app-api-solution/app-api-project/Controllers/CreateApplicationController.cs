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
    public class CreateApplicationsController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly PanoramaSessionCache _sessionCache;

        public CreateApplicationsController(
            IHttpClientFactory httpClientFactory,
            PanoramaSessionCache sessionCache)
        {
            _httpClientFactory = httpClientFactory;
            _sessionCache = sessionCache;
        }

        // ---------------- Models ----------------

        public class GetApplicationsRequest
        {
            public string DeviceGroup { get; set; } = string.Empty;
        }

        public class PanoramaApplicationEntry
        {
            public string Name { get; set; } = string.Empty;
            public string Location { get; set; } = string.Empty;
            public string DeviceGroup { get; set; } = string.Empty;
            public string EntryType { get; set; } = string.Empty; // built-in | application | application-group
        }

        private class ApplicationsApiResponse
        {
            [JsonPropertyName("@status")]
            public string? Status { get; set; }

            [JsonPropertyName("@code")]
            public string? Code { get; set; }

            [JsonPropertyName("result")]
            public ApplicationsApiResult? Result { get; set; }
        }

        private class ApplicationsApiResult
        {
            [JsonPropertyName("@total-count")]
            public string? TotalCount { get; set; }

            [JsonPropertyName("@count")]
            public string? Count { get; set; }

            [JsonPropertyName("entry")]
            public List<ApplicationsApiEntry>? Entry { get; set; }
        }

        private class ApplicationsApiEntry
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
        /// - built-in application value: any
        /// - predefined/shared/device-group applications
        /// - shared/device-group application groups
        /// </summary>
        [HttpPost("all")]
        public async Task<IActionResult> GetAllApplications([FromBody] GetApplicationsRequest request)
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

                var applicationsPredefinedUrl =
                    $"{baseHost}/restapi/v11.2/Objects/Applications?location=predefined";

                var applicationsSharedUrl =
                    $"{baseHost}/restapi/v11.2/Objects/Applications?location=shared";

                var applicationsDeviceGroupUrl =
                    $"{baseHost}/restapi/v11.2/Objects/Applications?location=device-group&device-group={Uri.EscapeDataString(request.DeviceGroup)}";

                var applicationGroupsSharedUrl =
                    $"{baseHost}/restapi/v11.2/Objects/ApplicationGroups?location=shared";

                var applicationGroupsDeviceGroupUrl =
                    $"{baseHost}/restapi/v11.2/Objects/ApplicationGroups?location=device-group&device-group={Uri.EscapeDataString(request.DeviceGroup)}";

                var applicationsPredefinedTask =
                    FetchApplicationsAsync(client, applicationsPredefinedUrl, "application");
                var applicationsSharedTask =
                    FetchApplicationsAsync(client, applicationsSharedUrl, "application");
                var applicationsDeviceGroupTask =
                    FetchApplicationsAsync(client, applicationsDeviceGroupUrl, "application");

                var applicationGroupsSharedTask =
                    FetchApplicationsAsync(client, applicationGroupsSharedUrl, "application-group");
                var applicationGroupsDeviceGroupTask =
                    FetchApplicationsAsync(client, applicationGroupsDeviceGroupUrl, "application-group");

                await Task.WhenAll(
                    applicationsPredefinedTask,
                    applicationsSharedTask,
                    applicationsDeviceGroupTask,
                    applicationGroupsSharedTask,
                    applicationGroupsDeviceGroupTask
                );

                var combined = new List<PanoramaApplicationEntry>
                {
                    new PanoramaApplicationEntry
                    {
                        Name = "any",
                        Location = "built-in",
                        DeviceGroup = string.Empty,
                        EntryType = "built-in"
                    }
                };

                combined.AddRange(applicationsPredefinedTask.Result);
                combined.AddRange(applicationsSharedTask.Result);
                combined.AddRange(applicationsDeviceGroupTask.Result);
                combined.AddRange(applicationGroupsSharedTask.Result);
                combined.AddRange(applicationGroupsDeviceGroupTask.Result);

                var deduped = combined
                    .GroupBy(a => new
                    {
                        Name = a.Name,
                        Location = a.Location,
                        DeviceGroup = a.DeviceGroup,
                        EntryType = a.EntryType
                    })
                    .Select(g => g.First())
                    .OrderBy(a => a.Name)
                    .ToList();

                return Ok(deduped);
            }
            catch (Exception ex)
            {
                return Problem($"Error retrieving Panorama applications: {ex.Message}");
            }
        }

        // ---------------- Private Helpers ----------------

        private static string NormalizeHost(string host)
        {
            return host.EndsWith("/")
                ? host[..^1]
                : host;
        }

        private async Task<List<PanoramaApplicationEntry>> FetchApplicationsAsync(
            HttpClient client,
            string url,
            string entryType)
        {
            var response = await client.GetAsync(url);
            var body = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"Panorama applications API error from {url}: {body}");
            }

            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            var parsed = JsonSerializer.Deserialize<ApplicationsApiResponse>(body, options);

            if (parsed?.Result?.Entry == null || !parsed.Result.Entry.Any())
            {
                return new List<PanoramaApplicationEntry>();
            }

            return parsed.Result.Entry.Select(entry => new PanoramaApplicationEntry
            {
                Name = entry.Name ?? string.Empty,
                Location = entry.Location ?? string.Empty,
                DeviceGroup = entry.DeviceGroup ?? string.Empty,
                EntryType = entryType
            }).ToList();
        }
    }
}