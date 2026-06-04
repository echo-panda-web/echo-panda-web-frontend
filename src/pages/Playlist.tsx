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
            <div className={`relative p-[1.5px] rounded-[2.5rem] transition-all duration-500 bg-linear-to-r ${isGenerating ? 'from-indigo-500 via-fuchsia-500 to-indigo-500 animate-gradient-x' : 'from-white/10 to-white/5'} shadow-2xl overflow-hidden`}>
                <div className="bg-[#0c0c0e]/80 rounded-[2.45rem] p-3 backdrop-blur-3xl">
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
                            className="group h-14 px-10 rounded-3xl bg-indigo-600 text-white font-black uppercase tracking-widest text-[11px] flex items-center gap-3 hover:bg-indigo-500 transition-all active:scale-95 disabled:opacity-20 shadow-xl"
                        >
                            {isGenerating ? 'Synthesizing' : 'Synthesize Mix'}
                            {!isGenerating && <FaArrowRight className="group-hover:translate-x-1 transition-transform" size={10} />}
                        </button>
                    </form>
                </div>
            </div>

            {/* AI Suggestions */}
            {!aiResult && !selectedPlaylistId && (
                <div className="flex flex-wrap justify-center gap-3 mt-8 animate-in fade-in duration-1000">
                    {['Euphoric EDM Festival', 'Deep Focus Khmer', 'Midnight Jazz Loft', 'High Intensity Cardio'].map(s => (
                        <button key={s} onClick={() => setAiPrompt(s)} className="px-6 py-3 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-300 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all">
                            {s}
                        </button>
                    ))}
                </div>
            )}
        </section>

        {/* ── PERSONAL ARCHIVE ── */}
        <section className="mb-16">
            <div className="flex items-center justify-between mb-8 px-2">
                <div className="flex items-center gap-4">
                    <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Library Archive</h3>
                    <div className="h-px w-24 bg-white/10" />
                </div>
                {aiResult && (
                    <button onClick={() => {setAiResult(null); loadPlaylists();}} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors">
                        <FaRedo /> Return to library
                    </button>
                )}
            </div>

            <div className="flex gap-6 overflow-x-auto pb-10 no-scrollbar mask-fade-right px-2">
                {/* Manual Creation Entry */}
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="shrink-0 w-56 h-72 rounded-[2.5rem] bg-white/[0.03] border border-dashed border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group flex flex-col items-center justify-center gap-4"
                >
                    <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-500 transition duration-500">
                        <FaPlus size={24} className="text-slate-600 group-hover:text-white" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-blue-400">Add Collection</span>
                </button>

                {/* Unified Collection Cards */}
                {playlists.map((p) => {
                    const isAiStored = (p as any).isAi;
                    const isActive = selectedPlaylistId === p.id && !aiResult;

                    return (
                        <div
                            key={p.id}
                            onClick={() => {setAiResult(null); setSelectedPlaylistId(p.id);}}
                            className={`group shrink-0 w-56 h-72 rounded-[3rem] p-8 cursor-pointer transition-all duration-500 relative flex flex-col justify-end overflow-hidden border ${isActive ? 'bg-white/10 border-white/20 shadow-2xl scale-105 z-10' : 'bg-slate-900/40 border-white/5 hover:bg-slate-900/80 hover:border-white/10 hover:-translate-y-2'}`}
                        >
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDeletePlaylist(p.id); }}
                                className="absolute top-6 right-6 z-20 opacity-0 group-hover:opacity-100 p-3 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl transition-all scale-75 group-hover:scale-100 backdrop-blur-md"
                            >
                                <FaTrash size={12} />
                            </button>

                            <div className={`absolute top-0 left-0 w-full h-2/3 flex items-center justify-center opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-110 transition-all duration-700 ${isAiStored ? 'text-indigo-400' : 'text-slate-400'}`}>
                                {isAiStored ? <FaMagic size={100} /> : <FaMusic size={100} />}
                            </div>

                            <div className="relative z-10 space-y-2">
                                <div className="flex items-center gap-2">
                                    {isAiStored && <Sparkles size={12} className="text-indigo-400" />}
                                    <h4 className="font-black text-white text-xl truncate">{p.name}</h4>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{p.song_count} Audio Objects</span>
                                    {isActive && <div className="flex gap-1"><div className="w-1 h-1 rounded-full bg-blue-400 animate-bounce" style={{animationDelay:'0s'}}/><div className="w-1 h-1 rounded-full bg-blue-400 animate-bounce" style={{animationDelay:'0.2s'}}/><div className="w-1 h-1 rounded-full bg-blue-400 animate-bounce" style={{animationDelay:'0.4s'}}/></div>}
                                </div>
                            </div>

                            {/* Card Hover Gradient */}
                            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-linear-to-tr ${isAiStored ? 'from-indigo-600/10 to-transparent' : 'from-blue-600/10 to-transparent'}`} />
                        </div>
                    );
                })}
            </div>
        </section>

        {/* ── SONIC DATA STRUCTURE ── */}
        {songs.length > 0 ? (
            <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
                <div className="flex items-center gap-10 mb-12 px-6">
                    <button
                        onClick={() => handlePlay(songs[0].id)}
                        className={`w-20 h-20 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl transition-all hover:scale-110 active:scale-95 ${aiResult ? 'bg-indigo-600 shadow-indigo-600/40 hover:bg-indigo-500' : 'bg-blue-600 shadow-blue-600/40 hover:bg-blue-500'}`}
                    >
                        <FaPlay size={28} className="ml-1" />
                    </button>

                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                           <h2 className="text-2xl font-black text-white uppercase tracking-tight">Audio Sequence</h2>
                           {aiResult && <span className="bg-indigo-500/20 text-indigo-400 text-[8px] font-black px-2 py-0.5 rounded border border-indigo-500/20 uppercase tracking-widest">Optimized by AI</span>}
                        </div>
                        <p className="text-[10px] font-black text-slate-500 mt-2 uppercase tracking-[0.3em]">Temporal Arrangement based on profile metrics</p>
                    </div>

                    <div className="flex items-center gap-6 text-slate-600">
                        <FaRandom size={20} className="hover:text-white cursor-pointer transition-colors" />
                        <div className="h-8 w-px bg-white/10" />
                        <FaList size={20} className="hover:text-white cursor-pointer transition-colors" />
                    </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-[4rem] overflow-hidden backdrop-blur-3xl shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
                    <div className="grid grid-cols-12 gap-4 px-12 py-8 text-[11px] font-black text-slate-500 uppercase border-b border-white/5 tracking-[0.4em]">
                        <div className="col-span-1 text-center">#</div>
                        <div className="col-span-9">Acoustic Signal / Composition</div>
                        <div className="col-span-2 text-right pr-6">Duration</div>
                    </div>

                    <div className="px-6 pb-10 pt-4 space-y-1">
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
            <div className="py-48 text-center animate-in fade-in duration-1000">
                <div className="w-28 h-28 bg-white/5 rounded-[3rem] flex items-center justify-center mx-auto mb-10 border border-white/10 relative">
                    <Music className="text-slate-800" size={48} />
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center border border-indigo-500/30">
                        <Sparkles size={16} className="text-indigo-400" />
                    </div>
                </div>
                <h3 className="text-3xl font-black text-white mb-4 tracking-tighter">Null Library State.</h3>
                <p className="text-slate-500 max-w-md mx-auto text-base font-medium leading-relaxed px-10">
                    Your collection is currently empty. Describe a sonic profile to the AI Engine above to synthesize a unique collection instantly.
                </p>
            </div>
        )}
      </main>

      {/* Manual Creation Overlay */}
      {isModalOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-6 animate-in zoom-in duration-500 backdrop-blur-3xl">
              <div className="absolute inset-0 bg-black/80" onClick={() => setIsModalOpen(false)} />
              <div className="relative bg-[#0c0c0e] w-full max-w-sm rounded-[4rem] p-12 border border-white/10 shadow-2xl overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl" />

                  <div className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500 mb-4">Initialize</div>
                  <h2 className="text-4xl font-black text-white mb-10 tracking-tighter">Collection.</h2>

                  <input
                    autoFocus
                    placeholder="Collection ID..."
                    className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-6 text-white mb-10 outline-none focus:border-blue-500 transition-all font-bold text-lg shadow-inner"
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
                  <div className="flex gap-6">
                    <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-[11px] font-black uppercase tracking-widest text-slate-600 hover:text-white transition">Abort</button>
                    <button className="flex-1 py-5 rounded-[2rem] bg-blue-600 text-white font-black uppercase tracking-widest text-[11px] hover:bg-blue-500 transition shadow-2xl shadow-blue-900/40 active:scale-95">Create</button>
                  </div>
              </div>
          </div>
      )}

      <AppFooter isLightMode={false} />
    </div>
  );
};

export default PlaylistPage;
