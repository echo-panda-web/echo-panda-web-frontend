import { buildApiUrl, resolveMediaUrl } from "./backendUrls";
import { getSignedAlbumCoverUrl, getSignedSongCoverUrl, getSignedArtistImageUrl } from "./songMediaApi";

export interface CatalogArtist {
  id: string;
  name: string;
  image_url?: string;
}

export interface CatalogAlbum {
  id: string;
  title: string;
  cover_url?: string;
  cover_key?: string | null;
  release_date?: string;
  type?: string;
  artists?: CatalogArtist[];
}

export interface CatalogSong {
  id: string;
  title: string;
  duration: number;
  album_id: string | null;
  original_key?: string | null;
  cover_key?: string | null;
  preview_key?: string | null;
  audio_url: string | null;
  songCover_url: string | null;
  created_at: string;
  artists: CatalogArtist[];
  album?: {
    id: string;
    title: string;
    cover_url?: string;
  } | null;
}

export interface CatalogCategory {
  id: string;
  name: string;
  description: string;
}

const request = async <T = any>(path: string): Promise<T> => {
  const res = await fetch(buildApiUrl(path), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    const errorMessage =
      errorData?.message ||
      errorData?.error ||
      errorData?.detail ||
      (typeof errorData === "string" ? errorData : "") ||
      res.statusText ||
      `HTTP ${res.status}`;

    throw new Error(`Request failed: ${errorMessage}`);
  }

  return (await res.json()) as T;
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
};

export async function getAlbums(limit = 10, offset = 0): Promise<CatalogAlbum[]> {
  const data = await request<{ data?: any[] }>(`/albums?per_page=200&sort_by=latest`);
  const rows = Array.isArray(data?.data) ? data.data : [];

  return Promise.all(rows.slice(offset, offset + limit).map(async (album: any) => ({
    id: String(album.id),
    title: album.title,
    cover_key: album.cover_key || null,
    cover_url: (await getSignedAlbumCoverUrl(album.id)) || undefined,
    release_date: album.release_date || undefined,
    type: album.type || undefined,
    artists: getArtistName(album.artist, album.artist_name)
      ? [{ id: String(album.artist_id || album.id), name: String(getArtistName(album.artist, album.artist_name)), image_url: undefined }]
      : [],
  })));
}

export async function getNewReleasesToday(limit = 10): Promise<CatalogAlbum[]> {
  try {
    const data = await request<{ data?: any[] }>(`/albums/new-releases-today?limit=${Math.max(1, limit)}`);
    const rows = Array.isArray(data?.data) ? data.data : [];

    return Promise.all(rows.map(async (album: any) => ({
      id: String(album.id),
      title: album.title,
      cover_key: album.cover_key || null,
      cover_url: (await getSignedAlbumCoverUrl(album.id)) || album.cover_url || undefined,
      release_date: album.release_date || undefined,
      type: album.type || undefined,
      artists: getArtistName(album.artist, album.artist_name)
        ? [{ id: String(album.artist_id || album.id), name: String(getArtistName(album.artist, album.artist_name)), image_url: undefined }]
        : [],
    })));
  } catch (error) {
    console.error('Error fetching today new releases:', error);
    return [];
  }
}

export async function getSongs(limit = 25): Promise<CatalogSong[]> {
  const data = await request<{ data?: any[] }>(`/songs?per_page=${Math.max(1, limit)}&sort_by=latest`);
  const rows = Array.isArray(data?.data) ? data.data : [];

  return Promise.all(rows.map(async (song: any) => {
    const coverUrl = await getSignedSongCoverUrl(song.id);

    return {
      id: String(song.id),
      title: song.title,
      duration: song.duration,
      album_id: song.album_id ? String(song.album_id) : null,
      original_key: song.original_key || null,
      cover_key: song.cover_key || null,
      preview_key: song.preview_key || null,
      audio_url: song.original_key || null,
      songCover_url: coverUrl || resolveMediaUrl(song.songCover_url || song.album?.cover_url || song.album?.cover_image),
      created_at: song.created_at,
      artists: getArtistName(song.artist, song.artist_name)
        ? [{ id: String(song.artist_id || song.id), name: String(getArtistName(song.artist, song.artist_name)), image_url: undefined }]
        : [],
      album: song.album
        ? {
            id: String(song.album.id),
            title: song.album.title,
            cover_url: (await getSignedAlbumCoverUrl(song.album.id)) || undefined,
          }
        : null,
    };
  }));
}

