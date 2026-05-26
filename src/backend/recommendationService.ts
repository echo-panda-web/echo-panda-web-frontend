import { getSongs } from "./catalogService";

export interface AlbumRef {
  id: string;
  title: string;
  cover_url?: string;
  artists?: Array<{ id: string; name: string; image_url?: string }>;
  type?: string;
}

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
