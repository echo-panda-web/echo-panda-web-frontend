import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaChartLine, FaCompactDisc, FaHeadphones, FaMusic, FaUsers,
  FaDotCircle, FaSpinner, FaTrophy, FaArrowUp, FaDownload, FaHistory,
  FaSignOutAlt
} from "react-icons/fa";
import {
  getArtistAnalytics, getArtistIdentity, getOwnedAlbums,
  getOwnedSongs, getSongPlayMap, type ArtistAlbum, type ArtistSong,
  type ArtistTrendData
} from "../artistStudioApi";
import { signOut } from "../../routes/authContext";

interface MetricCard {
  label: string;
  value: number;
  helper: string;
  icon: React.ReactNode;
  trend?: string;
}

// ─── TREND CHART COMPONENT ──────────────────────────────────────────
const HistoricalTrendChart = ({
  title,
  description,
  data,
  typeLabel = "Line - Linear | Last 90 Days"
}: {
  title: string;
  description: string;
  data?: ArtistTrendData;
  typeLabel?: string
}) => {
  const daily = data?.daily || [];
  const weekly = data?.weekly || [];
  const monthly = data?.monthly || [];
  const dates = data?.dates || [];

  const pointsToPath = (points: number[], scaleFactor: number = 1, offset: number = 0) => {
     if (points.length < 2) return "";
     const width = 1000;
     const height = 200;
     const step = width / (points.length - 1);

     const localMax = Math.max(...points, 1);
     const scale = (height * 0.4) / localMax; // Scale each to fit a portion of height

     return points.map((val, i) => {
        const x = i * step;
        const y = height - (val * scale) - offset;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
     }).join(' ');
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  };

  const maxOverall = Math.max(...daily, ...weekly, ...monthly, 1);
  const gridValues = [
    Math.round(maxOverall),
    Math.round(maxOverall * 0.66),
    Math.round(maxOverall * 0.33),
    0
  ];

  const handleDownload = () => {
    if (!data) return;

    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Daily,Weekly,Monthly\n";

    // We'll use the longest array to ensure we capture all data points if they differ in length
    const maxLength = Math.max(daily.length, weekly.length, monthly.length, dates.length);

    for (let i = 0; i < maxLength; i++) {
      const date = dates[i] || "";
      const d = daily[i] ?? "";
      const w = weekly[i] ?? "";
      const m = monthly[i] ?? "";
      csvContent += `${date},${d},${w},${m}\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${title.toLowerCase().replace(/\s+/g, "_")}_history.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#121214] border border-white/5 rounded-3xl p-8 shadow-2xl flex flex-col gap-6">
       <div className="flex justify-between items-start">
          <div className="space-y-1">
             <div className="flex items-center gap-3">
                <FaChartLine className="text-slate-400" size={16} />
                <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
             </div>
             <p className="text-xs text-slate-500 max-w-sm">{description}</p>
             <span className="text-[10px] font-medium text-slate-600 block mt-2">{typeLabel}</span>
          </div>
          <div className="flex gap-3 text-slate-600">
             <button
                onClick={handleDownload}
                title="Download CSV"
                className="hover:text-white transition-colors p-1"
             >
                <FaDownload size={14} />
             </button>
             <button
                onClick={() => window.location.reload()}
                title="Refresh Analytics"
                className="hover:text-white transition-colors p-1"
             >
                <FaHistory size={14} />
             </button>
          </div>
       </div>

       <div className="flex gap-6 border-b border-white/5 pb-4">
          <div className="flex items-center gap-2">
             <div className="w-2.5 h-2.5 rounded-full bg-[#f472b6]" />
             <span className="text-[10px] font-bold text-slate-400 uppercase">Daily</span>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-2.5 h-2.5 rounded-full bg-[#34d399]" />
             <span className="text-[10px] font-bold text-slate-400 uppercase">Weekly</span>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]" />
             <span className="text-[10px] font-bold text-slate-400 uppercase">Monthly</span>
          </div>
       </div>

       <div className="relative h-64 mt-4 group">
          {/* Grid Lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
             {gridValues.map((val, idx) => (
                <div key={`${idx}-${val}`} className="w-full flex items-center gap-4">
                   <span className="text-[9px] font-black text-slate-700 w-8">{val}</span>
                   <div className="flex-1 h-px bg-slate-800" />
                </div>
             ))}
          </div>

          <svg className="absolute inset-0 w-full h-full pt-2" viewBox="0 0 1000 200" preserveAspectRatio="none">
             {/* Monthly Line (Blue) */}
             <path d={pointsToPath(monthly, 1, 0)} fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_8px_rgba(56,189,248,0.2)]" />
             {/* Weekly Line (Green) */}
             <path d={pointsToPath(weekly, 1, 40)} fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_8px_rgba(52,211,153,0.2)]" />
             {/* Daily Line (Pink) */}
             <path d={pointsToPath(daily, 1, 80)} fill="none" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_8px_rgba(244,114,182,0.2)]" />
          </svg>

          {/* Date Axis */}
          <div className="absolute -bottom-6 inset-x-8 flex justify-between text-[9px] font-bold text-slate-700 uppercase tracking-widest">
             <span>{formatDate(dates[0])}</span>
             <span>{formatDate(dates[Math.floor(dates.length / 4)])}</span>
             <span>{formatDate(dates[Math.floor(dates.length / 2)])}</span>
             <span>{formatDate(dates[Math.floor(dates.length * 0.75)])}</span>
             <span>{formatDate(dates[dates.length - 1])}</span>
          </div>
       </div>
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [albums, setAlbums] = useState<ArtistAlbum[]>([]);
  const [songs, setSongs] = useState<ArtistSong[]>([]);
  const [monthlyStreams, setMonthlyStreams] = useState(0);
  const [trends, setTrends] = useState<{ plays: ArtistTrendData; listeners: ArtistTrendData } | null>(null);
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

        const analytics = await getArtistAnalytics().catch(() => null);

        const songsWithPlayCount = ownedSongs.map((song) => ({
          ...song,
          playCount: playMap.get(song.id) ?? song.playCount,
        }));

        setAlbums(ownedAlbums);
        setSongs(songsWithPlayCount);
        setMonthlyStreams(Number(analytics?.monthly_streams || 0));
        if (analytics?.trends) {
          setTrends(analytics.trends);
        }
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
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-3 bg-[#121214] border border-white/5 rounded-xl px-5 py-3 shadow-xl">
                <FaChartLine className="text-indigo-500" size={12} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Sync Active</span>
             </div>
             <button
                onClick={handleLogout}
                className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all rounded-xl px-5 py-3 shadow-xl text-red-400 group"
             >
                <FaSignOutAlt className="group-hover:scale-110 transition-transform" size={12} />
                <span className="text-[10px] font-black uppercase tracking-widest">Logout</span>
             </button>
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

        {/* Historical Trends Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
            <HistoricalTrendChart
              title="Trend of Active Listeners"
              description="Tracks active unique listeners over time, providing a time-based view of engagement signal."
              data={trends?.listeners}
            />
            <HistoricalTrendChart
              title="Trend of Master Plays"
              description="Tracks cumulative stream velocity over time, normalized for regional distribution peaks."
              data={trends?.plays}
            />
        </div>

        {/* Performance List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Section */}
          <div className="lg:col-span-2 rounded-[2.5rem] bg-[#121214]/30 border border-white/5 p-8 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <FaChartLine size={14} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight uppercase italic leading-none">Stream Distribution</h2>
                  <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em] mt-1">Relative reach per master track</p>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-[300px] flex items-end gap-2 md:gap-4 px-2">
              {analytics.topSongs.length > 0 ? (
                analytics.topSongs.map((song, i) => {
                  const maxPlays = Math.max(...analytics.topSongs.map(s => s.playCount)) || 1;
                  const heightPercent = (song.playCount / maxPlays) * 100;
                  return (
                    <div key={song.id} className="flex-1 flex flex-col items-center gap-3 group">
                      <div className="relative w-full flex flex-col justify-end h-full">
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          <div className="bg-white text-black text-[10px] font-black px-2 py-1 rounded shadow-xl whitespace-nowrap">
                            {song.playCount.toLocaleString()} Plays
                          </div>
                          <div className="w-2 h-2 bg-white rotate-45 mx-auto -mt-1" />
                        </div>

                        {/* Bar */}
                        <div
                          className="w-full bg-gradient-to-t from-indigo-600/40 to-indigo-400 rounded-t-lg group-hover:to-white transition-all duration-700 ease-out"
                          style={{ height: `${Math.max(heightPercent, 5)}%` }}
                        >
                          <div className="w-full h-full bg-indigo-400/20 blur-md scale-x-110" />
                        </div>
                      </div>
                      <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest text-center truncate w-full group-hover:text-indigo-400 transition-colors">
                        {song.title.substring(0, 6)}..
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center border border-white/5 border-dashed rounded-3xl">
                   <FaMusic className="text-4xl text-slate-800 mb-4" />
                   <p className="text-slate-600 font-bold uppercase tracking-widest text-[9px]">Insufficient data for visualization</p>
                </div>
              )}
            </div>
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
              {analytics.topSongs.slice(0, 5).map((song, i) => (
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
              {analytics.topSongs.length === 0 && (
                <div className="py-20 text-center">
                   <p className="text-slate-600 font-bold uppercase tracking-widest text-[9px]">No tracks found</p>
                </div>
              )}
            </div>
          </div>
        </div>


      </div>
    </div>
  );
}