export async function getDerivedArtists(limit = 10, search = ""): Promise<CatalogArtist[]> {
  try {
    // First try to fetch from the public artists endpoint (includes image_url)
    const response = await fetch(buildApiUrl('/artists'), {
      headers: { Accept: 'application/json' },
    });

    if (response.ok) {
      const data = await response.json().catch(() => null);
      if (data?.data && Array.isArray(data.data)) {
        const normalizedSearch = search.trim().toLowerCase();
        const filtered = data.data
          .filter((artist: any) =>
            normalizedSearch ? artist.name.toLowerCase().includes(normalizedSearch) : true
          );
        
        // Sign image URLs for artists that have them
        const withSignedUrls = await Promise.all(
          filtered.map(async (artist: any) => {
            let signedImageUrl = artist.image_url;
            if (artist.image_url && artist.id) {
              signedImageUrl = await getSignedArtistImageUrl(artist.id);
            }
            return {
              id: artist.id ? String(artist.id) : encodeURIComponent(artist.name),
              name: artist.name,
              image_url: signedImageUrl || undefined,
            };
          })
        );
        
        return withSignedUrls.slice(0, Math.max(1, limit));
      }
    }
  } catch (err) {
    console.error('Error fetching artists from public endpoint:', err);
  }

  // Fallback: derive from songs and albums if public endpoint fails
  const songs = await getSongs(200);
  const albums = await getAlbums(200, 0);

  const map = new Map<string, CatalogArtist>();

  songs.forEach((song) => {
    song.artists.forEach((artist) => {
      if (!map.has(artist.name.toLowerCase())) {
        map.set(artist.name.toLowerCase(), {
          id: encodeURIComponent(artist.name),
          name: artist.name,
          image_url: artist.image_url,
        });
      }
    });
  });

  albums.forEach((album) => {
    (album.artists || []).forEach((artist) => {
      if (!map.has(artist.name.toLowerCase())) {
        map.set(artist.name.toLowerCase(), {
          id: encodeURIComponent(artist.name),
          name: artist.name,
          image_url: artist.image_url,
        });
      }
    });
  });

  const normalizedSearch = search.trim().toLowerCase();
  const list = Array.from(map.values()).filter((artist) =>
    normalizedSearch ? artist.name.toLowerCase().includes(normalizedSearch) : true
  );

  return list.slice(0, Math.max(1, limit));
}

export async function getPopularArtists(limit = 10): Promise<Array<CatalogArtist & { play_count?: number; monthly_listeners?: string }>> {
  try {
    const data = await request<{ data?: any[] }>(`/artists/popular?limit=${Math.max(1, limit)}`);
    const rows = Array.isArray(data?.data) ? data.data : [];

    return Promise.all(rows.map(async (artist: any) => ({
      id: String(artist.id),
      name: artist.name,
      image_url: artist.image_url || undefined,
      play_count: artist.play_count,
      monthly_listeners: artist.monthly_listeners,
    })));
  } catch (error) {
    console.error('Error fetching popular artists:', error);
    return [];
  }
}

const normalizeCategories = (items: any[]): CatalogCategory[] => {
  return (Array.isArray(items) ? items : [])
    .map((item: any) => {
      const name = String(item?.name || item?.title || item?.genre || "").trim();
      if (!name) {
        return null;
      }

      const description = String(item?.description || item?.summary || `${name} music`).trim();

      return {
        id: String(item?.id || encodeURIComponent(name.toLowerCase())),
        name,
        description,
      };
    })
    .filter((item): item is CatalogCategory => Boolean(item));
};

const DEFAULT_GENRES: CatalogCategory[] = [
  { id: "pop", name: "Pop", description: "Popular music" },
  { id: "hip-hop", name: "Hip Hop", description: "Hip hop and rap" },
  { id: "rnb", name: "R&B", description: "Rhythm and Blues" },
  { id: "rock", name: "Rock", description: "Rock music" },
  { id: "electronic", name: "Electronic", description: "EDM and electronic" },
  { id: "jazz", name: "Jazz", description: "Jazz music" },
  { id: "classical", name: "Classical", description: "Classical music" },
  { id: "k-pop", name: "K-Pop", description: "Korean pop music" },
  { id: "lo-fi", name: "Lo-Fi", description: "Low fidelity beats" },
];

export async function getGenres(): Promise<CatalogCategory[]> {
  const parseResponse = (data: any): CatalogCategory[] => {
    if (Array.isArray(data)) {
      return normalizeCategories(data);
    }

    if (Array.isArray(data?.data)) {
      return normalizeCategories(data.data);
    }

    if (Array.isArray(data?.genres)) {
      return normalizeCategories(data.genres);
    }

    return [];
  };

  try {
    const genresRes = await fetch(buildApiUrl("/genres"), {
      headers: { Accept: "application/json" }
    });
    if (genresRes.ok) {
      const data = await genresRes.json();
      const fromGenres = parseResponse(data);
      if (fromGenres.length > 0) {
        return fromGenres;
      }
    }
  } catch (error) {
    console.error("Error fetching genres from backend:", error);
  }

  return DEFAULT_GENRES;
}

export async function getDerivedTags(): Promise<CatalogCategory[]> {
  try {
    const res = await fetch(buildApiUrl("/tags"), {
      headers: { Accept: "application/json" }
    });
    if (res.ok) {
      const data = await res.json();
      return normalizeCategories(data);
    }
  } catch (error) {
    console.error("Error fetching tags from backend:", error);
  }

  return [
    { id: "chill", name: "Chill", description: "Relaxing vibes" },
    { id: "workout", name: "Workout", description: "High energy for the gym" },
    { id: "party", name: "Party", description: "Upbeat celebration music" },
  ];
}

export async function getDerivedCategories(): Promise<CatalogCategory[]> {
  return getGenres();
}

export async function getTags(): Promise<Array<{ id: string; name: string; slug: string | null }>> {
  try {
    const url = buildApiUrl('/tags');
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Failed to load tags', err);
    return [];
  }
}

export async function getHomeTags(): Promise<Array<{ id: string; name: string; description: string; display_order: number; albums: CatalogAlbum[] }>> {
  const albums = await getAlbums(12, 0);
  const newReleases = albums.slice(0, 6);
  const trending = albums.slice(6, 12);

  return [
    {
      id: "new-releases",
      name: "New Releases",
      description: "Latest albums on Echo Panda",
      display_order: 1,
      albums: newReleases,
    },
    {
      id: "trending",
      name: "Trending",
      description: "Popular picks right now",
      display_order: 2,
      albums: trending,
    },
  ];
}
