import React, { useRef, useEffect, useState } from 'react';
import {
  FaPlay, FaPause, FaStepBackward, FaStepForward,
  FaRedo, FaRandom, FaVolumeUp, FaVolumeDown, FaVolumeMute,
  FaTimes
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAudioPlayer } from '../contexts/AudioPlayerContextCore';
import { getAdaptiveRecommendations, getColdStartRecommendations } from '../backend/recommendationService';
import { useTheme } from '../contexts/ThemeContext';

const Player: React.FC = () => {
  const { isLightMode } = useTheme();
  const navigate = useNavigate();
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffled,
    isRepeated,
    togglePlayPause,
    seekTo,
    setVolume: setPlayerVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    playSong,
    playNext: playNextSong,
    playPrevious: playPreviousSong,
    setAutoplayPool,
    closePlayer,
  } = useAudioPlayer();

  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingProgress) {
        if (progressRef.current && duration > 0) {
          const rect = progressRef.current.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const percentage = Math.max(0, Math.min(1, x / rect.width));
          seekTo(percentage * duration);
        }
      }
      if (isDraggingVolume) {
        if (volumeRef.current) {
          const rect = volumeRef.current.getBoundingClientRect();
          const x = e.clientX - rect.left;
          setPlayerVolume(Math.max(0, Math.min(1, x / rect.width)));
        }
      }
    };

    const handleMouseUp = () => {
      setIsDraggingProgress(false);
      setIsDraggingVolume(false);
    };

    if (isDraggingProgress || isDraggingVolume) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingProgress, isDraggingVolume, duration, seekTo, setPlayerVolume]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'n' || e.key === 'N') playNextSong();
      if (e.key === 'ArrowLeft' || e.key === 'p' || e.key === 'P') playPreviousSong();
      if (e.key === ' ') {
        e.preventDefault();
        togglePlayPause();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause, playNextSong, playPreviousSong]);

  useEffect(() => {
    const fetchRecommendationPool = async () => {
      try {
        const adaptive = await getAdaptiveRecommendations(50);
        const recommended = adaptive.length > 0 ? adaptive : await getColdStartRecommendations(50);

        const pool = recommended
          .map((item: any) => ({
            id: String(item.song?.id || item.id),
            title: item.song?.title || item.title || 'Unknown Song',
            artist: item.song?.artist || 'Unknown Artist',
            coverUrl: item.song?.cover_key || item.song?.album?.cover_url || '',
            audioUrl: item.song?.audio_url || null,
            duration: item.song?.duration || 0,
            recommendationScore: Number(item.recommendation_score || 0),
            similarityScore: Number(
              (item.reason?.artist || 0)
              + (item.reason?.genre || 0)
              + (item.reason?.mood || 0)
              + (item.reason?.tag || 0)
            ),
          }))
          .filter((song: any) => !!song.id && !!song.audioUrl);

        if (pool.length > 0) {
          setAutoplayPool(pool);
        }
      } catch (error) {
        console.error('Error fetching recommendation pool:', error);
      }
    };
    fetchRecommendationPool();
  }, [setAutoplayPool]);

  if (!currentSong) return null;

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressMouseDown = (e: React.MouseEvent) => {
    setIsDraggingProgress(true);
    if (progressRef.current && duration > 0) {
      const rect = progressRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      seekTo(percentage * duration);
    }
  };

  const handleVolumeMouseDown = (e: React.MouseEvent) => {
    setIsDraggingVolume(true);
    if (volumeRef.current) {
      const rect = volumeRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      setPlayerVolume(Math.max(0, Math.min(1, x / rect.width)));
    }
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return <FaVolumeMute size={16} />;
    if (volume < 0.5) return <FaVolumeDown size={16} />;
    return <FaVolumeUp size={16} />;
  };

  return (
    <footer className={`fixed bottom-0 left-0 right-0 w-full ${isLightMode ? "bg-white/95 border-gray-200" : "bg-black/95 border-white/10"} backdrop-blur-md border-t h-20 md:h-24 px-3 md:px-6 z-50 flex items-center pointer-events-none`}>
      <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer group/info pointer-events-auto" onClick={() => currentSong?.id && navigate(`/song/${currentSong.id}`)}>
        <div className="w-10 h-10 md:w-14 md:h-14 rounded overflow-hidden flex-shrink-0 shadow-md group-hover/info:opacity-80 transition-opacity">
          <img src={currentSong.coverUrl} alt={currentSong.title} className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0">
          <h4 className={`${isLightMode ? "text-gray-900" : "text-white"} text-[13px] md:text-sm font-semibold truncate group-hover/info:underline`}>{currentSong.title}</h4>
          <p className={`text-[11px] md:text-xs ${isLightMode ? "text-gray-500" : "text-gray-400"} truncate transition-colors`}>{currentSong.artist}</p>
        </div>
      </div>

      <div className="flex-2 flex flex-col items-center justify-center max-w-100 md:max-w-150 px-2 md:px-4">
        <div className={`flex items-center gap-4 md:gap-6 ${isLightMode ? "text-gray-600" : "text-gray-400"} mb-1.5`}>
          <FaRandom size={14} className={`hidden sm:block cursor-pointer transition-colors pointer-events-auto ${isShuffled ? 'text-blue-500' : isLightMode ? 'hover:text-black' : 'hover:text-white'}`} onClick={toggleShuffle} />
          <FaStepBackward size={18} className={`${isLightMode ? "hover:text-black" : "hover:text-white"} cursor-pointer transition-colors pointer-events-auto`} onClick={playPreviousSong} />
          <button onClick={togglePlayPause} className={`w-8 h-8 md:w-10 md:h-10 ${isLightMode ? "bg-black text-white" : "bg-white text-black"} rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all pointer-events-auto`}>
            {isPlaying ? <FaPause size={14} /> : <FaPlay size={14} className="ml-0.5" />}
          </button>
          <FaStepForward size={18} className={`${isLightMode ? "hover:text-black" : "hover:text-white"} cursor-pointer transition-colors pointer-events-auto`} onClick={playNextSong} />
          <FaRedo size={14} className={`hidden sm:block cursor-pointer transition-colors pointer-events-auto ${isRepeated ? 'text-blue-500' : isLightMode ? 'hover:text-black' : 'hover:text-white'}`} onClick={toggleRepeat} />
        </div>

        <div className="w-full flex items-center gap-2 md:gap-3">
          <span className="text-[10px] text-gray-500 w-8 text-right">{formatTime(currentTime)}</span>
          <div ref={progressRef} className={`flex-1 h-1 ${isLightMode ? "bg-gray-200" : "bg-white/20"} rounded-full cursor-pointer group relative pointer-events-auto`} onMouseDown={handleProgressMouseDown}>
            <div className={`h-full ${isLightMode ? "bg-black" : "bg-white"} group-hover:bg-blue-500 rounded-full`} style={{ width: `${progressPercentage}%` }} />
            <div className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 ${isLightMode ? "bg-black" : "bg-white"} rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity`} style={{ left: `calc(${progressPercentage}% - 5px)` }} />
          </div>
          <span className="text-[10px] text-gray-500 w-8">{formatTime(duration)}</span>
        </div>
      </div>

      <div className={`flex-1 flex items-center justify-end gap-3 md:gap-5 ${isLightMode ? "text-gray-600" : "text-gray-400"}`}>
        <div className="flex items-center gap-2 group">
          <div className={`cursor-pointer ${isLightMode ? "hover:text-black" : "hover:text-white"} pointer-events-auto`} onClick={toggleMute}>{getVolumeIcon()}</div>
          <div ref={volumeRef} className={`hidden sm:block w-16 md:w-24 h-1 ${isLightMode ? "bg-gray-200" : "bg-white/20"} rounded-full cursor-pointer relative pointer-events-auto`} onMouseDown={handleVolumeMouseDown}>
            <div className={`h-full ${isLightMode ? "bg-black" : "bg-white"} group-hover:bg-blue-500 rounded-full`} style={{ width: `${volume * 100}%` }} />
            <div className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 ${isLightMode ? "bg-black" : "bg-white"} rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing`} style={{ left: `calc(${volume * 100}% - 6px)` }} />
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); closePlayer(); }} className={`w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 ${isLightMode ? "text-gray-500" : "text-gray-400"} hover:text-rose-500 transition-all pointer-events-auto ml-2 border border-transparent hover:border-white/5`} title="Close Player">
          <FaTimes size={16} />
        </button>
      </div>
    </footer>
  );
};

export default Player;
