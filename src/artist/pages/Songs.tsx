import { useEffect, useMemo, useState } from "react";
import { FaEdit, FaFileUpload, FaMusic, FaSave, FaTrash, FaUpload } from "react-icons/fa";
import {
  createArtistSong,
  deleteArtistSong,
  getArtistIdentity,
  getOwnedAlbums,
  getOwnedSongs,
  updateArtistSong,
  uploadArtistMedia,
  type ArtistIdentity,
  type ArtistAlbum,
  type ArtistSong,
} from "../artistStudioApi";

interface SongFormState {
  title: string;
  duration: number;
  albumId: string;
  trackNumber: number;
  lyrics: string;
  lyricsUrl: string;
  audioUrl: string;
}

const EMPTY_FORM: SongFormState = {
  title: "",
  duration: 180,
  albumId: "",
  trackNumber: 1,
  lyrics: "",
  lyricsUrl: "",
  audioUrl: "",
};

const DRAFT_KEY = "artist_song_form_draft";

export default function SongsManager() {
  const [songs, setSongs] = useState<ArtistSong[]>([]);
  const [albums, setAlbums] = useState<ArtistAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadAlbumId, setUploadAlbumId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState("Idle");

  const [editingSongId, setEditingSongId] = useState<string>("");
  const [form, setForm] = useState<SongFormState>(EMPTY_FORM);

  const identity = useMemo<ArtistIdentity | null>(() => {
    try {
      return getArtistIdentity();
    } catch {
      return null;
    }
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      if (!identity) {
        throw new Error("Missing artist_id in session. Please sign in again.");
      }

      const [ownedSongs, ownedAlbums] = await Promise.all([
        getOwnedSongs(identity),
        getOwnedAlbums(identity),
      ]);

      setSongs(ownedSongs);
      setAlbums(ownedAlbums);
    } catch (loadError) {
      console.error(loadError);
      setError(loadError instanceof Error ? loadError.message : "Failed to load songs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as SongFormState;
        setForm({ ...EMPTY_FORM, ...parsed });
      }
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  const handleUploadSong = async () => {
    if (!uploadFile) {
      setError("Select an audio file before upload.");
      return;
    }

    if (!uploadAlbumId) {
      setError("Select an album before uploading a song.");
      return;
    }

    if (!identity) {
      setError("Missing artist_id in session. Please sign in again.");
      return;
    }

    try {
      setUploading(true);
      setError("");
      setUploadProgress(10);
      setUploadPhase("Uploading");

      const progressTimer = window.setInterval(() => {
        setUploadProgress((current) => Math.min(current + 8, 75));
      }, 250);

      const uploaded = await uploadArtistMedia({
        file: uploadFile,
        purpose: "song_audio",
      });

      await createArtistSong({
        title: uploadTitle || uploadFile.name,
        duration: 180,
        album_id: uploadAlbumId,
        artist: identity.displayName,
        track_number: 1,
        original_key: uploaded.key,
        cover_key: undefined,
        preview_key: undefined,
        lyrics: "",
        lyrics_url: undefined,
      });

      window.clearInterval(progressTimer);
      setUploadPhase("Processing");
      setUploadProgress(85);
      window.setTimeout(() => {
        setUploadPhase("Converting");
        setUploadProgress(95);
      }, 250);
      window.setTimeout(() => {
        setUploadPhase("Published");
        setUploadProgress(100);
      }, 500);

      setUploadFile(null);
      setUploadTitle("");
      setUploadAlbumId("");
      await loadData();
    } catch (uploadError) {
      console.error(uploadError);
      setError(uploadError instanceof Error ? uploadError.message : "Failed to upload song");
      setUploadPhase("Failed");
    } finally {
      setUploading(false);
    }
  };

  const beginEdit = (song: ArtistSong) => {
    setEditingSongId(song.id);
    setForm({
      title: song.title,
      duration: song.duration || 180,
      albumId: song.albumId || "",
      trackNumber: song.trackNumber || 1,
      lyrics: song.lyrics || "",
      lyricsUrl: "",
        audioUrl: song.audioUrl || "",
    });
  };

  const saveDraftForm = () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
  };

  const importLrcFile = async (file: File) => {
    const content = await file.text();
    setForm((current) => ({
      ...current,
      lyrics: content,
      lyricsUrl: file.name,
    }));
  };

  const saveSongMetadata = async () => {
    if (!editingSongId) {
      return;
    }

    if (!form.title.trim() || !form.albumId) {
      setError("Title and album are required.");
      return;
    }

    if (!identity) {
      setError("Missing artist_id in session. Please sign in again.");
      return;
    }

    try {
      setError("");
      await updateArtistSong(editingSongId, {
        title: form.title.trim(),
        duration: Math.max(1, Math.floor(form.duration)),
        album_id: form.albumId,
        artist: identity.displayName,
        track_number: Math.max(1, Math.floor(form.trackNumber)),
        original_key: form.audioUrl || undefined,
        lyrics: form.lyrics || undefined,
        lyrics_url: form.lyricsUrl || undefined,
      });

      setEditingSongId("");
      setForm(EMPTY_FORM);
      localStorage.removeItem(DRAFT_KEY);
      await loadData();
    } catch (saveError) {
      console.error(saveError);
      setError(saveError instanceof Error ? saveError.message : "Failed to update song");
    }
  };

  const createSongManually = async () => {
    if (!form.title.trim() || !form.albumId) {
      setError("Title and album are required.");
      return;
    }

    if (!identity) {
      setError("Missing artist_id in session. Please sign in again.");
      return;
    }

    try {
      setError("");
      await createArtistSong({
        title: form.title.trim(),
        duration: Math.max(1, Math.floor(form.duration)),
        album_id: form.albumId,
        artist: identity.displayName,
        track_number: Math.max(1, Math.floor(form.trackNumber)),
        original_key: form.audioUrl || undefined,
        lyrics: form.lyrics || undefined,
        lyrics_url: form.lyricsUrl || undefined,
      });
      setForm(EMPTY_FORM);
      localStorage.removeItem(DRAFT_KEY);
      await loadData();
    } catch (createError) {
      console.error(createError);
      setError(createError instanceof Error ? createError.message : "Failed to create song metadata");
    }
  };

  const removeSong = async (song: ArtistSong) => {
    const confirmed = window.confirm(`Delete song: ${song.title}?`);
    if (!confirmed) {
      return;
    }

    try {
      await deleteArtistSong(song.id);
      await loadData();
    } catch (deleteError) {
      console.error(deleteError);
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete song");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-6 md:p-10 text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-black">Songs Studio</h1>
          <p className="text-slate-300 mt-2">
            Upload songs, edit metadata, import synced lyrics (.lrc), and manage only your own tracks.
          </p>
        </div>

        {error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">{error}</div>}

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
          <h2 className="text-2xl font-black flex items-center gap-2">
            <FaUpload /> Upload Song File
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="text"
              value={uploadTitle}
              onChange={(event) => setUploadTitle(event.target.value)}
              placeholder="Song title (optional)"
              className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3"
            />
            <select
              value={uploadAlbumId}
              onChange={(event) => setUploadAlbumId(event.target.value)}
              className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3"
            >
              <option value="">No album</option>
              {albums.map((album) => (
                <option key={album.id} value={album.id}>
                  {album.title}
                </option>
              ))}
            </select>
            <label className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 cursor-pointer">
              Select audio file
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
              />
            </label>
            <button
              disabled={uploading}
              onClick={handleUploadSong}
              className="rounded-xl border border-purple-400/40 bg-purple-500/10 px-4 py-3 font-semibold"
            >
              Upload
            </button>
          </div>
          {uploadFile && <p className="text-xs text-slate-300">Selected: {uploadFile.name}</p>}
          {(uploading || uploadProgress > 0) && (
            <div className="space-y-2">
              <div className="h-2 w-full rounded-full bg-slate-800">
                <div className="h-2 rounded-full bg-purple-500 transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
              <p className="text-xs text-slate-300">
                {uploadPhase} {uploadProgress}%
              </p>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
          <h2 className="text-2xl font-black flex items-center gap-2">
            <FaEdit /> {editingSongId ? "Edit Song Metadata" : "Create Song Metadata"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Song title"
              className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3"
            />
            <select
              value={form.albumId}
              onChange={(event) => setForm((current) => ({ ...current, albumId: event.target.value }))}
              className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3"
            >
              <option value="">Select album</option>
              {albums.map((album) => (
                <option key={album.id} value={album.id}>
                  {album.title}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={form.duration}
              onChange={(event) => setForm((current) => ({ ...current, duration: Number(event.target.value || 0) }))}
              placeholder="Duration (seconds)"
              className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3"
            />
            <input
              type="number"
              min={1}
              value={form.trackNumber}
              onChange={(event) => setForm((current) => ({ ...current, trackNumber: Number(event.target.value || 1) }))}
              placeholder="Track number"
              className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3"
            />
            <input
              value={form.audioUrl}
              onChange={(event) => setForm((current) => ({ ...current, audioUrl: event.target.value }))}
              placeholder="Audio URL (optional)"
              className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 md:col-span-2"
            />
          </div>

          <textarea
            value={form.lyrics}
            onChange={(event) => setForm((current) => ({ ...current, lyrics: event.target.value }))}
            rows={7}
            placeholder="Paste lyrics or synced .lrc content"
            className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3"
          />

          <div className="flex flex-wrap gap-3">
            <label className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 cursor-pointer">
              <FaFileUpload className="inline mr-2" /> Import .lrc file
              <input
                type="file"
                accept=".lrc,text/plain"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    await importLrcFile(file);
                  }
                }}
              />
            </label>
            <button onClick={saveDraftForm} className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5">
              <FaSave className="inline mr-2" /> Save Draft Form
            </button>
            {editingSongId ? (
              <button
                onClick={saveSongMetadata}
                className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-2.5"
              >
                Save Metadata
              </button>
            ) : (
              <button
                onClick={createSongManually}
                className="rounded-xl border border-purple-400/40 bg-purple-500/10 px-4 py-2.5"
              >
                Create Metadata
              </button>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-black flex items-center gap-2">
            <FaMusic /> Your Songs
          </h2>
          {loading ? (
            <p className="mt-4 text-slate-300">Loading songs...</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="py-3">Title</th>
                    <th className="py-3">Album</th>
                    <th className="py-3">Processing</th>
                    <th className="py-3">Plays</th>
                    <th className="py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {songs.map((song) => (
                    <tr key={song.id} className="border-b border-white/5">
                      <td className="py-3 text-white font-semibold">{song.title}</td>
                      <td className="py-3 text-slate-300">{song.albumTitle}</td>
                      <td className="py-3">
                        <span className="rounded-full px-3 py-1 text-xs font-semibold bg-white/10 text-slate-200 uppercase">
                          {song.processingStatus}
                        </span>
                      </td>
                      <td className="py-3 text-purple-200 font-semibold">{song.playCount.toLocaleString()}</td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => beginEdit(song)}
                            className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold"
                          >
                            <FaEdit className="inline mr-1" /> Edit
                          </button>
                          <button
                            onClick={() => removeSong(song)}
                            className="rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold"
                          >
                            <FaTrash className="inline mr-1" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loading && songs.length === 0 && <p className="py-6 text-slate-400">No songs available in your artist catalog yet.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
