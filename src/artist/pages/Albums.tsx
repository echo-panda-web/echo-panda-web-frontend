import { useEffect, useMemo, useState } from "react";
import {
  FaCompactDisc, FaPlus, FaTrash, FaDotCircle, FaEdit, FaLayerGroup, FaClock
} from "react-icons/fa";
import {
  deleteArtistAlbum,
  getArtistIdentity,
  getOwnedAlbums,
  type ArtistIdentity,
  type ArtistAlbum,
} from "../artistStudioApi";
import AlbumModal from "./AlbumModal";

export default function AlbumsManager() {
  const [albums, setAlbums] = useState<ArtistAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const identity = useMemo<ArtistIdentity | null>(() => {
    try { return getArtistIdentity(); } catch { return null; }
  }, []);

  const loadAlbums = async () => {
    try {
      setLoading(true);
      if (!identity) throw new Error("Artist profile not found.");
      const data = await getOwnedAlbums(identity);
      setAlbums(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAlbums(); }, []);

  const handleDelete = async (album: ArtistAlbum) => {
    if (!window.confirm(`Permanently delete release: ${album.title}?`)) return;
    try {
      await deleteArtistAlbum(album.id);
      await loadAlbums();
    } catch (err) {
      alert("Delete failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center py-40 gap-6 text-white">
        <div className="w-16 h-16 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-slate-600 font-bold uppercase tracking-widest text-[10px]">Accessing Master Catalog</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white selection:bg-indigo-500/30">
      <div className="max-w-6xl mx-auto px-6 py-12 md:py-20 space-y-16">

        {/* Discography Master Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-10 border-b border-white/5">
          <div className="space-y-4">
             <div className="flex items-center gap-3 text-indigo-500 font-bold uppercase tracking-[0.4em] text-[10px]">
                <FaLayerGroup />
                <span>Discography Master</span>
             </div>
             <h1 className="text-5xl font-black tracking-tight text-white">Releases.</h1>
             <p className="text-slate-500 text-sm font-medium max-w-lg leading-relaxed">
                Management hub for your entire catalog of singles and albums. Monitor release statuses and track history.
             </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="group h-14 px-10 rounded-full bg-white text-black font-black transition-all hover:bg-indigo-50 active:scale-95 flex items-center gap-3 shadow-2xl text-[10px] uppercase tracking-widest"
          >
            <FaPlus size={10} className="group-hover:rotate-90 transition-transform duration-300" />
            New Release
          </button>
        </div>

        {/* Master Catalog List */}
        <div className="space-y-6">
            <div className="grid grid-cols-12 gap-4 px-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 border-b border-white/5 pb-6">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-5">Identity</div>
                <div className="col-span-2">Format</div>
                <div className="col-span-2">Deployment</div>
                <div className="col-span-2 text-right">Settings</div>
            </div>

            {albums.length === 0 ? (
                <div className="py-40 flex flex-col items-center justify-center bg-white/[0.01] rounded-[4rem] border border-white/5 border-dashed group">
                    <FaCompactDisc className="text-5xl text-slate-800 mb-8" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Master catalog empty</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {albums.map((album, index) => {
                        const isLive = album.releaseStatus === 'published';
                        return (
                            <div key={album.id} className="group grid grid-cols-12 items-center gap-4 p-5 rounded-[2rem] bg-white/[0.01] border border-transparent hover:border-white/5 hover:bg-white/[0.02] transition-all duration-300">

                                <div className="col-span-1 text-center text-slate-800 font-bold text-xs group-hover:text-indigo-500 transition-colors">
                                    {(index + 1).toString().padStart(2, '0')}
                                </div>

                                <div className="col-span-5 flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-[#0e0e11] border border-white/5 shadow-lg relative">
                                        {album.coverUrl ? (
                                            <img src={album.coverUrl} alt={album.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <FaCompactDisc className="text-slate-800 text-xl" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-xl font-bold text-white truncate group-hover:text-indigo-400 transition-colors">{album.title}</h3>
                                        <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                                            {album.releaseDate || 'Mastering'}
                                        </div>
                                    </div>
                                </div>

                                <div className="col-span-2">
                                    <span className="px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] bg-white/5 border border-white/5 text-slate-500">
                                        {album.type}
                                    </span>
                                </div>

                                <div className="col-span-2">
                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-xl border ${
                                        isLive
                                        ? 'bg-green-500/10 text-green-400 border-green-500/10'
                                        : 'bg-amber-500/10 text-amber-500 border-amber-500/10'
                                    }`}>
                                        {album.releaseStatus}
                                    </span>
                                </div>

                                <div className="col-span-2 flex items-center justify-end gap-2">
                                    <button className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/5 text-slate-500 hover:text-white transition-all shadow-xl" title="Edit Metadata">
                                        <FaEdit size={12} />
                                    </button>
                                    <button onClick={() => handleDelete(album)} className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all shadow-xl" title="Delete Release">
                                        <FaTrash size={12} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
      </div>

      <AlbumModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={async () => {
          setShowAddModal(false);
          await loadAlbums();
        }}
      />
    </div>
  );
}
