import React, { useRef, useEffect, useState } from 'react';
import { 
  FaPlay, FaPause, FaStepBackward, FaStepForward, 
  FaRedo, FaRandom, FaVolumeUp, FaVolumeDown, FaVolumeMute
} from 'react-icons/fa';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { getSongs } from '../backend/catalogService';

const Player: React.FC = () => {
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
  } = useAudioPlayer();

  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const [songQueue, setSongQueue] = useState<any[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(0);
  const progressRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      handleProgressMouseMove(e);
      handleVolumeDrag(e);
    };

    const handleMouseUp = () => {
      handleProgressMouseUp();
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
  }, [isDraggingProgress, isDraggingVolume, duration]);

  // Keyboard shortcuts for changing songs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Arrow Right or N: Next song
      if (e.key === 'ArrowRight' || e.key === 'n' || e.key === 'N') {
        playNextSong();
      }
      // Arrow Left or P: Previous song
      if (e.key === 'ArrowLeft' || e.key === 'p' || e.key === 'P') {
        playPreviousSong();
      }
      // Space: Play/Pause
      if (e.key === ' ') {
        e.preventDefault();
        togglePlayPause();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [togglePlayPause]);

  // Fetch random songs from database when component mounts
  useEffect(() => {
    const fetchRandomSongs = async () => {
      try {
        console.log('🎵 Fetching random songs from database');
        
        const allSongs = await getSongs(100);

        if (allSongs && allSongs.length > 0) {
          // Convert to audio player format
          const randomSongs = allSongs
            .map((song: any) => ({
              id: String(song.id),
              title: song.title || 'Unknown Song',
              artist: song.artist || song.album?.artist || 'Unknown Artist',
              coverUrl: song.songCover_url || '',
              audioUrl: song.original_key || song.audio_url || '',
            }))
            .filter((song: any) => !!song.audioUrl);

          console.log('✅ Loaded random songs:', randomSongs.length);
          setSongQueue(randomSongs);
          setCurrentQueueIndex(0);
        }
      } catch (error) {
        if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('NetworkError'))) {
          return;
        }
        console.error('❌ Error fetching random songs:', error);
        setSongQueue([]);
      }
    };

    fetchRandomSongs();
  }, []);

  // Play next song - random from database
  const playNextSong = () => {
    if (songQueue.length === 0) {
      console.log('⚠️ No songs available in queue');
      return;
    }

    // Get random song from entire queue
    const randomIndex = Math.floor(Math.random() * songQueue.length);
    const nextSong = songQueue[randomIndex];
    console.log('🎵 Playing random next song:', nextSong.title, 'Index:', randomIndex);
    setCurrentQueueIndex(randomIndex);
    playSong(nextSong);
  };

  // Play previous song - random from database
  const playPreviousSong = () => {
    if (songQueue.length === 0) {
      console.log('⚠️ No songs in queue');
      return;
    }

    // Get another random song (different approach for "previous")
    let randomIndex = Math.floor(Math.random() * songQueue.length);
    // Make sure we don't play the same song
    while (randomIndex === currentQueueIndex && songQueue.length > 1) {
      randomIndex = Math.floor(Math.random() * songQueue.length);
    }
    
    const prevSong = songQueue[randomIndex];
    console.log('🎵 Playing random previous song:', prevSong.title, 'Index:', randomIndex);
    setCurrentQueueIndex(randomIndex);
    playSong(prevSong);
  };

  // Don't render if there's no song playing
  if (!currentSong) {
    return null;
  }

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressRef.current && duration > 0) {
      const rect = progressRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const newTime = percentage * duration;
      seekTo(newTime);
    }
  };

  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDraggingProgress(true);
    handleProgressClick(e);
  };

  const handleProgressMouseMove = (e: MouseEvent) => {
    if (isDraggingProgress && progressRef.current && duration > 0) {
      const rect = progressRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const newTime = percentage * duration;
      seekTo(newTime);
    }
  };

  const handleProgressMouseUp = () => {
    setIsDraggingProgress(false);
  };

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (volumeRef.current) {
      const rect = volumeRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const newVolume = Math.max(0, Math.min(1, x / rect.width));
      setPlayerVolume(newVolume);
    }
  };

  const handleVolumeDrag = (e: MouseEvent) => {
    if (isDraggingVolume && volumeRef.current) {
      const rect = volumeRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const newVolume = Math.max(0, Math.min(1, x / rect.width));
      setPlayerVolume(newVolume);
    }
  };

  const handleVolumeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDraggingVolume(true);
    handleVolumeClick(e);
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return <FaVolumeMute size={16} />;
    if (volume < 0.5) return <FaVolumeDown size={16} />;
    return <FaVolumeUp size={16} />;
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 w-full bg-black/95 backdrop-blur-md border-t border-white/10 h-20 md:h-24 px-3 md:px-6 z-50 flex items-center pointer-events-none">
      
      {/* LEFT: Song Info (flex-1) */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 md:w-14 md:h-14 rounded overflow-hidden flex-shrink-0 shadow-md">
          <img src={currentSong.coverUrl} alt={currentSong.title} className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0 pointer-events-auto">
          <h4 className="text-white text-[13px] md:text-sm font-semibold truncate hover:underline cursor-pointer">
            {currentSong.title}
          </h4>
          <p className="text-[11px] md:text-xs text-gray-400 truncate hover:text-white cursor-pointer">
            {currentSong.artist}
          </p>
        </div>
      </div>

      {/* CENTER: Player Controls (flex-[2]) */}
      <div className="flex-[2] flex flex-col items-center justify-center max-w-[400px] md:max-w-[600px] px-2 md:px-4">
        {/* Buttons */}
        <div className="flex items-center gap-4 md:gap-6 text-gray-400 mb-1.5">
          <FaRandom 
            size={14} 
            className={`hidden sm:block cursor-pointer transition-colors pointer-events-auto ${isShuffled ? 'text-blue-500' : 'hover:text-white'}`}
            onClick={toggleShuffle}
          />
          <FaStepBackward 
            size={18} 
            className="hover:text-white cursor-pointer transition-colors pointer-events-auto" 
            onClick={playPreviousSong}
          />
          <button 
            onClick={togglePlayPause}
            className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-all pointer-events-auto"
          >
            {isPlaying ? <FaPause size={14} /> : <FaPlay size={14} className="ml-0.5" />}
          </button>
          <FaStepForward 
            size={18} 
            className="hover:text-white cursor-pointer transition-colors pointer-events-auto" 
            onClick={playNextSong}
          />
          <FaRedo 
            size={14} 
            className={`hidden sm:block cursor-pointer transition-colors pointer-events-auto ${isRepeated ? 'text-blue-500' : 'hover:text-white'}`}
            onClick={toggleRepeat}
          />
        </div>

        {/* Progress Bar */}
        <div className="w-full flex items-center gap-2 md:gap-3">
          <span className="text-[10px] text-gray-500 w-8 text-right">{formatTime(currentTime)}</span>
          <div 
            ref={progressRef}
            className="flex-1 h-1 bg-white/20 rounded-full cursor-pointer group relative pointer-events-auto"
            onMouseDown={handleProgressMouseDown}
          >
            <div 
              className="h-full bg-white group-hover:bg-blue-500 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${progressPercentage}% - 5px)` }}
            />
          </div>
          <span className="text-[10px] text-gray-500 w-8">{formatTime(duration)}</span>
        </div>
      </div>

      {/* RIGHT: Extra Utilities (flex-1) */}
      <div className="flex-1 flex items-center justify-end gap-3 md:gap-4 text-gray-400">
        
        <div className="flex items-center gap-2 group">
          <div className="cursor-pointer hover:text-white pointer-events-auto" onClick={toggleMute}>
            {getVolumeIcon()}
          </div>
          <div 
            ref={volumeRef}
            className="hidden sm:block w-16 md:w-24 h-1 bg-white/20 rounded-full cursor-pointer relative pointer-events-auto"
            onMouseDown={handleVolumeMouseDown}
            onClick={handleVolumeClick}
          >
            <div 
              className="h-full bg-white group-hover:bg-blue-500 rounded-full"
              style={{ width: `${volume * 100}%` }}
            />
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
              style={{ left: `calc(${volume * 100}% - 6px)` }}
            />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Player;