import { useEffect, useMemo, useState } from "react";
import {
  FaCheckCircle, FaCompactDisc, FaImage, FaMusic, FaPlus, FaTrash,
  FaSpinner, FaDotCircle, FaSearch, FaFilter, FaCalendarAlt, FaChevronRight, FaEdit
} from "react-icons/fa";
import {
  deleteArtistAlbum,
  getArtistIdentity,
  getOwnedAlbums,
  updateArtistAlbum,
  type ArtistIdentity,
  type ArtistAlbum,
} from "../artistStudioApi";
import AlbumModal from "./AlbumModal";

export default function Albums() {
  const [albums, setAlbums] = useState<ArtistAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<ArtistAlbum | null>(null);

  const identity = useMemo<ArtistIdentity | null>(() => {
    try {
      return getArtistIdentity();
    } catch {
      return null;
    }
  }, []);

  const loadAlbums = async () => {
    try {
      setLoading(true);
      setError("");
      if (!identity) {
        throw new Error("Missing artist_id in session. Please sign in again.");
      }
      const data = await getOwnedAlbums(identity);
      setAlbums(data);
    } catch (loadError) {
      console.error(loadError);
      setError(loadError instanceof Error ? loadError.message : "Failed to load releases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlbums();
  }, []);

  const openEditAlbum = (album: ArtistAlbum) => {
    setEditingAlbum(album);
    setShowAddModal(true);
  };

  const deleteRelease = async (album: ArtistAlbum) => {
    const confirmed = window.confirm(`Delete release: ${album.title}?`);
    if (!confirmed) {
      return;
    }

    try {
      await deleteArtistAlbum(album.id);
      await loadAlbums();
    } catch (deleteError) {
      console.error(deleteError);
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete release");
    }
  };

  const filteredAlbums = useMemo(() => {
    if (!searchTerm) return albums;
    const lower = searchTerm.toLowerCase();
    return albums.filter(a =>
      a.title.toLowerCase().includes(lower) ||
      (a.type && a.type.toLowerCase().includes(lower))
    );
  }, [albums, searchTerm]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center py-40 gap-6 text-white">
        <div className="w-16 h-16 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-slate-600 font-bold uppercase tracking-widest text-[10px]">Accessing Catalog</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white selection:bg-indigo-500/30">
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-10">

        {/* Releases Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/5">
          <div className="space-y-3">
             <div className="flex items-center gap-3 text-indigo-500 font-bold uppercase tracking-[0.4em] text-[9px]">
                <FaDotCircle className="animate-pulse" />
                <span>Production Environment</span>
             </div>
             <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">Album Management.</h1>
             <p className="text-slate-500 text-sm font-medium max-w-lg leading-relaxed">
                Manage your studio catalog. Create albums and singles, monitor publishing status, and control release distribution.
             </p>
          </div>
          <button
              onClick={() => { setEditingAlbum(null); setShowAddModal(true); }}
              className="h-12 px-8 rounded-xl bg-indigo-500 text-white font-black transition-all hover:bg-indigo-600 active:scale-95 flex items-center gap-3 shadow-2xl text-[10px] uppercase tracking-widest"
          >
              <FaPlus size={10} />
              New Album
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
            <div className="relative flex-1 group">
                <FaSearch size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
                <input
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search by title or type..."
                    className="w-full bg-[#121214] border border-white/5 rounded-xl pl-12 pr-5 py-3.5 outline-none focus:border-indigo-500/30 transition-all font-medium text-slate-300 text-sm"
                />
            </div>
            <button className="h-12 px-6 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3 text-slate-400 font-bold hover:text-white transition-all text-[10px] uppercase tracking-widest">
                <FaFilter size={12} /> Filter
            </button>
        </div>

        {error && (
            <div className="rounded-2xl border border-red-500/10 bg-red-500/5 p-4 text-red-400 text-xs font-bold uppercase tracking-widest">
                {error}
            </div>
        )}

        {/* Releases List */}
        <div className="space-y-2">
            {filteredAlbums.length === 0 ? (
                <div className="py-24 flex flex-col items-center justify-center bg-white/[0.01] rounded-[3rem] border border-white/5 border-dashed">
                    <FaCompactDisc className="text-4xl text-slate-800 mb-6" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">No Releases Found</p>
                </div>
            ) : (
                filteredAlbums.map((album, index) => {
                    const statusMeta: Record<string, { label: string; className: string; icon: any }> = {
                        draft: { label: "Draft", className: "bg-amber-500/10 text-amber-500 border-amber-500/10", icon: FaDotCircle },
                        pending_review: { label: "Review", className: "bg-blue-500/10 text-blue-400 border-blue-500/10", icon: FaSpinner },
                        published: { label: "Live", className: "bg-green-500/10 text-green-500 border-green-500/10", icon: FaCheckCircle },
                        rejected: { label: "Issue", className: "bg-red-500/10 text-red-500 border-red-500/10", icon: FaTrash },
                    };
                    const status = statusMeta[album.releaseStatus] || statusMeta.draft;

                    return (
                        <div key={album.id} className="group grid grid-cols-12 items-center gap-4 p-4 rounded-2xl bg-[#121214]/50 border border-transparent hover:border-white/10 hover:bg-[#121214] transition-all duration-300">
                            <div className="col-span-1 text-center text-slate-800 font-bold text-xs group-hover:text-indigo-500 transition-colors">
                                {(index + 1).toString().padStart(2, '0')}
                            </div>
                            <div className="col-span-4 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-[#0e0e11] border border-white/5 shadow-lg">
                                    {album.coverUrl ? (
                                        <img src={album.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    ) : <FaImage className="w-full h-full p-4 text-slate-800" />}
                                </div>
                                <div className="min-w-0">
                                    <button
                                      onClick={() => navigate(`/album/${album.id}`)}
                                      className="text-base font-bold text-white truncate hover:text-indigo-400 transition-colors tracking-tight text-left block w-full"
                                    >
                                      {album.title}
                                    </button>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <FaCalendarAlt className="text-slate-600" size={8} />
                                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest truncate">{album.releaseDate || "No Date"}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-2 text-xs font-bold text-slate-500 truncate uppercase tracking-widest">
                                {album.type || "album"}
                            </div>
                            <div className="col-span-2">
                                <span className={`inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest border ${status.className}`}>
                                    <status.icon className={status.label === "Review" ? "animate-spin" : ""} size={7} />
                                    {status.label}
                                </span>
                            </div>
                            <div className="col-span-3 flex items-center justify-end gap-2">
                                <button
                                    onClick={() => openEditAlbum(album)}
                                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 text-slate-500 hover:text-white transition-all border border-white/5"
                                    title="Edit Album"
                                >
                                    <FaEdit size={12} />
                                </button>
                                <button onClick={() => deleteRelease(album)} className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 text-slate-500 hover:text-red-400 transition-all border border-white/5">
                                    <FaTrash size={12} />
                                </button>
                                <div className="w-8 h-8 flex items-center justify-center rounded-full text-slate-800 group-hover:text-indigo-500 transition-all">
                                    <FaChevronRight size={10} />
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>

        {/* Help Footer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-10">
            <div className="p-6 rounded-3xl bg-[#121214]/50 border border-white/5 flex gap-5 items-start">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                    <FaMusic size={14} />
                </div>

            </div>
        </div>
      </div>

      <AlbumModal
        show={showAddModal}
        editingAlbum={editingAlbum}
        onClose={() => { setShowAddModal(false); setEditingAlbum(null); }}
        onCreated={async () => { setShowAddModal(false); setEditingAlbum(null); await loadAlbums(); }}
      />

      <style>{`
         .animate-spin-slow { animation: spin 10s linear infinite; }
         @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
