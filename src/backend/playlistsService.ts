import { buildApiUrl } from "./backendUrls";

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  song_count: number;
  created_at: string;
}

const getAuthToken = () => localStorage.getItem("userToken") || localStorage.getItem("authToken") || localStorage.getItem('token');

const request = async <T = any>(path: string, options: RequestInit = {}): Promise<T> => {
  const token = getAuthToken();
  const headers = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(buildApiUrl(path), { ...options, headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || "Playlist request failed");
  }

  return response.json();
};

export async function getUserPlaylists(): Promise<Playlist[]> {
  const token = getAuthToken();
  if (!token) return [];

  const response = await request("/playlists").catch(() => ({ data: [] }));
  const standard = Array.isArray(response) ? response : (response?.data || []);

  return standard.map((p: any) => ({
    id: String(p.id),
    name: p.name,
    description: p.description,
    image_url: p.image_url,
    song_count: p.songs_count || 0,
    created_at: p.created_at
  })).sort((a: any, b: any) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function createPlaylist(name: string, description?: string, imageUrl?: string): Promise<Playlist> {
  const response = await request("/playlists", {
    method: "POST",
    body: JSON.stringify({ name, description, image_url: imageUrl }),
  });
  const data = response?.data || response;

  return {
    id: String(data.id),
    name: data.name,
    description: data.description,
    image_url: data.image_url,
    song_count: 0,
    created_at: data.created_at
  };
}

export async function updatePlaylist(
  id: string,
  name: string,
  description?: string,
  cover?: string
): Promise<Playlist> {
  const coverPayload = cover
    ? (cover.startsWith("http") ? { image_url: cover } : { cover_key: cover })
    : {};

  const response = await request(`/playlists/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      name,
      description,
      ...coverPayload,
    }),
  });
  const data = response?.data || response;

  return {
    id: String(data.id),
    name: data.name,
    description: data.description,
    image_url: data.image_url,
    song_count: data.songs_count || 0,
    created_at: data.created_at
  };
}

export async function uploadPlaylistCover(playlistId: string, file: File): Promise<Playlist> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Missing auth token");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(buildApiUrl(`/playlists/${playlistId}/cover`), {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || "Failed to upload playlist cover");
  }

  const playlist = data?.data || data;

  return {
    id: String(playlist.id),
    name: playlist.name,
    description: playlist.description,
    image_url: playlist.image_url,
    song_count: playlist.songs_count || 0,
    created_at: playlist.created_at,
  };
}

export async function deletePlaylist(id: string): Promise<void> {
  await request(`/playlists/${id}`, { method: "DELETE" });
}

export async function getPlaylistSongs(id: string): Promise<any[]> {
  const response = await request(`/playlists/${id}/songs`);
  const data = Array.isArray(response) ? response : (response?.data || []);

  return data.map((s: any) => ({
    ...s,
    id: String(s.id),
    duration: Number(s.duration),
  }));
}

export async function addSongToPlaylist(playlistId: string, songId: string): Promise<void> {
  await request(`/playlists/${playlistId}/songs`, {
    method: "POST",
    body: JSON.stringify({ song_id: songId }),
  });
}

export async function removeSongFromPlaylist(playlistId: string, songId: string): Promise<void> {
  await request(`/playlists/${playlistId}/songs/${songId}`, {
    method: "DELETE"
  });
}

export async function isSongInPlaylist(playlistId: string, songId: string): Promise<boolean> {
  const data = await request(`/playlists/${playlistId}/songs/${songId}/exists`);
  return !!data.exists;
}
