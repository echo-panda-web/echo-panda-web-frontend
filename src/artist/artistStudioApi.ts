import { uploadMediaDirectly } from "../backend/directUpload";
import { getAlbumCoverImageUrl, getSongCoverImageUrl } from "../backend/songMediaApi";

const viteEnv = (import.meta as any).env || {};
const BACKEND_API_BASE_URL = viteEnv.VITE_BACKEND_API_URL || "http://localhost:8082/api";

export interface ArtistIdentity {
  userId: number;
  artistId: number;
  role: "user" | "artist" | "publicer" | "admin";
  displayName: string;
}

export interface ArtistAlbum {
  id: string;
  title: string;
  artist: string;
  releaseDate: string;
  coverUrl: string;
  type: "album" | "single" | "ep";
  description: string;
  releaseStatus: "draft" | "pending_review" | "published" | "rejected";
  scheduledAt: string;
  categoryId?: string;
  mood?: string;
}

export interface ArtistSong {
  id: string;
  title: string;
  artist: string;
  albumId: string | null;
  albumTitle: string;
  duration: number;
  trackNumber: number;
  audioUrl: string;
  lyricsUrl: string;
  lyrics: string;
  createdAt: string;
  coverUrl: string;
  coverKey?: string | null;
  originalKey?: string | null;
  playCount: number;
  processingStatus: string;
  mood?: string;
  song_type?: string;
  bpm?: number;
  is_explicit?: boolean;
  featured_artists?: string;
  category_id?: string;
}

export interface ArtistProfilePayload {
  id: number;
  user_id: number;
  artist_id: number | null;
  name: string;
  email: string;
  role: string;
  artist?: {
    id: number;
    name: string;
    image_url: string | null;
  } | null;
}

interface PaginatedResponse<T> {
  data?: T[];
}

const safeJson = (value: string | null): any => {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

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

  const response = await fetch(`${BACKEND_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...headers,
      ...(init.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const validationErrors = data?.errors && typeof data.errors === "object"
      ? Object.values(data.errors as Record<string, string[]>).flat().join(" ")
      : "";
    throw new Error(validationErrors || data?.message || `Request failed (${response.status})`);
  }

  return data as T;
}

export function getArtistIdentity(): ArtistIdentity | null {
  const artistUser = safeJson(localStorage.getItem("artistUser")) || {};
  const user = safeJson(localStorage.getItem("user")) || {};

  const artistId = Number(artistUser.artist_id ?? user.artist_id);
  const userId = Number(artistUser.user_id ?? user.user_id);

  if (!artistId || !userId) {
    return null;
  }

  // Ensure displayName is always a string to avoid React "Objects are not valid as a React child" errors
  let displayName = artistUser.displayName || artistUser.name || user.displayName || user.name || "Artist";
  if (typeof displayName === "object" && displayName !== null) {
    displayName = (displayName as any).stage_name || (displayName as any).name || "Artist";
  }

  return {
    userId,
    artistId,
    role: (artistUser.role || user.role || "artist") as ArtistIdentity["role"],
    displayName: String(displayName),
  };
}

export async function getOwnedAlbums(identity: ArtistIdentity): Promise<ArtistAlbum[]> {
  const payload = await request<PaginatedResponse<any>>(`/albums?per_page=300&sort_by=latest&artist_id=${identity.artistId}`, {}, true);
  const rows = Array.isArray(payload.data) ? payload.data : [];

  return rows
    .map((row) => {
      const rawType = String(row.description || row.type || "album").toLowerCase();
      const type: "album" | "single" | "ep" = rawType === "single" || rawType === "ep" ? rawType : "album";

      const artistName = row.artist?.stage_name || row.artist_name || identity.displayName;
      const safeArtistName = typeof artistName === "object" && artistName !== null
        ? (artistName as any).stage_name || (artistName as any).name || identity.displayName
        : artistName;

      return {
        id: String(row.id),
        title: row.title || "Untitled",
        artist: String(safeArtistName || "Unknown Artist"),
        releaseDate: row.release_date ? String(row.release_date).split("T")[0] : "",
        coverUrl: row.id ? getAlbumCoverImageUrl(row.id) : (row.cover_url || ""),
        description: row.description || "",
        type,
        releaseStatus: (row.release_status || "draft") as ArtistAlbum["releaseStatus"],
        scheduledAt: row.scheduled_at || "",
        categoryId: row.category_id ? String(row.category_id) : undefined,
        mood: row.mood || undefined,
      };
    });
}

export async function getOwnedSongs(identity: ArtistIdentity): Promise<ArtistSong[]> {
  const payload = await request<PaginatedResponse<any>>(`/songs?per_page=500&sort_by=latest&artist_id=${identity.artistId}`, {}, true);
  const rows = Array.isArray(payload.data) ? payload.data : [];

  return rows
    .map((row) => {
      const artistName = row.artist?.stage_name || row.artist_name || identity.displayName;
      const safeArtistName = typeof artistName === "object" && artistName !== null
        ? (artistName as any).stage_name || (artistName as any).name || identity.displayName
        : artistName;

      return {
        id: String(row.id),
        title: row.title || "Untitled",
        artist: String(safeArtistName || "Unknown Artist"),
        albumId: row.album_id ? String(row.album_id) : null,
      albumTitle: row.album?.title || "Unassigned",
      duration: Number(row.duration || 0),
      trackNumber: Number(row.track_number || 1),
      audioUrl: row.audio_url || "",
      lyricsUrl: row.lyrics_url || "",
      lyrics: row.lyrics || "",
      createdAt: row.created_at || new Date().toISOString(),
      coverUrl: row.id ? getSongCoverImageUrl(row.id) : (row.cover_url || ""),
      coverKey: row.cover_key || null,
      originalKey: row.original_key || null,
      playCount: Number(row.play_count || 0),
      processingStatus: String(row.processing_status || "ready"),
      mood: row.mood,
      song_type: row.song_type,
      bpm: row.bpm,
      is_explicit: Boolean(row.is_explicit),
      featured_artists: row.featured_artists,
      category_id: row.category_id,
    };
    });
}

export async function getSongPlayMap(): Promise<Map<string, number>> {
  const payload = await request<{ data?: Array<{ song_id: number; play_count: number }> }>(
    "/stats/most-played-songs?limit=300"
  );
  const rows = Array.isArray(payload.data) ? payload.data : [];
  const map = new Map<string, number>();
  rows.forEach((row) => {
    map.set(String(row.song_id), Number(row.play_count || 0));
  });
  return map;
}

export async function createArtistAlbum(payload: {
  title: string;
  artist: string;
  release_date?: string;
  description?: string;
  release_status?: "draft" | "pending_review" | "published" | "rejected";
  scheduled_at?: string;
  coverFile?: File | null;
  category_id?: string;
  mood?: string;
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
        release_status: payload.release_status,
        scheduled_at: payload.scheduled_at,
        cover_key: coverUpload?.key,
        category_id: payload.category_id,
        mood: payload.mood,
      }),
    },
    true
  );
}

export async function updateArtistAlbum(
  albumId: string,
  payload: {
    title: string;
    artist: string;
    release_date?: string;
    description?: string;
    release_status?: "draft" | "pending_review" | "published" | "rejected";
    scheduled_at?: string;
    coverFile?: File | null;
    category_id?: string;
    mood?: string;
  }
) {
  const coverUpload = payload.coverFile ? await uploadMediaDirectly(payload.coverFile, "album_cover") : null;

  return request(
    `/albums/${albumId}`,
    {
      method: "PUT",
      body: JSON.stringify({
        title: payload.title,
        artist: payload.artist,
        release_date: payload.release_date,
        description: payload.description,
        release_status: payload.release_status,
        scheduled_at: payload.scheduled_at,
        cover_key: coverUpload?.key,
        category_id: payload.category_id,
        mood: payload.mood,
      }),
    },
    true
  );
}

export async function deleteArtistAlbum(albumId: string) {
  return request(`/albums/${albumId}`, { method: "DELETE" }, true);
}

export async function createArtistSong(payload: {
  title: string;
  duration: number;
  album_id: string;
  artist: string;
  track_number: number;
  original_key?: string | null;
  cover_key?: string | null;
  preview_key?: string | null;
  lyrics?: string;
  lyrics_url?: string;
  mood?: string;
  song_type?: string;
  bpm?: number;
  is_explicit?: boolean;
  featured_artists?: string;
  category_id?: string;
}) {
  return request("/songs", {
    method: "POST",
    body: JSON.stringify(payload),
  }, true);
}

export async function updateArtistSong(
  songId: string,
  payload: {
    title: string;
    duration: number;
    album_id: string;
    artist: string;
    track_number: number;
    original_key?: string | null;
    cover_key?: string | null;
    preview_key?: string | null;
    lyrics?: string;
    lyrics_url?: string;
    mood?: string;
    song_type?: string;
    bpm?: number;
    is_explicit?: boolean;
    featured_artists?: string;
    category_id?: string;
  }
) {
  return request(`/songs/${songId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }, true);
}

