import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDataCache } from "../contexts/DataCacheContext";
import { FaSpinner, FaMusic, FaPlus } from "react-icons/fa";
import Song from "../components/Song";
import { getUserPlaylists, createPlaylist, addSongToPlaylist, isSongInPlaylist, type Playlist } from "../backend/playlistsService";
import { trackSongPlay } from "../backend/playTrackingService";
import { useAudioPlayer } from "../contexts/AudioPlayerContext";
import { getSongs } from "../backend/catalogService";

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
  audio_url: string | null;
  songCover_url: string | null;
  created_at: string;
  artists?: Artist[];
  album?: Album;
}

const RecentlyAdded: React.FC = () => {
  const navigate = useNavigate();
  const { playSong } = useAudioPlayer();
  const { getCachedData } = useDataCache();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isPlaylistSelectorOpen, setIsPlaylistSelectorOpen] = useState(false);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [selectedSongForPlaylist, setSelectedSongForPlaylist] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentSongs();
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      const data = await getUserPlaylists();
      setPlaylists(data);
    } catch (error) {
      console.error('Error loading playlists:', error);
    }
  };

  const fetchRecentSongs = async () => {
    try {
      setLoading(true);

      const data = await getCachedData('recently_added_songs', async () => {
        const startTime = performance.now();
        console.log('🔄 [RecentlyAdded] Fetching songs...');
        const songsData = await getSongs(25);

        const fetchTime = performance.now() - startTime;
        console.log(`✅ [RecentlyAdded] Songs fetched in ${fetchTime.toFixed(0)}ms`);
        console.log(`📊 [RecentlyAdded] Retrieved ${songsData?.length || 0} songs`);

        const transformedSongs: Song[] = (songsData || []).map((song: any) => ({
          id: song.id,
          title: song.title,
          duration: song.duration,
          album_id: song.album_id,
          audio_url: song.audio_url,
          songCover_url: song.songCover_url,
          created_at: song.created_at,
          artists: song.artists || [],
          album: song.album || null
        }));

        return transformedSongs;
      });

      setSongs(data);
    } catch (error) {
      console.error('Error fetching recent songs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };



  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handlePlay = async (songId: string) => {
    await trackSongPlay(songId);
    
    // Find the song data
    const song = songs.find(s => s.id === songId);
    if (song && song.audio_url) {
      playSong({
        id: song.id,
        title: song.title,
        artist: song.artists?.map(a => a.name).join(', ') || 'Unknown Artist',
        coverUrl: song.songCover_url || song.album?.cover_url || '',
        audioUrl: song.original_key || song.audio_url,
        duration: song.duration
      });
    } else {
      console.error('No audio URL available for this song');
    }
  };

  const handleAddToPlaylist = (songId: string) => {
    setSelectedSongForPlaylist(songId);
    setIsPlaylistSelectorOpen(true);
  };

  const handleSelectPlaylist = async (playlistId: string) => {
    if (!selectedSongForPlaylist) return;

    try {
      const alreadyInPlaylist = await isSongInPlaylist(playlistId, selectedSongForPlaylist);
      if (alreadyInPlaylist) {
        showToast('Song already in this playlist');
        setIsPlaylistSelectorOpen(false);
        setSelectedSongForPlaylist(null);
        return;
      }

      await addSongToPlaylist(playlistId, selectedSongForPlaylist);
      await loadPlaylists();
      showToast('Song added to playlist!');
      setIsPlaylistSelectorOpen(false);
      setSelectedSongForPlaylist(null);
    } catch (error) {
      console.error('Error adding song to playlist:', error);
      showToast('Failed to add song to playlist');
    }
  };

  const handleCreatePlaylistFromSelector = () => {
    setIsPlaylistSelectorOpen(false);
    setIsCreatePlaylistOpen(true);
  };

  const handleCreatePlaylist = async (name: string) => {
    try {
      const newPlaylist = await createPlaylist(name);
      if (!newPlaylist) {
        showToast('Failed to create playlist');
        return;
      }

      if (selectedSongForPlaylist) {
        await addSongToPlaylist(newPlaylist.id, selectedSongForPlaylist);
        showToast(`Playlist "${name}" created and song added!`);
        setSelectedSongForPlaylist(null);
      } else {
        showToast(`Playlist "${name}" created!`);
      }

      await loadPlaylists();
      setIsCreatePlaylistOpen(false);
    } catch (error) {
      console.error('Error creating playlist:', error);
      showToast('Failed to create playlist');
    }
  };

  const handleAddToFavorite = (songId: string) => {
    console.log('Add to favorite:', songId);
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white py-8">
      {/* Playlist Selector Modal */}
      {isPlaylistSelectorOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => { setIsPlaylistSelectorOpen(false); setSelectedSongForPlaylist(null); }} />
          <div className="relative bg-[#181818] w-full max-w-md rounded-3xl p-8 border border-white/10 shadow-2xl">
            <h2 className="text-2xl font-black text-white mb-6">Add to Playlist</h2>
            
            <button
              onClick={handleCreatePlaylistFromSelector}
              className="w-full mb-4 py-3 px-4 rounded-xl bg-white/5 border border-dashed border-white/10 hover:border-blue-500/50 hover:bg-white/10 transition-all flex items-center gap-3 text-white font-semibold"
            >
              <FaPlus size={16} />
              <span>Create New Playlist</span>
            </button>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {playlists.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No playlists yet</p>
              ) : (
                playlists.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => handleSelectPlaylist(playlist.id)}
                    className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all flex items-center gap-3 text-left group"
                  >
                    <div className="w-12 h-12 rounded-lg bg-neutral-900 flex items-center justify-center shrink-0">
                      <FaMusic size={20} className="text-neutral-700 group-hover:text-blue-500/50 transition" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold truncate">{playlist.name}</p>
                      <p className="text-gray-400 text-sm">{playlist.song_count} songs</p>
                    </div>
                  </button>
                ))
              )}
            </div>

            <button
              onClick={() => { setIsPlaylistSelectorOpen(false); setSelectedSongForPlaylist(null); }}
              className="mt-6 w-full py-3 text-gray-400 font-bold hover:text-white transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Create Playlist Modal */}
      {isCreatePlaylistOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => { setIsCreatePlaylistOpen(false); setSelectedSongForPlaylist(null); }} />
          <div className="relative bg-[#181818] w-full max-w-sm rounded-3xl p-8 border border-white/10 shadow-2xl">
            <h2 className="text-2xl font-black text-white mb-6">New Playlist</h2>
            <input
              autoFocus
              type="text"
              placeholder="Playlist name"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white mb-6 outline-none focus:border-blue-500 transition-all"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                  handleCreatePlaylist((e.target as HTMLInputElement).value);
                }
              }}
            />
            <div className="flex gap-3">
              <button onClick={() => { setIsCreatePlaylistOpen(false); setSelectedSongForPlaylist(null); }} className="flex-1 py-3 text-gray-400 font-bold hover:text-white transition">
                Cancel
              </button>
              <button
                onClick={(e) => {
                  const input = e.currentTarget.parentElement?.previousElementSibling as HTMLInputElement;
                  if (input?.value.trim()) handleCreatePlaylist(input.value);
                }}
                className="flex-1 py-3 rounded-full font-bold bg-blue-500 text-white hover:bg-blue-400 transition"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg animate-slide-up z-50">
          {toastMessage}
        </div>
      )}

      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-5xl font-black text-white tracking-tight">
              Recently <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Added</span>
            </h1>
          </div>
          <p className="text-slate-400 text-lg">Latest 25 tracks added to the collection</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <FaSpinner className="text-purple-400 text-5xl animate-spin" />
          </div>
        ) : songs.length === 0 ? (
          <div className="text-center py-32">
            <FaMusic className="text-slate-700 text-6xl mx-auto mb-4" />
            <p className="text-slate-400 text-xl">No songs added yet</p>
          </div>
        ) : (
          <div className="bg-[#0f0f0f] rounded-lg">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 text-xs md:text-sm uppercase tracking-wide text-gray-400 font-medium border-b border-gray-800 pb-2 px-3">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-5 md:col-span-4">Title</div>
              <div className="hidden md:block md:col-span-3">Album</div>
              <div className="hidden md:block md:col-span-2">Added</div>
              <div className="col-span-2 text-right">Time</div>
            </div>

            {/* Song List */}
            <div className="space-y-2 mt-3">
              {songs.map((song, index) => (
                <Song
                  key={song.id}
                  id={song.id}
                  index={index + 1}
                  title={song.title}
                  artists={song.artists}
                  album={song.album}
                  duration={song.duration}
                  coverUrl={song.songCover_url}
                  metadata={formatDate(song.created_at)}
                  onPlay={handlePlay}
                  onAddToPlaylist={handleAddToPlaylist}
                  onAddToFavorite={handleAddToFavorite}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentlyAdded;