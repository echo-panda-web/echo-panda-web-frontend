import React, { useState, useEffect } from 'react';
import { FaPlay, FaRandom, FaMusic, FaTrash, FaList, FaPlus, FaSpinner, FaMagic, FaArrowRight, FaRedo, FaRobot } from 'react-icons/fa';
import { Music, Clock, User, Sparkles, Wand2 } from 'lucide-react';
import AppFooter from '../components/AppFooter';
import Song from '../components/Song';
import { useDataCache } from '../contexts/DataCacheContext';
import { buildApiUrl } from '../backend/backendUrls';
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
  isAi?: boolean;
}

const PlaylistHero: React.FC<PlaylistHeroProps> = ({ title, songCount, duration, isAi }) => {
  return (
    <header className="relative px-4 sm:px-12 pt-24 pb-12 overflow-hidden transition-all duration-700">
      {/* Dynamic Background */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${isAi ? 'bg-indigo-950/40 opacity-100' : 'bg-blue-950/20 opacity-100'}`} />
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-black" />

      {/* Animated Blur Orbs */}
      <div className={`absolute top-0 -left-20 w-96 h-96 rounded-full blur-[120px] mix-blend-screen animate-pulse pointer-events-none ${isAi ? 'bg-indigo-500/10' : 'bg-blue-500/10'}`} />
      <div className={`absolute bottom-0 right-0 w-64 h-64 rounded-full blur-[100px] pointer-events-none ${isAi ? 'bg-fuchsia-500/10' : 'bg-cyan-500/5'}`} />

      {/* Content Grid */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-10 relative z-10">
        {/* Cover Art */}
        <div className={`relative group w-48 h-48 md:w-64 md:h-64 rounded-[2.5rem] overflow-hidden shadow-2xl transition-transform duration-500 hover:scale-[1.02] border border-white/10 ${isAi ? 'bg-indigo-600/20' : 'bg-white/5'}`}>
          {isAi ? (
            <div className="w-full h-full flex flex-col items-center justify-center relative">
                <Sparkles className="text-indigo-400 w-24 h-24 mb-4 drop-shadow-[0_0_15px_rgba(129,140,248,0.5)]" />
                <div className="absolute inset-0 bg-linear-to-t from-indigo-900/40 to-transparent" />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
                <Music className="text-white/10 w-24 h-24" />
            </div>
          )}

          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
             <FaPlay className="text-white text-4xl ml-2" />
          </div>
        </div>

        {/* Info Block */}
        <div className="flex flex-col gap-4 text-center md:text-left flex-1 min-w-0">
          <div className="flex items-center gap-3 justify-center md:justify-start">
             <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border ${isAi ? 'bg-indigo-500/20 border-indigo-400/30 text-indigo-300' : 'bg-blue-500/20 border-blue-400/30 text-blue-300'}`}>
                {isAi ? 'AI Engine Mix' : 'User Playlist'}
             </span>
             {isAi && <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping" />}
          </div>

          <h1 className="text-4xl md:text-7xl font-black text-white tracking-tight truncate leading-none">
            {title}
          </h1>

          <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-sm font-bold text-slate-400">
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className={`w-8 h-8 rounded-2xl flex items-center justify-center transition-colors ${isAi ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-300 group-hover:bg-blue-500 group-hover:text-white'}`}>
                {isAi ? <FaRobot size={14} /> : <User size={14} />}
              </div>
              <span className="text-slate-200">{isAi ? 'Echo Panda AI' : 'Library Curator'}</span>
            </div>
            <span className="w-1 h-1 rounded-full bg-slate-700" />
            <span>{songCount} Tracks</span>
            <span className="w-1 h-1 rounded-full bg-slate-700" />
            <div className="flex items-center gap-2">
              <Clock size={14} />
              <span>{duration}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

// ─── Main Page Component ──────────────────────────────────────────────────────

const PlaylistPage: React.FC = () => {
  const { playSong } = useAudioPlayer();
  const { getCachedData } = useDataCache();

  // State
  const [songs, setSongs] = useState<SongData[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [playlistsLoading, setPlaylistsLoading] = useState(true);

  // AI State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  useEffect(() => {
    loadPlaylists();
  }, []);

  useEffect(() => {
    if (selectedPlaylistId) {
      loadPlaylistSongs(selectedPlaylistId);
    } else if (!aiResult) {
      setSongs([]);
    }
  }, [selectedPlaylistId]);

  const loadPlaylists = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        setPlaylistsLoading(false);
        return;
    }

    try {
      setPlaylistsLoading(true);
      const data = await getUserPlaylists();
      setPlaylists(data);
    } catch (error) {
      console.warn('User session required for library sync.');
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

  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsGenerating(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to use AI Crafting');
        return;
      }

      const response = await fetch(buildApiUrl('/ai-playlists/generate'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt: aiPrompt })
      });

      const data = await response.json();
      if (response.ok) {
          // Success UX
          setAiResult(data);
          setSongs(data.songs);
          setSelectedPlaylistId(null);
          await loadPlaylists(); // Refresh list to show stored result
      } else {
          alert(data.message || 'The AI is resting. Try again in a moment.');
      }
    } catch (err) {
      console.error('System Failure:', err);
    } finally {
      setIsGenerating(false);
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
      if (aiResult && `ai_${aiResult.playlist_id}` === id) {
          setAiResult(null);
          setSongs([]);
      }
    } catch (error) {
      console.error('Delete operation failed:', error);
    }
  };

  const handlePlay = async (songId: string) => {
    try {
      await trackSongPlay(songId);
      const song = songs.find((s) => s.id === songId);
      if (song) {
        playSong({
          id: song.id,
          title: song.title,
          artist: song.artists?.map((a) => a.name).join(', ') || 'Various Artists',
          coverUrl: song.songCover_url || song.album?.cover_url || '',
          audioUrl: song.original_key || song.audio_url || '',
          duration: song.duration,
        });
      }
    } catch (error) {
      console.error('Playback Error:', error);
    }
  };

  const totalDuration = songs.reduce((sum, song) => sum + (song.duration || 0), 0);

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-indigo-500/30">

      {/* ── Header / Hero ── */}
      <PlaylistHero
        title={aiResult ? aiResult.title : (playlists.find(p => p.id === selectedPlaylistId)?.name || 'Your Library')}
        songCount={songs.length}
        duration={`${Math.floor(totalDuration / 60)} min`}
        isAi={!!aiResult}
      />

      <main className="px-4 sm:px-12 -mt-12 relative z-10 pb-32">

        {/* ── AI PROMPT ENGINE ── */}
        <section className="max-w-4xl mx-auto mb-16">
            <div className={`relative p-[1px] rounded-[2.5rem] transition-all duration-500 bg-linear-to-r ${isGenerating ? 'from-indigo-500 via-fuchsia-500 to-indigo-500 animate-gradient-x' : 'from-white/10 to-white/5'} shadow-2xl`}>
                <div className="bg-[#0c0c0e] rounded-[2.45rem] p-3 backdrop-blur-3xl">
                    <form onSubmit={handleAiGenerate} className="flex items-center gap-3">
                        <div className={`w-14 h-14 rounded-3xl flex items-center justify-center transition-colors ${isGenerating ? 'bg-indigo-500 text-white' : 'bg-white/5 text-indigo-400'}`}>
                            {isGenerating ? <FaSpinner className="animate-spin" size={20} /> : <Wand2 size={22} />}
                        </div>

                        <input
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder="Describe your mood... 'K-Pop gym energy' or 'Khmer rainy night drive'"
                            className="flex-1 bg-transparent border-none outline-none px-4 text-lg font-medium text-white placeholder:text-slate-600"
                            disabled={isGenerating}
                        />

                        <button
                            type="submit"
                            disabled={isGenerating || !aiPrompt.trim()}
                            className="group h-14 px-10 rounded-3xl bg-white text-black font-black uppercase tracking-widest text-[11px] flex items-center gap-3 hover:bg-indigo-400 hover:text-white transition-all active:scale-95 disabled:opacity-20 shadow-xl"
                        >
                            {isGenerating ? 'Analyzing' : 'Craft Mix'}
                            {!isGenerating && <FaArrowRight className="group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>
                </div>
            </div>

            {/* AI Suggestions */}
            {!aiResult && !selectedPlaylistId && (
                <div className="flex flex-wrap justify-center gap-3 mt-6 animate-in fade-in duration-700">
                    {['Summer road trip', 'Deep Focus Khmer', 'Midnight Jazz', 'Energetic Workout'].map(s => (
                        <button key={s} onClick={() => setAiPrompt(s)} className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white hover:bg-white/10 transition-all">
                            {s}
                        </button>
                    ))}
                </div>
            )}
        </section>

        {/* ── HORIZONTAL COLLECTION SCROLL ── */}
        <section className="mb-16">
            <div className="flex items-center justify-between mb-8 px-2">
                <div className="flex items-center gap-4">
                    <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Personal Collections</h3>
                    <div className="h-px w-20 bg-white/10" />
                </div>
                {aiResult && (
                    <button onClick={() => {setAiResult(null); loadPlaylists();}} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors">
                        <FaRedo /> Clear AI Preview
                    </button>
                )}
            </div>

            <div className="flex gap-6 overflow-x-auto pb-8 no-scrollbar mask-fade-right px-2">
                {/* Create Action */}
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="shrink-0 w-48 h-64 rounded-[2.5rem] bg-white/5 border border-dashed border-white/10 hover:border-blue-500/50 hover:bg-white/10 transition-all group flex flex-col items-center justify-center gap-4"
                >
                    <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition duration-500">
                        <FaPlus size={24} className="text-slate-600 group-hover:text-blue-400" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500 group-hover:text-blue-400">New Playlist</span>
                </button>

                {/* Playlist Cards */}
                {playlists.map((p) => {
                    const isAiStored = (p as any).isAi;
                    const isActive = selectedPlaylistId === p.id && !aiResult;

                    return (
                        <div
                            key={p.id}
                            onClick={() => {setAiResult(null); setSelectedPlaylistId(p.id);}}
                            className={`group shrink-0 w-48 h-64 rounded-[2.5rem] p-6 cursor-pointer transition-all duration-500 relative flex flex-col justify-end overflow-hidden border ${isActive ? 'bg-white/15 border-white/20 shadow-2xl' : 'bg-slate-900/40 border-white/5 hover:bg-slate-900/80 hover:border-white/10'}`}
                        >
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDeletePlaylist(p.id); }}
                                className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 p-2.5 bg-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl transition-all scale-75 group-hover:scale-100 backdrop-blur-md"
                            >
                                <FaTrash size={10} />
                            </button>

                            <div className={`absolute top-0 left-0 w-full h-1/2 flex items-center justify-center opacity-10 group-hover:scale-110 transition-transform duration-700 ${isAiStored ? 'text-indigo-400' : 'text-slate-600'}`}>
                                {isAiStored ? <Sparkles size={64} /> : <Music size={64} />}
                            </div>

                            <div className="relative z-10">
                                <h4 className="font-black text-white text-lg truncate mb-1">{p.name}</h4>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{p.song_count} Tracks</span>
                                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)] animate-pulse" />}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>

        {/* ── TRACK ARCHITECTURE ── */}
        {songs.length > 0 ? (
            <div className="animate-in fade-in slide-in-from-bottom-10 duration-700">
                <div className="flex items-center gap-8 mb-10 px-4">
                    <button
                        onClick={() => handlePlay(songs[0].id)}
                        className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-2xl transition-all hover:scale-110 active:scale-95 ${aiResult ? 'bg-indigo-600 shadow-indigo-600/40' : 'bg-blue-600 shadow-blue-600/40'}`}
                    >
                        <FaPlay size={24} className="ml-1" />
                    </button>

                    <div className="flex-1">
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">Track Sequence</h2>
                        <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Calculated order based on preference</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors">
                            <FaRandom size={18} />
                        </button>
                        <button className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors">
                            <FaList size={18} />
                        </button>
                    </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] overflow-hidden backdrop-blur-md shadow-2xl">
                    <div className="grid grid-cols-12 gap-4 px-10 py-6 text-[10px] font-black text-slate-600 uppercase border-b border-white/5 tracking-[0.3em]">
                        <div className="col-span-1 text-center">#</div>
                        <div className="col-span-9">Acoustic Structure</div>
                        <div className="col-span-2 text-right">Time</div>
                    </div>

                    <div className="px-4 py-6 space-y-1">
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
                                hideAlbum={true}
                                onRemoveFromPlaylist={aiResult ? undefined : (id) => handleRemoveFromPlaylist(id)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        ) : (
            <div className="py-40 text-center animate-in fade-in duration-1000">
                <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-white/10">
                    <Music className="text-slate-800" size={40} />
                </div>
                <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Silent Library</h3>
                <p className="text-slate-500 max-w-sm mx-auto text-sm font-medium leading-relaxed px-10">
                    Select a collection from above or describe your vibe to the AI Engine to synthesize a custom mix.
                </p>
            </div>
        )}
      </main>

      {/* Playlist Creation Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-6 animate-in zoom-in duration-300 backdrop-blur-xl">
              <div className="absolute inset-0 bg-black/80" onClick={() => setIsModalOpen(false)} />
              <div className="relative bg-[#121214] w-full max-w-sm rounded-[3rem] p-10 border border-white/10 shadow-2xl">
                  <div className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500 mb-2">New Collection</div>
                  <h2 className="text-3xl font-black text-white mb-8">Playlist.</h2>

                  <input
                    autoFocus
                    placeholder="Enter name..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white mb-8 outline-none focus:border-blue-500 transition-all font-bold"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            const val = (e.target as HTMLInputElement).value;
                            if (val.trim()) {
                                createPlaylist(val.trim()).then(() => {
                                    loadPlaylists();
                                    setIsModalOpen(false);
                                });
                            }
                        }
                    }}
                  />
                  <div className="flex gap-4">
                    <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition">Cancel</button>
                    <button className="flex-1 py-4 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] hover:bg-blue-500 transition shadow-xl shadow-blue-900/20">Create</button>
                  </div>
              </div>
          </div>
      )}

      <AppFooter isLightMode={false} />
    </div>
  );
};

export default PlaylistPage;
