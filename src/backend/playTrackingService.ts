const viteEnv = (import.meta as any).env || {};
const BACKEND_API_BASE_URL =
  viteEnv.VITE_BACKEND_API_URL || "http://localhost:8082/api";

const getBackendToken = (): string | null => {
  return localStorage.getItem("userToken") || localStorage.getItem("authToken");
};

const backendRequest = async <T = any>(
  path: string,
  init: RequestInit = {}
): Promise<T> => {
  const token = getBackendToken();

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BACKEND_API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || `Request failed with ${response.status}`);
  }

  return data as T;
};

const getArtistName = (artistField: any, artistNameField?: string): string | null => {
  if (artistField && typeof artistField === "object") {
    return artistField.stage_name || artistField.name || artistNameField || null;
  }
  if (typeof artistField === "string" && artistField.trim()) {
    return artistField;
  }
  if (artistNameField && artistNameField.trim()) {
    return artistNameField;
  }
  return null;
}

import { getSignedSongCoverUrl } from "./songMediaApi";
import { getSignedAlbumCoverUrl } from "./songMediaApi";

// Track a song play/listen
export const trackSongPlay = async (songId: string): Promise<boolean> => {
  const parsed = Number.parseInt(songId, 10);
  if (Number.isNaN(parsed)) {
    console.error("Invalid numeric song id for trackSongPlay:", songId);
    return false;
  }

  if (!getBackendToken()) {
    console.error("User not logged in");
    return false;
  }

  try {
    await backendRequest("/listen-history", {
      method: "POST",
      body: JSON.stringify({ song_id: parsed }),
    });

    console.log(`✅ Tracked play for song ${songId}`);
    return true;
  } catch (error) {
    console.error("Error tracking play:", error);
    return false;
  }
};

// Get play count for a song (all users)
export const getSongPlayCount = async (songId: string): Promise<number> => {
  try {
    const data = await backendRequest<{ data: Array<{ song_id: number; play_count: number }> }>(
      "/stats/most-played-songs?limit=200"
    );

    const parsed = Number.parseInt(songId, 10);
    if (Number.isNaN(parsed)) return 0;

    const row = (data?.data || []).find((item) => item.song_id === parsed);
    return row?.play_count || 0;
  } catch (error) {
    console.error("Error getting play count:", error);
    return 0;
  }
};

// Get most played songs (global)
export const getMostPlayedSongs = async (limit: number = 25): Promise<any[]> => {
  try {
    const result = await backendRequest<{ data: any[] }>(
      `/stats/most-played-songs?limit=${limit}`
    );

    return Promise.all((result?.data || []).map(async (row: any) => {
      const song = row.song;
      const coverUrl = await getSignedSongCoverUrl(song.id);
      const albumCoverUrl = song.album?.id ? await getSignedAlbumCoverUrl(song.album.id) : null;

      return {
        id: String(song.id),
        title: song.title,
        duration: song.duration,
        audio_url: song.original_key || null,
        songCover_url: coverUrl || albumCoverUrl || song.album?.cover_url || null,
        album_id: song.album_id ? String(song.album_id) : null,
        album: song.album
          ? {
              id: String(song.album.id),
              title: song.album.title,
              cover_url: albumCoverUrl || null,
            }
          : null,
        artists: getArtistName(song.artist, song.artist_name)
          ? [{ id: String(song.artist_id || song.id), name: String(getArtistName(song.artist, song.artist_name)), image_url: "" }]
          : [],
        play_count: row.play_count,
      };
    }));
  } catch (error) {
    console.error("Error fetching most played songs:", error);
    return [];
  }
};

// Get user's recently played songs
export const getRecentlyPlayed = async (limit: number = 25): Promise<any[]> => {
  if (!getBackendToken()) return [];

  try {
    const result = await backendRequest<{ data?: any[] }>(`/listen-history?per_page=${limit}`);
    const rows = result?.data || [];

    return Promise.all(rows.map(async (item: any) => {
      const song = item.song;
      const coverUrl = await getSignedSongCoverUrl(song.id);
      const albumCoverUrl = song.album?.id ? await getSignedAlbumCoverUrl(song.album.id) : null;

      return {
        id: String(song.id),
        title: song.title,
        duration: song.duration,
        audio_url: song.original_key || null,
        songCover_url: coverUrl || albumCoverUrl || song.album?.cover_url || null,
        album_id: song.album_id ? String(song.album_id) : null,
        album: song.album
          ? {
              id: String(song.album.id),
              title: song.album.title,
              cover_url: albumCoverUrl || null,
            }
          : null,
        artists: getArtistName(song.artist, song.artist_name)
          ? [{ id: String(song.artist_id || song.id), name: String(getArtistName(song.artist, song.artist_name)), image_url: "" }]
          : [],
        listened_at: item.updated_at || item.created_at,
      };
    }));
  } catch (error) {
    console.error("Error fetching recently played:", error);
    return [];
  }
};

// Get user's listening stats
export const getUserListeningStats = async (): Promise<{
  totalPlays: number;
  uniqueSongs: number;
  topArtist: string | null;
}> => {
  if (!getBackendToken()) return { totalPlays: 0, uniqueSongs: 0, topArtist: null };

  try {
    const result = await backendRequest<{ data?: any[] }>("/listen-history?per_page=200");
    const rows = result?.data || [];

    const totalPlays = rows.reduce((sum: number, item: any) => sum + (item.play_count || 0), 0);
    const uniqueSongs = new Set(rows.map((item: any) => item.song_id)).size;

    const artistCounts: Record<string, number> = {};
    rows.forEach((item: any) => {
      const artistName = getArtistName(item.song?.artist, item.song?.artist_name);
      const plays = item.play_count || 0;
      if (artistName) {
        artistCounts[artistName] = (artistCounts[artistName] || 0) + plays;
      }
    });

    const topArtist =
      Object.entries(artistCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    return { totalPlays, uniqueSongs, topArtist };
  } catch (error) {
    console.error("Error fetching stats:", error);
    return { totalPlays: 0, uniqueSongs: 0, topArtist: null };
  }
};

// Get most played albums
export const getMostPlayedAlbums = async (limit: number = 10): Promise<any[]> => {
  try {
    const result = await backendRequest<{ data: any[] }>(
      `/stats/most-played-albums?limit=${limit}`
    );

    return (result?.data || []).map((row: any) => {
      const album = row.album;
      return {
        id: String(album.id),
        title: album.title,
        cover_url: album.cover_url || null,
        release_date: album.release_date,
        artists: getArtistName(album.artist, album.artist_name)
          ? [{ id: String(album.artist_id || album.id), name: String(getArtistName(album.artist, album.artist_name)), image_url: "" }]
          : [],
        play_count: row.play_count,
      };
    });
  } catch (error) {
    console.error("Error fetching most played albums:", error);
    return [];
  }
};
