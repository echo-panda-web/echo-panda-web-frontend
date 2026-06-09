import React, { useRef, useEffect, useState } from 'react';
import { useLyrics } from '../hooks/useLyrics';
import { useAudioPlayer } from '../contexts/AudioPlayerContextCore';
import { FaMusic, FaSpinner } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';

interface LyricsPanelProps {
  songId?: string;
  onClose?: () => void;
  showBackground?: boolean;
}

const LyricsPanel: React.FC<LyricsPanelProps> = ({ songId, onClose, showBackground = false }) => {
  const { currentTime, duration, currentSong: playingSong } = useAudioPlayer();
  const { isLightMode } = useTheme();

  // Only sync if the song being viewed is the one currently playing
  const isSyncing = playingSong?.id === songId;
  const syncTime = isSyncing ? currentTime : 0;

  const { lyrics, loading, activeIndex } = useLyrics(songId, syncTime);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const interactionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isPlainText = lyrics?.format === 'plain';

  // Detect manual interaction
  const handleScrollAction = () => {
    if (!isSyncing) return;
    setIsUserInteracting(true);
    if (interactionTimerRef.current) clearTimeout(interactionTimerRef.current);
    interactionTimerRef.current = setTimeout(() => {
      setIsUserInteracting(false);
    }, 4000); // Resume auto-scroll after 4 seconds
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isSyncing || isUserInteracting) return;

    if (!isPlainText && activeIndex >= 0 && activeLineRef.current) {
      // Smoothly center the active line
      const containerHeight = container.offsetHeight;
      const elementOffset = activeLineRef.current.offsetTop;
      const elementHeight = activeLineRef.current.offsetHeight;

      container.scrollTo({
        top: elementOffset - (containerHeight / 2) + (elementHeight / 2),
        behavior: 'smooth',
      });
    } else if (isPlainText && duration > 0) {
      // Auto-scroll plain text based on progress
      const progress = currentTime / duration;
      const scrollHeight = container.scrollHeight - container.offsetHeight;
      if (scrollHeight > 0) {
        container.scrollTo({
          top: scrollHeight * progress,
          behavior: 'smooth',
        });
      }
    }
  }, [activeIndex, currentTime, duration, isPlainText, isSyncing, isUserInteracting]);

  // Reset scroll on song change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'instant' });
      setIsUserInteracting(false);
    }
  }, [songId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-gray-500">
        <FaSpinner className="animate-spin text-4xl mb-4 text-purple-500" />
        <p className="text-sm font-medium uppercase tracking-widest opacity-50">Fetching Synced Data</p>
      </div>
    );
  }

  if (!lyrics || lyrics.lines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500">
        <FaMusic className="text-4xl mb-4 opacity-10" />
        <p className="font-bold text-sm uppercase tracking-widest opacity-30">Lyrics not available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden font-sans">
      {/* Tab Header style like YouTube Music - Professional Cleanup */}
      <div className={`flex items-center justify-around border-b ${isLightMode ? 'border-gray-100' : 'border-white/5'} px-6 bg-black/20 backdrop-blur-md`}>
        {['UP NEXT', 'LYRICS', 'RELATED'].map((tab) => (
           <button
             key={tab}
             className={`relative text-[10px] font-black tracking-[0.2em] px-4 py-5 transition-all duration-300 ${
               tab === 'LYRICS'
                ? 'text-white'
                : `text-white/30 hover:text-white/60`
             }`}
           >
             {tab}
             {tab === 'LYRICS' && (
               <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
             )}
           </button>
        ))}
      </div>

      <div
        ref={containerRef}
        onWheel={handleScrollAction}
        onTouchStart={handleScrollAction}
        className={`flex-1 overflow-y-auto custom-scrollbar-hidden px-8 py-16 scroll-smooth ${
          showBackground ? (isLightMode ? 'bg-white' : 'bg-[#0a0a0c]') : 'bg-transparent'
        }`}
      >
        <div className="max-w-2xl mx-auto space-y-8">
          {lyrics.lines.map((line, index) => {
            const isActive = isSyncing && index === activeIndex;
            const isPast = isSyncing && index < activeIndex;

            return (
              <div
                key={`${index}-${line.time_ms}`}
                ref={isActive ? activeLineRef : null}
                className={`transition-all duration-1000 cursor-pointer group select-none text-left transform-gpu origin-left ${
                  isActive
                    ? 'text-xl md:text-2xl font-black text-white scale-105 opacity-100 filter-none drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] leading-tight'
                    : `text-lg md:text-xl font-bold ${isLightMode ? 'text-gray-900' : 'text-white'} opacity-10 filter blur-[1px] hover:opacity-50 hover:blur-none transition-all`
                }`}
              >
                {line.text || '•••'}
              </div>
            );
          })}
        </div>
      </div>
      <style>{`
        .custom-scrollbar-hidden::-webkit-scrollbar { display: none; }
        .custom-scrollbar-hidden { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default LyricsPanel;
