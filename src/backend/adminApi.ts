import { getAlbums, getDerivedArtists, getDerivedCategories, getHomeTags, getSongs } from "./catalogService";
import { uploadMediaDirectly } from "./directUpload";
import { getMostPlayedSongs } from "./playTrackingService";
import { getUserPlaylists } from "./playlistsService";

const viteEnv = (import.meta as any).env || {};
const BACKEND_API_BASE_URL = viteEnv.VITE_BACKEND_API_URL || "http://localhost:8082/api";

const getToken = (): string | null => {
  return localStorage.getItem("userToken") || localStorage.getItem("authToken");
};

async function request<T = any>(path: string, init: RequestInit = {}, auth = false): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(!isFormData && init.body ? { "Content-Type": "application/json" } : {}),
  };

  if (auth) {
    const token = getToken();
    if (!token) {
      throw new Error("Missing auth token");
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BACKEND_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...headers,
      ...(init.headers || {}),
    },
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.message || `Request failed: ${res.status}`);
  }

  return data as T;
}

export async function getAdminSongs(limit = 200) {
  const songs = await getSongs(limit);
  return songs.map((song, index) => ({
    id: song.id,
    title: song.title,
    duration: song.duration,
    album_id: song.album_id,
    original_key: song.original_key || null,
    cover_key: song.cover_key || null,
    preview_key: song.preview_key || null,
    audio_url: song.audio_url || "",
    songCover_url: song.songCover_url || "",
    created_at: song.created_at,
    updated_at: song.created_at,
    track_number: index + 1,
    artists: song.artists || [],
    album: song.album
      ? {
          id: song.album.id,
          title: song.album.title,
          cover_url: song.album.cover_url || "",
        }
      : null,
  }));
}

export async function getAdminAlbums(limit = 200) {
  const albums = await getAlbums(limit, 0);
  return albums.map((album) => ({
    id: album.id,
    title: album.title,
    cover_url: album.cover_url || "",
    type: (album.type as "album" | "single" | "ep") || "album",
    release_date: album.release_date || "",
    created_at: album.release_date || new Date().toISOString(),
    updated_at: album.release_date || new Date().toISOString(),
    artists: album.artists || [],
    categories: [],
  }));
}

export async function getAdminArtists() {
  const artists = await getDerivedArtists(500);
  return artists.map((artist) => ({
    id: artist.id,
    created_at: new Date().toISOString(),
    name: artist.name,
    image_url: artist.image_url || "",
    bio: "",
    updated_at: new Date().toISOString(),
    gender: "N/A",
    status: true,
    role: "Single",
  }));
}

export async function getAdminCategories() {
  return getDerivedCategories().then((categories) =>
    categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))
  );
}

export async function getAdminTags() {
  const tags = await getHomeTags();
  return tags.map((tag, index) => ({
    id: tag.id,
    name: tag.name,
    description: tag.description,
    display_order: tag.display_order || index + 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    albums: tag.albums || [],
  }));
}

export async function getDashboardCounts() {
  const [songs, albums, artists, playlists] = await Promise.all([
    getSongs(300),
    getAlbums(300, 0),
    getDerivedArtists(500),
    getUserPlaylists().catch(() => []),
  ]);

  return {
    songs: songs.length,
    albums: albums.length,
    artists: artists.length,
    playlists: playlists.length,
  };
}

export async function getTopFavoritesFallback(limit = 10) {
  const songs = await getMostPlayedSongs(limit);
  const topSongs = songs.map((song, index) => ({
    id: song.id,
    rank: index + 1,
    title: song.title,
    artist: song.artists?.map((a: { name: string }) => a.name).join(", ") || "Unknown",
    favorites: song.play_count || 0,
    plays: song.play_count || 0,
    cover_url: song.songCover_url || song.album?.cover_url,
  }));

  const artistMap = new Map<string, { id: string; name: string; favorites: number }>();
  topSongs.forEach((song) => {
    const names: string[] = song.artist.split(",").map((n: string) => n.trim()).filter(Boolean);
    names.forEach((name: string) => {
      const key = name.toLowerCase();
      const item = artistMap.get(key) || { id: encodeURIComponent(name), name, favorites: 0 };
      item.favorites += song.favorites;
      artistMap.set(key, item);
    });
  });

  const topArtists = Array.from(artistMap.values())
    .sort((a, b) => b.favorites - a.favorites)
    .slice(0, limit)
    .map((artist, index) => ({
      id: artist.id,
      rank: index + 1,
      name: artist.name,
      favorites: artist.favorites,
      followers: artist.favorites,
      image_url: "",
    }));

  return { songs: topSongs, artists: topArtists };
}

export async function createSong(payload: {
  title: string;
  duration: number;
  album_id: string;
  artist?: string;
  track_number?: number;
  original_key?: string | null;
  cover_key?: string | null;
  preview_key?: string | null;
}) {
  return request("/songs", {
    method: "POST",
    body: JSON.stringify({
      title: payload.title,
      duration: payload.duration,
      album_id: Number(payload.album_id),
      artist: payload.artist || null,
      track_number: payload.track_number || 1,
      original_key: payload.original_key || null,
      cover_key: payload.cover_key || null,
      preview_key: payload.preview_key || null,
    }),
  }, true);
}

export async function updateSong(id: string, payload: {
  title: string;
  duration: number;
  album_id: string;
  artist?: string;
  track_number?: number;
  original_key?: string | null;
  cover_key?: string | null;
  preview_key?: string | null;
}) {
  return request(`/songs/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      title: payload.title,
      duration: payload.duration,
      album_id: Number(payload.album_id),
      artist: payload.artist || null,
      track_number: payload.track_number || 1,
      original_key: payload.original_key || null,
      cover_key: payload.cover_key || null,
      preview_key: payload.preview_key || null,
    }),
  }, true);
}

export async function deleteSong(id: string) {
  return request(`/songs/${id}`, { method: "DELETE" }, true);
}

export async function createAlbum(payload: {
  title: string;
  artist: string;
  release_date?: string;
  description?: string;
  coverFile?: File | null;
}) {
  const coverUpload = payload.coverFile ? await uploadMediaDirectly(payload.coverFile, "album_cover") : null;

  return request(
    "/albums",
    {
      method: "POST",
      body: JSON.stringify({
        title: payload.title,
        artist: payload.artist,
        release_date: payload.release_date,
        description: payload.description,
        cover_key: coverUpload?.key,
      }),
    },
    true
  );
}

export async function updateAlbum(id: string, payload: {
  title: string;
  artist: string;
  release_date?: string;
  description?: string;
  coverFile?: File | null;
}) {
  const coverUpload = payload.coverFile ? await uploadMediaDirectly(payload.coverFile, "album_cover") : null;

  return request(
    `/albums/${id}`,
    {
      method: "PUT",
      body: JSON.stringify({
        title: payload.title,
        artist: payload.artist,
        release_date: payload.release_date,
        description: payload.description,
        cover_key: coverUpload?.key,
      }),
    },
    true
  );
}

export async function deleteAlbum(id: string) {
  return request(`/albums/${id}`, { method: "DELETE" }, true);
}

export async function uploadArtistSong(payload: {
  file: File;
  title?: string;
  album_id?: string;
}) {
  return uploadMediaDirectly(payload.file, "song_audio");
}
