import React, { useState, useEffect } from 'react';
import { FaPlay, FaRandom, FaMusic, FaTrash, FaList, FaPlus, FaSpinner } from 'react-icons/fa';
import { Music, Clock, User } from 'lucide-react';
import AppFooter from '../components/AppFooter';
import Song from '../components/Song';
import { useDataCache } from '../contexts/DataCacheContext';
import {
  getUserPlaylists,
  createPlaylist,
  deletePlaylist as deletePlaylistService,
  getPlaylistSongs,
  removeSongFromPlaylist,
  type Playlist,
} from '../backend/playlistsService';
import { trackSongPlay } from '../backend/playTrackingService';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';

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
  songCount: number;
  duration: string;
}

const PlaylistHero: React.FC<PlaylistHeroProps> = ({ title, songCount, duration }) => {
  return (
    <header className="relative px-4 sm:px-8 pt-20 sm:pt-24 pb-8 bg-linear-to-b from-blue-600/30 via-blue-950/20 to-black overflow-hidden">
      {/* Background blur circle */}
      <div className="absolute top-0 -left-16 sm:-left-20 w-75 sm:w-125 h-75 sm:h-125 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Content */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 relative z-10">
        {/* Music icon / Album art */}
        <div className="w-40 sm:w-52 lg:w-60 h-40 sm:h-52 lg:h-60 bg-linear-to-br from-white/10 to-white/5 backdrop-blur-md rounded-xl flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 group">
          <Music className="text-white/20 w-14 h-14 sm:w-20 sm:h-20 lg:w-24 lg:h-24 group-hover:scale-110 transition-transform duration-700" />
        </div>

        {/* Text Info */}
        <div className="flex flex-col gap-2 sm:gap-3 text-center md:text-left">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.15em] text-blue-400">
            Public Playlist
          </span>
          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black text-white tracking-tight truncate">
            {title}
          </h1>

          {/* Meta info */}
          <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium text-gray-300">
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-500 flex items-center justify-center">
                <User className="text-white w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
              <span className="text-white hover:underline cursor-pointer">User</span>
            </div>
            <span>•</span>
            <span>{songCount} songs</span>
            <span>•</span>
            <div className="flex items-center gap-1 text-gray-400">
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>{duration}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

// ─── CreatePlaylistModal ──────────────────────────────────────────────────────

const CreatePlaylistModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
}> = ({ isOpen, onClose, onConfirm }) => {
  const [name, setName] = useState('');
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-[#181818] w-full max-w-sm rounded-3xl p-8 border border-white/10 shadow-2xl">
        <h2 className="text-2xl font-black text-white mb-6">New Playlist</h2>
        <input
          autoFocus
          type="text"
          placeholder="Playlist name"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white mb-6 outline-none focus:border-blue-500 transition-all"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && name.trim() && onConfirm(name)}
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-gray-400 font-bold hover:text-white transition"
          >
            Cancel
          </button>
          <button
            disabled={!name.trim()}
            onClick={() => onConfirm(name)}
            className="flex-1 py-3 rounded-full font-bold bg-blue-500 text-white hover:bg-blue-400 transition disabled:opacity-50"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── PlaylistPage ─────────────────────────────────────────────────────────────

const PlaylistPage: React.FC = () => {
  const { playSong } = useAudioPlayer();
  const { getCachedData } = useDataCache();
  const [songs, setSongs] = useState<SongData[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [playlistsLoading, setPlaylistsLoading] = useState(true);

  useEffect(() => {
    loadPlaylists();
  }, []);

  useEffect(() => {
    if (selectedPlaylistId) {
      loadPlaylistSongs(selectedPlaylistId);
    } else {
      setSongs([]);
    }
  }, [selectedPlaylistId]);

  const loadPlaylists = async () => {
    try {
      setPlaylistsLoading(true);
      const data = await getCachedData('user_playlists', async () => getUserPlaylists());
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
      const data = await getCachedData(
        `playlist_songs_${playlistId}`,
        async () => getPlaylistSongs(playlistId)
      );
      setSongs(data);
    } catch (error) {
      console.error('Error loading playlist songs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlaylist = async (id: string) => {
    const playlist = playlists.find((p) => p.id === id);
    if (!playlist) return;
    if (!confirm(`Delete playlist "${playlist.name}"?`)) return;

    try {
      await deletePlaylistService(id);
      await loadPlaylists();
      if (selectedPlaylistId === id) {
        setSelectedPlaylistId(null);
        setSongs([]);
      }
    } catch (error) {
      console.error('Error deleting playlist:', error);
    }
  };

  const handleCreatePlaylist = async (name: string) => {
    try {
      const newPlaylist = await createPlaylist(name);
      if (!newPlaylist) return;
      setSelectedPlaylistId(newPlaylist.id);
      await loadPlaylists();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error creating playlist:', error);
    }
  };

  const handlePlay = async (songId: string) => {
    try {
      await trackSongPlay(songId);
      const song = songs.find((s) => s.id === songId);
      if (song?.audio_url) {
        playSong({
          id: song.id,
          title: song.title,
          artist: song.artists?.map((a) => a.name).join(', ') || 'Unknown Artist',
          coverUrl: song.songCover_url || song.album?.cover_url || '',
          audioUrl: song.original_key || song.audio_url,
          duration: song.duration,
        });
      }
    } catch (error) {
      console.error('Error playing song:', error);
    }
  };

  const handleRemoveFromPlaylist = async (songId: string) => {
    if (!selectedPlaylistId) return;
    try {
      await removeSongFromPlaylist(selectedPlaylistId, songId);
      await loadPlaylistSongs(selectedPlaylistId);
      await loadPlaylists();
    } catch (error) {
      console.error('Error removing song from playlist:', error);
    }
  };

  const currentPlaylist = selectedPlaylistId
    ? playlists.find((p) => p.id === selectedPlaylistId)
    : null;

  const totalDuration = songs.reduce((sum, song) => sum + (song.duration || 0), 0);
  const hasSongs = songs.length > 0;

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/30">
      <CreatePlaylistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleCreatePlaylist}
      />

      <PlaylistHero
        title={currentPlaylist?.name || 'Your Library'}
        songCount={songs.length}
        duration={`${Math.floor(totalDuration / 60)} min`}
      />

      <main className="px-8 -mt-10 relative z-10">
        {/* Library Cards */}
        <section className="mb-10 mt-5">
          <div className="flex items-center gap-4 mb-5">
            <h3 className="text-xs font-bold uppercase text-gray-300">Your Library</h3>
          </div>

          {playlistsLoading ? (
            <div className="flex items-center justify-center py-20">
              <FaSpinner className="animate-spin text-blue-500" size={32} />
            </div>
          ) : (
            <div className="flex gap-5 overflow-x-auto pb-6 no-scrollbar mask-fade-right mt-5">
              {/* Create Card */}
              <div
                onClick={() => setIsModalOpen(true)}
                className="shrink-0 w-44 p-5 rounded-4xl bg-white/5 border border-dashed border-white/10 hover:border-blue-500/50 hover:bg-white/10 cursor-pointer transition-all group"
              >
                <div className="aspect-square rounded-3xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-105 transition duration-300">
                  <FaPlus size={28} className="text-gray-500 group-hover:text-blue-500" />
                </div>
                <p className="text-sm font-bold text-center group-hover:text-blue-500 transition">
                  Create New
                </p>
              </div>

              {/* Playlist Cards */}
              {playlists.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlaylistId(p.id)}
                  className={`group shrink-0 w-44 p-5 rounded-4xl cursor-pointer transition-all duration-300 relative ${selectedPlaylistId === p.id
                    ? 'bg-white/15 ring-2 ring-white/20'
                    : 'bg-white/5 hover:bg-white/10'
                    }`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePlaylist(p.id);
                    }}
                    className="absolute top-7 right-7 z-20 opacity-0 group-hover:opacity-100 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition shadow-xl scale-75 group-hover:scale-100"
                  >
                    <FaTrash size={12} />
                  </button>
                  <div className="aspect-square rounded-3xl bg-neutral-900 flex items-center justify-center mb-4 shadow-xl overflow-hidden">
                    <FaMusic
                      size={35}
                      className="text-neutral-700 group-hover:text-blue-500/50 transition"
                    />
                  </div>
                  <p className="text-sm font-bold truncate text-center px-2">{p.name}</p>
                  <p className="text-xs text-gray-500 text-center mt-1">{p.song_count} songs</p>
                </div>
              ))}

              {playlists.length === 0 && (
                <p className="text-gray-500 text-sm py-10">
                  No playlists yet. Create one to get started!
                </p>
              )}
            </div>
          )}
        </section>

        {/* Action Bar & Songs — only when playlist has songs */}
        {hasSongs && (
          <>
            <div className="flex items-center gap-8 bg-white/2 p-4 border border-white/5 backdrop-blur-md">
              <button
                onClick={() => handlePlay(songs[0].id)}
                className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 hover:scale-105 active:scale-95 transition"
              >
                <FaPlay size={20} className="ml-1" />
              </button>
              <button className="text-gray-500 hover:text-white transition">
                <FaRandom size={22} />
              </button>
              <div className="h-6 w-px bg-white/10" />
              <p className="text-sm font-bold text-gray-400">
                {songs.length} Tracks in this playlist
              </p>
              <div className="ml-auto flex gap-4 text-gray-500 pr-4">
                <FaList size={18} className="cursor-pointer hover:text-white" />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20 bg-white/1 border border-white/5">
                <FaSpinner className="animate-spin text-blue-500" size={32} />
              </div>
            ) : (
              <div className="bg-white/1 border border-white/5 overflow-hidden mb-20">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-3 py-3 text-xs font-bold text-gray-500 uppercase border-b border-white/5">
                  <div className="col-span-1 text-center">#</div>
                  <div className="col-span-9">Title</div>
                  <div className="col-span-2 text-right pr-2">Time</div>
                </div>

                {/* Song Rows */}
                {songs.map((song, index) => (
                  <Song
                    key={song.id}
                    id={song.id}
                    index={index + 1}
                    title={song.title}
                    artists={song.artists}
                    album={song.album}
                    duration={song.duration}
                    coverUrl={song.songCover_url || song.album?.cover_url}
                    metadata={formatDate(song.added_at || song.created_at)}
                    onPlay={handlePlay}
                    hideAlbum={true}
                    onRemoveFromPlaylist={handleRemoveFromPlaylist}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!loading && selectedPlaylistId && songs.length === 0 && (
          <div className="text-center py-20">
            <FaMusic size={64} className="mx-auto text-gray-700 mb-4" />
            <p className="text-xl font-bold text-gray-400 mb-2">No songs in this playlist</p>
            <p className="text-gray-600">Add songs from the song detail page</p>
          </div>
        )}
      </main>

      <AppFooter isLightMode={false} />
    </div>
  );
};

export default PlaylistPage;