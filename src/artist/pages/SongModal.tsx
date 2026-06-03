import React, { useState, useEffect } from "react";
import {
  FaTimes,
  FaMusic,
  FaImage,
  FaChevronDown,
  FaExclamationTriangle,
  FaAlignLeft,
  FaCircleNotch,
} from "react-icons/fa";
import {
  createArtistSong,
  updateArtistSong,
  uploadArtistMedia,
  createArtistAlbum,
  getArtistIdentity,
} from "../artistStudioApi";

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
  lyrics?: string;
  lyrics_url?: string;
  original_key?: string | null;
  cover_key?: string | null;
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
  onAlbumsRefresh?: () => Promise<void>;
  preselectedAlbumId?: string | null;
}

// ─── SENIOR HUMAN WRITTEN LAYOUT CONFIGURATIONS ───────────────────────
const STYLES = {
  overlay: "fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/60 font-sans select-none",
  modalWrapper: "relative bg-[#0a0c16] border border-white/[0.08] w-full max-w-xl flex flex-col rounded-3xl shadow-2xl shadow-black/80 overflow-hidden",
  inputField: "w-full bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white font-medium outline-none transition-all duration-200 focus:border-indigo-500/50 focus:bg-white/[0.04] placeholder-slate-600",
  labelTitle: "text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 ml-1",
  scrollContainer: "flex-1 overflow-y-auto custom-scrollbar px-8 pb-6 space-y-6 max-h-[75vh]",
};

