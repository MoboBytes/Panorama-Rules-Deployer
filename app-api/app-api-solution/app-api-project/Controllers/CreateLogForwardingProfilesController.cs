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
    public class CreateLogForwardingProfilesController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly PanoramaSessionCache _sessionCache;

        public CreateLogForwardingProfilesController(
            IHttpClientFactory httpClientFactory,
            PanoramaSessionCache sessionCache)
        {
            _httpClientFactory = httpClientFactory;
            _sessionCache = sessionCache;
        }

        // ---------------- Models ----------------

        public class GetLogForwardingProfilesRequest
        {
            public string DeviceGroup { get; set; } = string.Empty;
        }

        public class PanoramaLogForwardingProfileEntry
        {
            public string Name { get; set; } = string.Empty;
            public string Location { get; set; } = string.Empty;
            public string DeviceGroup { get; set; } = string.Empty;
        }

        private class LogForwardingApiResponse
        {
            [JsonPropertyName("@status")]
            public string? Status { get; set; }

            [JsonPropertyName("@code")]
            public string? Code { get; set; }

            [JsonPropertyName("result")]
            public LogForwardingApiResult? Result { get; set; }
        }

        private class LogForwardingApiResult
        {
            [JsonPropertyName("@total-count")]
            public string? TotalCount { get; set; }

            [JsonPropertyName("@count")]
            public string? Count { get; set; }

            [JsonPropertyName("entry")]
            public List<LogForwardingApiEntry>? Entry { get; set; }
        }

        private class LogForwardingApiEntry
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
        /// - shared log forwarding profiles
        /// - device-group log forwarding profiles for the requested device group
        /// </summary>
        [HttpPost("all")]
        public async Task<IActionResult> GetAllLogForwardingProfiles([FromBody] GetLogForwardingProfilesRequest request)
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

                var sharedUrl =
                    $"{NormalizeHost(host)}/restapi/v11.2/Objects/LogForwardingProfiles?location=shared";

                var deviceGroupUrl =
                    $"{NormalizeHost(host)}/restapi/v11.2/Objects/LogForwardingProfiles?location=device-group&device-group={Uri.EscapeDataString(request.DeviceGroup)}";

                var sharedTask = FetchLogForwardingProfilesAsync(client, sharedUrl);
                var deviceGroupTask = FetchLogForwardingProfilesAsync(client, deviceGroupUrl);

                await Task.WhenAll(sharedTask, deviceGroupTask);

                var combined = new List<PanoramaLogForwardingProfileEntry>();
                combined.AddRange(sharedTask.Result);
                combined.AddRange(deviceGroupTask.Result);

                var deduped = combined
                    .GroupBy(p => new
                    {
                        Name = p.Name,
                        Location = p.Location,
                        DeviceGroup = p.DeviceGroup
                    })
                    .Select(g => g.First())
                    .OrderBy(p => p.Name)
                    .ToList();

                return Ok(deduped);
            }
            catch (Exception ex)
            {
                return Problem($"Error retrieving Panorama log forwarding profiles: {ex.Message}");
            }
        }

        // ---------------- Private Helpers ----------------

        private static string NormalizeHost(string host)
        {
            return host.EndsWith("/")
                ? host[..^1]
                : host;
        }

        private async Task<List<PanoramaLogForwardingProfileEntry>> FetchLogForwardingProfilesAsync(HttpClient client, string url)
        {
            var response = await client.GetAsync(url);
            var body = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"Panorama log forwarding profile API error from {url}: {body}");
            }

            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            var parsed = JsonSerializer.Deserialize<LogForwardingApiResponse>(body, options);

            if (parsed?.Result?.Entry == null || !parsed.Result.Entry.Any())
            {
                return new List<PanoramaLogForwardingProfileEntry>();
            }

            return parsed.Result.Entry.Select(entry => new PanoramaLogForwardingProfileEntry
            {
                Name = entry.Name ?? string.Empty,
                Location = entry.Location ?? string.Empty,
                DeviceGroup = entry.DeviceGroup ?? string.Empty
            }).ToList();
        }
    }
}