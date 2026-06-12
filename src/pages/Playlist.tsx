import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaPlay, FaRandom, FaMusic, FaTrash, FaList, FaPlus, FaMagic } from 'react-icons/fa';
import { Music, Clock, X } from 'lucide-react';
import AppFooter from '../components/AppFooter';
import Song from '../components/Song';
import { useAudioPlayer } from '../contexts/AudioPlayerContextCore';
import { useTheme } from '../contexts/ThemeContext';
import { uploadMediaDirectly } from '../backend/directUpload';
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

// ─── Custom Logic Hook ────────────────────────────────────────────────────────

const usePlaylistLogic = (urlPlaylistId: string | null, setSearchParams: Function) => {
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
      prev.map((p) => (p.id === playlistId ? { ...p, image_url: imageUrl } : p))
    );
  };

  const saveCoverForPlaylist = async (playlistId: string, file: File, name: string, description?: string) => {
    try {
      return await uploadPlaylistCover(playlistId, file);
    } catch {
      const uploaded = await uploadMediaDirectly(file, 'playlist_cover');
      return await updatePlaylist(playlistId, name, description, uploaded.key || uploaded.url);
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
        console.warn('Cover pre-upload failed; retrying on save.', error);
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
      if (updated.image_url) setCoverPreview(updated.image_url);
      syncPlaylistImage(editingPlaylistId, updated.image_url);
      setPendingCoverFile(null);
    } catch (error) {
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
        const created = await createPlaylist(newPlaylistName.trim(), newPlaylistDescription, uploadedCoverUrl || undefined);
        if (pendingCoverFile && !uploadedCoverUrl) {
          const updated = await saveCoverForPlaylist(created.id, pendingCoverFile, newPlaylistName.trim(), newPlaylistDescription);
          syncPlaylistImage(created.id, updated.image_url);
        }
      }

      resetModalForm();
      setIsModalOpen(false);
      await loadPlaylists();
    } catch (error) {
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
      const updated = await saveCoverForPlaylist(selectedPlaylistId, file, playlist.name, playlist.description);
      syncPlaylistImage(selectedPlaylistId, updated.image_url);
    } catch (error) {
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
      await loadPlaylists();
    } catch (error) {
      console.error('Failed to isolate track element:', error);
    }
  };

  const handleDeletePlaylist = async (id: string) => {
    const playlist = playlists.find((p) => p.id === id);
    if (!playlist || !confirm(`Permanently remove "${playlist.name}"?`)) return;
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

  return {
    songs, setSongs, playlists, selectedPlaylistId, setSelectedPlaylistId,
    isModalOpen, setIsModalOpen, editingPlaylistId, newPlaylistName, setNewPlaylistName,
    newPlaylistDescription, setNewPlaylistDescription, coverPreview, isUploading,
    isUploadingHeroCover, saveError, loading, handleModalImageSelect, handleSavePlaylist,
    handleHeroCoverSelect, openCreateModal, openEditModal, handleRemoveFromPlaylist,
    handleDeletePlaylist, loadPlaylists, loadPlaylistSongs
  };
};

