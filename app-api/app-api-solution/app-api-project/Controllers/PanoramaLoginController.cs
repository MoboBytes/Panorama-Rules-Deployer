using Microsoft.AspNetCore.Mvc;
using PanoramaBackend.Services;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;
using System.Xml.Linq;


namespace PanoramaBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PanoramaLoginController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly PanoramaSessionCache _sessionCache;

        public PanoramaLoginController(
            IHttpClientFactory httpClientFactory,
            PanoramaSessionCache sessionCache)
        {
            _httpClientFactory = httpClientFactory;
            _sessionCache = sessionCache;
        }

        // Model for request from frontend
        public class PanoramaLoginRequest
        {
            public string Host { get; set; } = string.Empty;
            public string User { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
        }

        // Response model to frontend
        public class PanoramaLoginResult
        {
            public string RawResponse { get; set; } = string.Empty;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] PanoramaLoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Host) ||
                string.IsNullOrWhiteSpace(request.User) ||
                string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest("Host, user, and password are required.");
            }

            // Normalize host: remove trailing slash if present
            var baseUri = request.Host.EndsWith("/")
                ? request.Host[..^1]
                : request.Host;

            // Build URL: {host}/api/?type=keygen&user=...&password=...
            var baseUrl = new Uri(baseUri);
            var builder = new UriBuilder(new Uri(baseUrl, "/api/"));
            var query = HttpUtility.ParseQueryString(string.Empty);
            query["type"] = "keygen";
            query["user"] = request.User;
            query["password"] = request.Password;
            builder.Query = query.ToString();

            var client = _httpClientFactory.CreateClient();

            HttpResponseMessage response;
            try
            {
                response = await client.GetAsync(builder.Uri);
            }
            catch (Exception ex)
            {
                return Problem($"Error calling Panorama: {ex.Message}");
            }

            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync();
                return StatusCode((int)response.StatusCode, $"Panorama error: {body}");
            }

            var raw = await response.Content.ReadAsStringAsync();

            // Parse the XML response and extract the key
            string bearerToken;
            try
            {

                var xmlDoc = XDocument.Parse(raw);
                var keyElement = xmlDoc.Descendants("key").FirstOrDefault();

                if (keyElement == null)
                {
                    return Problem("Could not find 'key' element in Panorama response.");
                }

                bearerToken = keyElement.Value;
                _sessionCache.SaveSession(baseUri, bearerToken); // Cache host + token for this app lifetime
            }
            catch (Exception ex)
            {
                return Problem($"Error parsing Panorama response: {ex.Message}");
            }

            var result = new PanoramaLoginResult
            {
                RawResponse = bearerToken
            };

            return Ok(result);
        }
    }
}