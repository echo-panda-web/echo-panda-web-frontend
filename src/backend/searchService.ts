import { buildApiUrl, resolveMediaUrl } from "./backendUrls";
import {
  getSignedAlbumCoverUrl,
  getSignedArtistImageUrl,
  getSignedSongCoverUrl,
} from "./songMediaApi";

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
    variants.add(tokens.join(" ")); // full token phrase
    variants.add(tokens.slice(0, 2).join(" ")); // first two tokens
    variants.add(tokens.slice(-2).join(" ")); // last two tokens
    variants.add(tokens.join("")); // collapsed tokens without whitespace
    tokens.forEach((t) => variants.add(t));
    tokens.slice(0, 4).forEach((t) => variants.add(t));
    if (tokens.length > 2) {
      variants.add(tokens.slice(1, 3).join(" "));
      variants.add(tokens.slice(0, 3).join(" "));
    }
  }

  const compact = normalized.replace(/\s+/g, "");
  if (compact && compact !== normalized) {
    variants.add(compact);
  }

  return Array.from(variants).filter((v) => v.trim().length > 0).slice(0, 8);
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
  const qCollapsed = q.replace(/\s+/g, "");
  const title = normalizeText(song?.title || "");
  const artist = normalizeText(song?.artist?.stage_name || song?.artist?.name || song?.artist_name || song?.artist || "");
  const combined = normalizeText(`${song?.title || ""} ${song?.artist?.stage_name || song?.artist?.name || song?.artist_name || song?.artist || ""}`);
  const titleCollapsed = title.replace(/\s+/g, "");
  const artistCollapsed = artist.replace(/\s+/g, "");
  const combinedCollapsed = combined.replace(/\s+/g, "");
  const tokens = q.split(" ").filter(Boolean);

  const exactTitle = title === q ? 1 : 0;
  const includesTitle = title.includes(q) && q ? 1 : 0;
  const includesArtist = artist.includes(q) && q ? 1 : 0;
  const includesCombined = combined.includes(q) && q ? 1 : 0;
  const includesTitleCollapsed = titleCollapsed.includes(qCollapsed) && qCollapsed ? 1 : 0;
  const includesArtistCollapsed = artistCollapsed.includes(qCollapsed) && qCollapsed ? 1 : 0;
  const includesCombinedCollapsed = combinedCollapsed.includes(qCollapsed) && qCollapsed ? 1 : 0;
  const tokenMatch = Math.max(
    tokenScore(title, tokens),
    tokenScore(artist, tokens),
    tokenScore(combined, tokens),
    tokenScore(titleCollapsed, tokens),
    tokenScore(artistCollapsed, tokens),
    tokenScore(combinedCollapsed, tokens)
  );
  const fuzzy = Math.max(
    diceCoefficient(combined, q),
    diceCoefficient(title, q),
    diceCoefficient(artist, q),
    diceCoefficient(combinedCollapsed, qCollapsed),
    diceCoefficient(titleCollapsed, qCollapsed),
    diceCoefficient(artistCollapsed, qCollapsed)
  );

  return (
    exactTitle * 2.0 +
    includesTitle * 1.4 +
    includesCombined * 1.1 +
    includesArtist * 0.7 +
    includesTitleCollapsed * 1.3 +
    includesCombinedCollapsed * 1.2 +
    includesArtistCollapsed * 0.8 +
    tokenMatch * 1.2 +
    fuzzy * 1.0
  );
};

const scoreArtist = (artist: any, query: string): number => {
  const q = normalizeText(query);
  const qCollapsed = q.replace(/\s+/g, "");
  const name = normalizeText(artist?.name || "");
  const bio = normalizeText(artist?.bio || "");
  const combined = normalizeText(`${artist?.name || ""} ${artist?.slug || ""} ${artist?.bio || ""}`);
  const nameCollapsed = name.replace(/\s+/g, "");
  const combinedCollapsed = combined.replace(/\s+/g, "");
  const tokens = q.split(" ").filter(Boolean);
  const exact = name === q ? 1 : 0;
  const includes = name.includes(q) && q ? 1 : 0;
  const includesCollapsed = nameCollapsed.includes(qCollapsed) && qCollapsed ? 1 : 0;
  const tokenMatch = Math.max(
    tokenScore(name, tokens),
    tokenScore(bio, tokens),
    tokenScore(combined, tokens),
    tokenScore(nameCollapsed, tokens),
    tokenScore(combinedCollapsed, tokens)
  );
  const fuzzy = Math.max(
    diceCoefficient(name, q),
    diceCoefficient(combined, q),
    diceCoefficient(nameCollapsed, qCollapsed),
    diceCoefficient(combinedCollapsed, qCollapsed)
  );

  return (
    exact * 2.0 +
    includes * 1.2 +
    includesCollapsed * 1.3 +
    tokenMatch * 1.1 +
    fuzzy * 0.9
  );
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

  if (uniqueSongs.size === 0 && uniqueArtists.size > 0) {
    const extraSongPayloads = await Promise.all(
      Array.from(uniqueArtists.values())
        .slice(0, 3)
        .map(async (artist: any) => {
          const artistName = encodeURIComponent(String(artist.name || ""));
          if (!artistName) return null;
          const res = await fetch(buildApiUrl(`/songs?search=${artistName}&per_page=50&sort_by=latest`), {
            headers: { Accept: "application/json" },
          });
          return res.ok ? await res.json().catch(() => null) : null;
        })
    );

    const extraSongRows = extraSongPayloads.flatMap((json: any) => (Array.isArray(json?.data) ? json.data : []));
    extraSongRows.forEach((song: any) => {
      const id = String(song?.id || "");
      if (!id) return;
      const existing = uniqueSongs.get(id);
      if (!existing || scoreSong(song, query) > scoreSong(existing, query)) {
        uniqueSongs.set(id, song);
      }
    });
  }

  const filteredSongs = await Promise.all(
    Array.from(uniqueSongs.values())
      .sort((a, b) => scoreSong(b, query) - scoreSong(a, query))
      .slice(0, 50)
      .map(async (song: any) => {
        const signedCoverUrl = await getSignedSongCoverUrl(song.id);
        const albumCoverUrl = song.album?.id
          ? await getSignedAlbumCoverUrl(song.album.id)
          : null;

        return {
          id: String(song.id),
          title: song.title,
          artist_name:
            song.artist?.stage_name || song.artist?.name || song.artist_name || song.artist || "Unknown Artist",
          cover_url:
            signedCoverUrl ||
            albumCoverUrl ||
            resolveMediaUrl(song.songCover_url || song.album?.cover_url || song.album?.cover_image) ||
            undefined,
          audio_url: song.audio_url || song.original_key || null,
          duration: song.duration,
        };
      })
  );

  const filteredArtists = await Promise.all(
    Array.from(uniqueArtists.values())
      .sort((a, b) => scoreArtist(b, query) - scoreArtist(a, query))
      .slice(0, 30)
      .map(async (artist: any) => {
        const signedImageUrl = artist.id ? await getSignedArtistImageUrl(artist.id) : null;

        return {
          id: String(artist.id),
          name: artist.name,
          image_url: signedImageUrl || artist.image_url || undefined,
        };
      })
  );

  return {
    songs: filteredSongs,
    artists: filteredArtists,
  };
}
