// Purpose of this page is to collect Tags, Group Tags, Applications, Services,
// and Log Forwarding Profiles from "Create Rules" and send them toward the Create Rules page.

const BACKEND_BASE_URL = "https://localhost:7206";

// ---------------- Shared Request Types ----------------

export type DeviceGroupRequest = {
  deviceGroup: string;
};

// ---------------- Tag Types ----------------

export type PanoramaTagEntry = {
  name: string;
  location: string;
  deviceGroup: string;
  color: string;
};

// ---------------- Log Forwarding Profile Types ----------------

export type PanoramaLogForwardingProfileEntry = {
  name: string;
  location: string;
  deviceGroup: string;
};

// ---------------- Profile Setting Types ----------------

export type PanoramaSecurityProfileGroupEntry = {
  name: string;
  location: string;
};

// ---------------- Service Types ----------------

export type PanoramaServiceEntry = {
  name: string;
  location: string;
  deviceGroup: string;
  entryType: string;
};

// ---------------- Tag APIs ----------------

export async function getAllPanoramaTags(
  deviceGroup: string
): Promise<PanoramaTagEntry[]> {
  const response = await fetch(`${BACKEND_BASE_URL}/api/CreateTags/all`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceGroup } satisfies DeviceGroupRequest),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Failed to retrieve Panorama tags");
  }

  return (await response.json()) as PanoramaTagEntry[];
}

// ---------------- Log Forwarding Profile APIs ----------------

export async function getAllPanoramaLogForwardingProfiles(
  deviceGroup: string
): Promise<PanoramaLogForwardingProfileEntry[]> {
  const response = await fetch(
    `${BACKEND_BASE_URL}/api/CreateLogForwardingProfiles/all`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceGroup } satisfies DeviceGroupRequest),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      text || "Failed to retrieve Panorama log forwarding profiles"
    );
  }

  return (await response.json()) as PanoramaLogForwardingProfileEntry[];
}

// ---------------- Profile Setting APIs ----------------

export async function getAllPanoramaSecurityProfileGroups(): Promise<
  PanoramaSecurityProfileGroupEntry[]
> {
  const response = await fetch(
    `${BACKEND_BASE_URL}/api/CreateProfileSettings/all`
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      text || "Failed to retrieve Panorama security profile groups"
    );
  }

  return (await response.json()) as PanoramaSecurityProfileGroupEntry[];
}

// ---------------- Service APIs ----------------

export async function getAllPanoramaServices(
  deviceGroup: string
): Promise<PanoramaServiceEntry[]> {
  const response = await fetch(`${BACKEND_BASE_URL}/api/CreateServices/all`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceGroup } satisfies DeviceGroupRequest),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Failed to retrieve Panorama services");
  }

  return (await response.json()) as PanoramaServiceEntry[];
}