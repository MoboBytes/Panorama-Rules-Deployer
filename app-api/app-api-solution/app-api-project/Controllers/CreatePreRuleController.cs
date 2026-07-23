using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using PanoramaBackend.Services;

namespace PanoramaBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CreatePreRuleController : ControllerBase
    {
        private readonly PanoramaSessionCache _sessionCache;
        private readonly IHttpClientFactory _httpClientFactory;

        public CreatePreRuleController(
            PanoramaSessionCache sessionCache,
            IHttpClientFactory httpClientFactory)
        {
            _sessionCache = sessionCache;
            _httpClientFactory = httpClientFactory;
        }

        // ---------------- Request DTO ----------------

        public class CreatePreRuleRequest
        {
            public string RuleName { get; set; } = string.Empty;
            public string Description { get; set; } = string.Empty;
            public string DeviceGroup { get; set; } = string.Empty;
            public string From { get; set; } = string.Empty;
            public string To { get; set; } = string.Empty;
            public string Source { get; set; } = string.Empty;
            public string Destination { get; set; } = string.Empty;

            public List<string> Application { get; set; } = new();
            public List<string> Service { get; set; } = new();
            public List<string> Tag { get; set; } = new();

            public string GroupTag { get; set; } = string.Empty;
            public string Action { get; set; } = string.Empty;
            public string LogSetting { get; set; } = string.Empty;
            public string LogStart { get; set; } = string.Empty;
            public string LogEnd { get; set; } = string.Empty;
            public string ProfileSetting { get; set; } = string.Empty;

            public string Requester { get; set; } = string.Empty;
            public string TicketNumber { get; set; } = string.Empty;
            public string SourceName { get; set; } = string.Empty;
            public string DestinationName { get; set; } = string.Empty;
        }

        // ---------------- Panorama Payload Models ----------------

        public class PanoramaRulePayload
        {
            [JsonPropertyName("entry")]
            public PanoramaRuleEntry Entry { get; set; } = new();
        }

        public class PanoramaRuleEntry
        {
            [JsonPropertyName("@name")]
            public string Name { get; set; } = string.Empty;

            [JsonPropertyName("from")]
            public MemberContainer From { get; set; } = new();

            [JsonPropertyName("to")]
            public MemberContainer To { get; set; } = new();

            [JsonPropertyName("source")]
            public MemberContainer Source { get; set; } = new();

            [JsonPropertyName("source-user")]
            public MemberContainer SourceUser { get; set; } = new()
            {
                Member = new List<string> { "any" }
            };

            [JsonPropertyName("destination")]
            public MemberContainer Destination { get; set; } = new();

            [JsonPropertyName("service")]
            public MemberContainer Service { get; set; } = new();

            [JsonPropertyName("category")]
            public MemberContainer Category { get; set; } = new()
            {
                Member = new List<string> { "any" }
            };

            [JsonPropertyName("application")]
            public MemberContainer Application { get; set; } = new();

            [JsonPropertyName("tag")]
            public MemberContainer? Tag { get; set; }

            [JsonPropertyName("group-tag")]
            public string? GroupTag { get; set; }

            [JsonPropertyName("description")]
            public string Description { get; set; } = string.Empty;

            [JsonPropertyName("action")]
            public string Action { get; set; } = "allow";

            [JsonPropertyName("disabled")]
            public string Disabled { get; set; } = "no";

            [JsonPropertyName("negate-source")]
            public string NegateSource { get; set; } = "no";

            [JsonPropertyName("negate-destination")]
            public string NegateDestination { get; set; } = "no";

            [JsonPropertyName("rule-type")]
            public string RuleType { get; set; } = "universal";

            [JsonPropertyName("log-setting")]
            public string? LogSetting { get; set; }

            [JsonPropertyName("log-start")]
            public string LogStart { get; set; } = "no";

            [JsonPropertyName("log-end")]
            public string LogEnd { get; set; } = "yes";

            [JsonPropertyName("profile-setting")]
            public ProfileSettingContainer? ProfileSetting { get; set; }
        }

        public class MemberContainer
        {
            [JsonPropertyName("member")]
            public List<string> Member { get; set; } = new();
        }

        public class ProfileSettingContainer
        {
            [JsonPropertyName("group")]
            public MemberContainer Group { get; set; } = new();
        }

        // ---------------- Public Endpoint ----------------

        [HttpPost]
        public async Task<IActionResult> CreatePreRule([FromBody] CreatePreRuleRequest request)
        {
            if (!_sessionCache.HasValidSession)
            {
                return BadRequest("No Panorama session is available. Please log in first.");
            }

            var validationErrors = ValidateRequest(request);
            if (validationErrors.Any())
            {
                return BadRequest(new
                {
                    message = "Validation failed.",
                    errors = validationErrors
                });
            }

            var payload = BuildPanoramaPayload(request);

            var host = _sessionCache.Host;
            var apiKey = _sessionCache.BearerToken;

            if (string.IsNullOrWhiteSpace(host))
            {
                return BadRequest("Panorama host is not available.");
            }

            if (string.IsNullOrWhiteSpace(apiKey))
            {
                return BadRequest("Panorama API key is not available.");
            }

            var baseUri = host.EndsWith("/")
                ? host.TrimEnd('/')
                : host;

            var endpoint =
                $"{baseUri}/restapi/v11.2/Policies/SecurityPreRules" +
                $"?name={Uri.EscapeDataString(request.RuleName)}" +
                $"&location=device-group" +
                $"&device-group={Uri.EscapeDataString(request.DeviceGroup)}" +
                $"&input-format=json" +
                $"&output-format=json";

            var jsonOptions = new JsonSerializerOptions
            {
                DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
            };

            var requestJson = JsonSerializer.Serialize(payload, jsonOptions);

            var client = _httpClientFactory.CreateClient();

            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, endpoint);
            httpRequest.Headers.Add("X-PAN-KEY", apiKey);
            httpRequest.Headers.Accept.ParseAdd("application/json");
            httpRequest.Content = new StringContent(requestJson, Encoding.UTF8, "application/json");

            var response = await client.SendAsync(httpRequest);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                if ((int)response.StatusCode == 403)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new
                    {
                        message = "Unauthorized"
                    });
                }

                return StatusCode((int)response.StatusCode, new
                {
                    message = "Panorama pre-rule creation failed."
                });
            }

            object? parsedPanoramaResponse = null;
            try
            {
                parsedPanoramaResponse = JsonSerializer.Deserialize<object>(responseBody);
            }
            catch
            {
                parsedPanoramaResponse = responseBody;
            }

            return Ok(new
            {
                message = "Panorama Firewall Pre-Rule Created Successfully",
                deviceGroup = request.DeviceGroup,
                ruleName = request.RuleName,
                panoramaResponse = parsedPanoramaResponse
            });
        }

        // ---------------- Private Helpers ----------------

        private static List<string> ValidateRequest(CreatePreRuleRequest request)
        {
            var errors = new List<string>();

            if (string.IsNullOrWhiteSpace(request.RuleName))
                errors.Add("RuleName is required.");

            if (string.IsNullOrWhiteSpace(request.DeviceGroup))
                errors.Add("DeviceGroup is required.");

            if (string.IsNullOrWhiteSpace(request.From))
                errors.Add("From is required.");

            if (string.IsNullOrWhiteSpace(request.To))
                errors.Add("To is required.");

            if (string.IsNullOrWhiteSpace(request.Source))
                errors.Add("Source is required.");

            if (string.IsNullOrWhiteSpace(request.Destination))
                errors.Add("Destination is required.");

            if (string.IsNullOrWhiteSpace(request.Action))
                errors.Add("Action is required.");

            if (!request.Application.Any())
                errors.Add("At least one Application is required.");

            if (!request.Service.Any())
                errors.Add("At least one Service is required.");

            return errors;
        }

        private static PanoramaRulePayload BuildPanoramaPayload(CreatePreRuleRequest request)
        {
            var cleanedApplications = request.Application
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            var cleanedServices = request.Service
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            var cleanedTags = request.Tag
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            var payload = new PanoramaRulePayload
            {
                Entry = new PanoramaRuleEntry
                {
                    Name = request.RuleName,
                    Description = request.Description,
                    Action = request.Action.ToLowerInvariant(),
                    Disabled = "no",
                    NegateSource = "no",
                    NegateDestination = "no",
                    RuleType = "universal",
                    LogStart = NormalizeYesNo(request.LogStart, "no"),
                    LogEnd = NormalizeYesNo(request.LogEnd, "yes"),

                    From = new MemberContainer
                    {
                        Member = new List<string> { request.From }
                    },
                    To = new MemberContainer
                    {
                        Member = new List<string> { request.To }
                    },
                    Source = new MemberContainer
                    {
                        Member = new List<string> { request.Source }
                    },
                    Destination = new MemberContainer
                    {
                        Member = new List<string> { request.Destination }
                    },
                    Service = new MemberContainer
                    {
                        Member = cleanedServices
                    },
                    Category = new MemberContainer
                    {
                        Member = new List<string> { "any" }
                    },
                    Application = new MemberContainer
                    {
                        Member = cleanedApplications
                    },
                    SourceUser = new MemberContainer
                    {
                        Member = new List<string> { "any" }
                    }
                }
            };

            if (cleanedTags.Any())
            {
                payload.Entry.Tag = new MemberContainer
                {
                    Member = cleanedTags
                };
            }

            if (!string.IsNullOrWhiteSpace(request.GroupTag))
            {
                payload.Entry.GroupTag = request.GroupTag;
            }

            if (!string.IsNullOrWhiteSpace(request.LogSetting))
            {
                payload.Entry.LogSetting = request.LogSetting;
            }

            if (!string.IsNullOrWhiteSpace(request.ProfileSetting))
            {
                payload.Entry.ProfileSetting = new ProfileSettingContainer
                {
                    Group = new MemberContainer
                    {
                        Member = new List<string> { request.ProfileSetting }
                    }
                };
            }

            return payload;
        }

        private static string NormalizeYesNo(string? value, string fallback)
        {
            if (string.Equals(value, "yes", StringComparison.OrdinalIgnoreCase))
                return "yes";

            if (string.Equals(value, "no", StringComparison.OrdinalIgnoreCase))
                return "no";

            return fallback;
        }
    }
}