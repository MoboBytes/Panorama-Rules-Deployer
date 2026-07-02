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
    public class CreateTagsController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly PanoramaSessionCache _sessionCache;

        public CreateTagsController(
            IHttpClientFactory httpClientFactory,
            PanoramaSessionCache sessionCache)
        {
            _httpClientFactory = httpClientFactory;
            _sessionCache = sessionCache;
        }

        // ---------------- Models ----------------

        public class GetTagsRequest
        {
            public string DeviceGroup { get; set; } = string.Empty;
        }

        public class PanoramaTagEntry
        {
            public string Name { get; set; } = string.Empty;
            public string Location { get; set; } = string.Empty;
            public string DeviceGroup { get; set; } = string.Empty;
            public string Color { get; set; } = string.Empty;
        }

        private class TagApiResponse
        {
            [JsonPropertyName("@status")]
            public string? Status { get; set; }

            [JsonPropertyName("@code")]
            public string? Code { get; set; }

            [JsonPropertyName("result")]
            public TagApiResult? Result { get; set; }
        }

        private class TagApiResult
        {
            [JsonPropertyName("@total-count")]
            public string? TotalCount { get; set; }

            [JsonPropertyName("@count")]
            public string? Count { get; set; }

            [JsonPropertyName("entry")]
            public List<TagApiEntry>? Entry { get; set; }
        }

        private class TagApiEntry
        {
            [JsonPropertyName("@name")]
            public string? Name { get; set; }

            [JsonPropertyName("@location")]
            public string? Location { get; set; }

            [JsonPropertyName("@device-group")]
            public string? DeviceGroup { get; set; }

            [JsonPropertyName("color")]
            public string? Color { get; set; }
        }

        // ---------------- Public Endpoint ----------------

        /// <summary>
        /// Returns a combined list of:
        /// - predefined tags
        /// - shared tags
        /// - device-group tags for the requested device group
        /// </summary>
        [HttpPost("all")]
        public async Task<IActionResult> GetAllTags([FromBody] GetTagsRequest request)
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

                var predefinedUrl =
                    $"{NormalizeHost(host)}/restapi/v11.2/Objects/Tags?location=predefined";

                var sharedUrl =
                    $"{NormalizeHost(host)}/restapi/v11.2/Objects/Tags?location=shared";

                var deviceGroupUrl =
                    $"{NormalizeHost(host)}/restapi/v11.2/Objects/Tags?location=device-group&device-group={Uri.EscapeDataString(request.DeviceGroup)}";

                var predefinedTask = FetchTagsAsync(client, predefinedUrl);
                var sharedTask = FetchTagsAsync(client, sharedUrl);
                var deviceGroupTask = FetchTagsAsync(client, deviceGroupUrl);

                await Task.WhenAll(predefinedTask, sharedTask, deviceGroupTask);

                var combined = new List<PanoramaTagEntry>();
                combined.AddRange(predefinedTask.Result);
                combined.AddRange(sharedTask.Result);
                combined.AddRange(deviceGroupTask.Result);

                // Optional dedupe: keep exact unique combinations
                var deduped = combined
                    .GroupBy(t => new
                    {
                        Name = t.Name,
                        Location = t.Location,
                        DeviceGroup = t.DeviceGroup
                    })
                    .Select(g => g.First())
                    .OrderBy(t => t.Name)
                    .ToList();

                return Ok(deduped);
            }
            catch (Exception ex)
            {
                return Problem($"Error retrieving Panorama tags: {ex.Message}");
            }
        }

        // ---------------- Private Helpers ----------------

        private static string NormalizeHost(string host)
        {
            return host.EndsWith("/")
                ? host[..^1]
                : host;
        }

        private async Task<List<PanoramaTagEntry>> FetchTagsAsync(HttpClient client, string url)
        {
            var response = await client.GetAsync(url);
            var body = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"Panorama tag API error from {url}: {body}");
            }

            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            var parsed = JsonSerializer.Deserialize<TagApiResponse>(body, options);

            if (parsed?.Result?.Entry == null || !parsed.Result.Entry.Any())
            {
                return new List<PanoramaTagEntry>();
            }

            return parsed.Result.Entry.Select(entry => new PanoramaTagEntry
            {
                Name = entry.Name ?? string.Empty,
                Location = entry.Location ?? string.Empty,
                DeviceGroup = entry.DeviceGroup ?? string.Empty,
                Color = entry.Color ?? string.Empty
            }).ToList();
        }
    }
}