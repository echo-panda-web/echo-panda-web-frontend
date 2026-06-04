import React, { useState, useEffect, useMemo } from "react";
import {
  FaTimes, FaMusic, FaClock, FaMicrophone, 
  FaCompactDisc, FaSpinner, FaUpload, FaImage, FaDotCircle, FaChevronDown,
  FaQuoteLeft, FaTags, FaCheckCircle, FaTrashAlt, FaHeart, FaExclamationTriangle, FaUserPlus
} from "react-icons/fa";
import { createArtistSong, updateArtistSong, uploadArtistMedia } from "../artistStudioApi";
import { getDerivedCategories } from "../../backend/catalogService";

interface Artist {
  id: string;
  name: string;
  image_url: string;
}

interface Album {
  id: string;
  title: string;
  cover_url: string;
}

interface Song {
  id: string;
  title: string;
  duration: number;
  album_id: string | null;
  track_number?: number;
  audio_url: string;
  songCover_url: string;
  cover_key?: string | null;
  lyrics?: string;
  category_id?: string;
  mood?: string;
  song_type?: string;
  bpm?: number;
  is_explicit?: boolean;
  featured_artists?: string;
  original_key?: string | null;
  created_at: string;
  updated_at: string;
  artists?: Artist[];
  album?: Album;
}

interface SongModalProps {
  show: boolean;
  editingSong: Song | null;
  allArtists: Artist[];
  allAlbums: Album[];
  onClose: () => void;
  onSave: () => void;
}

const MOODS = ["Chill", "Energetic", "Dark", "Happy", "Sad", "Romantic", "Angry", "Calm"];
const SONG_TYPES = ["Original", "Remix", "Cover", "Instrumental", "Live"];

