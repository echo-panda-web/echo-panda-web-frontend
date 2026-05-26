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

const request = async <T = any>(path: string): Promise<T> => {
  const res = await fetch(buildApiUrl(path), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
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

export async function getDerivedCategories(): Promise<Array<{ id: string; name: string; description: string }>> {
  const defaults = ["Pop", "Rock", "Hip Hop", "Chill", "Acoustic", "Electronic"];

  return defaults.map((name) => ({
    id: encodeURIComponent(name.toLowerCase()),
    name,
    description: `${name} music`,
  }));
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
