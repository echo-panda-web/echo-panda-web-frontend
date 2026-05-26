import { getDerivedArtists, getSongs } from "./catalogService";

export interface Song {
  id: string;
  title: string;
  artist_name: string;
  cover_url?: string;
  audio_url?: string | null;
  duration?: number;
}

export interface Artist {
  id: string;
  name: string;
  image_url?: string;
}

export async function searchContent(query: string): Promise<{ songs: Song[]; artists: Artist[] }> {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return { songs: [], artists: [] };
  }

  const [songs, artists] = await Promise.all([getSongs(400), getDerivedArtists(400)]);

  const filteredSongs = songs
    .filter((song) => {
      const title = String(song.title || "").toLowerCase();
      const artistNames = (song.artists || []).map((a) => a.name.toLowerCase()).join(" ");
      return title.includes(normalized) || artistNames.includes(normalized);
    })
    .slice(0, 50)
    .map((song) => ({
      id: song.id,
      title: song.title,
      artist_name: (song.artists || []).map((a) => a.name).join(", ") || "Unknown Artist",
      cover_url: song.songCover_url || song.album?.cover_url,
        audio_url: song.audio_url,
      duration: song.duration,
    }));

  const filteredArtists = artists
    .filter((artist) => String(artist.name || "").toLowerCase().includes(normalized))
    .slice(0, 30)
    .map((artist) => ({
      id: artist.id,
      name: artist.name,
      image_url: artist.image_url,
    }));

  return {
    songs: filteredSongs,
    artists: filteredArtists,
  };
}
