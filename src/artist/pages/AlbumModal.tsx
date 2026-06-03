import React, { useState, useEffect } from "react";
import { FaTimes, FaImage, FaSpinner, FaChevronDown, FaCalendarAlt, FaMusic } from "react-icons/fa";
import { createArtistAlbum, getArtistIdentity } from "../artistStudioApi";
import { getDerivedCategories } from "../../backend/catalogService";

interface Props {
  show: boolean;
  onClose: () => void;
  onCreated: (album?: any) => void;
}

export default function AlbumModal({ show, onClose, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("album");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [creating, setCreating] = useState(false);
  const [releaseDate, setReleaseDate] = useState("");
  const [selectedArtist, setSelectedArtist] = useState("");
  const [genre, setGenre] = useState("");
  const [genres, setGenres] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    const identity = getArtistIdentity();
    if (identity) setSelectedArtist(identity.displayName || "");
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const cats = await getDerivedCategories();
        setGenres(cats.map((c: any) => ({ id: c.id, name: c.name })));
      } catch (err) {
        console.warn('Failed to load genres', err);
      }
    })();
  }, []);

  useEffect(() => {
    if (!show) {
      setTitle("");
      setType("album");
      setCoverFile(null);
      setCoverPreview("");
      setReleaseDate("");
      setGenre("");
    }
  }, [show]);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return alert("Please choose an image file");
    if (file.size > 5 * 1024 * 1024) return alert("Cover must be 5MB or smaller");
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    try {
      setCreating(true);
      const newAlbum = await createArtistAlbum({
        title: title.trim(),
        artist: selectedArtist || "",
        description: type,
        release_status: "draft",
        scheduled_at: releaseDate || undefined,
        coverFile,
      });
      onCreated(newAlbum);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to create album");
    } finally {
      setCreating(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-10">
      <div className="fixed inset-0 bg-[#0a0a0c]/90 backdrop-blur-xl" onClick={onClose} />

      <div className="relative bg-[#121214] border border-white/5 w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">

        {/* Close Button */}
        <button
            onClick={onClose}
            className="absolute top-2.5 right-2.5 z-10 w-5 h-5 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-500 transition-all active:scale-90"
        >
            <FaTimes size={6} />
        </button>

        <div className="flex flex-col">

            {/* Top/Left Section: Artistic Header */}
            <div className="bg-[#0e0e11]/50 p-4 flex items-center gap-4 border-b border-white/5">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#0a0a0c] border border-white/5 shadow-xl shrink-0 group relative">
                    {coverPreview ? (
                        <>
                            <img src={coverPreview} alt="Preview" className="w-full h-full object-cover" />
                            <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                <span className="text-[6px] font-bold text-white uppercase">Edit</span>
                                <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                            </label>
                        </>
                    ) : (
                        <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer group">
                            <FaImage className="text-slate-700 text-xs mb-1" />
                            <span className="text-slate-500 font-bold text-[5px] uppercase tracking-widest">Art</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                        </label>
                    )}
                </div>
                <div className="min-w-0">
                    <h3 className="text-xs font-black text-white tracking-tight truncate uppercase">{title || 'New Release'}</h3>
                    <p className="text-[6px] font-black text-indigo-500/70 uppercase tracking-[0.3em] mt-0.5">
                        {type} • Draft
                    </p>
                </div>
            </div>

            {/* Form Section */}
            <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1">
                        <label className="text-[6px] font-black text-slate-500 uppercase tracking-widest ml-0.5">Title</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-[#0a0a0c] border border-white/5 rounded-md px-2 py-1.5 outline-none focus:border-indigo-500/30 text-white font-bold text-[10px] transition-all"
                            placeholder="Enter title..."
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[6px] font-black text-slate-500 uppercase tracking-widest ml-0.5">Type</label>
                        <div className="relative">
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full bg-[#0a0a0c] border border-white/5 rounded-md px-2 py-1.5 text-white font-bold text-[10px] appearance-none cursor-pointer outline-none focus:border-indigo-500/30 transition-all"
                            >
                                <option value="album">Album</option>
                                <option value="single">Single</option>
                                <option value="ep">EP</option>
                            </select>
                            <FaChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-700 pointer-events-none text-[5px]" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[6px] font-black text-slate-500 uppercase tracking-widest ml-0.5">Genre</label>
                        <div className="relative">
                            <select
                                value={genre}
                                onChange={(e) => setGenre(e.target.value)}
                                className="w-full bg-[#0a0a0c] border border-white/5 rounded-md px-2 py-1.5 text-white font-bold text-[10px] appearance-none cursor-pointer outline-none focus:border-indigo-500/30 transition-all"
                            >
                                <option value="">Genre</option>
                                {genres.map((g) => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                            </select>
                            <FaChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-700 pointer-events-none text-[5px]" />
                        </div>
                    </div>

                    <div className="col-span-2 space-y-1">
                        <label className="text-[6px] font-black text-slate-500 uppercase tracking-widest ml-0.5">Release Date</label>
                        <input
                            type="date"
                            value={releaseDate}
                            onChange={(e) => setReleaseDate(e.target.value)}
                            className="w-full bg-[#0a0a0c] border border-white/5 rounded-md px-2 py-1.5 text-white font-bold text-[10px] outline-none focus:border-indigo-500/30 transition-all [color-scheme:dark]"
                        />
                    </div>
                </div>

                <div className="pt-1 flex gap-2">
                    <button
                        onClick={onClose}
                        disabled={creating}
                        className="flex-1 h-7 rounded-md bg-white/[0.03] border border-white/5 hover:bg-white/10 text-slate-500 font-bold transition-all active:scale-95 text-[7px] uppercase tracking-widest"
                    >
                        Discard
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={creating || !title}
                        className="flex-[2] h-7 rounded-md bg-indigo-500 hover:bg-indigo-400 text-white font-black transition-all shadow-md active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1 text-[7px] uppercase tracking-widest"
                    >
                        {creating ? (
                            <><FaSpinner className="animate-spin" size={7} /> ...</>
                        ) : (
                            'Initialize'
                        )}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
