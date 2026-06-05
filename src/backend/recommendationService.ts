import { buildApiUrl } from "./backendUrls";
import { getSongs } from "./catalogService";

export interface AlbumRef {
  id: string;
  title: string;
  cover_url?: string;
  artists?: Array<{ id: string; name: string; image_url?: string }>;
  type?: string;
}

const normalize = (value: string) => value.trim().toLowerCase();

const getToken = (): string | null => {
  return localStorage.getItem("userToken") || localStorage.getItem("authToken");
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

export async function getHomeRecommendations() {
  return authenticatedRequest('/recommendations/home');
}

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
