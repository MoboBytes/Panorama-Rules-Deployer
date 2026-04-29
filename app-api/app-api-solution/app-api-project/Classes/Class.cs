using System;
using System.Collections.Generic;
using System.Linq;

namespace PanoramaBackend.Services
{
    public class PanoramaSessionCache
    {
        // ---------------- Session ----------------

        public string Host { get; private set; } = string.Empty;
        public string BearerToken { get; private set; } = string.Empty;

        public bool HasValidSession =>
            !string.IsNullOrWhiteSpace(Host) &&
            !string.IsNullOrWhiteSpace(BearerToken);

        public void SaveSession(string host, string bearerToken)
        {
            Host = host;
            BearerToken = bearerToken;
        }

        // ---------------- Metadata Cache ----------------

        private readonly object _lock = new();

        public bool IsCacheBuilding { get; private set; }
        public DateTime? CacheBuiltAtUtc { get; private set; }
        public string? CacheBuildError { get; private set; }

        public List<CachedPanoramaDevice> CachedDevices { get; private set; } = new();

        public bool HasMetadataCache
        {
            get
            {
                lock (_lock)
                {
                    return CachedDevices.Any();
                }
            }
        }

        public void SetCacheBuilding(bool isBuilding)
        {
            lock (_lock)
            {
                IsCacheBuilding = isBuilding;
            }
        }

        public void SaveMetadataCache(List<CachedPanoramaDevice> devices)
        {
            lock (_lock)
            {
                CachedDevices = devices ?? new List<CachedPanoramaDevice>();
                CacheBuiltAtUtc = DateTime.UtcNow;
                CacheBuildError = null;
            }
        }

        public List<CachedPanoramaDevice> GetCachedDevices()
        {
            lock (_lock)
            {
                return CachedDevices.ToList();
            }
        }

        public CachedPanoramaDevice? GetCachedDevice(string serial)
        {
            lock (_lock)
            {
                return CachedDevices.FirstOrDefault(d =>
                    string.Equals(d.Serial, serial, StringComparison.OrdinalIgnoreCase));
            }
        }

        public void SetCacheBuildError(string error)
        {
            lock (_lock)
            {
                CacheBuildError = error;
            }
        }

        public void ClearMetadataCache()
        {
            lock (_lock)
            {
                CachedDevices = new List<CachedPanoramaDevice>();
                CacheBuiltAtUtc = null;
                CacheBuildError = null;
                IsCacheBuilding = false;
            }
        }

        // ---------------- Full Reset ----------------

        public void Reset()
        {
            lock (_lock)
            {
                Host = string.Empty;
                BearerToken = string.Empty;

                CachedDevices = new List<CachedPanoramaDevice>();
                CacheBuiltAtUtc = null;
                CacheBuildError = null;
                IsCacheBuilding = false;
            }
        }
    }

    public class CachedPanoramaDevice
    {
        public string Serial { get; set; } = string.Empty;
        public string Hostname { get; set; } = string.Empty;
        public string IpAddress { get; set; } = string.Empty;
        public bool Connected { get; set; }

        public string DeviceGroup { get; set; } = string.Empty;

        // Usually VR1, but keep as a list for flexibility
        public List<string> VirtualRouters { get; set; } = new();

        // Key = interface name, Value = zone name
        public Dictionary<string, string> InterfaceToZone { get; set; }
            = new(StringComparer.OrdinalIgnoreCase);
    }
}