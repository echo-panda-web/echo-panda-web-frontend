import React, { useRef, useEffect } from 'react';
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
  const { currentTime, currentSong: playingSong } = useAudioPlayer();
  const { isLightMode } = useTheme();

  // Only sync if the song being viewed is the one currently playing
  const isSyncing = playingSong?.id === songId;
  const syncTime = isSyncing ? currentTime : 0;

  const { lyrics, loading, activeIndex } = useLyrics(songId, syncTime);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeLineRef.current && containerRef.current && isSyncing) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex, isSyncing]);

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
    <div
      ref={containerRef}
      className={`h-full overflow-y-auto custom-scrollbar px-6 py-12 scroll-smooth ${
        showBackground ? (isLightMode ? 'bg-white' : 'bg-black') : 'bg-transparent'
      }`}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {lyrics.lines.map((line, index) => {
          const isActive = isSyncing && index === activeIndex;
          const isPast = isSyncing && index < activeIndex;

          return (
            <div
              key={`${index}-${line.time_ms}`}
              ref={isActive ? activeLineRef : null}
              className={`transition-all duration-500 cursor-default group ${
                isActive
                  ? 'text-2xl md:text-3xl font-black text-indigo-500 scale-105 origin-left opacity-100'
                  : isPast
                    ? 'text-lg md:text-xl font-bold opacity-30'
                    : `text-lg md:text-xl font-bold ${isLightMode ? 'text-gray-900' : 'text-white'} opacity-10 hover:opacity-100 transition-opacity`
              }`}
            >
              {line.text || '•••'}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LyricsPanel;
