import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaPlay, FaHeart, FaEllipsisH, FaStepBackward, FaStepForward, 
  FaRedo, FaRandom, FaVolumeUp, FaListUl, FaDesktop, 
  FaMicrophone, FaChevronDown, FaChevronLeft, FaPlus,
  FaUser, FaCompactDisc, FaTimes, FaFolder, FaMusic, FaCheck, FaSpinner
} from 'react-icons/fa';
import Song from './Song';
import { getUserPlaylists, createPlaylist, addSongToPlaylist, isSongInPlaylist, type Playlist } from '../backend/playlistsService';
import { trackSongPlay } from '../backend/playTrackingService';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';

const viteEnv = (import.meta as any).env || {};
const BACKEND_API_BASE_URL = viteEnv.VITE_BACKEND_API_URL || 'http://localhost:8082/api';

// --- Types ---
interface Artist {
  id: string;
  name: string;
  image_url: string;
}

interface Album {
  id: string;
  title: string;
  cover_url: string;
  release_date: string;
}

interface SongData {
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


const staticLyrics = [
  "Beautiful melodies fill the air",
  "Music brings us together everywhere",
  "Feel the rhythm, feel the beat",
  "Let the music move your feet"
];

const formatDate = (date?: Date) => {
  const d = date || new Date();
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// --- Create Playlist Modal Component ---
interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePlaylist: (name: string) => void;
  initialSongId?: string;
}

const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({ 
  isOpen, 
  onClose, 
  onCreatePlaylist,
  initialSongId 
}) => {
  const [playlistName, setPlaylistName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (playlistName.trim()) {
      onCreatePlaylist(playlistName.trim());
      setPlaylistName('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-linear-to-br from-gray-900 to-gray-800 rounded-2xl border border-blue-500/30 shadow-2xl max-w-md w-full p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Create New Playlist</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition p-2 hover:bg-white/10 rounded-full">
            <FaTimes size={20} />
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Playlist Name</label>
          <input
            ref={inputRef}
            type="text"
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && playlistName.trim() && handleSubmit(e)}
            placeholder="My Awesome Playlist"
            className="w-full bg-black/40 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
            maxLength={50}
          />
        </div>

        {initialSongId && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-300">
              <FaMusic className="inline mr-2" size={12} />
              Song will be added to this playlist
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={!playlistName.trim()}
            className="flex-1 bg-linear-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all"
          >
            Create Playlist
          </button>
          <button onClick={onClose} className="px-6 bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-lg transition">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Playlist Selector Modal Component ---
interface PlaylistSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  songId: string;
  onSelectPlaylist: (playlistId: string) => void;
  onCreateNew: () => void;
}

const PlaylistSelectorModal: React.FC<PlaylistSelectorModalProps> = ({
  isOpen,
  onClose,
  songId,
  onSelectPlaylist,
  onCreateNew
}) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [songsInPlaylists, setSongsInPlaylists] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (isOpen) {
      loadPlaylists();
    }
  }, [isOpen]);

  const loadPlaylists = async () => {
    const userPlaylists = await getUserPlaylists();
    setPlaylists(userPlaylists);
    
    // Check which playlists already have this song
    const checks: { [key: string]: boolean } = {};
    for (const playlist of userPlaylists) {
      checks[playlist.id] = await isSongInPlaylist(playlist.id, songId);
    }
    setSongsInPlaylists(checks);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-linear-to-br from-gray-900 to-gray-800 rounded-2xl border border-blue-500/30 shadow-2xl max-w-md w-full p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Add to Playlist</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition p-2 hover:bg-white/10 rounded-full">
            <FaTimes size={20} />
          </button>
        </div>

        <button
          onClick={onCreateNew}
          className="w-full bg-linear-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-bold py-4 rounded-lg mb-4 transition-all flex items-center justify-center gap-2"
        >
          <FaPlus size={16} />
          Create New Playlist
        </button>

        <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
          {playlists.length === 0 ? (
            <div className="text-center py-8">
              <FaFolder size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400">No playlists yet</p>
            </div>
          ) : (
            playlists.map((playlist) => {
              const isAdded = songsInPlaylists[playlist.id];
              return (
                <button
                  key={playlist.id}
                  onClick={() => !isAdded && onSelectPlaylist(playlist.id)}
                  className={`w-full p-4 rounded-lg border transition-all flex items-center justify-between ${
                    isAdded ? 'bg-green-500/10 border-green-500/30 cursor-default' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-blue-500/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <FaFolder size={16} className="text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-white">{playlist.name}</p>
                      <p className="text-xs text-gray-400">{playlist.song_count || 0} songs</p>
                    </div>
                  </div>
                  {isAdded && <FaCheck size={18} className="text-green-500" />}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

// --- Main SongDetails Component ---
const SongDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { playSong } = useAudioPlayer();
  
  const [showSidebar, setShowSidebar] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSelectorModal, setShowSelectorModal] = useState(false);
  const [selectedSongForPlaylist, setSelectedSongForPlaylist] = useState<string | null>(null);
  
  const [currentSong, setCurrentSong] = useState<SongData | null>(null);
  const [albumSongs, setAlbumSongs] = useState<SongData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchSongAndAlbum();
    }
  }, [id]);

  const fetchSongAndAlbum = async () => {
    try {
      setLoading(true);

      const songRes = await fetch(`${BACKEND_API_BASE_URL}/songs/${id}`, {
        headers: { Accept: 'application/json' },
      });

      if (!songRes.ok) throw new Error(`Failed to fetch song ${id}`);
      const songData = await songRes.json();

      const album = songData.album;
      
      const transformedSong: SongData = {
        id: songData.id,
        title: songData.title,
        duration: songData.duration,
        album_id: songData.album_id,
        audio_url: songData.audio_url || null,
        songCover_url: songData.album?.cover_url || songData.album?.cover_image || null,
        created_at: songData.created_at,
          album: album ? {
          id: album.id,
          title: album.title,
          cover_url: album.cover_url || album.cover_image,
          release_date: album.release_date
        } : undefined,
        artists: songData.artist ? [{ id: String(songData.id), name: songData.artist, image_url: '' }] : []
      };

      setCurrentSong(transformedSong);

      // Fetch all songs from the same album
      if (songData.album_id) {
        const albumSongsRes = await fetch(
          `${BACKEND_API_BASE_URL}/songs?album_id=${songData.album_id}&per_page=200`,
          { headers: { Accept: 'application/json' } }
        );

        if (!albumSongsRes.ok) throw new Error('Failed to fetch album songs');
        const albumSongsJson = await albumSongsRes.json();
        const albumSongsData = Array.isArray(albumSongsJson?.data) ? albumSongsJson.data : [];

        const transformedAlbumSongs: SongData[] = (albumSongsData || []).map((song: any) => ({
          id: song.id,
          title: song.title,
          duration: song.duration,
          album_id: song.album_id,
          audio_url: song.audio_url || null,
          songCover_url: transformedSong.album?.cover_url || null,
          created_at: song.created_at,
          artists: song.artist ? [{ id: String(song.id), name: song.artist, image_url: '' }] : []
        }));

        setAlbumSongs(transformedAlbumSongs);
      }
    } catch (error) {
      console.error('Error fetching song data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (songId: string) => {
    console.log('🎵 handlePlay called with songId:', songId);
    trackSongPlay(songId);
    
    // Find the song data to play - check current song first, then album songs
    let songToPlay = null;
    
    if (currentSong?.id === songId) {
      songToPlay = currentSong;
      console.log('🎵 Playing current song');
    } else {
      songToPlay = albumSongs.find(s => s.id === songId);
      console.log('🎵 Playing song from album list');
    }
    
    console.log('🎵 Song to play:', songToPlay);
    console.log('🎵 Has audio_url?', !!songToPlay?.audio_url);
    console.log('🎵 audio_url value:', songToPlay?.audio_url);
    
    if (songToPlay && songToPlay.audio_url) {
      const songData = {
        id: songToPlay.id,
        title: songToPlay.title,
        artist: songToPlay.artists?.map(a => a.name).join(', ') || 'Unknown Artist',
        coverUrl: songToPlay.songCover_url || currentSong?.album?.cover_url || '',
        audioUrl: songToPlay.original_key || songToPlay.audio_url,
        duration: songToPlay.duration
      };
      console.log('🎵 Calling playSong with:', songData);
      playSong(songData);
      setShowSidebar(true); // Show the sidebar with lyrics
      console.log('✅ playSong called successfully');
    } else {
      console.error('❌ No audio URL available for this song');
      console.error('songToPlay:', songToPlay);
      alert('This song does not have an audio file. Please upload an audio file for this song.');
    }
  };

  const handleAddToPlaylist = (songId: string | number) => {
    const strId = typeof songId === 'number' ? songId.toString() : songId;
    setSelectedSongForPlaylist(strId);
    setShowSelectorModal(true);
  };

  const handleAddToFavorite = (songId: string | number) => {
    console.log('Add to favorite:', songId);
    // Favorites are now handled in Song component
  };

  const handleSelectPlaylist = async (playlistId: string) => {
    if (selectedSongForPlaylist) {
      const success = await addSongToPlaylist(playlistId, selectedSongForPlaylist);
      if (success) {
        console.log(`✅ Song added to playlist`);
      }
      setShowSelectorModal(false);
      setSelectedSongForPlaylist(null);
    }
  };

  const handleCreatePlaylist = async (name: string) => {
    const newPlaylist = await createPlaylist(name);
    if (newPlaylist && selectedSongForPlaylist) {
      await addSongToPlaylist(newPlaylist.id, selectedSongForPlaylist);
    }
    setShowCreateModal(false);
    setSelectedSongForPlaylist(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <FaSpinner className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  if (!currentSong) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <FaMusic size={64} className="mx-auto mb-4 text-gray-600" />
          <p className="text-xl">Song not found</p>
        </div>
      </div>
    );
  }

  const albumCover = currentSong.songCover_url || '';
  const albumTitle = currentSong.album?.title || 'Unknown Album';
  const artistNames = currentSong.artists?.map(a => a.name).join(', ') || 'Unknown Artist';

  return (
    <div className="flex flex-col h-screen bg-black text-gray-400 font-sans overflow-hidden">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
      
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 flex flex-col overflow-y-auto hide-scrollbar relative">
          
          <header className="absolute top-0 w-full z-20 p-6 px-10">
            <button onClick={() => navigate(-1)} className="bg-black/40 hover:bg-black/60 p-2.5 rounded-full text-white transition">
              <FaChevronLeft size={16} />
            </button>
          </header>

          <div className="relative shrink-0 min-h-[450px] flex flex-col justify-end p-12 bg-cover bg-center" 
               style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.9)), url('${albumCover}')` }}>
            <h1 className="text-8xl font-black text-white mb-8 tracking-tight">{albumTitle}</h1>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => handlePlay(currentSong.id)}
                className="bg-[#1d88b9] hover:scale-105 transition text-black px-10 py-2.5 rounded-full font-bold uppercase text-xs"
              >
                Play
              </button>
              <FaEllipsisH className="cursor-pointer hover:text-white ml-2 text-xl text-white" />
            </div>
          </div>

          <div className="p-12 pt-8 pb-32">
            <div className="grid grid-cols-12 gap-4 text-xs uppercase tracking-widest text-gray-500 font-bold border-b border-white/5 pb-4">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-9">Title</div>
              <div className="col-span-2 text-right pr-4">Time</div>
            </div>

            <div className="space-y-1 mt-4">
              {albumSongs.map((song, index) => (
                <Song
                  key={song.id}
                  id={song.id}
                  index={index + 1}
                  title={song.title}
                  artists={song.artists}
                  album={currentSong.album}
                  duration={song.duration}
                  coverUrl={song.songCover_url}
                  metadata={formatDate(new Date(song.created_at))}
                  onPlay={handlePlay}
                  onAddToPlaylist={handleAddToPlaylist}
                  onAddToFavorite={handleAddToFavorite}
                  hideAlbum={true}
                />
              ))}
            </div>
          </div>
        </main>

      {showSidebar && (
  <aside className="w-[380px] bg-linear-to-b from-[#0a0a1a] to-[#1a0a2e] border-l border-white/10 p-5 flex flex-col gap-5 overflow-y-auto animate-in slide-in-from-right">

    {/* Close Button */}
    <div className="flex justify-end">
      <button onClick={() => setShowSidebar(false)} className="text-gray-400 hover:text-white">
        <FaTimes size={20} />
      </button>
    </div>

    {/* Album Cover Animation */}
    <div className="relative bg-linear-to-br from-blue-600/20 to-purple-600/20 rounded-[30px] p-8 border border-blue-500/30 flex items-center justify-center min-h-[280px]">
      <img 
        src={albumCover} 
        alt={albumTitle}
        className="w-48 h-48 rounded-lg object-cover shadow-2xl"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>

    {/* Song Info + Heart & Add Buttons */}
    <div className="flex justify-between items-center mt-4">
      <div>
        <h2 className="text-white text-xl font-extrabold">{currentSong.title}</h2>
        <p className="text-gray-400 text-sm">{artistNames}</p>
      </div>

      {/* Buttons aligned to right of text */}
      <div className="flex gap-4">
        {/* Add to Playlist Button */}
        <button
          onClick={() => { setSelectedSongForPlaylist(id || '1'); setShowSelectorModal(true); }}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <FaPlus size={20} />
        </button>
      </div>
    </div>

    {/* Lyrics Section */}
    <div className="bg-blue-900/10 border border-blue-400/40 rounded-[25px] p-6 text-sm italic text-blue-100/80 flex flex-col gap-2 max-h-96 overflow-y-auto mt-2">
      {staticLyrics.map((line, idx) => (
        <p key={idx}>{line}</p>
      ))}
    </div>

    {/* Credits */}
    <div className="text-gray-500 text-xs mt-2">
      <p>{artistNames} - Main Artist</p>
    </div>
  </aside>
)}


      </div>

      <CreatePlaylistModal 
        isOpen={showCreateModal} 
        onClose={() => { setShowCreateModal(false); setSelectedSongForPlaylist(null); }} 
        onCreatePlaylist={handleCreatePlaylist} 
        initialSongId={selectedSongForPlaylist || undefined} 
      />

      <PlaylistSelectorModal 
        isOpen={showSelectorModal} 
        onClose={() => { setShowSelectorModal(false); setSelectedSongForPlaylist(null); }} 
        songId={selectedSongForPlaylist || ''} 
        onSelectPlaylist={handleSelectPlaylist}
        onCreateNew={() => { setShowSelectorModal(false); setShowCreateModal(true); }} 
      />
    </div>
  );
};

export default SongDetails;