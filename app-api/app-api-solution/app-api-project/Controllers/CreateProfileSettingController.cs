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
    public class CreateProfileSettingsController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly PanoramaSessionCache _sessionCache;

        public CreateProfileSettingsController(
            IHttpClientFactory httpClientFactory,
            PanoramaSessionCache sessionCache)
        {
            _httpClientFactory = httpClientFactory;
            _sessionCache = sessionCache;
        }

        // ---------------- Models ----------------

        public class PanoramaSecurityProfileGroupEntry
        {
            public string Name { get; set; } = string.Empty;
            public string Location { get; set; } = string.Empty;
        }

        private class SecurityProfileGroupsApiResponse
        {
            [JsonPropertyName("@status")]
            public string? Status { get; set; }

            [JsonPropertyName("@code")]
            public string? Code { get; set; }

            [JsonPropertyName("result")]
            public SecurityProfileGroupsApiResult? Result { get; set; }
        }

        private class SecurityProfileGroupsApiResult
        {
            [JsonPropertyName("@total-count")]
            public string? TotalCount { get; set; }

            [JsonPropertyName("@count")]
            public string? Count { get; set; }

            [JsonPropertyName("entry")]
            public List<SecurityProfileGroupsApiEntry>? Entry { get; set; }
        }

        private class SecurityProfileGroupsApiEntry
        {
            [JsonPropertyName("@name")]
            public string? Name { get; set; }

            [JsonPropertyName("@location")]
            public string? Location { get; set; }
        }

        // ---------------- Public Endpoint ----------------

        /// <summary>
        /// Returns the shared Security Profile Groups list.
        /// </summary>
        [HttpGet("all")]
        public async Task<IActionResult> GetAllProfileSettings()
        {
            if (!_sessionCache.HasValidSession)
            {
                return BadRequest("No Panorama session is available. Please log in first.");
            }

            var host = _sessionCache.Host;
            var apiKey = _sessionCache.BearerToken;

            try
            {
                var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Clear();
                client.DefaultRequestHeaders.Add("X-PAN-KEY", apiKey);

                var sharedUrl =
                    $"{NormalizeHost(host)}/restapi/v11.2/Objects/SecurityProfileGroups?location=shared";

                var profileGroups = await FetchSecurityProfileGroupsAsync(client, sharedUrl);

                var deduped = profileGroups
                    .GroupBy(p => new
                    {
                        Name = p.Name,
                        Location = p.Location
                    })
                    .Select(g => g.First())
                    .OrderBy(p => p.Name)
                    .ToList();

                return Ok(deduped);
            }
            catch (Exception ex)
            {
                return Problem($"Error retrieving Panorama security profile groups: {ex.Message}");
            }
        }

        // ---------------- Private Helpers ----------------

        private static string NormalizeHost(string host)
        {
            return host.EndsWith("/")
                ? host[..^1]
                : host;
        }

        private async Task<List<PanoramaSecurityProfileGroupEntry>> FetchSecurityProfileGroupsAsync(HttpClient client, string url)
        {
            var response = await client.GetAsync(url);
            var body = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"Panorama security profile groups API error from {url}: {body}");
            }

            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            var parsed = JsonSerializer.Deserialize<SecurityProfileGroupsApiResponse>(body, options);

            if (parsed?.Result?.Entry == null || !parsed.Result.Entry.Any())
            {
                return new List<PanoramaSecurityProfileGroupEntry>();
            }

            return parsed.Result.Entry.Select(entry => new PanoramaSecurityProfileGroupEntry
            {
                Name = entry.Name ?? string.Empty,
                Location = entry.Location ?? string.Empty
            }).ToList();
        }
    }
}