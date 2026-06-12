import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaChartLine, FaCompactDisc, FaMusic,
  FaDotCircle, FaSpinner, FaTrophy, FaSignOutAlt
} from "react-icons/fa";
import {
  getArtistIdentity,
  getOwnedAlbums,
  getOwnedSongs, getSongPlayMap, type ArtistSong,
} from "../artistStudioApi";
import { signOut } from "../../routes/authContext";

interface MetricCard {
  label: string;
  value: number;
  helper: string;
  icon: React.ReactNode;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [songs, setSongs] = useState<ArtistSong[]>([]);
  const [albumCount, setAlbumCount] = useState(0);
  const [error, setError] = useState<string>("");

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (err) {
      console.error("Failed to sign out:", err);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const identity = getArtistIdentity();
        if (!identity) {
          setError("Artist identity not found. Please log in again.");
          setLoading(false);
          return;
        }

        const [ownedAlbums, ownedSongs, playMap] = await Promise.all([
          getOwnedAlbums(identity),
          getOwnedSongs(identity),
          getSongPlayMap(),
        ]);

        const songsWithPlayCount = ownedSongs.map((song) => ({
          ...song,
          playCount: playMap.get(song.id) ?? song.playCount,
        }));

        setAlbumCount(ownedAlbums.length);
        setSongs(songsWithPlayCount);
      } catch (loadError) {
        console.error(loadError);
        setError(loadError instanceof Error ? loadError.message : "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const topSongs = useMemo(
    () => [...songs].sort((a, b) => b.playCount - a.playCount).slice(0, 8),
    [songs]
  );

  const cards: MetricCard[] = [
    {
      label: "Master Catalog",
      value: songs.length,
      helper: "Total owned songs",
      icon: <FaMusic />,
    },
    {
      label: "Release Catalog",
      value: albumCount,
      helper: "Total owned albums",
      icon: <FaCompactDisc />,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center py-40 gap-6 text-white">
        <div className="w-16 h-16 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-slate-600 font-bold uppercase tracking-widest text-[10px]">Processing Analytics</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white selection:bg-indigo-500/30 font-sans">
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-12">

        {/* Analytics Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/5">
          <div className="space-y-3">
             <div className="flex items-center gap-3 text-indigo-500 font-bold uppercase tracking-[0.4em] text-[9px]">
                <FaDotCircle className="animate-pulse" />
                <span>Production Environment</span>
             </div>
             <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">Streaming Analytics.</h1>
             <p className="text-slate-500 text-sm font-medium max-w-lg leading-relaxed">
                Real-time performance metrics scoped to your artist identity. Monitor distribution reach and audience engagement.
             </p>
          </div>
         
        </div>

        {error && (
            <div className="rounded-2xl border border-red-500/10 bg-red-500/5 p-4 text-red-400 text-xs font-bold uppercase tracking-widest">
                {error}
            </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map((card) => (
            <div key={card.label} className="group relative overflow-hidden rounded-2xl bg-[#121214]/50 border border-white/5 p-6 hover:border-white/10 hover:bg-[#121214] transition-all duration-300 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-600 group-hover:text-indigo-500 transition-colors">
                  {card.icon}
                </div>
              </div>
              <div>
                <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest mb-1">{card.label}</p>
                <h3 className="text-3xl font-black text-white tracking-tighter">
                  {card.value.toLocaleString()}
                </h3>
                <p className="mt-2 text-[10px] text-slate-600 font-medium">{card.helper}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Top Tracks List */}
        <div className="rounded-[2.5rem] bg-[#121214]/30 border border-white/5 overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <FaTrophy size={14} />
              </div>
              <h2 className="text-xl font-black text-white tracking-tight uppercase italic">Top Tracks</h2>
            </div>
          </div>

          <div className="p-2 space-y-1">
            {topSongs.slice(0, 5).map((song, i) => (
              <div key={song.id} className="group flex items-center justify-between p-4 rounded-2xl hover:bg-white/[0.02] transition-all">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black text-slate-800 w-4">{(i + 1).toString().padStart(2, '0')}</span>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors truncate">{song.title}</h4>
                    <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest mt-0.5 truncate">{song.albumTitle || "Single"}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-black text-white tracking-tighter">{song.playCount.toLocaleString()}</p>
                </div>
              </div>
            ))}
            {topSongs.length === 0 && (
              <div className="py-20 text-center">
                 <p className="text-slate-600 font-bold uppercase tracking-widest text-[9px]">No tracks found</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
