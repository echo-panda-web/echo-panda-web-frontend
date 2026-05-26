import { BACKEND_API_BASE_URL } from "./backendUrls";

export type MediaUploadPurpose = "album_cover" | "song_audio" | "artist_image" | "song_lyrics";

export interface PresignedMediaUploadResponse {
  message: string;
  purpose: MediaUploadPurpose;
  key: string;
  url: string;
  upload_url: string;
  headers: Record<string, string>;
}

const getToken = (): string | null => {
  return localStorage.getItem("userToken") || localStorage.getItem("authToken");
};

const normalizeHeaders = (headers: Record<string, string>): Record<string, string> => {
  return Object.entries(headers).reduce<Record<string, string>>((accumulator, [key, value]) => {
    if (key.toLowerCase() === "host") {
      return accumulator;
    }

    accumulator[key] = value;
    return accumulator;
  }, {});
};

async function requestPresignedUpload(file: File, purpose: MediaUploadPurpose): Promise<PresignedMediaUploadResponse> {
  const token = getToken();
  if (!token) {
    throw new Error("Missing auth token");
  }

  const response = await fetch(`${BACKEND_API_BASE_URL}/upload/media/presign`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      purpose,
      filename: file.name,
      content_type: file.type || "application/octet-stream",
      size: file.size,
    }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || `Upload failed (${response.status})`);
  }

  return data as PresignedMediaUploadResponse;
}

export async function uploadMediaDirectly(file: File, purpose: MediaUploadPurpose): Promise<{ key: string; url: string }> {
  const presigned = await requestPresignedUpload(file, purpose);
  const contentType = file.type || "application/octet-stream";
  const headers = {
    ...normalizeHeaders(presigned.headers),
    "Content-Type": contentType,
  };

  const uploadResponse = await fetch(presigned.upload_url, {
    method: "PUT",
    headers,
    body: file,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text().catch(() => "");
    throw new Error(errorText || `Upload failed (${uploadResponse.status})`);
  }

  return {
    key: presigned.key,
    url: presigned.url,
  };
}