// ─── PlaylistHero Component ──────────────────────────────────────────────────

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
    <header className={`relative px-6 sm:px-8 pt-8 pb-8 overflow-hidden transition-all duration-500 rounded-3xl border group/hero ${isLightMode ? "border-gray-200 bg-linear-to-b from-blue-50/70 to-white shadow-xs" : "border-white/5 bg-linear-to-b from-blue-950/20 to-transparent"}`}>
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 relative z-10">
        <label className={`relative group/cover w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${canEditImage ? 'cursor-pointer hover:scale-[1.02]' : ''}`}>
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
            <div className={`w-full h-full flex items-center justify-center ${isLightMode ? 'bg-gray-100' : 'bg-zinc-800'}`}>
              <Music className={`${isLightMode ? "text-gray-400" : "text-zinc-500"} w-14 h-14`} />
            </div>
          )}
          {canEditImage && (
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-xs">
              <span className="text-white text-[10px] font-black uppercase tracking-widest border border-white/30 px-3 py-1.5 rounded-full">
                {isUploadingImage ? 'Uploading...' : 'Change Cover'}
              </span>
            </div>
          )}
        </label>

        <div onClick={onEdit} className={`flex flex-col gap-1.5 text-center md:text-left flex-1 min-w-0 ${onEdit ? 'cursor-pointer' : ''}`}>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
            Playlist
          </span>
          <h1 className={`text-2xl md:text-5xl font-black ${isLightMode ? "text-gray-900" : "text-white"} tracking-tight truncate leading-tight`}>
            {title}
          </h1>
          {description && (
            <p className={`text-xs md:text-sm font-medium ${isLightMode ? "text-gray-500" : "text-zinc-400"} line-clamp-2 max-w-2xl`}>
              {description}
            </p>
          )}
          <div className={`flex flex-wrap justify-center md:justify-start items-center gap-1 text-xs font-bold ${isLightMode ? "text-gray-600" : "text-zinc-300"}`}>
            <span className="text-blue-600 dark:text-blue-400 hover:underline">EchoPanda</span>
            <span className="mx-1 opacity-50">•</span>
            <span>{songCount} {songCount === 1 ? 'song' : 'songs'}</span>
            <span className="mx-1 opacity-50">•</span>
            <span className="font-normal opacity-70">{duration}</span>
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

  const logic = usePlaylistLogic(searchParams.get('id'), setSearchParams);

  useEffect(() => {
    logic.loadPlaylists();
  }, []);

  useEffect(() => {
    const urlId = searchParams.get('id');
    if (urlId) logic.setSelectedPlaylistId(urlId);
  }, [searchParams]);

  useEffect(() => {
    if (logic.selectedPlaylistId) {
      logic.loadPlaylistSongs(logic.selectedPlaylistId);
      if (searchParams.get('id') !== logic.selectedPlaylistId) {
        setSearchParams({ id: logic.selectedPlaylistId }, { replace: true });
      }
    } else {
      logic.setSongs([]);
    }
  }, [logic.selectedPlaylistId]);

  const handlePlay = async (songId: string) => {
    try {
      await trackSongPlay(songId);
      const queue = logic.songs.map((song) => ({
        id: song.id,
        title: song.title,
        artist: song.artists?.map((a) => a.name).join(', ') || 'Various Artists',
        coverUrl: song.songCover_url || song.album?.cover_url || '',
        audioUrl: song.original_key || song.audio_url || '',
        duration: song.duration,
      }));
      const song = queue.find((s) => s.id === songId);
      if (song) playSong(song, { queue });
    } catch (error) {
      console.error('Playback Error:', error);
    }
  };

  const totalDuration = logic.songs.reduce((sum, song) => sum + (song.duration || 0), 0);
  const activePlaylist = logic.playlists.find(p => p.id === logic.selectedPlaylistId);

  return (
    <div className={`w-full max-w-full space-y-6 pb-24 transition-colors ${isLightMode ? "text-gray-900" : "text-white"}`}>

      <PlaylistHero
        title={activePlaylist?.name || 'Your Library'}
        description={activePlaylist?.description}
        imageUrl={activePlaylist?.image_url}
        songCount={logic.songs.length}
        duration={`${Math.floor(totalDuration / 60)} min`}
        canEditImage={!!logic.selectedPlaylistId}
        isUploadingImage={logic.isUploadingHeroCover}
        onImageSelect={logic.handleHeroCoverSelect}
        onEdit={() => activePlaylist && logic.openEditModal(activePlaylist)}
      />

      {logic.saveError && (
        <div className="mx-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold">
          {logic.saveError}
        </div>
      )}

      <main className="w-full space-y-6">
        {/* Collections Section */}
        <section className="space-y-3 px-1">
          <h3 className="text-base font-black tracking-tight px-3">Your Other Collections</h3>

          <div className="flex gap-4 overflow-x-auto pb-4 px-3 scrollbar-none">
            {/* Create Card Button */}
            <button
              onClick={logic.openCreateModal}
              className={`shrink-0 w-36 h-52 rounded-2xl ${isLightMode ? "bg-gray-50 border-gray-200" : "bg-white/[0.02] border-white/5"} border border-dashed hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group flex flex-col items-center justify-center gap-3`}
            >
              <div className={`w-10 h-10 rounded-full ${isLightMode ? "bg-white" : "bg-zinc-800"} flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 transition-all shadow-md group-hover:shadow-blue-500/20`}>
                <FaPlus size={14} className={`${isLightMode ? "text-gray-400" : "text-zinc-500"} group-hover:text-white transition-colors`} />
              </div>
              <span className={`text-[11px] font-bold ${isLightMode ? "text-gray-500" : "text-zinc-400"} group-hover:text-blue-500`}>Create New</span>
            </button>

            {/* Playlist Cards */}
            {logic.playlists.map((p) => {
              const isAiStored = (p as any).isAi;
              const isActive = logic.selectedPlaylistId === p.id;

              return (
                <div
                  key={p.id}
                  onClick={() => logic.setSelectedPlaylistId(p.id)}
                  className={`group shrink-0 w-36 h-52 rounded-2xl p-3 cursor-pointer transition-all duration-300 relative flex flex-col ${isActive ? (isLightMode ? 'bg-blue-50/50 border-blue-200 shadow-xs' : 'bg-blue-950/20 border-blue-500/30 shadow-lg') : (isLightMode ? 'bg-gray-50/60 hover:bg-gray-100/80 border-transparent' : 'bg-zinc-900/40 hover:bg-zinc-800/50 border-transparent')} border`}
                >
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-2.5 shadow-sm">
                    {p.image_url ? (
                      <img src={p.image_url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${isLightMode ? 'bg-gray-200/60' : 'bg-zinc-800'}`}>
                        {isAiStored ? <FaMagic size={20} className="text-purple-400" /> : <FaMusic size={18} className={isLightMode ? "text-gray-400" : "text-zinc-500"} />}
                      </div>
                    )}

                    <button
                      onClick={(e) => { e.stopPropagation(); logic.handleDeletePlaylist(p.id); }}
                      className="absolute top-1.5 right-1.5 z-20 opacity-0 group-hover:opacity-100 p-2 bg-black/60 text-white hover:bg-red-500 rounded-full transition-all scale-75"
                    >
                      <FaTrash size={12} />
                    </button>

                    {isActive && (
                      <div className="absolute bottom-1.5 right-1.5 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 animate-in zoom-in duration-300">
                        <FaPlay size={10} className="text-white ml-0.5" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h4 className={`font-bold ${isLightMode ? "text-gray-900" : "text-white"} text-xs truncate`}>{p.name}</h4>
                    <p className={`text-[10px] font-semibold ${isLightMode ? "text-gray-400" : "text-zinc-500"} truncate mt-0.5`}>
                      {p.song_count} {p.song_count === 1 ? 'song' : 'songs'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Track Viewport Sequence */}
        {logic.songs.length > 0 ? (
          <div className="space-y-4 animate-in fade-in duration-300 px-3">
            {/* Action controls */}
            <div className="flex items-center gap-6 py-2">
              <button
                onClick={() => handlePlay(logic.songs[0].id)}
                className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 bg-blue-600 hover:bg-blue-500"
              >
                <FaPlay size={16} className="ml-0.5" />
              </button>
              <div className="flex items-center gap-5">
                <FaRandom size={18} className={`${isLightMode ? "text-gray-400 hover:text-blue-600" : "text-zinc-500 hover:text-blue-400"} cursor-pointer transition-colors`} />
                <FaList size={16} className={`${isLightMode ? "text-gray-400 hover:text-blue-600" : "text-zinc-500 hover:text-blue-400"} cursor-pointer transition-colors`} />
              </div>
            </div>

            {/* Structured Track Table Header */}
            <div className="w-full">
              <div className={`grid grid-cols-12 gap-4 px-6 py-2 text-[10px] font-black ${isLightMode ? "text-gray-400" : "text-zinc-500"} uppercase border-b ${isLightMode ? "border-gray-100" : "border-white/5"} tracking-wider sticky top-0 z-20 backdrop-blur-md`}>
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-10 md:col-span-7">Title</div>
                <div className="hidden md:block md:col-span-3">Album</div>
                <div className="col-span-1 text-right flex justify-end items-center pr-2">
                  <Clock size={14} />
                </div>
              </div>

              <div className="pt-2 space-y-0.5">
                {logic.songs.map((song, i) => (
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
                    onRemoveFromPlaylist={logic.handleRemoveFromPlaylist}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className={`py-20 text-center border border-dashed mx-3 ${isLightMode ? "border-gray-200 bg-gray-50/30" : "border-white/5 bg-zinc-900/20"} rounded-3xl`}>
            <div className={`w-12 h-12 ${isLightMode ? "bg-gray-100" : "bg-white/5"} rounded-xl flex items-center justify-center mx-auto mb-4 border border-transparent`}>
              <Music className={isLightMode ? "text-gray-400" : "text-zinc-600"} size={20} />
            </div>
            <h3 className="text-sm font-bold mb-1">Your Archive Workspace is Empty</h3>
            <p className={`text-xs ${isLightMode ? "text-gray-400" : "text-zinc-500"} max-w-xs mx-auto leading-relaxed px-4`}>
              Select an existing collection playlist from your dynamic grid row or map a fresh workspace playlist track stack.
            </p>
          </div>
        )}
      </main>

      {/* Manual Creation Overlay Modal */}
      {logic.isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs bg-black/50 animate-in fade-in duration-150">
          <div className="absolute inset-0" onClick={() => logic.setIsModalOpen(false)} />
          <div className={`relative ${isLightMode ? "bg-white" : "bg-[#161618]"} w-full max-w-xl rounded-3xl p-6 border ${isLightMode ? "border-gray-100" : "border-white/5"} shadow-2xl space-y-5 z-10`}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-blue-500">Playlist Customizer</span>
                <h2 className="text-xl font-black tracking-tight mt-0.5">
                  {logic.editingPlaylistId ? 'Edit Details' : 'Create Playlist'}
                </h2>
              </div>
              <button onClick={() => logic.setIsModalOpen(false)} className={`${isLightMode ? "text-gray-400 hover:text-gray-600" : "text-zinc-500 hover:text-zinc-300"} p-1`}>
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="col-span-1">
                <label className="relative group cursor-pointer block aspect-square rounded-xl overflow-hidden shadow-sm">
                  <input type="file" className="hidden" accept="image/*" onChange={logic.handleModalImageSelect} disabled={logic.isUploading} />
                  {logic.coverPreview ? (
                    <img src={logic.coverPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full flex flex-col items-center justify-center gap-2 transition-colors ${isLightMode ? "bg-gray-50 hover:bg-gray-100" : "bg-white/[0.02] hover:bg-white/[0.04]"}`}>
                      <Music className={`${isLightMode ? "text-gray-300" : "text-zinc-700"} w-8 h-8`} />
                      <span className="text-[9px] font-bold uppercase tracking-wider opacity-60">Upload Cover</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold uppercase tracking-wider">
                      {logic.isUploading ? 'Uploading...' : 'Browse Image'}
                    </span>
                  </div>
                </label>
              </div>

              <div className="col-span-1 sm:col-span-2 space-y-3.5">
                <div className="space-y-1">
                  <label className={`text-[9px] font-black uppercase tracking-wider px-0.5 ${isLightMode ? "text-gray-400" : "text-zinc-500"}`}>Playlist Name</label>
                  <input
                    autoFocus
                    placeholder="My Collection Name"
                    value={logic.newPlaylistName}
                    onChange={(e) => logic.setNewPlaylistName(e.target.value)}
                    className={`w-full ${isLightMode ? "bg-gray-50 border-gray-200 text-gray-900 focus:bg-white" : "bg-white/5 border-white/5 text-white focus:bg-transparent"} border rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-blue-500 transition-all font-bold`}
                  />
                </div>

                <div className="space-y-1">
                  <label className={`text-[9px] font-black uppercase tracking-wider px-0.5 ${isLightMode ? "text-gray-400" : "text-zinc-500"}`}>Description</label>
                  <textarea
                    placeholder="Describe your compilation..."
                    value={logic.newPlaylistDescription}
                    onChange={(e) => logic.setNewPlaylistDescription(e.target.value)}
                    rows={3}
                    className={`w-full ${isLightMode ? "bg-gray-50 border-gray-200 text-gray-900 focus:bg-white" : "bg-white/5 border-white/5 text-white focus:bg-transparent"} border rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-blue-500 transition-all font-medium resize-none`}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button
                onClick={logic.handleSavePlaylist}
                disabled={!logic.newPlaylistName.trim() || logic.isUploading}
                className="px-8 py-3 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition shadow-md shadow-blue-500/10 active:scale-[0.98] disabled:opacity-40"
              >
                {logic.isUploading ? 'Saving...' : logic.editingPlaylistId ? 'Save Changes' : 'Create Collection'}
              </button>
            </div>

            <p className={`text-[9px] ${isLightMode ? "text-gray-400" : "text-zinc-500"} text-center font-medium opacity-80`}>
              By proceeding, you agree to grant EchoPanda local access permissions for asset data syncing.
            </p>
          </div>
        </div>
      )}

      <AppFooter isLightMode={isLightMode} />
    </div>
  );
};

export default PlaylistPage;