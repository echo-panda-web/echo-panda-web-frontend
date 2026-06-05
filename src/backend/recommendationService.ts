import { getSongs } from "./catalogService";

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

export interface AlbumRef {
  id: string;
  title: string;
  cover_url?: string;
  artists?: Array<{ id: string; name: string; image_url?: string }>;
  type?: string;
}

export interface AdaptiveRecommendation {
  id: number;
  title: string;
  recommendation_score: number;
  recommendation_reason: string;
  reason: {
    artist: number;
    genre: number;
    mood: number;
    tag: number;
    popularity: number;
  };
  song: {
    id: number;
    title: string;
    artist: string;
    artist_id: number | null;
    album: any;
    genre: string | null;
    mood: string | null;
    tag: string | null;
    duration: number | null;
    play_count: number;
    audio_url: string | null;
    cover_key: string | null;
  };
}

export type RecommendationEventType =
  | "recommendation_shown"
  | "recommendation_clicked"
  | "recommendation_played"
  | "recommendation_skipped";

const normalize = (value: string) => value.trim().toLowerCase();

export async function getRecommendationsForInterests(interests: string[]): Promise<AlbumRef[]> {
  const songs = await getSongs(500);

  const allAlbumsMap = new Map<string, AlbumRef>();
  songs.forEach((song) => {
    if (!song.album) return;

    const existing = allAlbumsMap.get(song.album.id);
    if (!existing) {
      allAlbumsMap.set(song.album.id, {
        id: song.album.id,
        title: song.album.title,
        cover_url: song.album.cover_url,
        artists: song.artists || [],
        type: "album",
      });
    }
  });

  const albums = Array.from(allAlbumsMap.values());
  if (albums.length === 0) return [];

  const wanted = new Set((interests || []).map(normalize).filter(Boolean));
  if (wanted.size === 0) return albums.slice(0, 12);

  const matches = albums.filter((album) => {
    const title = normalize(album.title || "");
    const artists = (album.artists || []).map((a) => normalize(a.name)).join(" ");

    for (const token of wanted) {
      if (title.includes(token) || artists.includes(token)) {
        return true;
      }
    }

    return false;
  });

  if (matches.length > 0) {
    return matches.slice(0, 12);
  }

  // Fallback when interest labels do not directly match titles/artists.
  return albums.slice(0, 12);
}

export async function getAdaptiveRecommendations(limit: number = 20): Promise<AdaptiveRecommendation[]> {
  if (!getBackendToken()) {
    return [];
  }

  try {
    const payload = await backendRequest<{ data?: AdaptiveRecommendation[] }>(
      `/recommendations?limit=${Math.max(1, Math.min(limit, 50))}`
    );

    return payload?.data || [];
  } catch (error) {
    console.error("Error fetching adaptive recommendations:", error);
    return [];
  }
}

export async function getColdStartRecommendations(limit: number = 20): Promise<AdaptiveRecommendation[]> {
  try {
    const payload = await backendRequest<{ data?: AdaptiveRecommendation[] }>(
      `/recommendations/cold-start?limit=${Math.max(1, Math.min(limit, 50))}`
    );

    return payload?.data || [];
  } catch (error) {
    console.error("Error fetching cold-start recommendations:", error);
    return [];
  }
}

export async function getSimilarRecommendations(songId: string | number, limit: number = 10): Promise<AdaptiveRecommendation[]> {
  try {
    const payload = await backendRequest<{ data?: AdaptiveRecommendation[] }>(
      `/recommendations/similar/${songId}?limit=${Math.max(1, Math.min(limit, 20))}`
    );

    return payload?.data || [];
  } catch (error) {
    console.error("Error fetching similar recommendations:", error);
    return [];
  }
}

export async function trackRecommendationEvent(event: {
  songId: string | number;
  eventType: RecommendationEventType;
  recommendationScore?: number;
  recommendationReason?: string;
}): Promise<boolean> {
  if (!getBackendToken()) {
    return false;
  }

  try {
    await backendRequest("/recommendations/events", {
      method: "POST",
      body: JSON.stringify({
        song_id: Number(event.songId),
        event_type: event.eventType,
        recommendation_score: event.recommendationScore ?? 0,
        recommendation_reason: event.recommendationReason ?? null,
      }),
    });

    return true;
  } catch (error) {
    console.error("Error tracking recommendation event:", error);
    return false;
  }
}
