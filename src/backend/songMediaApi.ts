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

/** Same-origin cover URL — streams through the API instead of loading S3 directly. */
export function getSongCoverImageUrl(songId: string | number): string {
  return buildApiUrl(`/songs/${songId}/cover`);
}

/** Same-origin cover URL — streams through the API instead of loading S3 directly. */
export function getAlbumCoverImageUrl(albumId: string | number): string {
  return buildApiUrl(`/albums/${albumId}/cover`);
}

export async function getSignedSongAudioUrl(songId: string | number): Promise<string | null> {
  return fetchSignedUrl(`/songs/${songId}/signed-url`);
}

export async function getSignedSongCoverUrl(songId: string | number): Promise<string | null> {
  if (!songId) return null;
  return getSongCoverImageUrl(songId);
}

export async function getSignedAlbumCoverUrl(albumId: string | number): Promise<string | null> {
  if (!albumId) return null;
  return getAlbumCoverImageUrl(albumId);
}

export async function getSignedArtistImageUrl(artistId: string | number): Promise<string | null> {
  return fetchSignedUrl(`/artists/${artistId}/image-url`, true);
}

export async function getSignedGenreImageUrl(genreId: string | number): Promise<string | null> {
  return fetchSignedUrl(`/genres/${genreId}/image-url`, true);
}

export async function getSignedTagImageUrl(tagId: string | number): Promise<string | null> {
  return fetchSignedUrl(`/tags/${tagId}/image-url`, true);
}
