import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getSongs } from "../backend/catalogService";
import { useDataCache } from "../contexts/DataCacheContext";
import { useAudioPlayer } from "../contexts/AudioPlayerContextCore";
import { trackSongPlay } from "../backend/playTrackingService";
import Song from "../components/Song";
import { FaSpinner, FaMusic, FaArrowLeft, FaSortAmountDown } from "react-icons/fa";
import { useTheme } from "../contexts/ThemeContext";

interface SongData {
  id: string;
  title: string;
  duration: number;
  album_id: string | null;
  audio_url: string | null;
  songCover_url: string | null;
  created_at: string;
  artists?: any[];
  album?: any;
}

const SongsList: React.FC = () => {
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") || "latest";
  const { getCachedData } = useDataCache();
  const { playSong } = useAudioPlayer();
  const { isLightMode } = useTheme();
  const navigate = useNavigate();

  const [songs, setSongs] = useState<SongData[]>([]);
  const [loading, setLoading] = useState(true);

  const titles: Record<string, string> = {
    latest: "Latest Releases",
    trending: "Trending Songs",
    popular: "Most Played",
    recommended: "Recommended for You"
  };

  useEffect(() => {
    fetchSongs();
  }, [type]);

  const fetchSongs = async () => {
    try {
      setLoading(true);
      const data = await getCachedData(`songs_list_${type}`, async () => {
        const songsData = await getSongs(100);
        return (songsData || []).map((s: any) => ({
          ...s,
          id: String(s.id),
          duration: Number(s.duration),
        }));
      });

      setSongs(data);
    } catch (error) {
      console.error("Error fetching songs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (songId: string) => {
    const song = songs.find(s => s.id === songId);
    if (song) {
      trackSongPlay(song.id).catch(() => {});
      playSong({
        id: song.id,
        title: song.title,
        artist: song.artists?.map(a => a.name).join(', ') || 'Unknown Artist',
        coverUrl: song.songCover_url || song.album?.cover_url || '',
        audioUrl: song.audio_url || '',
        duration: song.duration
      });
    }
  };

  return (
    <div className={`min-h-screen ${isLightMode ? "bg-gray-50 text-gray-900" : "bg-black text-white"} py-8`}>
      <div className="container mx-auto px-4 max-w-7xl">
        <button
          onClick={() => navigate(-1)}
          className={`flex items-center gap-2 ${isLightMode ? "text-gray-500 hover:text-gray-900" : "text-gray-400 hover:text-white"} transition-colors mb-8 font-bold uppercase tracking-widest text-xs`}
        >
          <FaArrowLeft size={14} /> Back
        </button>

        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
               <div className="w-10 h-1 rounded-full bg-blue-500" />
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">Audio Library</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter">
              {titles[type] || "All Songs"}
            </h1>
            <p className={`${isLightMode ? "text-gray-500" : "text-gray-400"} text-lg max-w-xl`}>
              Explore the complete collection of high-fidelity audio tracks curated for your library.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${isLightMode ? "bg-white border-gray-200 shadow-sm" : "bg-white/5 border-white/10"}`}>
               <FaSortAmountDown className="text-blue-500" size={14} />
               <span className="text-xs font-bold uppercase tracking-wider">{type}</span>
            </div>
            <span className={`text-sm font-bold ${isLightMode ? "text-gray-400" : "text-gray-500"}`}>{songs.length} Tracks</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <FaSpinner className="text-blue-500 text-5xl animate-spin" />
          </div>
        ) : songs.length === 0 ? (
          <div className={`text-center py-32 rounded-3xl border border-dashed ${isLightMode ? "border-gray-200 bg-white" : "border-white/10 bg-white/5"}`}>
            <FaMusic className={`${isLightMode ? "text-gray-200" : "text-gray-800"} text-8xl mx-auto mb-6`} />
            <p className="text-xl font-bold">No tracks found</p>
            <p className="text-gray-500 mt-2">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className={`${isLightMode ? "bg-white border border-gray-100 shadow-sm" : "bg-black"} rounded-[2rem] overflow-hidden shadow-2xl`}>
            {/* Table Header */}
            <div className={`grid grid-cols-12 gap-4 text-[10px] font-black uppercase tracking-[0.25em] ${isLightMode ? "text-gray-400 bg-gray-50" : "text-gray-500 bg-white/[0.02]"} border-b ${isLightMode ? "border-gray-100" : "border-white/5"} py-5 px-8`}>
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-5 md:col-span-4">Composition</div>
              <div className="hidden md:block md:col-span-3">Album Source</div>
              <div className="hidden md:block md:col-span-2">Release</div>
              <div className="col-span-2 text-right">Duration</div>
            </div>

            {/* Song List */}
            <div className="p-4 space-y-1">
              {songs.map((song, index) => (
                <Song
                  key={song.id}
                  id={song.id}
                  index={index + 1}
                  title={song.title}
                  artists={song.artists}
                  album={song.album}
                  duration={song.duration}
                  coverUrl={song.songCover_url}
                  metadata={new Date(song.created_at).getFullYear().toString()}
                  onPlay={handlePlay}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SongsList;
