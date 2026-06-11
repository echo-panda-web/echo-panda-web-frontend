import React, { useState, useEffect } from "react";
import { FaTimes, FaImage, FaSpinner, FaDotCircle } from "react-icons/fa";
import { createArtistAlbum, updateArtistAlbum, getArtistIdentity, type ArtistAlbum } from "../artistStudioApi";

interface Props {
  show: boolean;
  editingAlbum?: ArtistAlbum | null;
  onClose: () => void;
  onCreated: () => void;
}

export default function AlbumModal({ show, editingAlbum, onClose, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("album");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [releaseDate, setReleaseDate] = useState("");
  const [selectedArtist, setSelectedArtist] = useState("");

  useEffect(() => {
    const identity = getArtistIdentity();
    if (identity) setSelectedArtist(identity.displayName || "");
  }, []);

  useEffect(() => {
    if (show) {
      if (editingAlbum) {
        setTitle(editingAlbum.title);
        setType(editingAlbum.type);
        setReleaseDate(editingAlbum.releaseDate);
        setCoverPreview(editingAlbum.coverUrl);
      } else {
        setTitle("");
        setType("album");
        setCoverFile(null);
        setCoverPreview("");
        setReleaseDate("");
      }
    }
  }, [show, editingAlbum]);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return alert("Please choose an image file");
    if (file.size > 5 * 1024 * 1024) return alert("Cover must be 5MB or smaller");
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!title.trim()) return alert("Release title is required");
    try {
      setSaving(true);
      const payload = {
        title: title.trim(),
        artist: selectedArtist || "",
        description: type,
        release_status: editingAlbum ? editingAlbum.releaseStatus : "draft" as any,
        release_date: releaseDate || undefined,
        scheduled_at: releaseDate || undefined,
        coverFile,
      };

      if (editingAlbum) {
        await updateArtistAlbum(editingAlbum.id, payload);
      } else {
        await createArtistAlbum(payload);
      }

      onCreated();
      onClose();
    } catch (err) {
      console.error(err);
      alert(editingAlbum ? "Failed to update release" : "Failed to create release");
    } finally {
      setSaving(false);
    }
  };

  if (!show) return null;

  const inputBase = "w-full bg-[#18181b] border border-white/5 rounded-xl px-5 py-4 outline-none focus:border-indigo-500/30 transition-all font-medium text-slate-300 text-sm placeholder:text-slate-700";
  const labelBase = "text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 block ml-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0a0a0c]/90 backdrop-blur-md" onClick={onClose} />

      <div className="relative bg-[#121214] border border-white/10 w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">

        {/* Header */}
        <div className="p-8 pb-0 flex justify-between items-start">
           <div className="space-y-1">
              <div className="flex items-center gap-3 text-indigo-500 font-bold uppercase tracking-[0.4em] text-[8px]">
                 <FaDotCircle className="animate-pulse" />
                 <span>Production Module</span>
              </div>
              <h3 className="text-2xl font-black text-white">{editingAlbum ? 'Update Release Meta.' : 'Initialize New Release.'}</h3>
           </div>
           <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-500 hover:text-white transition-all">
              <FaTimes size={16} />
           </button>
        </div>

        <div className="p-8 space-y-8">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
               <div>
                 <label className={labelBase}>Release Title</label>
                 <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={inputBase}
                    placeholder="e.g. Midnight Melodies"
                 />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelBase}>Release Type</label>
                    <select
                       value={type}
                       onChange={(e) => setType(e.target.value)}
                       className={`${inputBase} appearance-none`}
                    >
                       <option value="album">Album</option>
                       <option value="single">Single</option>
                       <option value="ep">EP</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelBase}>Release Date</label>
                    <input
                        type="date"
                        value={releaseDate}
                        onChange={(e) => setReleaseDate(e.target.value)}
                        className={inputBase}
                    />
                  </div>
               </div>

               <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                     <span className="text-indigo-400 font-bold">Pro Tip:</span> Detailed metadata like genres and lyrics will be added during the track upload stage for better precision.
                  </p>
               </div>
            </div>

            {/* Cover Art Upload */}
            <div className="flex flex-col h-full">
              <label className={labelBase}>Master Artwork</label>
              <label className="flex-1 group cursor-pointer">
                <div className={`h-full min-h-[220px] border-2 border-dashed ${coverPreview ? 'border-transparent' : 'border-white/5 group-hover:border-indigo-500/30'} rounded-3xl transition-all relative overflow-hidden flex flex-col items-center justify-center gap-4 bg-white/[0.02] group-hover:bg-white/[0.04]`}>
                  {coverPreview ? (
                    <>
                       <img src={coverPreview} alt="preview" className="absolute inset-0 w-full h-full object-cover" />
                       <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest">Update Artwork</span>
                       </div>
                    </>
                  ) : (
                    <>
                       <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-slate-700 group-hover:text-indigo-500 transition-colors">
                          <FaImage size={24} />
                       </div>
                       <div className="text-center">
                          <div className="text-slate-300 font-bold text-xs">Drop Cover Art</div>
                          <div className="text-[9px] text-slate-600 font-black uppercase tracking-widest mt-1">1000x1000 Master Quality</div>
                       </div>
                    </>
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-white/5">
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest max-w-xs">
              {editingAlbum ? "Updates will be applied immediately to the catalog metadata." : "This release will be saved as a draft. You can add tracks and publish it later from your catalog."}
            </p>
            <div className="flex gap-4">
               <button
                  onClick={onClose}
                  disabled={saving}
                  className="px-8 py-3 rounded-xl bg-white/5 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-white transition-all"
               >
                  Cancel
               </button>
               <button
                  onClick={handleSave}
                  disabled={saving || !title}
                  className="px-8 py-3 rounded-xl bg-indigo-500 text-white font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 active:scale-95 transition-all shadow-2xl disabled:opacity-50 disabled:pointer-events-none"
               >
                  {saving ? <><FaSpinner className="animate-spin mr-2 inline-block"/> Processing</> : editingAlbum ? 'Update Release' : 'Create Release'}
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
