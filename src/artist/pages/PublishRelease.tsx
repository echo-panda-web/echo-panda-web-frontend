import { useEffect, useMemo, useState } from "react";
import {
  FaCheckCircle, FaRocket, FaCompactDisc, FaSpinner, FaDotCircle, FaGlobe
} from "react-icons/fa";
import {
  getArtistIdentity,
  getOwnedAlbums,
  updateArtistAlbum,
  type ArtistIdentity,
  type ArtistAlbum,
} from "../artistStudioApi";

export default function PublishRelease() {
  const [albums, setAlbums] = useState<ArtistAlbum[]>([]);
  const [loading, setLoading] = useState(true);

  const identity = useMemo<ArtistIdentity | null>(() => {
    try { return getArtistIdentity(); } catch { return null; }
  }, []);

  const loadReadyToPublish = async () => {
    try {
      setLoading(true);
      if (!identity) throw new Error("Artist profile not found.");
      const data = await getOwnedAlbums(identity);
      // Filter for anything NOT published yet
      setAlbums(data.filter(a => a.releaseStatus !== "published"));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReadyToPublish(); }, []);

  const handlePublish = async (album: ArtistAlbum) => {
    if (!identity) return;
    try {
      setLoading(true);
      await updateArtistAlbum(album.id, {
        title: album.title,
        artist: identity.displayName,
        description: album.type,
        release_status: "published",
        release_date: new Date().toISOString().slice(0, 10),
      });
      await loadReadyToPublish();
    } catch (err) {
      alert("Publish failed");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center py-40 gap-6 text-white">
        <div className="w-16 h-16 border-4 border-green-500/10 border-t-green-500 rounded-full animate-spin" />
        <span className="text-slate-600 font-bold uppercase tracking-widest text-[10px]">Syncing Distribution</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white selection:bg-green-500/30">
      <div className="max-w-5xl mx-auto px-6 py-12 md:py-20 space-y-12">

        {/* Publish Specific Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-white/5">
          <div className="space-y-4">
             <div className="flex items-center gap-3 text-green-500 font-bold uppercase tracking-[0.4em] text-[10px]">
                <FaGlobe />
                <span>Global Distribution</span>
             </div>
             <h1 className="text-5xl font-black tracking-tight text-white">Publish.</h1>
             <p className="text-slate-500 text-sm font-medium max-w-lg leading-relaxed">
                Launch your mastered assets to the global Echo Panda catalog. Once published, your music will be available for streaming worldwide.
             </p>
          </div>
        </div>

        {/* Publish Queue Layout */}
        <div className="space-y-6">
            {albums.length === 0 ? (
                <div className="py-40 flex flex-col items-center justify-center bg-white/[0.01] rounded-[4rem] border border-white/5 border-dashed">
                    <FaCheckCircle className="text-5xl text-slate-800 mb-8" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">All releases are live</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {albums.map((album) => (
                        <div key={album.id} className="group flex items-center justify-between p-8 rounded-[3rem] bg-[#121214] border border-white/5 hover:border-green-500/30 transition-all duration-500 shadow-2xl">
                            <div className="flex items-center gap-8">
                                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#0e0e11] border border-white/5 shadow-lg flex-shrink-0">
                                    {album.coverUrl ? (
                                        <img src={album.coverUrl} className="w-full h-full object-cover" />
                                    ) : <FaCompactDisc className="w-full h-full p-6 text-slate-800" />}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-2xl font-bold text-white truncate group-hover:text-green-400 transition-colors">{album.title}</h3>
                                    <div className="flex items-center gap-4 mt-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{album.type}</span>
                                        <div className="w-1 h-1 rounded-full bg-slate-800" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Ready for Launch</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handlePublish(album)}
                                className="h-14 px-12 rounded-full bg-green-500 hover:bg-green-400 text-black font-black text-[10px] uppercase tracking-[0.3em] transition-all shadow-xl shadow-green-500/10 active:scale-95 flex items-center gap-3"
                            >
                                <FaRocket />
                                Finalize & Launch
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
