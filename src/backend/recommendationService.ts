import { buildApiUrl } from "./backendUrls";
import { getSongs } from "./catalogService";
import { getSignedAlbumCoverUrl, getSignedSongCoverUrl } from "./songMediaApi";

/**
 * Frontend client for the active adaptive recommendation system.
 *
 * IN USE:
 *   getAdaptiveRecommendations  → GET /recommendations (Home, Player)
 *   getColdStartRecommendations → GET /recommendations/cold-start (fallback)
 *   getSimilarRecommendations   → GET /recommendations/similar/{id} (Song Detail)
 *   trackRecommendationEvent    → POST /recommendations/events (analytics)
 *   trackInteraction            → POST /interactions/track (event log only, not ranking)
 *
 * NOT IN USE: getHomeRecommendations, getRecommendationsForInterests (legacy)
 */

const viteEnv = (import.meta as any).env || {};
const BACKEND_API_BASE_URL =
  viteEnv.VITE_BACKEND_API_URL || "http://localhost:8082/api";

const getBackendToken = (): string | null => {
  return (
    localStorage.getItem("userToken") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("token")
  );
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
    songCover_url?: string | null;
    cover_url?: string | null;
    artists?: Array<{ id: number; name: string; image_url?: string }>;
  };
}

const enrichRecommendations = async (
  recommendations: AdaptiveRecommendation[]
): Promise<AdaptiveRecommendation[]> => {
  return Promise.all(
    recommendations.map(async (rec) => {
      const song = rec.song;
      if (!song?.id) return rec;

      const [signedSongCover, signedAlbumCover] = await Promise.all([
        getSignedSongCoverUrl(song.id),
        song.album?.id ? getSignedAlbumCoverUrl(song.album.id) : Promise.resolve(null),
      ]);

      const resolvedCover =
        signedSongCover ||
        signedAlbumCover ||
        song.cover_url ||
        song.songCover_url ||
        song.album?.cover_url ||
        song.cover_key ||
        null;

      const normalizedArtists = Array.isArray(song.artists) && song.artists.length > 0
        ? song.artists
        : song.artist
          ? [{ id: Number(song.artist_id ?? 0), name: song.artist }]
          : [];

      return {
        ...rec,
        song: {
          ...song,
          artists: normalizedArtists,
          artist: song.artist || normalizedArtists.map((a) => a.name).filter(Boolean).join(', '),
          songCover_url: resolvedCover,
          cover_url: resolvedCover,
          cover_key: resolvedCover,
        },
      };
    })
  );
};

export type RecommendationEventType =
  | "recommendation_shown"
  | "recommendation_clicked"
  | "recommendation_played"
  | "recommendation_skipped";

const normalize = (value: string) => value.trim().toLowerCase();

const getToken = (): string | null => {
  return (
    localStorage.getItem("userToken") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("token")
  );
};

const authenticatedRequest = async (path: string, options: RequestInit = {}) => {
  const token = getToken();
  const headers: Record<string, string> = {
    "Accept": "application/json",
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.statusText}`);
  }

  return response.json();
};

/** @deprecated Legacy client-side interest matching — onboarding was removed. */
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

  return matches.length > 0 ? matches.slice(0, 12) : albums.slice(0, 12);
}

// New Dynamic Recommendation Endpoints

/** @deprecated Not used — /recommendations/home has no controller method. */
export async function getHomeRecommendations() {
  return authenticatedRequest('/recommendations/home');
}

/**
 * Logs player events to user_interactions. Does NOT update the taste profile.
 * For preference learning on play click, see trackSongPlay() in playTrackingService.
 */
export async function trackInteraction(songId: string, action: string) {
  try {
    return await authenticatedRequest('/interactions/track', {
      method: 'POST',
      body: JSON.stringify({ song_id: songId, action }),
    });
  } catch (error) {
    console.warn('Failed to track interaction:', error);
  }
}

/**
 * Personalized recommendations from user_preferences (auth required).
 * Used by Home "Recommended Songs" and Player autoplay pool.
 * Backend auto-logs recommendation_shown for each result.
 */
export async function getAdaptiveRecommendations(limit: number = 20): Promise<AdaptiveRecommendation[]> {
  if (!getBackendToken()) {
    return [];
  }

  try {
    const payload = await backendRequest<{ data?: AdaptiveRecommendation[] }>(
      `/recommendations?limit=${Math.max(1, Math.min(limit, 50))}`
    );

    return enrichRecommendations(payload?.data || []);
  } catch (error) {
    console.error("Error fetching adaptive recommendations:", error);
    return [];
  }
}

/**
 * Fallback when adaptive returns empty (guest, new user, or no candidates).
 * Mix of trending, recently added, and popular songs.
 */
export async function getColdStartRecommendations(limit: number = 20): Promise<AdaptiveRecommendation[]> {
  try {
    const payload = await backendRequest<{ data?: AdaptiveRecommendation[] }>(
      `/recommendations/cold-start?limit=${Math.max(1, Math.min(limit, 50))}`
    );

    return enrichRecommendations(payload?.data || []);
  } catch (error) {
    console.error("Error fetching cold-start recommendations:", error);
    return [];
  }
}

/**
 * Content-based "More Like This" for Song Detail.
 * Scores by same artist/genre/mood/tag — does not use user_preferences.
 */
export async function getSimilarRecommendations(songId: string | number, limit: number = 10): Promise<AdaptiveRecommendation[]> {
  try {
    const payload = await backendRequest<{ data?: AdaptiveRecommendation[] }>(
      `/recommendations/similar/${songId}?limit=${Math.max(1, Math.min(limit, 20))}`
    );

    return enrichRecommendations(payload?.data || []);
  } catch (error) {
    console.error("Error fetching similar recommendations:", error);
    return [];
  }
}

/**
 * Logs recommendation UI events (clicked, etc.) for admin analytics.
 * Does not affect future recommendation rankings.
 */
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
