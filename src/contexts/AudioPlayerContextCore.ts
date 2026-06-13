import { createContext, useContext } from 'react';

/** Optional scores attached by Player.tsx from recommendation API for autoplay weighting. */
export interface SongData {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  audioUrl?: string | null;
  duration?: number;
  /** From GET /recommendations — 70% of autoplay pick weight. */
  recommendationScore?: number;
  /** Sum of artist+genre+mood+tag reason scores — 30% of autoplay pick weight. */
  similarityScore?: number;
}

export interface PlaySongOptions {
  /** When set, next/previous and autoplay stay within this list only. */
  queue?: SongData[];
}

export interface AudioPlayerContextType {
  currentSong: SongData | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffled: boolean;
  isRepeated: boolean;
  playbackMode: 'autoplay' | 'queue';
  playSong: (song: SongData, options?: PlaySongOptions) => void;
  togglePlayPause: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  playNext: () => void;
  playPrevious: () => void;
  setAutoplayPool: (songs: SongData[]) => void;
  closePlayer: () => void;
}

export const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within AudioPlayerProvider');
  }
  return context;
};
