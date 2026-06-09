import React, { useRef, useEffect, useState } from 'react';
import { useLyrics } from '../hooks/useLyrics';
import { useAudioPlayer } from '../contexts/AudioPlayerContextCore';
import { FaCompress, FaMusic, FaSpinner } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';

interface FullScreenLyricsProps {
  onClose: () => void;
}

const FullScreenLyrics: React.FC<FullScreenLyricsProps> = ({ onClose }) => {
  const { currentSong, currentTime, duration, isPlaying } = useAudioPlayer();
  const { lyrics, loading, activeIndex } = useLyrics(currentSong?.id, currentTime);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const [mouseActive, setMouseActive] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isPlainText = lyrics?.format === 'plain';

  // New states for smart scrolling
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const interactionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Detect manual scrolling to pause auto-scroll
  const handleScrollAction = () => {
    setIsUserInteracting(true);
    if (interactionTimerRef.current) clearTimeout(interactionTimerRef.current);
    interactionTimerRef.current = setTimeout(() => {
      setIsUserInteracting(false);
    }, 5000); // Pause auto-scroll for 5 seconds after manual interaction
  };

  // Robust scrolling logic
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isUserInteracting) return;

    if (!isPlainText && activeIndex >= 0 && activeLineRef.current) {
      // Logic for Synced Lyrics: Center the active line
      const containerHeight = container.offsetHeight;
      const elementOffset = activeLineRef.current.offsetTop;
      const elementHeight = activeLineRef.current.offsetHeight;

      container.scrollTo({
        top: elementOffset - (containerHeight / 2) + (elementHeight / 2),
        behavior: 'smooth',
      });
    } else if (isPlainText && duration > 0) {
      // Logic for Plain Text: Slower, periodic auto-scroll
      const progress = currentTime / duration;
      const scrollHeight = container.scrollHeight - container.offsetHeight;
      if (scrollHeight > 0) {
        container.scrollTo({
          top: scrollHeight * progress,
          behavior: 'smooth',
        });
      }
    } else if (activeIndex === -1 && !isPlainText) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeIndex, isPlainText, isUserInteracting, duration, Math.floor(currentTime)]);

  // Reset scroll on song change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'instant' });
      setIsUserInteracting(false);
    }
  }, [currentSong?.id]);

  // Handle mouse idle to hide controls
  useEffect(() => {
    const handleMouseMove = () => {
      setMouseActive(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setMouseActive(false), 3000);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (!currentSong) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col overflow-hidden">
      {/* Dynamic Background with Deep Blur */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-black/40 z-10" />
        <img
          src={currentSong.coverUrl}
          className="w-full h-full object-cover blur-[100px] scale-150 opacity-50 animate-pulse-slow"
          alt=""
        />
      </div>

      {/* Header */}
      <div className={`relative z-20 p-6 flex items-center justify-between transition-opacity duration-500 ${mouseActive ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg overflow-hidden shadow-xl border border-white/10">
             <img src={currentSong.coverUrl} alt={currentSong.title} className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{currentSong.title}</h1>
            <p className="text-sm text-white/50 font-medium">{currentSong.artist}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 bg-white/5 hover:bg-white/15 rounded-full transition-all flex items-center justify-center backdrop-blur-md border border-white/5 group"
        >
          <FaCompress size={16} className="group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Lyrics Content */}
      <div
        ref={containerRef}
        onWheel={handleScrollAction}
        onTouchStart={handleScrollAction}
        className="relative z-20 flex-1 overflow-y-auto px-8 md:px-24 py-16 custom-scrollbar-hidden select-none"
      >
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <FaSpinner className="animate-spin text-2xl text-white/20" />
          </div>
        ) : !lyrics || lyrics.lines.length === 0 ? (
          <div className="h-full flex flex-col items-start justify-center gap-4 text-left">
             <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                <FaMusic className="text-2xl opacity-20" />
             </div>
             <div>
                <h2 className="text-2xl font-bold mb-1">Instrumental</h2>
                <p className="text-base text-white/30 font-medium">Enjoy the rhythm.</p>
             </div>
          </div>
        ) : (
          <div className="space-y-4 pb-[50vh]">
            {lyrics.lines.map((line, index) => {
              const isPlainText = lyrics.format === 'plain';
              const isActive = !isPlainText && index === activeIndex;
              const isPast = !isPlainText && index < activeIndex;
              const isUpcomingFirst = !isPlainText && activeIndex === -1 && index === 0;

              return (
                <div
                  key={`${index}-${line.time_ms}`}
                  ref={isActive ? activeLineRef : null}
                  className={`transition-all duration-700 cursor-default select-none text-left ${
                    isPlainText
                      ? 'text-lg md:text-xl font-semibold text-white/80 hover:text-white transition-colors'
                      : isActive
                        ? 'text-2xl md:text-3xl font-bold text-white scale-100 origin-left opacity-100 filter-none drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                        : isPast
                          ? 'text-lg md:text-xl font-semibold opacity-20 filter blur-[0.5px] origin-left'
                          : isUpcomingFirst
                            ? 'text-lg md:text-xl font-semibold opacity-40 origin-left'
                            : 'text-lg md:text-xl font-semibold opacity-10 origin-left'
                  }`}
                >
                  {line.text || '•••'}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Visualizer Style Overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-linear-to-t from-black/80 to-transparent pointer-events-none z-10" />

      <style>{`
        .custom-scrollbar-hidden::-webkit-scrollbar { display: none; }
        .custom-scrollbar-hidden { -ms-overflow-style: none; scrollbar-width: none; }
        .animate-pulse-slow { animation: pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse { 0%, 100% { opacity: 0.5; transform: scale(1.5); } 50% { opacity: 0.3; transform: scale(1.6); } }
      `}</style>
    </div>
  );
};

export default FullScreenLyrics;
