import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaPlay, FaRandom, FaMusic, FaTrash, FaList, FaPlus, FaMagic } from 'react-icons/fa';
import { Music, Clock, User } from 'lucide-react';
import AppFooter from '../components/AppFooter';
import Song from '../components/Song';
import {
  getUserPlaylists,
  createPlaylist,
  deletePlaylist as deletePlaylistService,
  getPlaylistSongs,
  removeSongFromPlaylist,
  updatePlaylist,
  uploadPlaylistCover,
  type Playlist,
} from '../backend/playlistsService';
import { trackSongPlay } from '../backend/playTrackingService';
import { useAudioPlayer } from '../contexts/AudioPlayerContextCore';
import { useTheme } from '../contexts/ThemeContext';
import { uploadMediaDirectly } from '../backend/directUpload';

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface SongData {
  id: string;
  title: string;
  duration: number;
  album_id: string | null;
  audio_url: string | null;
  songCover_url: string | null;
  created_at: string;
  added_at?: string;
  artists?: Artist[];
  album?: Album;
  original_key: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.ceil(Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

// ─── PlaylistHero ─────────────────────────────────────────────────────────────

interface PlaylistHeroProps {
  title: string;
  description?: string;
  imageUrl?: string;
  songCount: number;
  duration: string;
  canEditImage?: boolean;
  isUploadingImage?: boolean;
  onEdit?: () => void;
  onImageSelect?: (file: File) => void;
}

const PlaylistHero: React.FC<PlaylistHeroProps> = ({
  title,
  description,
  imageUrl,
  songCount,
  duration,
  canEditImage = false,
  isUploadingImage = false,
  onEdit,
  onImageSelect,
}) => {
  const { isLightMode } = useTheme();

  return (
    <header
      className={`relative px-4 sm:px-8 pt-10 pb-10 overflow-hidden transition-all duration-700 rounded-3xl border group/hero ${isLightMode ? "border-gray-200 bg-linear-to-b from-blue-50 to-white shadow-sm" : "border-white/5 bg-linear-to-b from-[#222]/40 to-transparent"}`}
    >
      {/* Background elements */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${isLightMode ? "bg-white/40" : "bg-black/20"}`} />

      <div className="flex flex-col md:flex-row items-center md:items-end gap-8 relative z-10">
        {/* Cover Art - Large Spotify Style */}
        <label
          className={`relative group/cover w-48 h-48 md:w-60 md:h-60 rounded-xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.5)] transition-transform duration-500 shrink-0 ${canEditImage ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="file"
            className="hidden"
            accept="image/*"
            disabled={!canEditImage || isUploadingImage}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImageSelect?.(file);
              e.target.value = '';
            }}
          />
          {imageUrl ? (
            <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${isLightMode ? 'bg-zinc-200' : 'bg-zinc-800'}`}>
              <Music className={`${isLightMode ? "text-zinc-400" : "text-zinc-600"} w-24 h-24`} />
            </div>
          )}
          {canEditImage && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
              <span className="text-white text-xs font-black uppercase tracking-widest border border-white/40 px-4 py-2 rounded-full">
                {isUploadingImage ? 'Uploading...' : 'Change Cover'}
              </span>
            </div>
          )}
        </label>

        {/* Info Block */}
        <div
          onClick={onEdit}
          className={`flex flex-col gap-4 text-center md:text-left flex-1 min-w-0 ${onEdit ? 'cursor-pointer' : ''}`}
        >
          <div className="hidden md:flex items-center gap-2">
             <span className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-500">
                Playlist
             </span>
          </div>

          <h1 className={`text-4xl md:text-7xl lg:text-8xl font-black ${isLightMode ? "text-gray-900" : "text-white"} tracking-tighter truncate leading-none pb-2`}>
            {title}
          </h1>

          {description && (
            <p className={`text-sm md:text-base font-medium ${isLightMode ? "text-gray-500" : "text-zinc-400"} line-clamp-2 max-w-3xl`}>
              {description}
            </p>
          )}

          <div className={`flex flex-wrap justify-center md:justify-start items-center gap-1 text-[13px] font-bold ${isLightMode ? "text-gray-600" : "text-white/80"}`}>
            <span className="hover:underline cursor-pointer">EchoPanda</span>
            <span className="mx-1">•</span>
            <span>{songCount} {songCount === 1 ? 'song' : 'songs'}</span>
            <span className="mx-1 text-zinc-500 font-normal">,</span>
            <span className={isLightMode ? "text-gray-400 font-normal" : "text-zinc-500 font-normal"}>{duration}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

// ─── Main Page Component ──────────────────────────────────────────────────────

const PlaylistPage: React.FC = () => {
  const { playSong } = useAudioPlayer();
  const { isLightMode } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlPlaylistId = searchParams.get('id');

  // State Modules
  const [songs, setSongs] = useState<SongData[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(urlPlaylistId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
  const [uploadedCoverUrl, setUploadedCoverUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingHeroCover, setIsUploadingHeroCover] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [playlistsLoading, setPlaylistsLoading] = useState(true);

  useEffect(() => {
    loadPlaylists();
  }, []);

  useEffect(() => {
    if (urlPlaylistId) {
      setSelectedPlaylistId(urlPlaylistId);
    }
  }, [urlPlaylistId]);

  useEffect(() => {
    if (selectedPlaylistId) {
      loadPlaylistSongs(selectedPlaylistId);
      // Sync URL if changed via UI click
      if (urlPlaylistId !== selectedPlaylistId) {
        setSearchParams({ id: selectedPlaylistId }, { replace: true });
      }
    } else {
      setSongs([]);
    }
  }, [selectedPlaylistId]);

  const loadPlaylists = async () => {
    try {
      setPlaylistsLoading(true);
      const data = await getUserPlaylists();
      setPlaylists(data);
    } catch (error) {
      console.error('Error loading playlists:', error);
    } finally {
      setPlaylistsLoading(false);
    }
  };

  const loadPlaylistSongs = async (playlistId: string) => {
    try {
      setLoading(true);
      const data = await getPlaylistSongs(playlistId);
      setSongs(data);
    } catch (error) {
      console.error('Error loading playlist songs:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncPlaylistImage = (playlistId: string, imageUrl?: string) => {
    setPlaylists((prev) =>
      prev.map((playlist) =>
        playlist.id === playlistId
          ? { ...playlist, image_url: imageUrl }
          : playlist
      )
    );
  };

  const saveCoverForPlaylist = async (
    playlistId: string,
    file: File,
    name: string,
    description?: string
  ) => {
    try {
      return await uploadPlaylistCover(playlistId, file);
    } catch {
      const uploaded = await uploadMediaDirectly(file, 'playlist_cover');
      return await updatePlaylist(
        playlistId,
        name,
        description,
        uploaded.key || uploaded.url
      );
    }
  };

  const handleModalImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPendingCoverFile(file);
    setUploadedCoverUrl(null);
    setCoverPreview(URL.createObjectURL(file));
    setSaveError(null);

    if (!editingPlaylistId) {
      try {
        setIsUploading(true);
        const uploaded = await uploadMediaDirectly(file, 'playlist_cover');
        setUploadedCoverUrl(uploaded.url);
      } catch (error) {
        console.warn('Cover pre-upload failed; will retry after playlist is saved.', error);
      } finally {
        setIsUploading(false);
      }
      return;
    }

    try {
      setIsUploading(true);
      const updated = await saveCoverForPlaylist(
        editingPlaylistId,
        file,
        newPlaylistName.trim() || 'My Playlist',
        newPlaylistDescription
      );
      if (updated.image_url) {
        setCoverPreview(updated.image_url);
      }
      syncPlaylistImage(editingPlaylistId, updated.image_url);
      setPendingCoverFile(null);
    } catch (error) {
      console.error('Failed to update playlist cover:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to update cover image');
    } finally {
      setIsUploading(false);
    }
  };

  const resetModalForm = () => {
    setNewPlaylistName('');
    setNewPlaylistDescription('');
    setCoverPreview(null);
    setPendingCoverFile(null);
    setUploadedCoverUrl(null);
    setEditingPlaylistId(null);
    setSaveError(null);
  };

  const handleSavePlaylist = async () => {
    if (!newPlaylistName.trim()) return;

    try {
      setIsUploading(true);
      setSaveError(null);

      if (editingPlaylistId) {
        await updatePlaylist(editingPlaylistId, newPlaylistName.trim(), newPlaylistDescription);

        if (pendingCoverFile) {
          const updated = await saveCoverForPlaylist(
            editingPlaylistId,
            pendingCoverFile,
            newPlaylistName.trim(),
            newPlaylistDescription
          );
          syncPlaylistImage(editingPlaylistId, updated.image_url);
          setPendingCoverFile(null);
        }
      } else {
        const created = await createPlaylist(
          newPlaylistName.trim(),
          newPlaylistDescription,
          uploadedCoverUrl || undefined
        );

        if (pendingCoverFile && !uploadedCoverUrl) {
          const updated = await saveCoverForPlaylist(
            created.id,
            pendingCoverFile,
            newPlaylistName.trim(),
            newPlaylistDescription
          );
          syncPlaylistImage(created.id, updated.image_url);
        }
      }

      resetModalForm();
      setIsModalOpen(false);
      await loadPlaylists();
    } catch (error) {
      console.error('Failed to save playlist:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save playlist');
    } finally {
      setIsUploading(false);
    }
  };

  const handleHeroCoverSelect = async (file: File) => {
    if (!selectedPlaylistId) return;

    const playlist = playlists.find((p) => p.id === selectedPlaylistId);
    if (!playlist) return;

    try {
      setIsUploadingHeroCover(true);
      setSaveError(null);
      const updated = await saveCoverForPlaylist(
        selectedPlaylistId,
        file,
        playlist.name,
        playlist.description
      );
      syncPlaylistImage(selectedPlaylistId, updated.image_url);
    } catch (error) {
      console.error('Failed to upload playlist cover:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to upload cover image');
    } finally {
      setIsUploadingHeroCover(false);
    }
  };

  const openCreateModal = () => {
    resetModalForm();
    setIsModalOpen(true);
  };

  const openEditModal = (playlist: Playlist) => {
    setEditingPlaylistId(playlist.id);
    setNewPlaylistName(playlist.name);
    setNewPlaylistDescription(playlist.description || '');
    setCoverPreview(playlist.image_url || null);
    setPendingCoverFile(null);
    setUploadedCoverUrl(null);
    setSaveError(null);
    setIsModalOpen(true);
  };

  const handleRemoveFromPlaylist = async (songId: string) => {
    if (!selectedPlaylistId) return;
    try {
      await removeSongFromPlaylist(selectedPlaylistId, songId);
      setSongs((prev) => prev.filter((song) => song.id !== songId));
      await loadPlaylists(); // Update counts
    } catch (error) {
      console.error('Failed to isolate track element:', error);
    }
  };

  const handleDeletePlaylist = async (id: string) => {
    const playlist = playlists.find((p) => p.id === id);
    if (!playlist) return;
    if (!confirm(`Permanently remove "${playlist.name}"?`)) return;

    try {
      await deletePlaylistService(id);
      await loadPlaylists();
      if (selectedPlaylistId === id) {
        setSelectedPlaylistId(null);
        setSongs([]);
      }
    } catch (error) {
      console.error('Delete operation failed:', error);
    }
  };

  const toPlayerSong = (song: SongData) => ({
    id: song.id,
    title: song.title,
    artist: song.artists?.map((a) => a.name).join(', ') || 'Various Artists',
    coverUrl: song.songCover_url || song.album?.cover_url || '',
    audioUrl: song.original_key || song.audio_url || '',
    duration: song.duration,
  });

  const handlePlay = async (songId: string) => {
    try {
      await trackSongPlay(songId);
      const queue = songs.map(toPlayerSong);
      const song = queue.find((s) => s.id === songId);
      if (song) {
        playSong(song, { queue });
      }
    } catch (error) {
      console.error('Playback Error:', error);
    }
  };

  const totalDuration = songs.reduce((sum, song) => sum + (song.duration || 0), 0);

  return (
    <div className={`w-full max-w-full space-y-8 pb-24 ${isLightMode ? "text-gray-900" : "text-white"}`}>

      {/* ── Header / Hero Frame ── */}
      <PlaylistHero
        title={playlists.find(p => p.id === selectedPlaylistId)?.name || 'Your Library'}
        description={playlists.find(p => p.id === selectedPlaylistId)?.description}
        imageUrl={playlists.find(p => p.id === selectedPlaylistId)?.image_url}
        songCount={songs.length}
        duration={`${Math.floor(totalDuration / 60)} min`}
        canEditImage={!!selectedPlaylistId}
        isUploadingImage={isUploadingHeroCover}
        onImageSelect={handleHeroCoverSelect}
        onEdit={() => {
          const p = playlists.find(p => p.id === selectedPlaylistId);
          if (p) openEditModal(p);
        }}
      />

      {saveError && (
        <div className="mx-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium">
          {saveError}
        </div>
      )}

      <main className="w-full space-y-10">

        {/* ── PERSONAL ARCHIVE SECTIONS ── */}
        <section className="space-y-6 pt-12">
            <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <h3 className={`text-xl font-black ${isLightMode ? "text-gray-900" : "text-white"} tracking-tight`}>Your Other Collections</h3>
                </div>
            </div>

            <div className="flex gap-6 overflow-x-auto pb-8 custom-scrollbar px-4">
                {/* Manual Creation Card Button */}
                <button
                    onClick={openCreateModal}
                    className={`shrink-0 w-48 h-64 rounded-xl ${isLightMode ? "bg-zinc-100 border-zinc-200" : "bg-white/[0.03] border-white/5"} border border-dashed hover:border-green-500/50 hover:bg-green-500/5 transition-all group flex flex-col items-center justify-center gap-4`}
                >
                    <div className={`w-14 h-14 rounded-full ${isLightMode ? "bg-white" : "bg-zinc-800"} flex items-center justify-center group-hover:scale-110 group-hover:bg-green-500 transition-all duration-300 shadow-lg`}>
                        <FaPlus size={18} className={`${isLightMode ? "text-zinc-400" : "text-zinc-500"} group-hover:text-black`} />
                    </div>
                    <span className={`text-sm font-bold ${isLightMode ? "text-zinc-500" : "text-zinc-400"} group-hover:text-green-500`}>Create New</span>
                </button>

                {/* Playlist Collection Row Cards */}
                {playlists.map((p) => {
                    const isAiStored = (p as any).isAi;
                    const isActive = selectedPlaylistId === p.id;

                    return (
                        <div
                          key={p.id}
                          onClick={() => {setSelectedPlaylistId(p.id);}}
                          className={`group shrink-0 w-48 h-64 rounded-xl p-4 cursor-pointer transition-all duration-300 relative flex flex-col ${isActive ? (isLightMode ? 'bg-zinc-200 shadow-lg' : 'bg-zinc-800 shadow-xl') : (isLightMode ? 'bg-zinc-50 hover:bg-zinc-100' : 'bg-zinc-900/40 hover:bg-zinc-800/60')} border ${isActive ? (isLightMode ? 'border-zinc-300' : 'border-white/10') : 'border-transparent'}`}
                        >
                            <div className="relative aspect-square w-full rounded-lg overflow-hidden mb-4 shadow-lg shadow-black/20">
                                {p.image_url ? (
                                    <img src={p.image_url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                ) : (
                                    <div className={`w-full h-full flex items-center justify-center ${isLightMode ? 'bg-zinc-200' : 'bg-zinc-800'}`}>
                                        {isAiStored ? <FaMagic size={32} className="text-purple-400" /> : <FaMusic size={32} className={isLightMode ? "text-zinc-400" : "text-zinc-600"} />}
                                    </div>
                                )}

                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeletePlaylist(p.id); }}
                                    className={`absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 p-2 bg-black/60 text-white hover:bg-red-500 rounded-full transition-all scale-90`}
                                >
                                    <FaTrash size={10} />
                                </button>

                                {isActive && (
                                    <div className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shadow-lg animate-in zoom-in duration-300">
                                        <FaPlay size={14} className="text-black ml-0.5" />
                                    </div>
                                )}
                            </div>

                            <div className="relative z-10 min-w-0">
                                <h4 className={`font-bold ${isLightMode ? "text-gray-900" : "text-white"} text-[15px] truncate mb-1`}>{p.name}</h4>
                                <p className={`text-xs font-medium ${isLightMode ? "text-gray-500" : "text-zinc-500"} truncate`}>
                                    Playlist • {p.song_count} {p.song_count === 1 ? 'song' : 'songs'}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>

        {/* ── TRACK LIST VIEWPORT SEQUENCE ── */}
        {songs.length > 0 ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Spotify Play/Actions Bar */}
                <div className="flex items-center gap-8 px-4">
                    <button
                        onClick={() => handlePlay(songs[0].id)}
                        className="w-14 h-14 rounded-full flex items-center justify-center text-black shadow-lg transition-all hover:scale-105 active:scale-95 bg-green-500 hover:bg-green-400"
                    >
                        <FaPlay size={20} className="ml-1" />
                    </button>

                    <div className="flex items-center gap-6">
                        <FaRandom size={22} className={`${isLightMode ? "text-gray-400 hover:text-black" : "text-zinc-500 hover:text-white"} cursor-pointer transition-colors`} />
                        <FaList size={20} className={`${isLightMode ? "text-gray-400 hover:text-black" : "text-zinc-500 hover:text-white"} cursor-pointer transition-colors`} />
                    </div>
                </div>

                <div className="w-full">
                    <div className={`grid grid-cols-12 gap-4 px-8 py-3 text-[11px] font-bold ${isLightMode ? "text-gray-500" : "text-zinc-400"} uppercase border-b ${isLightMode ? "border-gray-200" : "border-white/5"} tracking-widest sticky top-0 z-20 backdrop-blur-md`}>
                        <div className="col-span-1 text-center">#</div>
                        <div className="col-span-10 md:col-span-7">Title</div>
                        <div className="hidden md:block md:col-span-3">Album</div>
                        <div className="col-span-1 text-right flex justify-end items-center pr-2">
                            <Clock size={16} />
                        </div>
                    </div>

                    <div className="px-2 pt-2 pb-10 space-y-1">
                        {songs.map((song, i) => (
                            <Song
                                key={song.id}
                                id={song.id}
                                index={i + 1}
                                title={song.title}
                                artists={song.artists}
                                album={song.album}
                                duration={song.duration}
                                coverUrl={song.songCover_url || song.album?.cover_url}
                                metadata={formatDate(song.added_at || song.created_at)}
                                onPlay={handlePlay}
                                hideAlbum={false}
                                onRemoveFromPlaylist={handleRemoveFromPlaylist}
                            />
                        ))}
                    </div>
                </div>
            </div>
        ) : (
            <div className={`py-24 text-center border border-dashed ${isLightMode ? "border-gray-200 bg-white" : "border-white/5 bg-black/40"} rounded-3xl backdrop-blur-xl`}>
                <div className={`w-16 h-16 ${isLightMode ? "bg-gray-100" : "bg-white/5"} rounded-2xl flex items-center justify-center mx-auto mb-5 border border-white/5 relative`}>
                    <Music className={isLightMode ? "text-gray-400" : "text-gray-600"} size={24} />
                </div>
                <h3 className={`text-xl font-bold ${isLightMode ? "text-gray-900" : "text-white"} mb-2`}>Null Library State</h3>
                <p className={`${isLightMode ? "text-gray-500" : "text-gray-500"} max-w-sm mx-auto text-sm leading-relaxed px-4`}>
                    Your collection is currently empty. Select a playlist or create a new one to start listening.
                </p>
            </div>
        )}
      </main>

      {/* Manual Creation Overlay Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 backdrop-blur-md bg-black/60 animate-in fade-in duration-200">
              <div className="absolute inset-0" onClick={() => setIsModalOpen(false)} />
              <div className={`relative ${isLightMode ? "bg-white" : "bg-[#181818]"} w-full max-w-2xl rounded-[2rem] p-8 border ${isLightMode ? "border-gray-200" : "border-white/10"} shadow-2xl space-y-6`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">Playlist Editor</div>
                      <h2 className={`text-3xl font-black ${isLightMode ? "text-gray-900" : "text-white"} tracking-tight`}>
                        {editingPlaylistId ? 'Edit Details' : 'Create Playlist'}
                      </h2>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className={`${isLightMode ? "text-gray-400 hover:text-gray-600" : "text-gray-500 hover:text-gray-300"}`}>
                      <FaPlus className="rotate-45" size={20} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Image Upload Area */}
                    <div className="col-span-1">
                      <label className="relative group cursor-pointer block aspect-square rounded-2xl overflow-hidden shadow-2xl">
                        <input type="file" className="hidden" accept="image/*" onChange={handleModalImageSelect} disabled={isUploading} />

                        {coverPreview ? (
                          <img src={coverPreview} alt="Preview" className="w-full h-full object-cover transition duration-500 group-hover:scale-110" />
                        ) : (
                          <div className={`w-full h-full flex flex-col items-center justify-center gap-3 transition-colors ${isLightMode ? "bg-gray-100 group-hover:bg-gray-200" : "bg-white/5 group-hover:bg-white/10"}`}>
                            <Music className={`${isLightMode ? "text-gray-300" : "text-white/20"} w-12 h-12`} />
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${isLightMode ? "text-gray-400" : "text-gray-500"}`}>Choose Image</span>
                          </div>
                        )}

                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                          <span className="text-white text-xs font-black uppercase tracking-widest">
                            {isUploading ? 'Uploading...' : 'Change Photo'}
                          </span>
                        </div>
                      </label>
                    </div>

                    {/* Inputs */}
                    <div className="col-span-1 md:col-span-2 space-y-4">
                      <div className="space-y-1.5">
                        <label className={`text-[10px] font-black uppercase tracking-widest px-1 ${isLightMode ? "text-gray-400" : "text-gray-500"}`}>Name</label>
                        <input
                          autoFocus
                          placeholder="My Awesome Playlist"
                          value={newPlaylistName}
                          onChange={(e) => setNewPlaylistName(e.target.value)}
                          className={`w-full ${isLightMode ? "bg-gray-50 border-gray-200 text-gray-900" : "bg-white/5 border-white/10 text-white"} border rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition-all font-bold`}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className={`text-[10px] font-black uppercase tracking-widest px-1 ${isLightMode ? "text-gray-400" : "text-gray-500"}`}>Description</label>
                        <textarea
                          placeholder="Add an optional description"
                          value={newPlaylistDescription}
                          onChange={(e) => setNewPlaylistDescription(e.target.value)}
                          rows={4}
                          className={`w-full ${isLightMode ? "bg-gray-50 border-gray-200 text-gray-900" : "bg-white/5 border-white/10 text-white"} border rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition-all font-medium resize-none`}
                        />
                      </div>
                    </div>
                  </div>

                  {saveError && (
                    <p className="text-sm text-red-500 font-medium">{saveError}</p>
                  )}

                  <div className="flex justify-end gap-4 pt-2">
                    <button
                      onClick={handleSavePlaylist}
                      disabled={!newPlaylistName.trim() || isUploading}
                      className="px-10 py-3.5 rounded-full bg-blue-600 text-white text-xs font-black uppercase tracking-widest hover:bg-blue-500 transition shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-40"
                    >
                      {isUploading ? 'Saving...' : editingPlaylistId ? 'Save Changes' : 'Create Collection'}
                    </button>
                  </div>

                  <p className={`text-[10px] ${isLightMode ? "text-gray-400" : "text-gray-500"} text-center font-medium`}>
                    By proceeding, you agree to give EchoPanda access to the image you choose to upload. Please make sure you have the right to upload the image.
                  </p>
              </div>
          </div>
      )}

      <AppFooter isLightMode={isLightMode} />
    </div>
  );
};

export default PlaylistPage;