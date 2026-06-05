import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaEllipsisH, FaSpinner, FaPlay, FaClock } from "react-icons/fa";
import { useDataCache } from "../contexts/DataCacheContext";
import { useAudioPlayer } from "../contexts/AudioPlayerContextCore";
import { trackSongPlay } from "../backend/playTrackingService";
import { buildApiUrl } from "../backend/backendUrls";
import { getSignedAlbumCoverUrl, getSignedSongCoverUrl } from "../backend/songMediaApi";
import Song from "../components/Song";
import { useTheme } from "../contexts/ThemeContext";

interface Artist {
  id: string;
  name: string;
  image_url?: string;
}

interface AlbumMeta {
  id: string;
  title: string;
  cover_key?: string | null;
  cover_url?: string;
  release_date?: string;
  type?: string;
  artists?: Artist[];
}

interface SongData {
  id: string;
  title: string;
  duration: number;
  album_id: string | null;
  original_key?: string | null;
  audio_url: string | null;
  songCover_url: string | null;
  created_at: string;
  artists?: Artist[];
}

const formatDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const AlbumDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCachedData } = useDataCache();
  const { playSong } = useAudioPlayer();
  const { isLightMode } = useTheme();

  const [loading, setLoading] = useState(true);
  const [album, setAlbum] = useState<AlbumMeta | null>(null);
  const [songs, setSongs] = useState<SongData[]>([]);

  useEffect(() => {
    if (id) {
      loadAlbum(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadAlbum = async (albumId: string) => {
    try {
      setLoading(true);

      if (!/^\d+$/.test(albumId)) {
        setAlbum(null);
        setSongs([]);
        return;
      }

      const data = await getCachedData(`album_details_${albumId}`, async () => {
        const response = await fetch(buildApiUrl(`/albums/${albumId}`), {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch album details");
        }

        const albumData = await response.json();
        const rawAlbum = albumData.data || albumData;

        const meta: AlbumMeta = {
          id: String(rawAlbum.id),
          title: rawAlbum.title,
          cover_key: rawAlbum.cover_key || null,
          cover_url: (await getSignedAlbumCoverUrl(rawAlbum.id)) || rawAlbum.cover_url || undefined,
          release_date: rawAlbum.release_date || undefined,
          type: rawAlbum.type || undefined,
          artists: rawAlbum.artist
            ? [{
                id: String(rawAlbum.artist.id || rawAlbum.id),
                name: rawAlbum.artist.stage_name || rawAlbum.artist.name || rawAlbum.artist || "Unknown"
              }]
            : [],
        };

        const songsData = Array.isArray(rawAlbum?.songs) ? rawAlbum.songs : [];

        const transformed: SongData[] = await Promise.all((songsData || []).map(async (s: any) => ({
          id: String(s.id),
          title: s.title,
          duration: s.duration,
          album_id: s.album_id ? String(s.album_id) : meta.id,
          original_key: s.original_key || null,
          audio_url: s.audio_url || s.original_key,
          songCover_url: (await getSignedSongCoverUrl(s.id)) || s.songCover_url || meta.cover_url,
          created_at: s.created_at,
          artists: s.artist
            ? [{ id: String(s.id), name: s.artist.stage_name || s.artist.name || s.artist || "Unknown" }]
            : meta.artists,
        })));

        return { album: meta, songs: transformed };
      });

      setAlbum(data.album);
      setSongs(data.songs);
    } catch (err) {
      if (err instanceof Error && (err.name === 'AbortError' || err.message.includes('NetworkError'))) {
        return;
      }
      console.error("Failed to load album:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaySong = async (songId: string) => {
    const song = songs.find(s => s.id === songId);
    if (!song) {
      console.error('Song not found');
      return;
    }

    const artistNames = song.artists && song.artists.length > 0
      ? song.artists.map(a => a.name).join(", ")
      : "Various Artists";

    playSong({
      id: song.id,
      title: song.title,
      artist: artistNames,
      coverUrl: song.songCover_url || album?.cover_url || '',
      audioUrl: song.audio_url || song.original_key,
      duration: song.duration,
    });

    await trackSongPlay(song.id);
  };

  if (loading) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <FaSpinner className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (!album) {
    return (
      <div className="py-24 text-center border border-dashed border-white/5 rounded-3xl bg-[#0c0f17]/20 max-w-md mx-auto">
        <p className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Album Data Mismatch</p>
        <h3 className="text-xl font-bold text-white mb-6">Album not found in system index</h3>
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95"
        >
          Return to previous context
        </button>
      </div>
    );
  }

  const artistNames = album.artists && album.artists.length > 0
    ? album.artists.map(a => a.name).join(", ")
    : "Various Artists";

  const totalDuration = songs.reduce((sum, s) => sum + (s.duration || 0), 0);

  return (
    <div className={`w-full max-w-full space-y-8 pb-24 animate-in fade-in duration-500 ${isLightMode ? "text-gray-900" : "text-white"}`}>

      {/* ── Dynamic Ambient Glass Header / Hero Banner ── */}
      <header className={`relative px-4 sm:px-6 pt-6 pb-10 overflow-hidden transition-all duration-700 rounded-3xl border ${isLightMode ? "border-gray-200 bg-white shadow-sm" : "border-white/5 bg-linear-to-b from-[#111622]/40 to-transparent"}`}>
        {/* Immersive Blurred Backdrop Grid */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.08] blur-xl scale-110 pointer-events-none select-none"
          style={{ backgroundImage: `url('${album.cover_url || ""}')` }}
        />
        <div className={`absolute top-0 -left-20 w-72 h-72 rounded-full blur-[100px] pointer-events-none ${isLightMode ? "bg-blue-100/50" : "bg-blue-500/10"}`} />

        {/* Action Button Navigation Controls */}
        <div className="flex items-center gap-2 relative z-20 mb-8">
          <button
            onClick={() => navigate(-1)}
            className={`p-2.5 ${isLightMode ? "bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700" : "bg-white/5 hover:bg-white/10 border-white/5 text-gray-200"} border rounded-xl transition-all active:scale-95`}
            title="Go Back"
          >
            <FaArrowLeft size={12} />
          </button>
          <button
            className={`p-2.5 ${isLightMode ? "bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-500 hover:text-gray-900" : "bg-white/5 hover:bg-white/10 border-white/5 text-gray-400 hover:text-white"} border rounded-xl transition-all`}
            title="Options"
          >
            <FaEllipsisH size={12} />
          </button>
        </div>

        {/* Core Media Meta Information Layout */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-8 relative z-10">
          {/* Box Art Cover */}
          <div className={`relative group w-40 h-40 md:w-48 md:h-48 rounded-[2rem] overflow-hidden shadow-2xl transition-transform duration-500 hover:scale-[1.02] border ${isLightMode ? "border-gray-200 bg-gray-100" : "border-white/10 bg-white/5"} shrink-0`}>
            {album.cover_url ? (
              <img
                src={album.cover_url}
                alt={album.title}
                className="w-full h-full object-cover object-center pointer-events-none select-none"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FaSpinner className={`${isLightMode ? "text-gray-300" : "text-white/20"} animate-spin`} size={24} />
              </div>
            )}
            <div
              onClick={() => songs.length > 0 && handlePlaySong(songs[0].id)}
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px] cursor-pointer"
            >
               <FaPlay className="text-white text-2xl ml-1" />
            </div>
          </div>

          {/* Info Details Stack */}
          <div className="flex flex-col gap-3 text-center sm:text-left flex-1 min-w-0">
            <div className="flex items-center gap-2.5 justify-center sm:justify-start">
               <span className="px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-blue-500/20 border border-blue-500/30 text-blue-400">
                  {album.type || "Album"}
               </span>
            </div>

            <h1 className={`text-3xl md:text-5xl font-black ${isLightMode ? "text-gray-900" : "text-white"} tracking-tight truncate leading-tight`}>
              {album.title}
            </h1>

            <div className={`flex flex-wrap justify-center sm:justify-start items-center gap-3 text-xs font-semibold ${isLightMode ? "text-gray-500" : "text-gray-400"}`}>
              <span className={`${isLightMode ? "text-gray-700" : "text-gray-200"} text-[13px]`}>{artistNames}</span>
              <span className={`w-1 h-1 rounded-full ${isLightMode ? "bg-gray-300" : "bg-gray-700"}`} />
              <span className="text-[13px]">{formatDate(album.release_date)}</span>
              <span className={`w-1 h-1 rounded-full ${isLightMode ? "bg-gray-300" : "bg-gray-700"}`} />
              <span className="text-[13px]">{songs.length} Tracks</span>
              <span className={`w-1 h-1 rounded-full ${isLightMode ? "bg-gray-300" : "bg-gray-700"}`} />
              <div className="flex items-center gap-1.5 text-[13px]">
                <FaClock size={11} />
                <span>{Math.floor(totalDuration / 60)} min</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Audio Tracks Viewport Sequencer ── */}
      <main className="space-y-6">
        <div className={`${isLightMode ? "bg-white border-gray-100 shadow-sm" : "bg-white/[0.01] border-white/5"} border rounded-3xl overflow-hidden shadow-2xl`}>
          {/* Sequence Column Grid Header */}
          <div className={`grid grid-cols-12 gap-4 px-6 py-4 text-[10px] font-bold ${isLightMode ? "text-gray-400" : "text-gray-500"} uppercase border-b ${isLightMode ? "border-gray-100" : "border-white/5"} tracking-widest`}>
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-9">Composition / Track Title</div>
            <div className="col-span-2 text-right pr-4">Duration</div>
          </div>

          {/* Active Song Record Node List mapping */}
          <div className="px-3 pb-4 pt-2 space-y-1">
            {songs.map((s, idx) => (
              <Song
                key={s.id}
                id={s.id}
                index={idx + 1}
                title={s.title}
                artists={s.artists}
                album={{ id: album.id, title: album.title, cover_url: album.cover_url }}
                duration={s.duration}
                coverUrl={s.songCover_url}
                metadata={formatDate(s.created_at)}
                hideAlbum={true}
                onPlay={handlePlaySong}
              />
            ))}
          </div>
        </div>
      </main>

    </div>
  );
};

export default AlbumDetails;