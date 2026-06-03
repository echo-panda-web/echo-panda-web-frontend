import { useEffect, useMemo, useState } from "react";
import { FaChartLine, FaCompactDisc, FaHeadphones, FaMusic, FaUsers, FaArrowUpRightFromSquare } from "react-icons/fa6";
import { getArtistAnalytics, getArtistIdentity, getOwnedAlbums, getOwnedSongs, getSongPlayMap, type ArtistAlbum, type ArtistSong } from "../artistStudioApi";

interface MetricCard {
  label: string;
  value: number;
  helper: string;
  icon: React.ReactNode;
  gradient: string;
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
      label: "Total Catalog Tracks",
      value: songs.length,
      helper: "Your active discography size",
      icon: <FaMusic className="text-xl text-emerald-400" />,
      gradient: "from-emerald-500/10 to-teal-500/5 hover:border-emerald-500/30",
    },
    {
      label: "Releases & Projects",
      value: albums.length,
      helper: `${analytics.publishedReleases} Published · ${analytics.draftReleases} Drafts`,
      icon: <FaCompactDisc className="text-xl text-indigo-400" />,
      gradient: "from-indigo-500/10 to-purple-500/5 hover:border-indigo-500/30",
    },
    {
      label: "Stream Count Insights",
      value: monthlyStreams || analytics.totalPlays,
      helper: monthlyStreams ? "Current monthly rolling streams" : "Total lifetime streams cumulative",
      icon: <FaHeadphones className="text-xl text-pink-400" />,
      gradient: "from-pink-500/10 to-rose-500/5 hover:border-pink-500/30",
    },
    {
      label: "Active Listener Signals",
      value: analytics.listenerStat,
      helper: "Tracks with standard playback activity",
      icon: <FaUsers className="text-xl text-amber-400" />,
      gradient: "from-amber-500/10 to-orange-500/5 hover:border-amber-500/30",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0c16] bg-radial-gradient from-[#131833] via-[#0a0c16] to-[#05060b] p-6 md:p-10 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header / Brand Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-400">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              EchoPanda Studio
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Streaming Analytics
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl">
              Real-time monitoring interface scoped to your official studio releases, user interactions, and playback metrics.
            </p>
          </div>
          
          <button className="self-start sm:self-center flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm font-medium backdrop-blur-sm">
            View Live Platform <FaArrowUpRightFromSquare className="text-xs text-slate-400" />
          </button>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-950/30 backdrop-blur-md p-4 text-sm text-red-300 flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444]" />
            {error}
          </div>
        )}

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {cards.map((card) => (
            <div 
              key={card.label} 
              className={`group relative rounded-2xl border border-white/[0.06] bg-gradient-to-br ${card.gradient} p-6 transition-all duration-300 hover:-translate-y-1 shadow-lg shadow-black/20`}
            >
              <div className="flex items-start justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 group-hover:text-slate-300 transition-colors">
                  {card.label}
                </p>
                <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.05] group-hover:scale-110 transition-transform">
                  {card.icon}
                </div>
              </div>
              
              <div className="mt-4">
                {loading ? (
                  <div className="h-9 w-24 bg-white/10 rounded-lg animate-pulse" />
                ) : (
                  <p className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">
                    {card.value.toLocaleString()}
                  </p>
                )}
                <p className="mt-2 text-xs text-slate-400 font-medium group-hover:text-slate-300 transition-colors">
                  {card.helper}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Top Songs Table Section */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl shadow-xl shadow-black/40 overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.06] p-6 bg-white/[0.01]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <FaChartLine className="text-indigo-400 text-lg" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Top Performing Tracks</h2>
                <p className="text-xs text-slate-400">Ranked dynamically based on all-time play performance</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-white/[0.06] bg-white/[0.01]">
                  <th className="px-6 py-4"># Track Details</th>
                  <th className="px-6 py-4">Album/Project</th>
                  <th className="px-6 py-4 text-right">Performance Metrics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {analytics.topSongs.map((song, index) => (
                  <tr key={song.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-slate-500 group-hover:text-indigo-400 transition-colors w-4">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="text-white font-semibold tracking-wide text-base group-hover:text-indigo-200 transition-colors">
                          {song.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300 font-medium">
                      {song.albumTitle || <span className="text-xs italic text-slate-500">Single</span>}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-indigo-300 text-base">
                      {song.playCount.toLocaleString()}
                      <span className="text-[10px] uppercase font-sans tracking-wide text-slate-400 ml-1.5 font-normal">Plays</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {!loading && analytics.topSongs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-3">
                <div className="p-4 rounded-full bg-white/[0.02] border border-white/[0.05]">
                  <FaMusic className="text-2xl text-slate-500" />
                </div>
                <h3 className="text-sm font-semibold text-slate-300">No tracks registered</h3>
                <p className="text-xs text-slate-500 max-w-xs">
                  Your distribution network is currently clear. Publish your first single or track project to begin logging streams.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}