const viteEnv = (import.meta as any).env || {};
const BACKEND_API_BASE_URL =
  viteEnv.VITE_BACKEND_API_URL || "http://localhost:8082/api";

export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  song_count?: number;
}

const getBackendToken = (): string | null => {
  return localStorage.getItem("userToken") || localStorage.getItem("authToken");
};

const backendRequest = async <T = any>(
  path: string,
  init: RequestInit = {}
): Promise<T> => {
  const token = getBackendToken();

  if (!token) {
    throw new Error("Missing backend auth token");
  }

  const response = await fetch(`${BACKEND_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || `Request failed with ${response.status}`);
  }

  return data as T;
};

import { getSignedAlbumCoverUrl, getSignedSongCoverUrl } from "./songMediaApi";

// Get all playlists for current user
export const getUserPlaylists = async (): Promise<Playlist[]> => {
  if (!getBackendToken()) return [];

  try {
    const result = await backendRequest<{ data: any[] }>("/playlists");

    return (result?.data || []).map((playlist: any) => ({
      id: String(playlist.id),
      user_id: String(playlist.user_id),
      name: playlist.name,
      created_at: playlist.created_at,
      updated_at: playlist.updated_at,
      song_count: playlist.songs_count || 0,
    }));
  } catch (error) {
    console.error("Error fetching playlists:", error);
    return [];
  }
};

// Create new playlist
export const createPlaylist = async (name: string): Promise<Playlist | null> => {
  if (!getBackendToken()) {
    console.error("User not logged in");
    return null;
  }

  try {
    const result = await backendRequest<{ data: any }>("/playlists", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    const data = result?.data;

    console.log(`✅ Playlist "${name}" created`);
    return {
      id: String(data.id),
      user_id: String(data.user_id),
      name: data.name,
      created_at: data.created_at,
      updated_at: data.updated_at,
      song_count: 0,
    };
  } catch (error) {
    console.error("Error creating playlist:", error);
    return null;
  }
};

// Add song to playlist
export const addSongToPlaylist = async (
  playlistId: string,
  songId: string
): Promise<boolean> => {
  try {
    const parsedSongId = Number.parseInt(songId, 10);
    if (Number.isNaN(parsedSongId)) return false;

    await backendRequest(`/playlists/${playlistId}/songs`, {
      method: "POST",
      body: JSON.stringify({ song_id: parsedSongId }),
    });

    console.log(`✅ Song ${songId} added to playlist ${playlistId}`);
    return true;
  } catch (error: any) {
    if ((error?.message || "").toLowerCase().includes("already in playlist")) {
      return true;
    }
    console.error("Error adding song to playlist:", error);
    return false;
  }
};

// Remove song from playlist
export const removeSongFromPlaylist = async (
  playlistId: string,
  songId: string
): Promise<boolean> => {
  try {
    const parsedSongId = Number.parseInt(songId, 10);
    if (Number.isNaN(parsedSongId)) return false;

    await backendRequest(`/playlists/${playlistId}/songs/${parsedSongId}`, {
      method: "DELETE",
    });

    console.log(`✅ Song ${songId} removed from playlist ${playlistId}`);
    return true;
  } catch (error) {
    console.error("Error removing song from playlist:", error);
    return false;
  }
};

// Get songs in a playlist
export const getPlaylistSongs = async (playlistId: string): Promise<any[]> => {
  try {
    const result = await backendRequest<{ data: any[] }>(`/playlists/${playlistId}/songs`);

    return Promise.all((result?.data || []).map(async (song: any) => {
      const coverUrl = await getSignedSongCoverUrl(song.id);
      const albumCoverUrl = song.album?.id ? await getSignedAlbumCoverUrl(song.album.id) : null;

      return {
        id: String(song.id),
        title: song.title,
        duration: song.duration,
        album_id: song.album_id ? String(song.album_id) : null,
        audio_url: song.original_key || null,
        songCover_url: coverUrl || albumCoverUrl || song.album?.cover_url || null,
        artists: song.artist ? [{ id: String(song.id), name: song.artist, image_url: "" }] : [],
        album: song.album
          ? {
              id: String(song.album.id),
              title: song.album.title,
              cover_url: albumCoverUrl || null,
            }
          : null,
        added_at: song.pivot?.added_at || song.created_at,
      };
    }));
  } catch (error) {
    console.error("Error fetching playlist songs:", error);
    return [];
  }
};

// Delete playlist
export const deletePlaylist = async (playlistId: string): Promise<boolean> => {
  try {
    await backendRequest(`/playlists/${playlistId}`, {
      method: "DELETE",
    });

    console.log(`✅ Playlist ${playlistId} deleted`);
    return true;
  } catch (error) {
    console.error("Error deleting playlist:", error);
    return false;
  }
};

// Check if song is in playlist
export const isSongInPlaylist = async (
  playlistId: string,
  songId: string
): Promise<boolean> => {
  try {
    const parsedSongId = Number.parseInt(songId, 10);
    if (Number.isNaN(parsedSongId)) return false;

    const result = await backendRequest<{ exists: boolean }>(
      `/playlists/${playlistId}/songs/${parsedSongId}/exists`
    );

    return !!result?.exists;
  } catch (error) {
    console.error("Error checking playlist:", error);
    return false;
  }
};
