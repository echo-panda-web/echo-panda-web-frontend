import { buildApiUrl } from "./backendUrls";

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

const normalizeText = (value: string): string =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const STOP_WORDS = new Set([
  "play", "song", "songs", "music", "please", "for", "me", "the", "a", "an", "to", "by", "with", "and", "of", "on", "called", "name"
]);

const buildSearchVariants = (query: string): string[] => {
  const normalized = normalizeText(query);
  if (!normalized) return [];

  const tokens = normalized
    .split(" ")
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));

  const variants = new Set<string>();
  variants.add(normalized);

  if (tokens.length > 0) {
    variants.add(tokens.join(" "));
    variants.add(tokens.slice(0, 2).join(" "));
    tokens.slice(0, 4).forEach((t) => variants.add(t));
  }

  return Array.from(variants).filter((v) => v.trim().length > 0).slice(0, 6);
};

const tokenScore = (text: string, queryTokens: string[]): number => {
  if (queryTokens.length === 0) return 0;
  const matched = queryTokens.filter((t) => text.includes(t)).length;
  return matched / queryTokens.length;
};

const diceCoefficient = (a: string, b: string): number => {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;

  const bigrams = (s: string) => {
    const map = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i += 1) {
      const gram = s.slice(i, i + 2);
      map.set(gram, (map.get(gram) || 0) + 1);
    }
    return map;
  };

  const aBigrams = bigrams(a);
  const bBigrams = bigrams(b);
  let intersection = 0;

  aBigrams.forEach((count, gram) => {
    const bCount = bBigrams.get(gram) || 0;
    intersection += Math.min(count, bCount);
  });

  return (2 * intersection) / ((a.length - 1) + (b.length - 1));
};

const scoreSong = (song: any, query: string): number => {
  const q = normalizeText(query);
  const title = normalizeText(song?.title || "");
  const artist = normalizeText(song?.artist?.stage_name || song?.artist?.name || song?.artist_name || song?.artist || "");
  const tokens = q.split(" ").filter(Boolean);

  const exactTitle = title === q ? 1 : 0;
  const includesTitle = title.includes(q) && q ? 1 : 0;
  const includesArtist = artist.includes(q) && q ? 1 : 0;
  const tokenMatch = Math.max(tokenScore(title, tokens), tokenScore(artist, tokens));
  const fuzzy = Math.max(diceCoefficient(title, q), diceCoefficient(artist, q));

  return (exactTitle * 2.0) + (includesTitle * 1.2) + (includesArtist * 0.4) + (tokenMatch * 1.1) + (fuzzy * 0.9);
};

const scoreArtist = (artist: any, query: string): number => {
  const q = normalizeText(query);
  const name = normalizeText(artist?.name || "");
  const tokens = q.split(" ").filter(Boolean);
  const exact = name === q ? 1 : 0;
  const includes = name.includes(q) && q ? 1 : 0;
  const tokenMatch = tokenScore(name, tokens);
  const fuzzy = diceCoefficient(name, q);

  return (exact * 2.0) + (includes * 1.2) + (tokenMatch * 1.0) + (fuzzy * 0.8);
};

export async function searchContent(query: string): Promise<{ songs: Song[]; artists: Artist[] }> {
  const normalized = normalizeText(query);
  if (!normalized) {
    return { songs: [], artists: [] };
  }

  const variants = buildSearchVariants(query);

  const [songPayloads, artistPayloads] = await Promise.all([
    Promise.all(
      variants.map(async (variant) => {
        const res = await fetch(buildApiUrl(`/songs?search=${encodeURIComponent(variant)}&per_page=50&sort_by=latest`), {
          headers: { Accept: "application/json" },
        });
        return res.ok ? await res.json().catch(() => null) : null;
      })
    ),
    Promise.all(
      variants.map(async (variant) => {
        const res = await fetch(buildApiUrl(`/artists?search=${encodeURIComponent(variant)}&limit=30`), {
          headers: { Accept: "application/json" },
        });
        return res.ok ? await res.json().catch(() => null) : null;
      })
    ),
  ]);

  const songRows = songPayloads.flatMap((json: any) => (Array.isArray(json?.data) ? json.data : []));
  const artistRows = artistPayloads.flatMap((json: any) => (Array.isArray(json?.data) ? json.data : []));

  const uniqueSongs = new Map<string, any>();
  songRows.forEach((song: any) => {
    const id = String(song?.id || "");
    if (!id) return;
    const existing = uniqueSongs.get(id);
    if (!existing || scoreSong(song, query) > scoreSong(existing, query)) {
      uniqueSongs.set(id, song);
    }
  });

  const uniqueArtists = new Map<string, any>();
  artistRows.forEach((artist: any) => {
    const id = String(artist?.id || "");
    if (!id) return;
    const existing = uniqueArtists.get(id);
    if (!existing || scoreArtist(artist, query) > scoreArtist(existing, query)) {
      uniqueArtists.set(id, artist);
    }
  });

  const filteredSongs = Array.from(uniqueSongs.values())
    .sort((a, b) => scoreSong(b, query) - scoreSong(a, query))
    .slice(0, 50)
    .map((song: any) => ({
    id: String(song.id),
    title: song.title,
    artist_name:
      song.artist?.stage_name || song.artist?.name || song.artist_name || song.artist || "Unknown Artist",
    cover_url: song.cover_key || song.album?.cover_url || song.album?.cover_image || undefined,
    audio_url: song.audio_url || song.original_key || null,
    duration: song.duration,
  }));

  const filteredArtists = Array.from(uniqueArtists.values())
    .sort((a, b) => scoreArtist(b, query) - scoreArtist(a, query))
    .slice(0, 30)
    .map((artist: any) => ({
      id: String(artist.id),
      name: artist.name,
      image_url: artist.image_url,
    }));

  return {
    songs: filteredSongs,
    artists: filteredArtists,
  };
}
