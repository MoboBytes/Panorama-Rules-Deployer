const BACKEND_BASE_URL = "https://localhost:7206";

export type PanoramaDeviceInfo = {
  serial: string;
  hostname: string;
  ipAddress: string;
  connected: boolean;
};

export type ZoneByIpResult = {
  deviceSerial: string;
  deviceHostname: string;
  deviceIpAddress: string;
  virtualRouter: string;
  egressInterface: string;
  zone: string;
};

export type PanoramaCacheStatus = {
  hasValidSession: boolean;
  isCacheBuilding: boolean;
  hasMetadataCache: boolean;
  builtAtUtc?: string | null;
  lastError?: string | null;
  totalDevices: number;
  connectedDevices: number;
  totalVirtualRouters: number;
  totalInterfaceZoneMappings: number;
};

export type PanoramaCacheBuildResult = {
  success: boolean;
  message: string;
  builtAtUtc?: string | null;
  totalDevices: number;
  connectedDevices: number;
  totalVirtualRouters: number;
  totalInterfaceZoneMappings: number;
};

// ---------------- Cache APIs ----------------

export async function buildPanoramaCache(): Promise<PanoramaCacheBuildResult> {
  const response = await fetch(`${BACKEND_BASE_URL}/api/PanoramaCache/build`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Failed to build Panorama cache");
  }

  return (await response.json()) as PanoramaCacheBuildResult;
}

export async function clearPanoramaCache(): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${BACKEND_BASE_URL}/api/PanoramaCache/clear`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Failed to clear Panorama cache");
  }

  return (await response.json()) as { success: boolean; message: string };
}

export async function getPanoramaCacheStatus(): Promise<PanoramaCacheStatus> {
  const response = await fetch(`${BACKEND_BASE_URL}/api/PanoramaCache/status`);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Failed to get Panorama cache status");
  }

  return (await response.json()) as PanoramaCacheStatus;
}

// Optional debug endpoint if you still want it
export async function getCachedPanoramaDevices(): Promise<PanoramaDeviceInfo[]> {
  const response = await fetch(`${BACKEND_BASE_URL}/api/PanoramaCache/devices`);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Failed to fetch cached Panorama devices");
  }

  return (await response.json()) as PanoramaDeviceInfo[];
}

// ---------------- IP Lookup API ----------------

export async function getZoneByIp(ip: string): Promise<ZoneByIpResult> {
  const response = await fetch(
    `${BACKEND_BASE_URL}/api/PanoramaIPtoZone/zone-by-ip`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Failed to resolve zone by IP");
  }

  return (await response.json()) as ZoneByIpResult;
}