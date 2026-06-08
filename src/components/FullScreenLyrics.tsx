import React, { useRef, useEffect, useState } from 'react';
import { useLyrics } from '../hooks/useLyrics';
import { useAudioPlayer } from '../contexts/AudioPlayerContextCore';
import { FaCompress, FaMusic, FaSpinner } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';

interface FullScreenLyricsProps {
  onClose: () => void;
}

const FullScreenLyrics: React.FC<FullScreenLyricsProps> = ({ onClose }) => {
  const { currentSong, currentTime, isPlaying } = useAudioPlayer();
  const { lyrics, loading, activeIndex } = useLyrics(currentSong?.id, currentTime);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const [mouseActive, setMouseActive] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex]);

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
    <div className="fixed inset-0 z-[100] bg-linear-to-b from-purple-900 via-black to-black text-white flex flex-col">
      {/* Header */}
      <div className={`p-8 flex items-center justify-between transition-opacity duration-500 ${mouseActive ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center gap-6">
          <img
            src={currentSong.coverUrl}
            alt={currentSong.title}
            className="w-20 h-20 rounded-xl shadow-2xl animate-pulse"
          />
          <div>
            <h1 className="text-3xl font-black">{currentSong.title}</h1>
            <p className="text-xl text-purple-300 font-bold">{currentSong.artist}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-4 bg-white/10 hover:bg-white/20 rounded-full transition-all group"
        >
          <FaCompress size={24} className="group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Lyrics Content */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-8 md:px-24 py-32 custom-scrollbar-hidden select-none"
      >
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <FaSpinner className="animate-spin text-6xl text-purple-500" />
            <span className="text-xl font-bold tracking-widest uppercase opacity-50">Syncing with audio...</span>
          </div>
        ) : !lyrics || lyrics.lines.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-6 text-center">
             <div className="w-32 h-32 rounded-full bg-white/5 flex items-center justify-center">
                <FaMusic className="text-6xl opacity-20" />
             </div>
             <div>
                <h2 className="text-4xl font-black mb-2">Purely Instrumental?</h2>
                <p className="text-xl text-gray-500">Or maybe we're still writing them down.</p>
             </div>
          </div>
        ) : (
          <div className="space-y-12 pb-64">
            {lyrics.lines.map((line, index) => {
              const isActive = index === activeIndex;
              const isPast = index < activeIndex;

              return (
                <div
                  key={`${index}-${line.time_ms}`}
                  ref={isActive ? activeLineRef : null}
                  className={`transition-all duration-700 cursor-default ${
                    isActive
                      ? 'text-5xl md:text-7xl font-black text-white drop-shadow-[0_10px_20px_rgba(168,85,247,0.4)]'
                      : isPast
                        ? 'text-3xl md:text-4xl font-black opacity-30 scale-95 origin-left'
                        : 'text-3xl md:text-4xl font-black opacity-10'
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
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-black to-transparent pointer-events-none" />

      <style>{`
        .custom-scrollbar-hidden::-webkit-scrollbar {
          display: none;
        }
        .custom-scrollbar-hidden {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default FullScreenLyrics;
