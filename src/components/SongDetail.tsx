import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaEllipsisH, FaChevronLeft, FaPlay, FaPause, FaHeart,
  FaCompactDisc, FaSpinner, FaCheckCircle, FaMusic, FaLink, FaShareSquare,
  FaTimes
} from 'react-icons/fa';
import { trackSongPlay } from '../backend/playTrackingService';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { isSongFavorite, toggleFavorite } from '../backend/favoritesService';
import { getSignedSongCoverUrl, getSignedArtistImageUrl } from '../backend/songMediaApi';

const viteEnv = (import.meta as any).env || {};
const BACKEND_API_BASE_URL = viteEnv.VITE_BACKEND_API_URL || 'http://localhost:8082/api';

interface Artist { id: string; name: string; image_url: string; bio?: string; }
interface Album { id: string; title: string; cover_url: string; release_date: string; }
interface SongData {
  id: string; title: string; duration: number; album_id: string | null;
  audio_url: string | null; songCover_url: string | null; created_at: string;
  lyrics?: string; artists?: Artist[]; album?: Album;
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const SongDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { playSong, currentSong: playingSong, isPlaying, togglePlayPause, closePlayer } = useAudioPlayer();

  const [currentSong, setCurrentSong] = useState<SongData | null>(null);
  const [albumSongs, setAlbumSongs] = useState<SongData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);

  // Share Dropdown States
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  const getArtistName = (artist: any) => {
    if (!artist) return 'Unknown Artist';
    if (typeof artist === 'string') return artist;
    return artist.stage_name || artist.name || 'Unknown Artist';
  };

  useEffect(() => {
    if (id) {
      fetchSongAndAlbum();
      checkLikedStatus();
    }
  }, [id]);

  // Close share menu if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setShowShareMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const checkLikedStatus = async () => {
    if (id) {
      const fav = await isSongFavorite(id);
      setIsLiked(fav);
    }
  };

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (id) {
      const success = await toggleFavorite(id);
      if (success) setIsLiked(!isLiked);
    }
  };

  const handleCopyLink = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setShowShareMenu(false);
    }, 1800);
  };

  const handleSocialShare = (platform: string) => {
    const currentUrl = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Listen to ${currentSong?.title || 'this song'} on Echo Panda!`);
    let shareUrl = '';

    if (platform === 'facebook') {
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${currentUrl}`;
    } else if (platform === 'telegram') {
      shareUrl = `https://t.me/share/url?url=${currentUrl}&text=${text}`;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
      setShowShareMenu(false);
    }
  };

  const fetchSongAndAlbum = async () => {
    try {
      setLoading(true);
      const songRes = await fetch(`${BACKEND_API_BASE_URL}/songs/${id}`, { headers: { Accept: 'application/json' } });
      if (!songRes.ok) throw new Error(`Failed to fetch song ${id}`);
      const songData = await songRes.json();

      const artistId = songData.artist_id || songData.artist?.id || null;
      const [signedSongCover, signedArtistImage] = await Promise.all([
        getSignedSongCoverUrl(songData.id),
        artistId ? getSignedArtistImageUrl(artistId) : Promise.resolve(null)
      ]);

      const transformedSong: SongData = {
        id: String(songData.id),
        title: songData.title,
        duration: songData.duration,
        album_id: songData.album_id,
        audio_url: songData.audio_url || null,
        songCover_url: signedSongCover || songData.album?.cover_url || songData.album?.cover_image || null,
        created_at: songData.created_at,
        lyrics: songData.lyrics || "",
        album: songData.album ? {
          id: String(songData.album.id),
          title: songData.album.title,
          cover_url: songData.album.cover_url || songData.album.cover_image,
          release_date: songData.album.release_date
        } : undefined,
        artists: artistId ? [{
            id: String(artistId),
            name: getArtistName(songData.artist),
            image_url: signedArtistImage || '',
            bio: songData.artist?.bio || ''
        }] : []
      };

      setCurrentSong(transformedSong);

      if (songData.album_id) {
        const albumSongsRes = await fetch(`${BACKEND_API_BASE_URL}/songs?album_id=${songData.album_id}&per_page=200`, { headers: { Accept: 'application/json' } });
        if (albumSongsRes.ok) {
          const albumSongsJson = await albumSongsRes.json();
          const data = Array.isArray(albumSongsJson?.data) ? albumSongsJson.data : [];
          setAlbumSongs(data.map((s: any) => ({
            id: String(s.id),
            title: s.title,
            duration: s.duration,
            artists: s.artist ? [{ id: String(s.artist_id), name: getArtistName(s.artist), image_url: '' }] : []
          } as any)));
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    navigate(-1);
  };

  const handleStopAndClose = () => {
    closePlayer();
    navigate(-1);
  };

  const handlePlay = (songToPlay: SongData) => {
    trackSongPlay(songToPlay.id);
    playSong({
      id: songToPlay.id,
      title: songToPlay.title,
      artist: songToPlay.artists?.map(a => a.name).join(', ') || 'Unknown Artist',
      coverUrl: songToPlay.songCover_url || currentSong?.songCover_url || '',
      audioUrl: songToPlay.audio_url || '',
      duration: songToPlay.duration
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full min-h-[400px] bg-black">
      <FaSpinner className="animate-spin text-indigo-500" size={40} />
    </div>
  );

  if (!currentSong) return null;

  const artistName = currentSong.artists?.[0]?.name || 'Unknown Artist';
  const songCoverUrl = currentSong.songCover_url;
  const isCurrentlyPlaying = playingSong?.id === currentSong.id;

  return (
    <div className="relative w-full min-h-screen bg-[#050505] text-white font-sans selection:bg-indigo-500/30 overflow-x-hidden pb-12">

      {/* 1. DYNAMIC BACKGROUND LAYER */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 via-[#050505]/95 to-[#050505] z-10" />
          {songCoverUrl && (
            <img
              src={songCoverUrl}
              className="w-full h-[600px] object-cover opacity-20 blur-[120px] scale-125 select-none"
              alt=""
            />
          )}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-8">

         {/* Top Navigation */}
         <header className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <button onClick={handleClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all border border-white/5 active:scale-90 group">
                  <FaChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
               </button>
               <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">Echo Panda</span>
                  <div className="flex items-center gap-2">
                     <span className="text-xs font-semibold text-slate-400">{artistName}</span>
                     <div className="w-1 h-1 rounded-full bg-indigo-500" />
                     <span className="text-xs text-slate-200">Playing</span>
                  </div>
               </div>
            </div>

            <button
               onClick={handleStopAndClose}
               className="group flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all border border-white/5 active:scale-95 shadow-lg"
               title="Close & Stop Song"
            >
               <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:block">Close Player</span>
               <FaTimes size={14} />
            </button>
         </header>

         {/* 2. HERO CONTENT SECTION */}
         <div className="flex flex-col lg:flex-row gap-10 items-center lg:items-end bg-white/[0.02] border border-white/[0.05] p-8 rounded-[2.5rem] backdrop-blur-2xl shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
               <FaMusic size={120} />
            </div>

            <div className="w-56 h-56 md:w-64 md:h-64 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] shrink-0 border border-white/10 relative">
               <img src={songCoverUrl || ''} className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110" alt={currentSong.title} />
               <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                  <FaCompactDisc className="text-white/70 animate-spin-slow text-5xl" />
               </div>
            </div>

            <div className="flex-1 space-y-6 text-center lg:text-left w-full">
               <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                     <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-indigo-500/20 shadow-glow">
                        Master Quality
                     </span>
                     <span className="text-slate-400 text-xs font-medium flex items-center gap-2">
                        <FaCompactDisc className="text-indigo-400/60" size={14} /> {currentSong.album?.title || 'Single'}
                     </span>
                  </div>

                  <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none uppercase drop-shadow-2xl">
                     {currentSong.title}
                  </h1>

                  <div className="flex items-center justify-center lg:justify-start gap-3">
                     <span className="text-lg font-bold text-slate-300">{artistName}</span>
                     <FaCheckCircle className="text-indigo-500" size={16} />
                  </div>
               </div>

               <div className="flex flex-wrap items-center justify-center lg:justify-start gap-5 pt-2">
                  <button
                    onClick={() => handlePlay(currentSong)}
                    className="bg-white hover:bg-indigo-500 text-black hover:text-white px-10 py-4 rounded-full font-bold text-xs uppercase tracking-[0.2em] shadow-xl transition-all flex items-center gap-3 active:scale-95 transform hover:-translate-y-1"
                  >
                    {isCurrentlyPlaying && isPlaying ? <FaPause size={12} /> : <FaPlay size={12} className="ml-0.5" />}
                    {isCurrentlyPlaying && isPlaying ? 'Pause Track' : 'Play Track'}
                  </button>

                  <button
                    onClick={handleToggleLike}
                    className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all active:scale-90 ${isLiked ? 'bg-rose-500 border-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.3)]' : 'border-white/10 text-slate-400 hover:border-white/30 hover:text-white'}`}
                  >
                    <FaHeart size={20} />
                  </button>

                  <div className="relative" ref={shareMenuRef}>
                     <button
                        onClick={() => setShowShareMenu(!showShareMenu)}
                        className={`w-14 h-14 rounded-full border-2 border-white/10 text-slate-400 hover:border-white/30 hover:text-white transition-all flex items-center justify-center active:scale-90 ${showShareMenu ? 'bg-white/10 text-white' : ''}`}
                     >
                        <FaEllipsisH size={20} />
                     </button>

                     {showShareMenu && (
                        <div className="absolute left-0 mt-4 w-60 rounded-2xl bg-[#121216] border border-white/10 p-2 shadow-2xl z-50 animate-fadeIn backdrop-blur-3xl">
                           <button
                              onClick={handleCopyLink}
                              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-left text-xs font-bold text-slate-200 transition-colors uppercase tracking-wider"
                           >
                              {copied ? (
                                 <><FaCheckCircle className="text-emerald-400" size={14} /> <span className="text-emerald-400">Copied!</span></>
                              ) : (
                                 <><FaLink className="text-indigo-400" size={14} /> <span>Copy Link</span></>
                              )}
                           </button>
                           <div className="h-[1px] bg-white/5 my-1" />
                           <button onClick={() => handleSocialShare('telegram')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-left text-xs font-bold text-slate-200 transition-colors uppercase tracking-wider">
                              <FaShareSquare className="text-sky-400" size={14} /> <span>Telegram</span>
                           </button>
                           <button onClick={() => handleSocialShare('facebook')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-left text-xs font-bold text-slate-200 transition-colors uppercase tracking-wider">
                              <FaShareSquare className="text-blue-500" size={14} /> <span>Facebook</span>
                           </button>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         </div>

         {/* 3. SIDE-BY-SIDE SIDEBAR LAYOUT */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">

            {/* Left Box: Tracklist Component */}
            <div className="lg:col-span-2 bg-white/[0.01] border border-white/[0.04] rounded-[2rem] p-8 flex flex-col justify-between h-[520px] backdrop-blur-md">
               <div className="w-full">
                  <div className="flex justify-between items-center pb-5 border-b border-white/5 mb-5">
                     <h3 className="text-[10px] font-bold text-slate-500 tracking-[0.3em] uppercase">Album Content</h3>
                     <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/10">
                       {albumSongs.length} Tracks
                     </p>
                  </div>

                  <div className="space-y-1 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                     {albumSongs.map((song, i) => {
                        const isThisPlaying = playingSong?.id === song.id;
                        return (
                           <div
                             key={song.id}
                             onClick={() => handlePlay(song as any)}
                             className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group cursor-pointer border ${isThisPlaying ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-transparent border-transparent hover:bg-white/[0.02]'}`}
                           >
                              <div className="flex items-center gap-5 min-w-0">
                                 <div className="w-6 flex justify-center shrink-0">
                                    {isThisPlaying && isPlaying ? (
                                       <div className="flex items-end gap-[3px] h-4 w-4">
                                          <div className="w-[3px] bg-indigo-400 animate-bar-1" />
                                          <div className="w-[3px] bg-indigo-400 animate-bar-2" />
                                          <div className="w-[3px] bg-indigo-400 animate-bar-3" />
                                       </div>
                                    ) : (
                                       <span className={`text-[11px] font-bold group-hover:hidden transition-colors ${isThisPlaying ? 'text-indigo-400' : 'text-slate-600'}`}>
                                          {(i + 1).toString().padStart(2, '0')}
                                       </span>
                                    )}
                                    <FaPlay className={`hidden group-hover:block transition-colors ${isThisPlaying ? 'text-indigo-400' : 'text-slate-300'}`} size={10} />
                                 </div>
                                 <div className="min-w-0">
                                    <h4 className={`text-[15px] font-bold truncate ${isThisPlaying ? 'text-indigo-400' : 'text-slate-200'}`}>{song.title}</h4>
                                    <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5 uppercase tracking-wider">{artistName}</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-4 shrink-0">
                                 <span className="text-xs font-mono text-slate-500 group-hover:text-slate-300">{formatDuration(song.duration)}</span>
                              </div>
                           </div>
                        );
                     })}
                  </div>
               </div>
            </div>

            {/* Right Box: Combined Sidebar Cards */}
            <div className="flex flex-col gap-6 h-[520px]">
               <div className="flex-1 bg-white/[0.01] border border-white/[0.04] rounded-[2rem] p-8 flex flex-col justify-between backdrop-blur-md">
                  <div>
                     <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-slate-800 shrink-0 border border-white/10 overflow-hidden shadow-2xl">
                            {currentSong.artists?.[0]?.image_url ? (
                              <img src={currentSong.artists[0].image_url} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-indigo-500/10"><FaMusic className="text-indigo-500/40" size={20} /></div>
                            )}
                        </div>
                        <div className="min-w-0">
                           <div className="flex items-center gap-2">
                              <h4 className="text-base font-bold text-white truncate">{artistName}</h4>
                              <FaCheckCircle className="text-indigo-500" size={13} />
                           </div>
                           <p className="text-[10px] font-bold text-indigo-400/80 tracking-widest uppercase mt-1">Verified Artist</p>
                        </div>
                     </div>
                     <p className="text-sm text-slate-400 font-normal leading-relaxed line-clamp-4">
                        {currentSong.artists?.[0]?.bio || `Explore the high-fidelity soundscapes of ${artistName}. Known for pushing tactical boundaries across modern composition styles.`}
                     </p>
                  </div>
                  <button onClick={() => navigate(`/artist/${currentSong.artists?.[0]?.id}`)} className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-300 hover:text-white transition-all active:scale-95 border border-white/5">
                     Artist Profile
                  </button>
               </div>

               <div className="flex-1 p-8 bg-indigo-500/[0.02] border border-indigo-500/[0.05] rounded-[2rem] flex flex-col justify-start backdrop-blur-md">
                  <h4 className="text-[10px] font-bold text-indigo-400 tracking-[0.3em] uppercase mb-4">Lyrics Snippet</h4>
                  <div className="text-base font-medium text-slate-300 italic space-y-2 overflow-y-auto max-h-[160px] custom-scrollbar pr-2">
                     {currentSong.lyrics ? currentSong.lyrics.split('\n').map((line, i) => (
                        <p key={i} className="hover:text-white transition-colors cursor-default">{line}</p>
                     )) : <p className="text-xs text-slate-500 not-italic uppercase tracking-widest opacity-50">Instrumental Asset</p>}
                  </div>
               </div>
            </div>
         </div>
      </div>

      <style>{`
         .animate-spin-slow { animation: spin 15s linear infinite; }
         @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

         @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
         .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }

         .shadow-glow { box-shadow: 0 0 15px rgba(99, 102, 241, 0.2); }

         .custom-scrollbar::-webkit-scrollbar { width: 4px; }
         .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
         .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 99px; }
         .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.4); }

         .animate-bar-1 { animation: bounceBar 0.6s ease-in-out infinite alternate; }
         .animate-bar-2 { animation: bounceBar 0.6s ease-in-out infinite alternate 0.2s; }
         .animate-bar-3 { animation: bounceBar 0.6s ease-in-out infinite alternate 0.4s; }

         @keyframes bounceBar { 0% { height: 20%; } 100% { height: 100%; } }
      `}</style>
    </div>
  );
};

export default SongDetails;
