import { buildApiUrl } from "./backendUrls";

const getToken = (): string | null => {
  return localStorage.getItem("userToken") || localStorage.getItem("authToken");
};

async function fetchSignedUrl(path: string, silent = false): Promise<string | null> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(buildApiUrl(path), {
      headers,
    });

    if (!response.ok) {
      if (!silent) {
        console.warn(`Failed to fetch signed URL from ${path}: ${response.status}`);
      }
      return null;
    }

    const data = await response.json().catch(() => null);
    const signedUrl = data?.signed_url;

    return typeof signedUrl === "string" && signedUrl.trim() ? signedUrl : null;
  } catch (err) {
    if (!silent) {
      console.warn(`Error fetching signed URL from ${path}:`, err);
    }
    return null;
  }
}

export async function getSignedSongAudioUrl(songId: string | number): Promise<string | null> {
  return fetchSignedUrl(`/songs/${songId}/signed-url`);
}

export async function getSignedSongCoverUrl(songId: string | number): Promise<string | null> {
  return fetchSignedUrl(`/songs/${songId}/cover-url`, true);
}

export async function getSignedAlbumCoverUrl(albumId: string | number): Promise<string | null> {
  return fetchSignedUrl(`/albums/${albumId}/cover-url`, true);
}

export async function getSignedArtistImageUrl(artistId: string | number): Promise<string | null> {
  return fetchSignedUrl(`/artists/${artistId}/image-url`, true);
}

export async function getSignedGenreImageUrl(genreId: string | number): Promise<string | null> {
  return fetchSignedUrl(`/genres/${genreId}/image-url`, true);
}
