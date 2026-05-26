import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { buildApiUrl } from '../backend/backendUrls';
import { getSignedSongAudioUrl, getSignedSongCoverUrl } from '../backend/songMediaApi';

interface SongData {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  audioUrl?: string | null;
  duration?: number;
}

interface AudioPlayerContextType {
  currentSong: SongData | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffled: boolean;
  isRepeated: boolean;
  playSong: (song: SongData) => void;
  togglePlayPause: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  playNext: () => void;
  playPrevious: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within AudioPlayerProvider');
  }
  return context;
};

interface AudioPlayerProviderProps {
  children: ReactNode;
}

export const AudioPlayerProvider: React.FC<AudioPlayerProviderProps> = ({ children }) => {
  const [currentSong, setCurrentSong] = useState<SongData | null>(null);
  const [queue, setQueue] = useState<SongData[]>([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [isRepeated, setIsRepeated] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(0.5);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadSong = async (song: SongData) => {
    if (!audioRef.current) {
      return;
    }

    setCurrentTime(0);

    try {
      const [signed, signedCover] = await Promise.all([
        getSignedSongAudioUrl(song.id),
        getSignedSongCoverUrl(song.id),
      ]);

      if (!signed) {
        throw new Error('Missing signed URL');
      }

      const nextSong = {
        ...song,
        coverUrl: signedCover || song.coverUrl,
      };

      setCurrentSong(nextSong);

      console.log('🎵 AudioContext: Audio signed URL:', signed);
      try {
        audioRef.current.crossOrigin = 'anonymous';
      } catch (e) {
        /* ignore if not supported */
      }
      audioRef.current.src = signed;
      audioRef.current.load();
      setIsPlaying(true);
      console.log('✅ AudioContext: Song loaded, isPlaying set to true');
    } catch (err) {
      console.error('❌ AudioContext: Failed to acquire signed url:', err);
    }
  };

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;

    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      if (isRepeated) {
        audio.currentTime = 0;
        audio.play();
      } else {
        setIsPlaying(false);
        setCurrentTime(0);
        void playNext();
      }
    };

    const handleCanPlay = () => {
      if (isPlaying) {
        audio.play().catch(error => {
          console.error('Playback failed:', error);
          setIsPlaying(false);
        });
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.pause();
      audio.src = '';
    };
  }, [isRepeated]);

  // Handle play/pause when isPlaying changes
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.play().catch(error => {
        console.error('Playback failed:', error);
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const playSong = (song: SongData) => {
    console.log('🎵 AudioContext: playSong called with:', song);

    // If same song, just toggle play/pause
    if (currentSong?.id === song.id) {
      console.log('🎵 AudioContext: Same song, toggling play/pause');
      togglePlayPause();
      return;
    }

    setQueue((currentQueue) => {
      const existingIndex = currentQueue.findIndex((queuedSong) => queuedSong.id === song.id);
      if (existingIndex >= 0) {
        setQueueIndex(existingIndex);
        return currentQueue;
      }

      const nextQueue = [...currentQueue, song];
      setQueueIndex(nextQueue.length - 1);
      return nextQueue;
    });

    console.log('🎵 AudioContext: Loading new song:', song.title);
    void loadSong(song);
  };

  const togglePlayPause = () => {
    setIsPlaying(prev => !prev);
  };

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const setVolume = (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    setPreviousVolume(clampedVolume);
    if (clampedVolume > 0) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolumeState(previousVolume);
      setIsMuted(false);
    } else {
      setPreviousVolume(volume);
      setIsMuted(true);
    }
  };

  const toggleShuffle = () => {
    setIsShuffled(prev => !prev);
  };

  const toggleRepeat = () => {
    setIsRepeated(prev => !prev);
  };

  const playNext = () => {
    if (queue.length === 0) {
      console.log('Next song - queue is empty');
      return;
    }

    const nextIndex = isShuffled
      ? Math.floor(Math.random() * queue.length)
      : Math.min(queueIndex + 1, queue.length - 1);

    const nextSong = queue[nextIndex];
    if (!nextSong) {
      return;
    }

    setQueueIndex(nextIndex);
    void loadSong(nextSong);
  };

  const playPrevious = () => {
    if (queue.length === 0) {
      console.log('Previous song - queue is empty');
      return;
    }

    const prevIndex = Math.max(queueIndex - 1, 0);
    const prevSong = queue[prevIndex];
    if (!prevSong) {
      return;
    }

    setQueueIndex(prevIndex);
    void loadSong(prevSong);
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        isShuffled,
        isRepeated,
        playSong,
        togglePlayPause,
        seekTo,
        setVolume,
        toggleMute,
        toggleShuffle,
        toggleRepeat,
        playNext,
        playPrevious,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
};
