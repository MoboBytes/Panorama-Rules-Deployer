//Purpose of this page is to collect Tags, Group Tages, Applications, Services from "Create Rules" and send them towards the Create Rules Page.

const BACKEND_BASE_URL = "https://localhost:7206";

// ---------------- Tag Types ----------------

export type PanoramaTagEntry = {
  name: string;
  location: string;
  deviceGroup: string;
  color: string;
};

export type GetAllTagsRequest = {
  deviceGroup: string;
};

// ---------------- Tag APIs ----------------

export async function getAllPanoramaTags(
  deviceGroup: string
): Promise<PanoramaTagEntry[]> {
  const response = await fetch(`${BACKEND_BASE_URL}/api/CreateTags/all`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceGroup } satisfies GetAllTagsRequest),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Failed to retrieve Panorama tags");
  }

  return (await response.json()) as PanoramaTagEntry[];
}