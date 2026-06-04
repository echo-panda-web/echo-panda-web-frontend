import { useEffect, useMemo, useState } from "react";
import {
  FaChartLine, FaCompactDisc, FaHeadphones, FaMusic, FaUsers,
  FaDotCircle, FaSpinner, FaTrophy, FaArrowUp
} from "react-icons/fa";
import {
  getArtistAnalytics, getArtistIdentity, getOwnedAlbums,
  getOwnedSongs, getSongPlayMap, type ArtistAlbum, type ArtistSong
} from "../artistStudioApi";

interface MetricCard {
  label: string;
  value: number;
  helper: string;
  icon: React.ReactNode;
  trend?: string;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [albums, setAlbums] = useState<ArtistAlbum[]>([]);
  const [songs, setSongs] = useState<ArtistSong[]>([]);
  const [monthlyStreams, setMonthlyStreams] = useState(0);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const identity = getArtistIdentity();
        const [ownedAlbums, ownedSongs, playMap] = await Promise.all([
          getOwnedAlbums(identity),
          getOwnedSongs(identity),
          getSongPlayMap(),
        ]);

        const analytics = await getArtistAnalytics().catch(() => null);

        const songsWithPlayCount = ownedSongs.map((song) => ({
          ...song,
          playCount: playMap.get(song.id) ?? song.playCount,
        }));

        setAlbums(ownedAlbums);
        setSongs(songsWithPlayCount);
        setMonthlyStreams(Number(analytics?.monthly_streams || 0));
      } catch (loadError) {
        console.error(loadError);
        setError(loadError instanceof Error ? loadError.message : "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const analytics = useMemo(() => {
    const totalPlays = songs.reduce((sum, song) => sum + song.playCount, 0);
    const songsWithPlays = songs.filter((song) => song.playCount > 0).length;
    const publishedReleases = albums.filter((album) => Boolean(album.releaseDate)).length;
    const draftReleases = albums.length - publishedReleases;
    const listenerStat = songsWithPlays;

    const topSongs = [...songs]
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, 8);

    return {
      totalPlays,
      songsWithPlays,
      publishedReleases,
      draftReleases,
      listenerStat,
      topSongs,
    };
  }, [albums, songs]);

  const cards: MetricCard[] = [
    {
      label: "Master Catalog",
      value: songs.length,
      helper: "Total owned songs",
      icon: <FaMusic />,
    },
    {
      label: "Studio Releases",
      value: analytics.publishedReleases,
      helper: `${analytics.draftReleases} drafts in progress`,
      icon: <FaCompactDisc />,
    },
    {
      label: "All-Time Streams",
      value: monthlyStreams || analytics.totalPlays,
      helper: monthlyStreams ? "Monthly active signal" : "Accumulated stream count",
      icon: <FaHeadphones />,
      trend: "+8.4%",
    },
    {
      label: "Listener Signal",
      value: analytics.listenerStat,
      helper: "Tracks with active reach",
      icon: <FaUsers />,
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
          <div className="flex items-center gap-3 bg-[#121214] border border-white/5 rounded-xl px-5 py-3 shadow-xl">
             <FaChartLine className="text-indigo-500" size={12} />
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Sync Active</span>
          </div>
        </div>

        {error && (
            <div className="rounded-2xl border border-red-500/10 bg-red-500/5 p-4 text-red-400 text-xs font-bold uppercase tracking-widest">
                {error}
            </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div key={card.label} className="group relative overflow-hidden rounded-2xl bg-[#121214]/50 border border-white/5 p-6 hover:border-white/10 hover:bg-[#121214] transition-all duration-300 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-600 group-hover:text-indigo-500 transition-colors">
                  {card.icon}
                </div>
                {card.trend && (
                  <div className="flex items-center gap-1 text-green-500 text-[10px] font-black bg-green-500/10 px-2 py-1 rounded-lg border border-green-500/10">
                    <FaArrowUp size={8} /> {card.trend}
                  </div>
                )}
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

        {/* Performance List */}
        <div className="rounded-[2.5rem] bg-[#121214]/30 border border-white/5 overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <FaTrophy size={14} />
              </div>
              <h2 className="text-xl font-black text-white tracking-tight uppercase italic">Top Master Tracks</h2>
            </div>
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/5">
                Top 8 Distribution
            </span>
          </div>

          <div className="p-2 space-y-1">
            {analytics.topSongs.map((song, i) => (
              <div key={song.id} className="group flex items-center justify-between p-4 rounded-2xl hover:bg-white/[0.02] transition-all">
                <div className="flex items-center gap-6">
                  <span className="text-[10px] font-black text-slate-800 w-4">{(i + 1).toString().padStart(2, '0')}</span>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">{song.title}</h4>
                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">{song.albumTitle || "Single"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                   <div className="text-right">
                      <p className="text-xs font-black text-white tracking-tighter">{song.playCount.toLocaleString()}</p>
                      <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest">Streams</p>
                   </div>
                   <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-800 group-hover:text-indigo-500 transition-all">
                      <FaChartLine size={10} />
                   </div>
                </div>
              </div>
            ))}
            {analytics.topSongs.length === 0 && (
              <div className="py-20 text-center">
                 <FaMusic className="text-4xl text-slate-800 mx-auto mb-4" />
                 <p className="text-slate-600 font-bold uppercase tracking-widest text-[9px]">No streaming data processed</p>
              </div>
            )}
          </div>
        </div>

        {/* Advice Footer */}
        <div className="rounded-[2.5rem] bg-indigo-500/5 border border-indigo-500/10 p-10 flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="space-y-2 text-center md:text-left">
              <h3 className="text-lg font-black text-white uppercase italic">Audience Retention Tips.</h3>
              <p className="text-slate-500 text-xs font-medium max-w-md">
                 Master tracks with synced lyrics and high-quality artwork maintain 40% higher retention rates on discovery playlists.
              </p>
           </div>
           <button className="h-12 px-10 rounded-xl bg-white text-black font-black uppercase text-[10px] tracking-widest shadow-2xl hover:bg-indigo-50 transition-all active:scale-95 whitespace-nowrap">
              Review Master Data
           </button>
        </div>

      </div>
    </div>
  );
}
