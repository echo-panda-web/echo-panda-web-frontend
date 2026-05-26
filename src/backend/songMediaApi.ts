import { buildApiUrl } from "./backendUrls";

async function fetchSignedUrl(path: string): Promise<string | null> {
  const response = await fetch(buildApiUrl(path), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json().catch(() => null);
  const signedUrl = data?.signed_url;

  return typeof signedUrl === "string" && signedUrl.trim() ? signedUrl : null;
}

export async function getSignedSongAudioUrl(songId: string | number): Promise<string | null> {
  return fetchSignedUrl(`/songs/${songId}/signed-url`);
}

export async function getSignedSongCoverUrl(songId: string | number): Promise<string | null> {
  return fetchSignedUrl(`/songs/${songId}/cover-url`);
}

export async function getSignedAlbumCoverUrl(albumId: string | number): Promise<string | null> {
  return fetchSignedUrl(`/albums/${albumId}/cover-url`);
}

export async function getSignedArtistImageUrl(artistId: string | number): Promise<string | null> {
  return fetchSignedUrl(`/artists/${artistId}/image-url`);
}