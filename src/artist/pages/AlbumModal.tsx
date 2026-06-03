import React, { useState, useEffect } from "react";
import { FaTimes, FaImage, FaSpinner } from "react-icons/fa";
import { createArtistAlbum, getArtistIdentity } from "../artistStudioApi";
import { getDerivedCategories } from "../../backend/catalogService";

interface Props {
  show: boolean;
  onClose: () => void;
  onCreated: () => void;
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

  useEffect(() => {
    // Auto-create when title + cover are present
    if (coverFile && title && !creating) {
      (async () => {
        try {
          setCreating(true);
          await createArtistAlbum({
            title: title.trim(),
            artist: selectedArtist || "",
            description: type,
            release_status: "draft",
            scheduled_at: releaseDate || undefined,
            coverFile,
          });
          onCreated();
          onClose();
        } catch (err) {
          console.error("Failed to auto-create album:", err);
        } finally {
          setCreating(false);
        }
      })();
    }
  }, [coverFile]);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return alert("Please choose an image file");
    if (file.size > 5 * 1024 * 1024) return alert("Cover must be 5MB or smaller");
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleCreate = async () => {
    try {
      setCreating(true);
      await createArtistAlbum({
        title: title.trim(),
        artist: selectedArtist || "",
        description: type,
        release_status: "draft",
        scheduled_at: releaseDate || undefined,
        coverFile,
      });
      onCreated();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-white/10 w-full max-w-2xl rounded-[2rem] p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-white">Add New Album</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><FaTimes size={20} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Album Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-purple-500 text-white" placeholder="Album Title" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-2xl px-4 py-3 text-white">
              <option value="album">Album</option>
              <option value="single">Single</option>
              <option value="ep">EP</option>
            </select>
            <input type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-2xl px-4 py-3 text-white" />
            <select value={selectedArtist} onChange={(e) => setSelectedArtist(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-2xl px-4 py-3 text-white">
              <option value={selectedArtist}>{selectedArtist || 'Your artist'}</option>
            </select>
            <select value={genre} onChange={(e) => setGenre(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-2xl px-4 py-3 text-white">
              <option value="">Select genre</option>
              {genres.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Cover Art</label>
            <label className="block cursor-pointer">
              <div className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-10 hover:bg-white/10 transition-all flex items-center justify-center flex-col gap-2">
                <FaImage className="text-purple-300 text-3xl" />
                <div className="text-slate-300">Click to upload cover art</div>
                <div className="text-xs text-slate-500">JPG, PNG, WEBP - Max 5MB</div>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
            </label>
            {coverPreview && <img src={coverPreview} alt="preview" className="mt-3 h-28 w-28 rounded-lg object-cover border border-white/10" />}
          </div>

          <div className="flex gap-3 justify-end">
            <button onClick={onClose} disabled={creating} className="px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10">Cancel</button>
            <button onClick={handleCreate} disabled={creating || !title} className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold">
              {creating ? <><FaSpinner className="animate-spin mr-2"/> Creating...</> : 'Create Album'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
