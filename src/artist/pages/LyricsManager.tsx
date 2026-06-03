import { useEffect, useMemo, useState } from "react";
import {
  FaFileAlt, FaEdit, FaCheckCircle, FaSpinner, FaDotCircle, FaMusic, FaClock
} from "react-icons/fa";
import {
  getArtistIdentity,
  getOwnedSongs,
  getOwnedAlbums,
  type ArtistIdentity,
  type ArtistSong,
  type ArtistAlbum,
} from "../artistStudioApi";
import SongModal from "./SongModal";

export default function LyricsManager() {
  const [songs, setSongs] = useState<ArtistSong[]>([]);
  const [albums, setAlbums] = useState<ArtistAlbum[]>([]);
  const [loading, setLoading] = useState(true);

  const [showSongModal, setShowSongModal] = useState(false);
  const [editingSong, setEditingSong] = useState<ArtistSong | null>(null);

  const identity = useMemo<ArtistIdentity | null>(() => {
    try { return getArtistIdentity(); } catch { return null; }
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      if (!identity) throw new Error("Artist profile not found.");
      const [ownedSongs, ownedAlbums] = await Promise.all([
        getOwnedSongs(identity),
        getOwnedAlbums(identity),
      ]);
      setSongs(ownedSongs);
      setAlbums(ownedAlbums);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openEditLyrics = (song: ArtistSong) => {
    setEditingSong(song);
    setShowSongModal(true);
  };

  const modalArtists = useMemo(() => {
    if (!identity) return [];
    return [{ id: String(identity.artistId), name: identity.displayName, image_url: "" }];
  }, [identity]);

  const modalAlbums = useMemo(() => {
    return albums.map(a => ({ id: a.id, title: a.title, cover_url: a.coverUrl }));
  }, [albums]);

  const songToModalFormat = (song: ArtistSong | null) => {
    if (!song) return null;
    return {
      id: song.id,
      title: song.title,
      duration: song.duration,
      album_id: song.albumId,
      track_number: song.trackNumber,
      audio_url: song.audioUrl,
      songCover_url: song.coverUrl,
      lyrics: song.lyrics,
      created_at: song.createdAt,
      updated_at: song.createdAt,
      artists: modalArtists,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center py-40 gap-6 text-white">
        <div className="w-16 h-16 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-slate-600 font-bold uppercase tracking-widest text-[10px]">Syncing Sync Library</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white selection:bg-indigo-500/30">
      <div className="max-w-5xl mx-auto px-6 py-12 md:py-20 space-y-12">

        {/* Lyrics Management Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-white/5">
          <div className="space-y-4">
             <div className="flex items-center gap-3 text-indigo-500 font-bold uppercase tracking-[0.4em] text-[10px]">
                <FaFileAlt />
                <span>Text Synchronization</span>
             </div>
             <h1 className="text-5xl font-black tracking-tight text-white">Lyrics.</h1>
             <p className="text-slate-500 text-sm font-medium max-w-lg leading-relaxed">
                Maintain and update synchronized lyrics for your tracks. High-quality transcriptions improve user engagement and searchability.
             </p>
          </div>
        </div>

        {/* Lyrics Track List */}
        <div className="space-y-4">
            {songs.length === 0 ? (
                <div className="py-40 flex flex-col items-center justify-center bg-white/[0.01] rounded-[4rem] border border-white/5 border-dashed">
                    <FaFileAlt className="text-5xl text-slate-800 mb-8" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">No tracks available for sync</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {songs.map((song) => (
                        <div key={song.id} className="group flex items-center justify-between p-6 rounded-[2rem] bg-[#121214] border border-white/5 hover:border-indigo-500/30 transition-all duration-300">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[#0e0e11] border border-white/5 shadow-lg">
                                    {song.coverUrl ? (
                                        <img src={song.coverUrl} className="w-full h-full object-cover" />
                                    ) : <FaMusic className="w-full h-full p-4 text-slate-800" />}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-lg font-bold text-white truncate group-hover:text-indigo-400 transition-colors">{song.title}</h3>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${song.lyrics ? 'bg-green-500/10 text-green-500' : 'bg-white/5 text-slate-600'}`}>
                                            {song.lyrics ? 'Lyrics Ready' : 'Empty'}
                                        </span>
                                        <div className="w-1 h-1 rounded-full bg-slate-800" />
                                        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{song.albumTitle}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => openEditLyrics(song)}
                                className="h-11 px-8 rounded-xl bg-white/5 hover:bg-white text-slate-400 hover:text-black font-black text-[9px] uppercase tracking-[0.2em] transition-all flex items-center gap-3 active:scale-95"
                            >
                                <FaEdit />
                                {song.lyrics ? 'Edit Transcription' : 'Add Lyrics'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>

      <SongModal
        show={showSongModal}
        editingSong={songToModalFormat(editingSong) as any}
        allArtists={modalArtists}
        allAlbums={modalAlbums}
        onClose={() => {
          setShowSongModal(false);
          setEditingSong(null);
        }}
        onSave={async () => {
          setShowSongModal(false);
          setEditingSong(null);
          await loadData();
        }}
        onAlbumsRefresh={loadData}
      />
    </div>
  );
}
