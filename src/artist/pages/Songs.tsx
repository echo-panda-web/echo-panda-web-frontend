import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FaPlus, FaMusic, FaPlay, FaEdit, FaTrash, FaSpinner, FaDotCircle, FaClock, FaChartBar, FaSearch, FaFilter
} from "react-icons/fa";
import { useAudioPlayer } from "../../contexts/AudioPlayerContext";
import {
  getArtistIdentity,
  getOwnedSongs,
  getOwnedAlbums,
  deleteArtistSong,
  type ArtistIdentity,
  type ArtistSong,
  type ArtistAlbum,
} from "../artistStudioApi";
import SongModal from "./SongModal";

export default function SongsManager() {
  const { playSong } = useAudioPlayer();
  const [searchParams, setSearchParams] = useSearchParams();
  const [songs, setSongs] = useState<ArtistSong[]>([]);
  const [albums, setAlbums] = useState<ArtistAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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

  useEffect(() => {
    if (searchParams.get("action") === "upload") {
      setShowSongModal(true);
    }
  }, [searchParams]);

  const handleDelete = async (songId: string) => {
    if (!window.confirm("Permanently delete this track?")) return;
    try {
      await deleteArtistSong(songId);
      await loadData();
    } catch (err) {
      alert("Failed to delete track");
    }
  };

  const openEditSong = (song: ArtistSong) => {
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
      cover_key: song.coverKey,
      original_key: song.originalKey,
      lyrics: song.lyrics,
      category_id: song.category_id,
      mood: song.mood,
      song_type: song.song_type,
      bpm: song.bpm,
      is_explicit: song.is_explicit,
      featured_artists: song.featured_artists,
      created_at: song.createdAt,
      updated_at: song.createdAt,
      artists: modalArtists,
    };
  };

  const filteredSongs = useMemo(() => {
    if (!searchTerm) return songs;
    const lower = searchTerm.toLowerCase();
    return songs.filter(s =>
      s.title.toLowerCase().includes(lower) ||
      s.albumTitle.toLowerCase().includes(lower)
    );
  }, [songs, searchTerm]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center py-40 gap-6 text-white">
        <div className="w-16 h-16 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-slate-600 font-bold uppercase tracking-widest text-[10px]">Accessing Library</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white selection:bg-indigo-500/30">
      <div className="max-w-6xl mx-auto px-6 py-12 md:py-12 space-y-10">

        {/* Tracks Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/5">
          <div className="space-y-3">
             <div className="flex items-center gap-3 text-indigo-500 font-bold uppercase tracking-[0.4em] text-[9px]">
                <FaDotCircle className="animate-pulse" />
                <span>Production Environment</span>
             </div>
             <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">Song Management.</h1>
             <p className="text-slate-500 text-sm font-medium max-w-lg leading-relaxed">
                Manage your entire master recording library. Control metadata, monitor streams, and maintain synchronization.
             </p>
          </div>
          <button
              onClick={() => setShowSongModal(true)}
              className="h-12 px-8 rounded-xl bg-white text-black font-black transition-all hover:bg-indigo-50 active:scale-95 flex items-center gap-3 shadow-2xl text-[10px] uppercase tracking-widest"
          >
              <FaPlus size={10} />
              New Master
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
            <div className="relative flex-1 group">
                <FaSearch size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
                <input
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search by title or album..."
                    className="w-full bg-[#121214] border border-white/5 rounded-xl pl-12 pr-5 py-3.5 outline-none focus:border-indigo-500/30 transition-all font-medium text-slate-300 text-sm"
                />
            </div>
            <button className="h-12 px-6 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3 text-slate-400 font-bold hover:text-white transition-all text-[10px] uppercase tracking-widest">
                <FaFilter size={12} /> Filter
            </button>
        </div>

        {/* Tracks List */}
        <div className="space-y-2">
            {filteredSongs.length === 0 ? (
                <div className="py-24 flex flex-col items-center justify-center bg-white/[0.01] rounded-[3rem] border border-white/5 border-dashed">
                    <FaMusic className="text-4xl text-slate-800 mb-6" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Empty Library</p>
                </div>
            ) : (
                filteredSongs.map((song, index) => {
                    const albumCover = albums.find(a => a.id === song.albumId)?.coverUrl;
                    return (
                        <div key={song.id} className="group grid grid-cols-12 items-center gap-4 p-4 rounded-2xl bg-[#121214]/50 border border-transparent hover:border-white/10 hover:bg-[#121214] transition-all duration-300">
                            <div className="col-span-1 text-center text-slate-800 font-bold text-xs group-hover:text-indigo-500 transition-colors">
                                {(index + 1).toString().padStart(2, '0')}
                            </div>
                            <div className="col-span-4 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-[#0e0e11] border border-white/5 shadow-lg">
                                    {song.coverUrl || albumCover ? (
                                        <img src={song.coverUrl || albumCover} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    ) : <FaMusic className="w-full h-full p-4 text-slate-800" />}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-base font-bold text-white truncate group-hover:text-indigo-400 transition-colors tracking-tight">{song.title}</h3>
                                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-0.5 truncate">{song.artist}</p>
                                </div>
                            </div>
                            <div className="col-span-2 text-xs font-bold text-slate-500 truncate">
                                {song.albumTitle}
                            </div>
                            <div className="col-span-1 text-[10px] font-bold text-slate-600 flex items-center gap-2">
                                <FaClock className="opacity-20" size={9} />
                                {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                            </div>
                            <div className="col-span-1 text-[10px] font-bold text-slate-600 flex items-center gap-2">
                                <FaChartBar className="opacity-20" size={9} />
                                {song.playCount.toLocaleString()}
                            </div>
                            <div className="col-span-1">
                                <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest border ${song.processingStatus === 'ready' ? 'bg-green-500/10 text-green-500 border-green-500/10' : 'bg-amber-500/10 text-amber-400 border-amber-500/10'}`}>
                                    {song.processingStatus}
                                </span>
                            </div>
                            <div className="col-span-2 flex items-center justify-end gap-2">
                                <button onClick={() => playSong({ id: song.id, title: song.title, artist: song.artist, coverUrl: song.coverUrl || albumCover || '', audioUrl: song.audioUrl, duration: song.duration })} className="w-10 h-10 flex items-center justify-center rounded-lg bg-white text-black hover:bg-indigo-50 active:scale-90 transition-all shadow-lg"><FaPlay size={10} className="ml-0.5" /></button>
                                <button onClick={() => openEditSong(song)} className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 text-slate-500 hover:text-white transition-all"><FaEdit size={12} /></button>
                                <button onClick={() => handleDelete(song.id)} className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 text-slate-500 hover:text-red-400 transition-all"><FaTrash size={12} /></button>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
      </div>

      <SongModal
        show={showSongModal}
        editingSong={songToModalFormat(editingSong) as any}
        allArtists={modalArtists}
        allAlbums={modalAlbums}
        onClose={() => { setShowSongModal(false); setEditingSong(null); }}
        onSave={async () => { setShowSongModal(false); setEditingSong(null); await loadData(); }}
        onAlbumsRefresh={loadData}
      />
    </div>
  );
}
