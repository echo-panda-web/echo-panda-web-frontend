import { createContext, useContext } from 'react';

export interface SongData {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  audioUrl?: string | null;
  duration?: number;
  recommendationScore?: number;
  similarityScore?: number;
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
  playSong: (song: SongData) => void;
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
