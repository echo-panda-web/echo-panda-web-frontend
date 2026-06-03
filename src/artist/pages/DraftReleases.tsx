import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSave, FaEdit, FaTrash, FaSpinner, FaDotCircle, FaCompactDisc, FaPlus, FaClock
} from "react-icons/fa";
import {
  deleteArtistAlbum,
  getArtistIdentity,
  getOwnedAlbums,
  type ArtistIdentity,
  type ArtistAlbum,
} from "../artistStudioApi";
import AlbumModal from "./AlbumModal";

export default function DraftReleases() {
  const navigate = useNavigate();
  const [albums, setAlbums] = useState<ArtistAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const identity = useMemo<ArtistIdentity | null>(() => {
    try { return getArtistIdentity(); } catch { return null; }
  }, []);

  const loadDrafts = async () => {
    try {
      setLoading(true);
      if (!identity) throw new Error("Artist profile not found.");
      const data = await getOwnedAlbums(identity);
      // Filter only drafts and pending reviews
      setAlbums(data.filter(a => a.releaseStatus === "draft" || a.releaseStatus === "pending_review"));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDrafts(); }, []);

  const handleDelete = async (album: ArtistAlbum) => {
    if (!window.confirm(`Permanently delete draft: ${album.title}?`)) return;
    try {
      await deleteArtistAlbum(album.id);
      await loadDrafts();
    } catch (err) {
      alert("Failed to delete draft");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center py-40 gap-6 text-white">
        <div className="w-16 h-16 border-4 border-amber-500/10 border-t-amber-500 rounded-full animate-spin" />
        <span className="text-slate-600 font-bold uppercase tracking-widest text-[10px]">Accessing Drafts</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white selection:bg-amber-500/30">
      <div className="max-w-5xl mx-auto px-6 py-12 md:py-20 space-y-12">

        {/* Draft Specific Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-white/5">
          <div className="space-y-4">
             <div className="flex items-center gap-3 text-amber-500 font-bold uppercase tracking-[0.4em] text-[10px]">
                <FaSave />
                <span>Work in Progress</span>
             </div>
             <h1 className="text-5xl font-black tracking-tight text-white">Drafts.</h1>
             <p className="text-slate-500 text-sm font-medium max-w-lg leading-relaxed">
                Releases currently in the mastering or review phase. These are not yet visible to the public catalog.
             </p>
          </div>
          <button
              onClick={() => setShowAddModal(true)}
              className="h-14 px-10 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 font-black transition-all hover:bg-amber-500 hover:text-black active:scale-95 flex items-center gap-3 text-[10px] uppercase tracking-widest"
          >
              <FaPlus size={10} />
              New Draft
          </button>
        </div>

        {/* Draft List Layout */}
        <div className="space-y-6">
            {albums.length === 0 ? (
                <div className="py-40 flex flex-col items-center justify-center bg-white/[0.01] rounded-[4rem] border border-white/5 border-dashed">
                    <FaSave className="text-5xl text-slate-800 mb-8" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">No active drafts</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {albums.map((album) => (
                        <div key={album.id} className="group bg-[#121214] border border-white/5 p-6 rounded-[2.5rem] hover:border-amber-500/30 transition-all duration-300">
                            <div className="flex gap-6">
                                <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-black/40 border border-white/5">
                                    {album.coverUrl ? (
                                        <img src={album.coverUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                                    ) : <FaCompactDisc className="w-full h-full p-6 text-slate-800" />}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <h3 className="text-xl font-bold truncate group-hover:text-amber-500 transition-colors">{album.title}</h3>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full border border-amber-500/10">
                                            {album.releaseStatus}
                                        </span>
                                        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                                            <FaClock size={9} /> {album.type}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                                <button onClick={() => navigate(`/artist/publish?action=publish`)} className="text-[10px] font-black uppercase tracking-widest text-amber-400 hover:text-white transition-colors">
                                    Move to Publish →
                                </button>
                                <div className="flex gap-2">
                                    <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-slate-500 hover:text-white transition-all"><FaEdit size={12}/></button>
                                    <button onClick={() => handleDelete(album)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-slate-500 hover:text-red-500 transition-all"><FaTrash size={12}/></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>

      <AlbumModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={async () => {
          setShowAddModal(false);
          await loadDrafts();
        }}
      />
    </div>
  );
}
