using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;
using PanoramaBackend.Services;

namespace PanoramaBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CreatePreRuleController : ControllerBase
    {
        private readonly PanoramaSessionCache _sessionCache;

        public CreatePreRuleController(PanoramaSessionCache sessionCache)
        {
            _sessionCache = sessionCache;
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

            [JsonPropertyName("destination")]
            public MemberContainer Destination { get; set; } = new();

            [JsonPropertyName("service")]
            public MemberContainer Service { get; set; } = new();

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

            [JsonPropertyName("log-setting")]
            public string? LogSetting { get; set; }

            [JsonPropertyName("log-start")]
            public string LogStart { get; set; } = "no";

            [JsonPropertyName("log-end")]
            public string LogEnd { get; set; } = "yes";

            [JsonPropertyName("disabled")]
            public string Disabled { get; set; } = "no";

            [JsonPropertyName("negate-source")]
            public string NegateSource { get; set; } = "no";

            [JsonPropertyName("negate-destination")]
            public string NegateDestination { get; set; } = "no";

            [JsonPropertyName("rule-type")]
            public string RuleType { get; set; } = "universal";

            [JsonPropertyName("category")]
            public MemberContainer Category { get; set; } = new()
            {
                Member = new List<string> { "any" }
            };

            [JsonPropertyName("source-user")]
            public MemberContainer SourceUser { get; set; } = new()
            {
                Member = new List<string> { "any" }
            };

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
        public IActionResult CreatePreRule([FromBody] CreatePreRuleRequest request)
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

            // For now, return the payload so you can verify it from the frontend.
            // Next step will be submitting this payload to Panorama.
            return Ok(new
            {
                message = "Payload built successfully.",
                deviceGroup = request.DeviceGroup,
                payload
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
            var payload = new PanoramaRulePayload
            {
                Entry = new PanoramaRuleEntry
                {
                    Name = request.RuleName,
                    Description = request.Description,
                    Action = request.Action.ToLowerInvariant(),
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
                    Application = new MemberContainer
                    {
                        Member = request.Application
                            .Where(x => !string.IsNullOrWhiteSpace(x))
                            .Distinct(StringComparer.OrdinalIgnoreCase)
                            .ToList()
                    },
                    Service = new MemberContainer
                    {
                        Member = request.Service
                            .Where(x => !string.IsNullOrWhiteSpace(x))
                            .Distinct(StringComparer.OrdinalIgnoreCase)
                            .ToList()
                    }
                }
            };

            var cleanedTags = request.Tag
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

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