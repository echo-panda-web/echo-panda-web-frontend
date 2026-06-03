import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlay, FaRandom, FaMusic, FaTrash, FaList, FaPlus, FaSpinner } from 'react-icons/fa';
import { PlaylistHero } from './playList/PlaylistHero';
import AppFooter from './home/AppFooter';
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

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

// --- Create Playlist Modal ---
const CreatePlaylistModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
}> = ({ isOpen, onClose, onConfirm }) => {
  const [name, setName] = useState('');
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
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

// --- Playlist Page ---
const PlaylistPage: React.FC = () => {
  const { playSong } = useAudioPlayer();
  const { getCachedData } = useDataCache();
  const [songs, setSongs] = useState<SongData[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [playlistsLoading, setPlaylistsLoading] = useState(true);

  // Load playlists on mount
  useEffect(() => {
    loadPlaylists();
  }, []);

  // Load songs when playlist is selected
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
      const data = await getCachedData('user_playlists', async () => {
        return await getUserPlaylists();
      });
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
      const data = await getCachedData(`playlist_songs_${playlistId}`, async () => {
        return await getPlaylistSongs(playlistId);
      });
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
      if (song && song.audio_url) {
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
      await loadPlaylists(); // refresh song count
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
                    <FaMusic size={35} className="text-neutral-700 group-hover:text-blue-500/50 transition" />
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