// src/services/PanoramaZoneControllerClient.ts

const BACKEND_BASE_URL = "https://localhost:7206"; // same as your login client

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
  note?: string; // present when we hit the "inside" fallback
};

// Get devices (uses cached host/token on backend)
export async function getPanoramaDevices(): Promise<PanoramaDeviceInfo[]> {
  const response = await fetch(
    `${BACKEND_BASE_URL}/api/PanoramaZoneCollector/devices`
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Failed to fetch Panorama devices");
  }

  return (await response.json()) as PanoramaDeviceInfo[];
}

// Get zone by IP (frontend only sends the IP)
export async function getZoneByIp(ip: string): Promise<ZoneByIpResult> {
  const response = await fetch(
    `${BACKEND_BASE_URL}/api/PanoramaZoneCollector/zone-by-ip`,
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