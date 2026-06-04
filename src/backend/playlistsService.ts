import { buildApiUrl } from "./backendUrls";

export interface Playlist {
  id: string;
  name: string;
  song_count: number;
  created_at: string;
}

const getAuthToken = () => localStorage.getItem('token');

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

  // We combine standard playlists and AI generated ones for a unified library
  const [standard, ai] = await Promise.all([
    request("/playlists").catch(() => []),
    request("/ai-playlists").catch(() => [])
  ]);

  const standardTransformed = standard.map((p: any) => ({
    id: String(p.id),
    name: p.name,
    song_count: p.songs_count || 0,
    created_at: p.created_at
  }));

  const aiTransformed = ai.map((p: any) => ({
    id: `ai_${p.id}`, // Prefix to distinguish from standard
    name: p.title,
    song_count: p.song_count || 0,
    created_at: p.created_at,
    isAi: true
  }));

  return [...standardTransformed, ...aiTransformed].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function createPlaylist(name: string): Promise<Playlist> {
  const data = await request("/playlists", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  return {
    id: String(data.id),
    name: data.name,
    song_count: 0,
    created_at: data.created_at
  };
}

export async function deletePlaylist(id: string): Promise<void> {
  if (id.startsWith('ai_')) {
    const numericId = id.replace('ai_', '');
    await request(`/ai-playlists/${numericId}`, { method: "DELETE" });
  } else {
    await request(`/playlists/${id}`, { method: "DELETE" });
  }
}

export async function getPlaylistSongs(id: string): Promise<any[]> {
  if (id.startsWith('ai_')) {
    const numericId = id.replace('ai_', '');
    const data = await request(`/ai-playlists/${numericId}`);
    return data.songs.map((s: any) => ({
        ...s,
        id: String(s.id),
        duration: Number(s.duration),
        songCover_url: s.cover_url
    }));
  }

  const data = await request(`/playlists/${id}/songs`);
  return (data || []).map((s: any) => ({
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