export async function deleteArtistSong(songId: string) {
  return request(`/songs/${songId}`, { method: "DELETE" }, true);
}

export async function uploadArtistMedia(payload: { file: File; purpose: "album_cover" | "song_cover" | "song_audio" | "artist_image" | "song_lyrics" }) {
  return uploadMediaDirectly(payload.file, payload.purpose);
}

export async function deleteArtistMedia(payload: { key?: string; url?: string }) {
  const token = getToken();
  if (!token) {
    throw new Error("Missing auth token");
  }

  const response = await fetch(`${BACKEND_API_BASE_URL}/upload/media`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || `Delete failed (${response.status})`);
  }

  return data as { message: string; key: string };
}

export async function getMyProfile(): Promise<ArtistProfilePayload> {
  const response = await request<{ user: ArtistProfilePayload }>(
    "/profile",
    {},
    true
  );

  return response.user;
}

export async function updateMyProfile(payload: { name: string; image_url?: string | null }) {
  // Preferred route for artist profile (accepts artist image keys)
  try {
    const current = await getMyProfile();
    const artistId = current.artist?.id;

    return await request(
      "/artist/profile",
      {
        method: "PUT",
        body: JSON.stringify({
          id: artistId,
          name: payload.name,
          image_url: payload.image_url ?? null,
        }),
      },
      true
    );
  } catch (error) {
    // Fallback for non-artist accounts or older backend behavior
    const current = await getMyProfile();
    return request<{ user: ArtistProfilePayload }>(
      "/profile",
      {
        method: "PUT",
        body: JSON.stringify({
          ...payload,
          email: current.email,
        }),
      },
      true
    );
  }
}

export interface ArtistTrendData {
  daily: number[];
  weekly: number[];
  monthly: number[];
  dates: string[];
}

export async function getArtistAnalytics(): Promise<{
  artist_id: number;
  monthly_streams: number;
  top_song: { id: number; title: string; play_count: number } | null;
  listener_countries: Array<{ country: string; streams: number }>;
  trends: {
    plays: ArtistTrendData;
    listeners: ArtistTrendData;
  };
}> {
  return request("/artist/analytics", {}, true);
}