export default function SongModal({
  show,
  editingSong,
  allArtists,
  allAlbums,
  onClose,
  onSave
}: SongModalProps) {
  const [formData, setFormData] = useState<Partial<Song>>({
    title: "",
    duration: 180,
    album_id: null,
    audio_url: "",
    songCover_url: "",
    cover_key: null,
    lyrics: "",
    category_id: "",
    mood: "",
    song_type: "Original",
    bpm: 0,
    is_explicit: false,
    featured_artists: ""
  });

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [selectedArtistIds, setSelectedArtistIds] = useState<string[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState({ audio: 0 });
  const [uploading, setUploading] = useState(false);
  const [genres, setGenres] = useState<Array<{ id: string; name: string }>>([]);

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
    if (editingSong) {
      setFormData({
        title: editingSong.title,
        duration: editingSong.duration || 180,
        album_id: editingSong.album_id,
        audio_url: editingSong.audio_url,
        songCover_url: editingSong.songCover_url,
        cover_key: editingSong.cover_key || null,
        lyrics: editingSong.lyrics || "",
        category_id: editingSong.category_id || "",
        mood: editingSong.mood || "",
        song_type: editingSong.song_type || "Original",
        bpm: editingSong.bpm || 0,
        is_explicit: editingSong.is_explicit || false,
        featured_artists: editingSong.featured_artists || ""
      });
      setSelectedArtistIds(editingSong.artists?.map(a => a.id) || []);
    } else {
      setFormData({
        title: "",
        duration: 180,
        album_id: null,
        audio_url: "",
        songCover_url: "",
        cover_key: null,
        lyrics: "",
        category_id: "",
        mood: "",
        song_type: "Original",
        bpm: 0,
        is_explicit: false,
        featured_artists: ""
      });
      setSelectedArtistIds([]);
    }
    setAudioFile(null);
    setUploadProgress({ audio: 0 });
    setCoverFile(null);
    setCoverPreview("");
  }, [editingSong, show]);

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) return alert('Audio file must be less than 50MB');
    setAudioFile(file);
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return alert("Please choose an image file");
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const clearSongCover = () => {
    setCoverFile(null);
    setCoverPreview("");
    setFormData({ ...formData, songCover_url: "", cover_key: null });
  };

  const handleSave = async () => {
    if (!formData.title) return alert('Song Title is required');
    if (!editingSong && !audioFile) return alert('Song audio file is required');
    if (!formData.album_id) return alert('Please select a release album');

    try {
      setUploading(true);
      let audioKey = editingSong?.original_key || null;
      let coverKey = formData.cover_key || null;

      if (audioFile) {
        setUploadProgress({ audio: 30 });
        const res = await uploadArtistMedia({ file: audioFile, purpose: 'song_audio' });
        audioKey = res.key;
        setUploadProgress({ audio: 100 });
      }

      if (coverFile) {
        const res = await uploadArtistMedia({ file: coverFile, purpose: 'song_cover' });
        coverKey = res.key;
      }

      const payload = {
        title: formData.title || "",
        duration: formData.duration || 180,
        album_id: String(formData.album_id),
        artist: allArtists.find(a => selectedArtistIds.includes(a.id))?.name || allArtists[0]?.name || "Unknown Artist",
        track_number: editingSong?.track_number || 1,
        original_key: audioKey,
        cover_key: coverKey,
        lyrics: formData.lyrics,
        category_id: formData.category_id,
        mood: formData.mood,
        song_type: formData.song_type,
        bpm: Number(formData.bpm),
        is_explicit: formData.is_explicit,
        featured_artists: formData.featured_artists
      };

      if (editingSong) {
        await updateArtistSong(editingSong.id, payload);
      } else {
        await createArtistSong(payload);
      }

      onSave();
      onClose();
    } catch (err: any) {
      console.error(err);
      alert('Failed to save track: ' + (err.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  if (!show) return null;

  const inputBase = "w-full bg-[#18181b] border border-white/5 rounded-xl px-5 py-4 outline-none focus:border-indigo-500/30 transition-all font-medium text-slate-300 text-sm placeholder:text-slate-700";
  const labelBase = "text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 block ml-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0a0a0c]/90 backdrop-blur-md" onClick={onClose} />

      <div className="relative bg-[#121214] border border-white/10 w-full max-w-5xl rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        
        <div className="p-8 pb-0 flex justify-between items-start">
           <div className="space-y-1">
              <div className="flex items-center gap-3 text-indigo-500 font-bold uppercase tracking-[0.4em] text-[8px]">
                 <FaDotCircle className="animate-pulse" />
                 <span>Mastering Module</span>
              </div>
              <h3 className="text-2xl font-black text-white">{editingSong ? 'Update Song.' : 'Upload New Song.'}</h3>
           </div>
           <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-500 hover:text-white transition-all">
              <FaTimes size={16} />
           </button>
        </div>

        <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">

          <div className="space-y-6">
            <div>
              <label className={labelBase}>Song Title</label>
              <input 
                value={formData.title || ''}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className={inputBase}
                placeholder="e.g. Neon Horizon"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className={labelBase}>Release Album List</label>
                  <div className="relative">
                    <select
                      value={formData.album_id || ''}
                      onChange={(e) => setFormData({...formData, album_id: e.target.value || null})}
                      className={`${inputBase} appearance-none`}
                    >
                      <option value="">Select Release</option>
                      {allAlbums.map(album => (
                        <option key={album.id} value={album.id}>{album.title}</option>
                      ))}
                    </select>
                    <FaChevronDown size={10} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                  </div>
               </div>
               <div>
                  <label className={labelBase}>Genre Classification</label>
                  <div className="relative">
                    <select
                      value={formData.category_id || ''}
                      onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                      className={`${inputBase} appearance-none`}
                    >
                      <option value="">Select Genre</option>
                      {genres.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                    <FaTags size={10} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className={labelBase}>Mood Song</label>
                  <div className="relative">
                    <select
                      value={formData.mood || ''}
                      onChange={(e) => setFormData({...formData, mood: e.target.value})}
                      className={`${inputBase} appearance-none`}
                    >
                      <option value="">Select Mood</option>
                      {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <FaHeart size={10} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                  </div>
               </div>
               <div>
                  <label className={labelBase}>Song Style / Type</label>
                  <div className="relative">
                    <select
                      value={formData.song_type || 'Original'}
                      onChange={(e) => setFormData({...formData, song_type: e.target.value})}
                      className={`${inputBase} appearance-none`}
                    >
                      {SONG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <FaDotCircle size={10} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className={labelBase}>Beats Per Minute (BPM)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.bpm || ''}
                      onChange={(e) => setFormData({...formData, bpm: Number(e.target.value)})}
                      className={inputBase}
                      placeholder="128"
                    />
                    <FaDotCircle size={12} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-700" />
                  </div>
               </div>
               <div>
                 <label className={labelBase}>Contributor Credits</label>
                 <div className="bg-[#18181b] border border-white/5 rounded-xl p-3 max-h-[50px] overflow-y-auto custom-scrollbar">
                    {allArtists.map(artist => (
                      <label key={artist.id} className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-1 rounded-lg transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedArtistIds.includes(artist.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedArtistIds([...selectedArtistIds, artist.id]);
                            else setSelectedArtistIds(selectedArtistIds.filter(id => id !== artist.id));
                          }}
                          className="w-3 h-3 accent-indigo-500 bg-transparent border-white/10"
                        />
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">{artist.name}</span>
                      </label>
                    ))}
                 </div>
               </div>
            </div>

            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <label className={labelBase}>Asset Pipeline</label>
                  {(coverPreview || formData.cover_key) && (
                     <button onClick={clearSongCover} className="text-[8px] font-black text-red-500 uppercase flex items-center gap-1 hover:text-red-400 transition-colors">
                        <FaTrashAlt size={8} /> Remove Image
                     </button>
                  )}
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <label className="cursor-pointer group">
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:bg-white/10 transition-all border-dashed border-indigo-500/20">
                       <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                          <FaMusic size={14} />
                       </div>
                       <div className="min-w-0">
                          <p className="text-[9px] font-black text-white uppercase tracking-widest truncate">
                             {audioFile ? audioFile.name : formData.audio_url ? 'File Verified' : 'File Song Audio'}
                          </p>
                          <p className="text-[7px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">MP3/WAV High-Res</p>
                       </div>
                    </div>
                    <input type="file" accept="audio/*" onChange={handleAudioChange} className="hidden" />
                  </label>

                  <label className="cursor-pointer group">
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:bg-white/10 transition-all relative overflow-hidden">
                       {(coverPreview || (formData.cover_key && formData.songCover_url)) ? (
                          <img src={coverPreview || formData.songCover_url} className="absolute inset-0 w-full h-full object-cover opacity-30 transition-transform group-hover:scale-110 duration-700" />
                       ) : null}
                       <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500 z-10">
                          <FaImage size={14} />
                       </div>
                       <div className="min-w-0 z-10">
                          <p className="text-[9px] font-black text-white uppercase tracking-widest truncate">
                             {coverFile ? coverFile.name : "Song Image Artwork"}
                          </p>
                          <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                             { (coverPreview || formData.cover_key) ? 'Custom Song Image' : 'Unique Song Cover' }
                          </p>
                       </div>
                    </div>
                    <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
                  </label>
               </div>
            </div>
          </div>

          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
               <label className={labelBase}>Synchronized Lyrics</label>
               <div className="flex items-center gap-2 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  <FaQuoteLeft size={8} className="text-indigo-400" />
                  <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">Real-time Display</span>
               </div>
            </div>
            <div className="flex-1 relative group">
               <textarea
                  value={formData.lyrics || ''}
                  onChange={(e) => setFormData({...formData, lyrics: e.target.value})}
                  className="w-full h-full min-h-[300px] lg:min-h-0 bg-[#18181b] border border-white/5 rounded-[2rem] p-10 outline-none focus:border-indigo-500/30 transition-all font-medium text-slate-300 text-sm leading-relaxed custom-scrollbar resize-none shadow-inner"
                  placeholder="Paste track lyrics here... Supports standard .LRC timestamp formatting for live synchronization during playback."
               />
            </div>
          </div>

        </div>

        <div className="p-8 pt-0 flex items-center justify-between border-t border-white/5 mt-4">
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                 <FaCheckCircle className="text-emerald-500" size={10} />
                 <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Master Status: <span className="text-white">Secure</span></p>
              </div>
           </div>
           <div className="flex gap-4">
              <button onClick={onClose} disabled={uploading} className="px-8 py-3 rounded-xl bg-white/5 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-white transition-all">Discard</button>
              <button onClick={handleSave} disabled={uploading} className="px-8 py-3 rounded-xl bg-white text-black font-black uppercase text-[10px] tracking-widest hover:bg-indigo-50 active:scale-95 transition-all shadow-2xl disabled:opacity-50 flex items-center gap-3">
                {uploading ? <FaSpinner className="animate-spin" /> : <FaUpload size={10} />}
                {uploading ? 'Processing' : editingSong ? 'Update Song' : 'Upload Song'}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
