import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { getDerivedArtists, getAlbums, getSongs } from "../backend/catalogService";
import { useDataCache } from "../contexts/DataCacheContext";
import { useAudioPlayer } from "../contexts/AudioPlayerContextCore";
import AppFooter from "../components/AppFooter";
import ArtistSection from "../components/ArtistsSection";
import AlbumCard from "../components/AlbumCard";
import Song from "../components/Song";
import { FaSpinner, FaCheckCircle, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useTheme } from "../contexts/ThemeContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Artist {
  id: string;
  name: string;
  image_url?: string;
  bio?: string;
  gender?: string;
  role?: string;
  status?: boolean;
  created_at?: string;
}

interface Album {
  id: string;
  title: string;
  cover_url: string;
  type?: string;
  release_date?: string;
  artists?: { id: string; name: string; image_url?: string }[];
}

interface SongType {
  id: string;
  title: string;
  duration: number;
  created_at: string;
  audio_url?: string;
  artists?: { id: string; name: string; image_url?: string }[];
  album?: { id: string; title: string; cover_url: string };
}

// ─── HeroBanner ───────────────────────────────────────────────────────────────

function HeroBanner({
  artist,
  onRefresh,
  loading,
}: {
  artist: Artist;
  onRefresh?: () => void;
  loading?: boolean;
}) {
  return (
    <div className="relative w-full bg-linear-to-b from-slate-900 via-slate-900 to-slate-950 p-6">
      <div
        className="absolute inset-0 opacity-30 blur-3xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(168,85,247,0.3), rgba(236,72,153,0.3))",
          zIndex: 0,
        }}
      />
      <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-8 max-w-6xl mx-auto">
        <div className="shrink-0">
          <div className="relative w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-purple-500/50 shadow-2xl shadow-purple-500/50">
            <img
              src={
                artist.image_url ||
                "https://images.unsplash.com/photo-1511192336575-5a79af67a629"
              }
              alt={artist.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="grow text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start mb-3">
            <FaCheckCircle className="text-blue-400 text-sm" />
            <span className="text-white text-sm font-semibold">
              Verified Artist
            </span>
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={loading}
                className="ml-2 p-1.5 hover:opacity-70 disabled:opacity-40 transition-opacity text-white"
                aria-label="Refresh artist"
              >
                <svg
                  className={`w-3 h-3 ${loading ? "animate-spin" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            )}
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white mb-4 drop-shadow-lg">
            {artist.name}
          </h1>

          <p className="text-white/70 text-lg font-medium">
            Discover amazing music from {artist.name}
          </p>
        </div>
      </div>

    </div>
  );
}

// ─── PopularSongs ─────────────────────────────────────────────────────────────

function PopularSongs({ artistId }: { artistId: string }) {
  const { getCachedData } = useDataCache();
  const { playSong } = useAudioPlayer();
  const [showAll, setShowAll] = useState(false);
  const [songs, setSongs] = useState<SongType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArtistSongs();
  }, [artistId]);

  const fetchArtistSongs = async () => {
    try {
      setLoading(true);
      const data = await getCachedData(`artist_songs_${artistId}`, async () => {
        const startTime = performance.now();
        console.log(`🔄 [PopularSongs] Fetching songs for artist ${artistId}...`);

        const allSongs = await getSongs(200);
        const songsData = allSongs.filter((song) =>
          (song.artists || []).some(
            (artist) =>
              artist.id === artistId ||
              encodeURIComponent(artist.name) === artistId
          )
        );

        console.log(
          `✅ [PopularSongs] Songs fetched in ${(performance.now() - startTime).toFixed(0)}ms`
        );

        return (songsData || []).map((song: any) => ({
          id: song.id,
          title: song.title,
          duration: song.duration,
          audio_url: song.audio_url,
          created_at: song.created_at,
          album: song.album
            ? { id: song.album.id, title: song.album.title, cover_url: song.album.cover_url || "" }
            : undefined,
          artists: song.artists || [],
        }));
      });

      setSongs(data);
    } catch (error) {
      console.error("Error fetching artist songs:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const handlePlaySong = (songId: string) => {
    const song = songs.find((s) => s.id === songId);
    if (song?.audio_url) {
      playSong({
        id: song.id,
        title: song.title,
        artist: song.artists?.map((a) => a.name).join(", ") || "Unknown Artist",
        coverUrl: song.album?.cover_url || "",
        audioUrl: song.audio_url,
        duration: song.duration,
      });
    }
  };

  if (loading) {
    return (
      <section>
        <h2 className="text-2xl font-semibold mb-4">Popular</h2>
        <div className="flex items-center justify-center py-12">
          <FaSpinner className="text-purple-400 text-3xl animate-spin" />
        </div>
      </section>
    );
  }

  if (songs.length === 0) {
    return (
      <section>
        <h2 className="text-2xl font-semibold mb-4">Popular</h2>
        <div className="text-center py-12 text-zinc-500">No songs available</div>
      </section>
    );
  }

  const displayedSongs = showAll ? songs : songs.slice(0, 5);

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-4">Popular</h2>
      <div className="space-y-2">
        {displayedSongs.map((song, i) => (
          <Song
            key={song.id}
            id={song.id}
            index={i + 1}
            title={song.title}
            artists={song.artists}
            album={song.album}
            duration={song.duration}
            coverUrl={song.album?.cover_url}
            metadata={formatDate(song.created_at)}
            onPlay={handlePlaySong}
          />
        ))}
      </div>
      {songs.length > 5 && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white font-medium transition-all hover:scale-105"
          >
            {showAll ? "Show Less" : "Show More"}
          </button>
        </div>
      )}
    </section>
  );
}

// ─── AlbumsSection ────────────────────────────────────────────────────────────

function AlbumsSection({ artistId }: { artistId: string }) {
  const { getCachedData } = useDataCache();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchArtistAlbums();
  }, [artistId]);

  const fetchArtistAlbums = async () => {
    try {
      const data = await getCachedData(`artist_albums_${artistId}`, async () => {
        console.log(`🔄 [Artist Albums] Fetching albums for artist ${artistId}...`);
        const albumData = await getAlbums(200, 0);

        return (albumData || [])
          .map((album: any) => ({
            id: album.id,
            title: album.title,
            cover_url: album.cover_url,
            type: album.type,
            release_date: album.release_date,
            artists: album.artists || [],
          }))
          .filter((album: any) => album.type === "album")
          .filter((album: any) =>
            (album.artists || []).some(
              (artist: any) =>
                artist.id === artistId ||
                encodeURIComponent(artist.name) === artistId
            )
          );
      });

      setAlbums(data);
    } catch (error) {
      console.error("Error fetching artist albums:", error);
    } finally {
      setLoading(false);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollTo = direction === 'left'
        ? scrollLeft - clientWidth * 0.8
        : scrollLeft + clientWidth * 0.8;
      scrollContainerRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <section>
        <h2 className="text-xl font-semibold mb-4">
          Artist's <span className="text-blue-400">Albums</span>
        </h2>
        <div className="flex justify-center py-8">
          <FaSpinner className="text-purple-400 text-3xl animate-spin" />
        </div>
      </section>
    );
  }

  if (albums.length === 0) return null;

  return (
    <section className="relative group/section">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          Artist's <span className="text-blue-400">Albums</span>
        </h2>
        <div className="flex gap-2">
          <button onClick={() => scroll('left')} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
            <FaChevronLeft size={12} />
          </button>
          <button onClick={() => scroll('right')} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
            <FaChevronRight size={12} />
          </button>
        </div>
      </div>
      <div ref={scrollContainerRef} className="flex gap-6 overflow-x-auto no-scrollbar pb-4 snap-x">
        {albums.map((album) => (
          <div key={album.id} className="w-44 md:w-52 shrink-0 snap-start">
            <AlbumCard album={album} />
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── SingleSongs ──────────────────────────────────────────────────────────────

function SingleSongs({ artistId }: { artistId: string }) {
  const { getCachedData } = useDataCache();
  const [singles, setSingles] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSingles();
  }, [artistId]);

  const fetchSingles = async () => {
    try {
      const data = await getCachedData(`artist_singles_${artistId}`, async () => {
        console.log(`🔄 [Artist Singles] Fetching singles for artist ${artistId}...`);
        const albums = await getAlbums(200, 0);

        return (albums || [])
          .filter((album: any) => album?.type === "single")
          .filter((album: any) =>
            (album.artists || []).some(
              (artist: any) =>
                artist.id === artistId ||
                encodeURIComponent(artist.name) === artistId
            )
          )
          .map((album: any) => ({
            id: album.id,
            title: album.title,
            cover_url: album.cover_url,
            type: album.type,
            release_date: album.release_date,
            artists: album.artists || [],
          }));
      });

      setSingles(data);
    } catch (error) {
      console.error("Error fetching singles:", error);
    } finally {
      setLoading(false);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollTo = direction === 'left'
        ? scrollLeft - clientWidth * 0.8
        : scrollLeft + clientWidth * 0.8;
      scrollContainerRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <section>
        <h2 className="text-xl font-semibold mb-4">
          Single <span className="text-blue-400">Songs</span>
        </h2>
        <div className="flex justify-center py-8">
          <FaSpinner className="text-purple-400 text-3xl animate-spin" />
        </div>
      </section>
    );
  }

  if (singles.length === 0) return null;

  return (
    <section className="relative group/section">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          Single <span className="text-blue-400">Songs</span>
        </h2>
        <div className="flex gap-2">
          <button onClick={() => scroll('left')} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
            <FaChevronLeft size={12} />
          </button>
          <button onClick={() => scroll('right')} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
            <FaChevronRight size={12} />
          </button>
        </div>
      </div>
      <div ref={scrollContainerRef} className="flex gap-6 overflow-x-auto no-scrollbar pb-4 snap-x">
        {singles.map((single) => (
          <div key={single.id} className="w-44 md:w-52 shrink-0 snap-start">
            <AlbumCard album={single} />
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── FansAlsoListen ───────────────────────────────────────────────────────────

function FansAlsoListen({ artistId }: { artistId?: string }) {
  const { getCachedData } = useDataCache();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArtists();
  }, [artistId]);

  const fetchArtists = async () => {
    try {
      const data = await getCachedData(
        `fans_also_listen_${artistId || "all"}`,
        async () => {
          console.log("🔄 [Fans Also Listen] Fetching related artists...");
          let artistsData = await getDerivedArtists(20);
          if (artistId) {
            artistsData = artistsData.filter(
              (artist) =>
                artist.id !== artistId &&
                encodeURIComponent(artist.name) !== artistId
            );
          }
          return artistsData || [];
        }
      );
      setArtists(data);
    } catch (error) {
      console.error("Error fetching artists:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="mb-12">
        <div className="text-center py-8">
          <p className="text-zinc-400">Loading artists...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-12">
      <ArtistSection
        title="Fans Also Listen To"
        isLightMode={false}
        artists={artists.map((artist) => ({
          id: artist.id,
          name: artist.name,
          image_url: artist.image_url,
        }))}
      />
    </section>
  );
}

// ─── Artist (main page) ───────────────────────────────────────────────────────

const Artist: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getCachedData } = useDataCache();
  const { isLightMode } = useTheme();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchArtist(id);
  }, [id]);

  const fetchArtist = async (artistId: string) => {
    try {
      setLoading(true);
      const data = await getCachedData(`artist_${artistId}`, async () => {
        const startTime = performance.now();
        console.log(`🔄 [Artist] Fetching artist ${artistId}...`);

        const artists = await getDerivedArtists(500);
        const artistData =
          artists.find((a) => a.id === artistId) ||
          artists.find((a) => encodeURIComponent(a.name) === artistId) ||
          null;

        console.log(
          `✅ [Artist] Artist fetched in ${(performance.now() - startTime).toFixed(0)}ms`
        );
        return artistData;
      });

      setArtist(data);
    } catch (error) {
      if (
        error instanceof Error &&
        (error.name === "AbortError" || error.message.includes("NetworkError"))
      ) {
        return;
      }
      console.error("Error fetching artist:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <FaSpinner className="text-purple-400 text-5xl animate-spin" />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 opacity-20">🎤</div>
          <p className="text-slate-400 text-xl">Artist not found</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <HeroBanner artist={artist} />
      <div className="space-y-10 p-6 text-white">
        <PopularSongs artistId={artist.id} />
        <AlbumsSection artistId={artist.id} />
        <SingleSongs artistId={artist.id} />
        <FansAlsoListen artistId={artist.id} />
      </div>
      <AppFooter isLightMode={isLightMode} />
    </>
  );
};

export default Artist;