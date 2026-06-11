import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useLyrics } from '../hooks/useLyrics';
import { useAudioPlayer } from '../contexts/AudioPlayerContextCore';
import {
  FaPlay,
  FaPause,
  FaStepBackward,
  FaStepForward,
  FaRandom,
  FaRedo,
  FaTimes,
  FaStar,
  FaVolumeUp,
  FaQuoteRight,
  FaSpinner,
  FaExpand,
  FaCompress
} from 'react-icons/fa';
import { isSongFavorite, toggleFavorite as toggleFavoriteApi } from '../backend/favoritesService';

interface FullScreenLyricsProps {
  onClose: () => void;
}

const FullScreenLyrics: React.FC<FullScreenLyricsProps> = ({ onClose }) => {
  const {
    currentSong,
    currentTime,
    duration,
    isPlaying,
    togglePlayPause,
    playNext,
    playPrevious,
    isShuffled,
    isRepeated,
    toggleShuffle,
    toggleRepeat,
    seekTo,
    volume,
    setVolume
  } = useAudioPlayer();

  const { lyrics, loading, activeIndex } = useLyrics(currentSong?.id, currentTime);

  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const interactionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleClose = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    onClose();
  };

  const isPlainText = lyrics?.format === 'plain';

  // Load and sync favorite status
  useEffect(() => {
    if (currentSong?.id) {
      isSongFavorite(currentSong.id).then(setIsFav);
    }
  }, [currentSong?.id]);

  const handleToggleFavorite = async () => {
    if (!currentSong?.id) return;
    const success = await toggleFavoriteApi(currentSong.id);
    if (success) setIsFav(!isFav);
  };

  const progressPercent = useMemo(() => {
    if (!duration || duration === 0) return 0;
    return Math.min(Math.max((currentTime / duration) * 100, 0), 100);
  }, [currentTime, duration]);

  const formatTime = useCallback((seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickedProgress = x / rect.width;
    seekTo(clickedProgress * duration);
  };

  const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newVolume = Math.min(Math.max(x / rect.width, 0), 1);
    setVolume(newVolume);
  };

  const handleLyricClick = (timeMs: number) => {
    if (timeMs > 0) {
      seekTo(timeMs / 1000);
    }
  };

  const handleScrollAction = useCallback(() => {
    setIsUserInteracting(true);
    if (interactionTimerRef.current) clearTimeout(interactionTimerRef.current);
    interactionTimerRef.current = setTimeout(() => {
      setIsUserInteracting(false);
    }, 4500);
  }, []);

  useEffect(() => {
    return () => {
      if (interactionTimerRef.current) clearTimeout(interactionTimerRef.current);
    };
  }, []);

  // Moves the active lyric upward in the viewpoint container
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isUserInteracting) return;

    if (!isPlainText && activeIndex >= 0 && activeLineRef.current) {
      const containerHeight = container.offsetHeight;
      const elementOffset = activeLineRef.current.offsetTop;

      // Centered at 15% from the top so active text rolls up much higher
      container.scrollTo({
        top: elementOffset - (containerHeight * 0.15),
        behavior: 'smooth',
      });
    } else if (isPlainText && duration > 0) {
      const progress = currentTime / duration;
      const scrollHeight = container.scrollHeight - container.offsetHeight;
      if (scrollHeight > 0) {
        container.scrollTo({
          top: scrollHeight * progress,
          behavior: 'smooth',
        });
      }
    }
  }, [activeIndex, isPlainText, isUserInteracting, duration, currentTime]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0 });
      setIsUserInteracting(false);
    }
  }, [currentSong?.id]);

  if (!currentSong) return null;

  return (
    <div
      onDoubleClick={toggleFullScreen}
      className="fixed inset-0 z-[100] bg-black text-neutral-200 flex flex-col overflow-hidden font-sans antialiased select-none animate-fade-in"
    >

      {/* Deep Black & Rich Sapphire Blue Fluid Background */}
      <div className="absolute inset-0 z-0 pointer-events-none scale-110">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[#040814] to-black opacity-80 z-10" />
        <div
          className="absolute w-[50%] h-[50%] -top-[10%] -left-[5%] rounded-full bg-[#0044ff] opacity-[0.2] blur-[140px] mix-blend-screen transform-gpu update-bg-motion-1"
        />
        <div
          className="absolute w-[60%] h-[60%] -bottom-[15%] -right-[10%] rounded-full bg-[#0022aa] opacity-[0.25] blur-[150px] mix-blend-screen transform-gpu update-bg-motion-2"
        />
        <div
          className="absolute w-[40%] h-[40%] top-[20%] right-[20%] rounded-full bg-[#4400ff] opacity-[0.1] blur-[120px] mix-blend-screen transform-gpu update-bg-motion-3"
        />
      </div>

      {/* Main Container Core */}
      <div className="relative z-10 flex flex-col lg:flex-row h-full w-full max-w-[1440px] mx-auto px-6 md:px-16 lg:px-20 items-center unified-layout">

        {/* Left Side: Dynamic Media Controller */}
        <div className="w-full lg:w-[45%] flex flex-col justify-center py-10 lg:py-0 pr-0 lg:pr-12 animate-panel-entry">
          <div className="w-full max-w-[340px] mx-auto lg:mx-0 flex flex-col">

            {/* Cover Art Wrapper */}
            <div className={`aspect-square w-full rounded-2xl overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.9)] border border-white/[0.05] group relative transition-all duration-1000 ${isPlaying ? 'animate-float' : ''}`}>
              <img
                src={currentSong.coverUrl}
                alt={currentSong.title}
                className={`w-full h-full object-cover transition-transform duration-[2000ms] cubic-bezier(0.25, 1, 0.5, 1) ${
                  isPlaying ? 'scale-105' : 'scale-100 brightness-75'
                }`}
              />
            </div>

            {/* Song Information Block */}
            <div className="mt-10 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl font-black tracking-tight text-white truncate drop-shadow-sm">{currentSong.title}</h1>
                <p className="text-lg text-neutral-500 font-bold mt-0.5 truncate">
                  {currentSong.artist}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleToggleFavorite}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 border border-white/[0.05] ${isFav ? 'bg-white text-black' : 'bg-white/[0.03] hover:bg-white/[0.08] text-white/40'}`}
                >
                  <FaStar size={12} />
                </button>
              </div>
            </div>

            {/* Dynamic Timeline Scrub Rail */}
            <div className="mt-8 space-y-2.5">
              <div
                onClick={handleSeek}
                className="h-[4px] w-full bg-white/10 rounded-full relative cursor-pointer group"
              >
                <div
                  className="absolute inset-y-0 left-0 bg-white group-hover:bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-xl"
                  style={{ left: `${progressPercent}%`, transform: 'translate(-50%, -50%)' }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-black text-neutral-500 tracking-widest tabular-nums uppercase">
                <span>{formatTime(currentTime)}</span>
                <span>-{formatTime(Math.max(0, duration - currentTime))}</span>
              </div>
            </div>

            {/* Navigation Controls Hub */}
            <div className="flex items-center justify-between mt-6 px-1">
              <button onClick={toggleShuffle} className={`transition-colors active:scale-90 ${isShuffled ? 'text-blue-500' : 'text-neutral-700 hover:text-neutral-300'}`}>
                <FaRandom size={14} />
              </button>

              <div className="flex items-center gap-10">
                <button onClick={playPrevious} className="text-neutral-400 hover:text-white transition-all active:scale-90">
                  <FaStepBackward size={22} />
                </button>
                <button
                  onClick={togglePlayPause}
                  className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-all active:scale-95 shadow-2xl"
                >
                  {isPlaying ? <FaPause size={22} /> : <FaPlay size={22} className="translate-x-0.5" />}
                </button>
                <button onClick={playNext} className="text-neutral-400 hover:text-white transition-all active:scale-90">
                  <FaStepForward size={22} />
                </button>
              </div>

              <button onClick={toggleRepeat} className={`transition-colors active:scale-90 ${isRepeated ? 'text-blue-500' : 'text-neutral-700 hover:text-neutral-300'}`}>
                <FaRedo size={14} />
              </button>
            </div>

            {/* Volume HUD Rail */}
            <div className="mt-8 flex items-center gap-4 px-1 opacity-25 hover:opacity-100 transition-opacity duration-300">
              <span className="text-neutral-500"><FaVolumeUp size={12} /></span>
              <div
                onClick={handleVolumeChange}
                className="h-[3px] flex-1 bg-white/10 rounded-full relative cursor-pointer group"
              >
                <div className="absolute inset-y-0 left-0 bg-white/60 group-hover:bg-white rounded-full transition-all" style={{ width: `${volume * 100}%` }} />
              </div>
            </div>

          </div>
        </div>

        {/* Right Side: Upward Scrolling Dynamic Lyric Canvas */}
        <div
          ref={containerRef}
          onWheel={handleScrollAction}
          onTouchStart={handleScrollAction}
          className="w-full lg:w-[55%] h-full overflow-y-auto no-scrollbar pt-[15vh] pb-[70vh] pl-0 lg:pl-12 scroll-smooth perspective-1000"
          style={{
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 85%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 85%, transparent 100%)'
          }}
        >
          {loading ? (
            <div className="h-full w-full flex items-center justify-start pl-4 opacity-10">
              <FaSpinner className="animate-spin text-2xl" />
            </div>
          ) : !lyrics || lyrics.lines.length === 0 ? (
            <div className="h-full w-full flex items-center justify-start opacity-10">
              <h2 className="text-3xl font-black italic tracking-tighter text-white">Instrumental.</h2>
            </div>
          ) : (
            <div className="space-y-12 max-w-2xl will-change-transform pr-4 py-20">
              {lyrics.lines.map((line, index) => {
                const isActive = !isPlainText && index === activeIndex;
                const isPast = !isPlainText && index < activeIndex;
                const distance = Math.abs(index - activeIndex);

                // Dynamic styles based on distance from active line
                const opacity = isActive ? 1 : Math.max(0.05, 1 - distance * 0.25);
                const blur = isActive ? 0 : Math.min(4, distance * 0.8);
                const scale = isActive ? 1 : Math.max(0.85, 1 - distance * 0.03);

                return (
                  <div
                    key={`${index}-${line.time_ms}`}
                    ref={isActive ? activeLineRef : null}
                    onClick={() => handleLyricClick(line.time_ms)}
                    style={{
                      opacity,
                      filter: `blur(${blur}px)`,
                      transform: `scale(${scale}) translateX(${isActive ? '0' : '4px'})`,
                    }}
                    className={`transition-all duration-[1000ms] cubic-bezier(0.22, 1, 0.36, 1) text-left transform-gpu origin-left tracking-tight cursor-pointer font-extrabold select-none will-change-[transform,opacity,filter] ${
                      isPlainText
                        ? 'text-lg md:text-xl text-neutral-400 hover:text-white'
                        : isActive
                          ? 'text-2xl md:text-3xl leading-tight text-white drop-shadow-[0_10px_40px_rgba(255,255,255,0.4)] animate-lyric-focus'
                          : 'text-lg md:text-xl text-neutral-500'
                    }`}
                  >
                    {line.text || '•••'}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Global Action Triggers */}
      <div className="absolute top-6 left-6 z-50 flex gap-3">
        <button
          onClick={handleClose}
          className="w-10 h-10 flex items-center justify-center text-neutral-500 hover:text-neutral-200 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] rounded-full transition-all duration-300"
          title="Close"
        >
          <FaTimes size={13} />
        </button>
        <button
          onClick={toggleFullScreen}
          className="w-10 h-10 flex items-center justify-center text-neutral-500 hover:text-neutral-200 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] rounded-full transition-all duration-300"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? <FaCompress size={13} /> : <FaExpand size={13} />}
        </button>
      </div>

      <div className="absolute bottom-8 right-10 z-50 flex items-center gap-4 text-neutral-700 hover:text-neutral-400 transition-all cursor-pointer">
        <button className="transition-colors"><FaQuoteRight size={14} /></button>
      </div>

      {/* Stylesheet Utility Stack */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes panelEntry {
          from { opacity: 0; transform: scale(0.99) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        @keyframes lyricFocus {
          0% { transform: scale(0.94) translateY(10px); filter: blur(10px); opacity: 0; }
          100% { transform: scale(1) translateY(0); filter: blur(0); opacity: 1; }
        }

        .animate-lyric-focus { animation: lyricFocus 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .perspective-1000 { perspective: 1000px; }

        @keyframes bgFluidMotion1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(10%, 5%) scale(1.1); }
          66% { transform: translate(-5%, 10%) scale(0.9); }
        }

        @keyframes bgFluidMotion2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-10%, -5%) scale(1.15); }
          66% { transform: translate(5%, -10%) scale(0.85); }
        }

        @keyframes bgFluidMotion3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(8%, -8%) scale(1.2); }
        }

        .animate-fade-in { animation: fadeIn 0.8s ease-out forwards; }
        .animate-panel-entry { animation: panelEntry 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .animate-lyric-pop { animation: lyricPop 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .update-bg-motion-1 { animation: bgFluidMotion1 25s ease-in-out infinite; }
        .update-bg-motion-2 { animation: bgFluidMotion2 30s ease-in-out infinite; }
        .update-bg-motion-3 { animation: bgFluidMotion3 20s ease-in-out infinite; }

        @media (max-width: 1023px) {
          .unified-layout { height: auto; overflow-y: auto; padding-top: 5rem; padding-bottom: 5rem; }
        }
      `}</style>
    </div>
  );
};

export default FullScreenLyrics;
