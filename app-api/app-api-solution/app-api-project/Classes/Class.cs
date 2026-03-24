namespace PanoramaBackend.Services
{
    public class PanoramaSessionCache
    {
        // You can expand this later if needed
        public string Host { get; private set; } = string.Empty;
        public string BearerToken { get; private set; } = string.Empty;

        // Call this after a successful login
        public void SaveSession(string host, string bearerToken)
        {
            Host = host;
            BearerToken = bearerToken;
        }

        // If you want, you can add a reset method
        public void Reset()
        {
            Host = string.Empty;
            BearerToken = string.Empty;
        }

        // Optional: helper to check if we have a valid session
        public bool HasValidSession =>
            !string.IsNullOrWhiteSpace(Host) &&
            !string.IsNullOrWhiteSpace(BearerToken);
    }
}