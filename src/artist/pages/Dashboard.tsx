import { useEffect, useMemo, useState } from "react";
import { FaChartLine, FaCompactDisc, FaHeadphones, FaMusic, FaUsers } from "react-icons/fa";
import { getArtistAnalytics, getArtistIdentity, getOwnedAlbums, getOwnedSongs, getSongPlayMap, type ArtistAlbum, type ArtistSong } from "../artistStudioApi";

interface MetricCard {
  label: string;
  value: number;
  helper: string;
  icon: React.ReactNode;
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
      label: "Owned Songs",
      value: songs.length,
      helper: "Only your catalog",
      icon: <FaMusic />,
    },
    {
      label: "Owned Releases",
      value: albums.length,
      helper: `${analytics.publishedReleases} published, ${analytics.draftReleases} drafts`,
      icon: <FaCompactDisc />,
    },
    {
      label: "Play Counts",
      value: monthlyStreams || analytics.totalPlays,
      helper: monthlyStreams ? "Monthly streams (artist analytics API)" : "Total streams across your songs",
      icon: <FaHeadphones />,
    },
    {
      label: "Listener Statistics",
      value: analytics.listenerStat,
      helper: "Songs with at least one play",
      icon: <FaUsers />,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-6 md:p-10 text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tight">Streaming Analytics</h1>
          <p className="text-slate-300">
            Artist view is scoped to your own content only: releases, play counts, and listener signals.
          </p>
        </div>

        {error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div key={card.label} className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-300">{card.label}</p>
                <div className="text-purple-300">{card.icon}</div>
              </div>
              <p className="mt-3 text-3xl font-black text-white">{loading ? "..." : card.value.toLocaleString()}</p>
              <p className="mt-1 text-xs text-slate-400">{card.helper}</p>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-3">
            <FaChartLine className="text-purple-300" />
            <h2 className="text-2xl font-black">Top Songs By Plays</h2>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-white/10">
                  <th className="py-3">Song</th>
                  <th className="py-3">Album</th>
                  <th className="py-3">Play Count</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topSongs.map((song) => (
                  <tr key={song.id} className="border-b border-white/5">
                    <td className="py-3 text-white font-semibold">{song.title}</td>
                    <td className="py-3 text-slate-300">{song.albumTitle}</td>
                    <td className="py-3 text-purple-200 font-bold">{song.playCount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && analytics.topSongs.length === 0 && (
              <p className="py-6 text-slate-400">No owned songs found. Upload your first track to start analytics.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
