// src/services/panoramaClient.ts

export type PanoramaLoginResult = {
  rawResponse: string; // matches PanoramaLoginResult in C#
};

export async function loginToPanorama(
  host: string,
  user: string,
  password: string
) {
  // Change this to your actual backend URL from Swagger
  const BACKEND_BASE_URL = "https://localhost:7206"; // <-- adjust port

  const response = await fetch(`${BACKEND_BASE_URL}/api/PanoramaLogin/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ host, user, password }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Panorama login failed");
  }

  const data = (await response.json()) as PanoramaLoginResult;
  return data.rawResponse; // for now, return raw response from Panorama
}