export default function SongModal({
  show,
  editingSong,
  allArtists,
  allAlbums,
  onClose,
  onSave,
  onAlbumsRefresh,
  preselectedAlbumId,
}: SongModalProps) {

  // ─── STATE MANAGEMENT ───────────────────────────────────────────────
  const [formData, setFormData] = useState<Partial<Song>>({
    title: "",
    duration: 0,
    album_id: null,
    audio_url: "",
    songCover_url: "",
    lyrics: "",
  });

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [removeExistingCover, setRemoveExistingCover] = useState(false);
  const [selectedArtistIds, setSelectedArtistIds] = useState<string[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState({ audio: 0 });
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // ─── SYNCHRONIZE MODAL STATES ───────────────────────────────────────
  useEffect(() => {
    if (!show) return;

    setErrorMessage("");
    setRemoveExistingCover(false);
    setAudioFile(null);
    setUploadProgress({ audio: 0 });
    setCoverFile(null);
    setCoverPreview("");

    if (editingSong) {
      setFormData({
        title: editingSong.title,
        duration: editingSong.duration,
        album_id: editingSong.album_id,
        audio_url: editingSong.audio_url,
        songCover_url: editingSong.songCover_url,
        lyrics: editingSong.lyrics || "",
      });
      setSelectedArtistIds(editingSong.artists?.map((a) => a.id) || []);
    } else {
      setFormData({
        title: "",
        duration: 0,
        album_id: preselectedAlbumId || null,
        audio_url: "",
        songCover_url: "",
        lyrics: "",
      });
      setSelectedArtistIds(allArtists.length > 0 ? [allArtists[0].id] : []);
    }
  }, [editingSong, show, preselectedAlbumId, allArtists]);

  // ─── EVENT HANDLERS ─────────────────────────────────────────────────
  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioFile(file);
    if (!formData.title) {
      setFormData((prev) => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, "") }));
    }

    const objectUrl = URL.createObjectURL(file);
    const audio = new Audio(objectUrl);
    audio.addEventListener("loadedmetadata", () => {
      const duration = Math.round(audio.duration);
      if (duration > 0) setFormData((prev) => ({ ...prev, duration }));
      URL.revokeObjectURL(objectUrl);
    });
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setRemoveExistingCover(false);
  };

  const handleSave = async () => {
    setErrorMessage("");
    if (!formData.title || (!editingSong && !audioFile) || !formData.album_id) {
      setErrorMessage("Missing required track metadata (*)");
      return;
    }

    try {
      setUploading(true);
      let audioKey: string | undefined = undefined;
      let coverKey: string | undefined = undefined;

      if (coverFile) {
        const coverResult = await uploadArtistMedia({ file: coverFile, purpose: "album_cover" });
        coverKey = coverResult.key;
      } else if (removeExistingCover) {
        coverKey = null as any;
      }

      if (audioFile) {
        setUploadProgress({ audio: 15 });
        const audioResult = await uploadArtistMedia({ file: audioFile, purpose: "song_audio" });
        audioKey = audioResult.key;
        setUploadProgress({ audio: 90 });
      }

      const activeArtists = allArtists.filter((a) => selectedArtistIds.includes(a.id));
      const artistNameString = activeArtists.map((a) => a.name).join(", ") || allArtists[0]?.name || "Unknown Artist";

      const songPayload = {
        title: formData.title || "",
        duration: Math.max(1, formData.duration || 0),
        album_id: String(formData.album_id || ""),
        artist: artistNameString,
        track_number: editingSong?.track_number || 1,
        original_key: audioKey || editingSong?.original_key || null,
        cover_key: coverKey === undefined ? editingSong?.cover_key || null : coverKey,
        lyrics: formData.lyrics || "",
      };

      if (editingSong) {
        await updateArtistSong(editingSong.id, songPayload);
      } else {
        await createArtistSong(songPayload);
      }

      setUploadProgress({ audio: 100 });
      onSave();
      onClose();
    } catch (error: any) {
      setErrorMessage(error.message || "Network error during upload initialization.");
    } finally {
      setUploading(false);
    }
  };

  if (!show) return null;

  return (
    <div className={STYLES.overlay}>
      <div className={STYLES.modalWrapper}>

        {/* Modal Header */}
        <div className="px-8 pt-7 pb-5 flex justify-between items-center border-b border-white/[0.04] bg-white/[0.01]">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              {editingSong ? "Manage Audio Track" : "Upload New Song"}
            </h3>
            <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">
              EchoPanda Artist Engine
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:text-white transition-all hover:bg-white/[0.08]"
          >
            <FaTimes size={14} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className={STYLES.scrollContainer}>

          {/* Error Message Layout */}
          {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl flex items-center gap-3 mt-4">
              <FaExclamationTriangle className="text-red-400 text-sm shrink-0" />
              <p className="text-red-300 text-xs font-medium leading-tight">{errorMessage}</p>
            </div>
          )}

          {/* Album Cover Canvas & Identification Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-6 items-start pt-4">
            <div className="mx-auto sm:mx-0">
              <div className="relative aspect-square w-36 rounded-2xl overflow-hidden border border-white/[0.08] bg-black/40 group shadow-lg shadow-black/40">
                {coverPreview || formData.songCover_url ? (
                  <img
                    src={coverPreview || formData.songCover_url || ""}
                    alt="Cover preview artwork"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                    <FaImage className="text-slate-600 text-xl mb-2" />
                    <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                      Add Art
                    </span>
                  </div>
                )}

                <label className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-xs">
                  <span className="bg-white text-black px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wide shadow-md">
                    Update Media
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                </label>
              </div>
            </div>

            {/* Title and Release Options */}
            <div className="space-y-4 w-full">
              <div>
                <label className={STYLES.labelTitle}>Song Name *</label>
                <input
                  required
                  value={formData.title || ""}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={STYLES.inputField}
                  placeholder="e.g., Summer Moonlight (Radio Edit)"
                />
              </div>

              <div>
                <label className={STYLES.labelTitle}>Album List *</label>
                <div className="relative">
                  <select
                    value={formData.album_id || ""}
                    onChange={(e) => setFormData({ ...formData, album_id: e.target.value || null })}
                    className={`${STYLES.inputField} appearance-none pr-10 cursor-pointer`}
                  >
                    <option value="" className="bg-[#0a0c16] text-slate-500">Select collection assignment...</option>
                    {allAlbums.map((album) => (
                      <option key={album.id} value={album.id} className="bg-[#0a0c16] text-white">
                        {album.title}
                      </option>
                    ))}
                  </select>
                  <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-[10px] pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Master Media Pipeline Dropper */}
          <div className="space-y-2">
            <label className={STYLES.labelTitle}>Song Audio Source *</label>
            <label className="block cursor-pointer group">
              <div className={`w-full border rounded-2xl p-4 flex items-center gap-4 transition-all duration-200 ${
                audioFile || formData.audio_url
                  ? "bg-indigo-500/10 border-indigo-500/30"
                  : "bg-white/[0.01] border-white/[0.06] hover:bg-white/[0.03] hover:border-white/[0.12]"
              }`}>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                  audioFile || formData.audio_url
                    ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
                    : "bg-white/[0.04] text-slate-400 group-hover:text-slate-200"
                }`}>
                  <FaMusic size={15} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-xs truncate">
                    {audioFile ? audioFile.name : formData.audio_url ? "Static_Audio_Pipeline_Linked.wav" : "Attach Song File"}
                  </p>
                  <p className="text-slate-500 text-[10px] font-medium tracking-wide mt-0.5">
                    Broadcast Grade WAV / FLAC / MP3 Asset
                  </p>
                </div>
                <input type="file" accept="audio/*" onChange={handleAudioChange} className="hidden" />
              </div>
            </label>

            {/* Modern Animated Audio Upload Bar */}
            {uploading && (
              <div className="space-y-1.5 pt-1">
                <div className="h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress.audio}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                  <span>Uploading Content Pipeline</span>
                  <span>{uploadProgress.audio}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Sync Text Editor Layout */}
          <div className="space-y-2">
            <label className={`${STYLES.labelTitle} flex items-center gap-2`}>
              <FaAlignLeft className="text-indigo-400 text-[11px]" /> Verified Song Lyrics
            </label>
            <textarea
              value={formData.lyrics || ""}
              onChange={(e) => setFormData({ ...formData, lyrics: e.target.value })}
              className={`${STYLES.inputField} min-h-[110px] max-h-[180px] custom-scrollbar resize-y text-xs leading-relaxed font-mono`}
              placeholder={"Enter synchronized time timestamps...\n[00:16.80] Then add your lyric tracks here."}
            />
            <p className="text-[10px] text-slate-500 italic font-medium ml-1">
              Supports synchronized .lrc time strings to enable active platform tracking.
            </p>
          </div>

          {/* Artist Collaborators Grid Wrapper */}
          <div className="space-y-2.5">
            <label className={STYLES.labelTitle}>Artist Contributors</label>
            <div className="flex flex-wrap gap-2 max-h-[90px] overflow-y-auto pr-1 custom-scrollbar">
              {allArtists.map((artist) => {
                const isChecked = selectedArtistIds.includes(artist.id);
                return (
                  <label
                    key={artist.id}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all duration-150 cursor-pointer ${
                      isChecked
                        ? "bg-indigo-500/10 border-indigo-500/30 text-white"
                        : "bg-white/[0.01] border-white/[0.06] text-slate-400 hover:bg-white/[0.03] hover:border-white/[0.12]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) =>
                        e.target.checked
                          ? setSelectedArtistIds([...selectedArtistIds, artist.id])
                          : setSelectedArtistIds(selectedArtistIds.filter((id) => id !== artist.id))
                      }
                      className="hidden"
                    />
                    <span>{artist.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Cinematic Control Bar Footer */}
        <div className="px-8 py-5 bg-white/[0.01] border-t border-white/[0.04] flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            disabled={uploading}
            className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors disabled:opacity-30"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={uploading}
            className="px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 active:scale-98 transition-all text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg shadow-indigo-950/50 disabled:opacity-50 disabled:pointer-events-none"
          >
            {uploading ? (
              <>
                <FaCircleNotch className="animate-spin text-sm" />
                <span>Processing Stream Assets...</span>
              </>
            ) : (
              <span>Finalize & Publish Track</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}