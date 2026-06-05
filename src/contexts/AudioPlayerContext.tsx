import React, { useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import { getSignedSongAudioUrl, getSignedSongCoverUrl } from '../backend/songMediaApi';
import { trackInteraction } from '../backend/recommendationService';
import { AudioPlayerContext, PlaySongOptions, SongData, useAudioPlayer } from './AudioPlayerContextCore';

export { useAudioPlayer };

interface AudioPlayerProviderProps {
  children: ReactNode;
}

export const AudioPlayerProvider: React.FC<AudioPlayerProviderProps> = ({ children }) => {
  const [currentSong, setCurrentSong] = useState<SongData | null>(null);
  const [queue, setQueue] = useState<SongData[]>([]);
  const autoplayPoolRef = useRef<SongData[]>([]);
  const playbackModeRef = useRef<'autoplay' | 'queue'>('autoplay');
  const [playbackMode, setPlaybackMode] = useState<'autoplay' | 'queue'>('autoplay');
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

  // Initialize audio element only once
  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Update handlers separately to avoid re-creating audio element
  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;

    const handleEnded = () => {
      if (currentSong) {
        trackInteraction(currentSong.id, 'complete');
      }
      if (isRepeated) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        playNext();
      }
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [isRepeated, queue, queueIndex, isShuffled, currentSong]);

  const loadSong = async (song: SongData) => {
    if (!audioRef.current) return;

    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    audioRef.current.src = '';

    setIsPlaying(false);
    setCurrentTime(0);

    try {
      const [signed, signedCover] = await Promise.all([
        getSignedSongAudioUrl(song.id).catch(() => null),
        getSignedSongCoverUrl(song.id).catch(() => null),
      ]);

      const finalAudioUrl = signed || song.audioUrl;
      if (!finalAudioUrl) throw new Error('No audio source available');

      const nextSong = {
        ...song,
        coverUrl: signedCover || song.coverUrl,
        audioUrl: finalAudioUrl,
      };

      setCurrentSong(nextSong);
      audioRef.current.src = finalAudioUrl;
      audioRef.current.load();

      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            trackInteraction(song.id, 'play');
          })
          .catch(e => {
            console.error('Playback failed:', e);
            setIsPlaying(false);
          });
      }

    } catch (err) {
      console.error('❌ AudioContext: Failed to load song:', err);
      setCurrentSong(null);
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      if (audioRef.current.src) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const playSong = (song: SongData, options?: PlaySongOptions) => {
    if (currentSong?.id === song.id) {
      togglePlayPause();
      return;
    }

    if (options?.queue && options.queue.length > 0) {
      playbackModeRef.current = 'queue';
      setPlaybackMode('queue');
      const idx = options.queue.findIndex((s) => s.id === song.id);
      setQueue(options.queue);
      setQueueIndex(idx >= 0 ? idx : 0);
    } else {
      playbackModeRef.current = 'autoplay';
      setPlaybackMode('autoplay');
      setQueue((prev) => {
        const idx = prev.findIndex(s => s.id === song.id);
        if (idx !== -1) {
          setQueueIndex(idx);
          return prev;
        }
        const newQueue = [...prev, song];
        setQueueIndex(newQueue.length - 1);
        return newQueue;
      });
    }

    void loadSong(song);
  };

  const togglePlayPause = () => setIsPlaying(prev => !prev);

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const setVolume = (v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
    setPreviousVolume(clamped);
    if (clamped > 0) setIsMuted(false);
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

  const toggleShuffle = () => setIsShuffled(prev => !prev);
  const toggleRepeat = () => setIsRepeated(prev => !prev);

  const pickWeightedRandomSong = useCallback((pool: SongData[], currentSongId?: string): SongData | null => {
    const candidates = pool.filter((song) => song.id !== currentSongId);
    const source = candidates.length > 0 ? candidates : pool;

    if (source.length === 0) {
      return null;
    }

    const weighted = source.map((song) => {
      const recommendationScore = Math.max(0, song.recommendationScore ?? 0);
      const similarityScore = Math.max(0, song.similarityScore ?? 0);
      const combinedWeight = (recommendationScore * 0.7) + (similarityScore * 0.3);

      // Keep a floor so low-score songs can still appear occasionally.
      return {
        song,
        weight: Math.max(1, combinedWeight),
      };
    });

    const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
    let target = Math.random() * totalWeight;

    for (const item of weighted) {
      target -= item.weight;
      if (target <= 0) {
        return item.song;
      }
    }

    return weighted[weighted.length - 1]?.song ?? null;
  }, []);

  const advanceQueue = useCallback((songs: SongData[], currentIndex: number) => {
    if (songs.length === 0) return;

    if (currentSong) trackInteraction(currentSong.id, 'skip');

    let nextIdx = currentIndex + 1;
    if (isShuffled) {
      nextIdx = Math.floor(Math.random() * songs.length);
    }

    if (nextIdx < songs.length) {
      setQueueIndex(nextIdx);
      void loadSong(songs[nextIdx]);
    } else {
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [currentSong, isShuffled]);

  const playNext = useCallback(() => {
    if (playbackModeRef.current === 'queue') {
      advanceQueue(queue, queueIndex);
      return;
    }

    const recommendationPool = autoplayPoolRef.current;

    if (recommendationPool.length > 0) {
      if (currentSong) trackInteraction(currentSong.id, 'skip');

      const nextSong = pickWeightedRandomSong(recommendationPool, currentSong?.id);

      if (!nextSong) {
        return;
      }

      setQueue((prev) => {
        const existingIndex = prev.findIndex((song) => song.id === nextSong.id);
        if (existingIndex !== -1) {
          setQueueIndex(existingIndex);
          return prev;
        }

        const updated = [...prev, nextSong];
        setQueueIndex(updated.length - 1);
        return updated;
      });

      void loadSong(nextSong);
      return;
    }

    advanceQueue(queue, queueIndex);
  }, [queue, queueIndex, currentSong, pickWeightedRandomSong, advanceQueue]);

  const playPrevious = () => {
    if (queueIndex > 0) {
      if (currentSong) trackInteraction(currentSong.id, 'skip');
      const nextIdx = queueIndex - 1;
      setQueueIndex(nextIdx);
      void loadSong(queue[nextIdx]);
    }
  };

  const closePlayer = () => {
    setIsPlaying(false);
    setCurrentSong(null);
    playbackModeRef.current = 'autoplay';
    setPlaybackMode('autoplay');
    setQueue([]);
    setQueueIndex(-1);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
  };

  const setAutoplayPool = useCallback((songs: SongData[]) => {
    autoplayPoolRef.current = songs;
  }, []);

  return (
    <AudioPlayerContext.Provider
      value={{
        currentSong, isPlaying, currentTime, duration, volume, isMuted, isShuffled, isRepeated, playbackMode,
        playSong, togglePlayPause, seekTo, setVolume, toggleMute, toggleShuffle, toggleRepeat,
        playNext, playPrevious, setAutoplayPool, closePlayer,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
};
