import { useState, useEffect, useMemo, useCallback } from 'react';
import { buildApiUrl } from '../backend/backendUrls';

export interface LyricLine {
  time_ms: number;
  text: string;
}

export interface LyricsData {
  song_id: string;
  format: 'lrc' | 'plain';
  language: string | null;
  lines: LyricLine[];
}

export const useLyrics = (songId: string | undefined, currentTime: number) => {
  const [lyrics, setLyrics] = useState<LyricsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!songId) {
      setLyrics(null);
      return;
    }

    const fetchLyrics = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(buildApiUrl(`/songs/${songId}/lyrics`));
        if (!response.ok) throw new Error('Failed to fetch lyrics');
        const data = await response.json();
        setLyrics(data);
      } catch (err) {
        console.error('Error loading lyrics:', err);
        setError('Lyrics not available');
        setLyrics(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLyrics();
  }, [songId]);

  const activeIndex = useMemo(() => {
    if (!lyrics || lyrics.lines.length === 0) return -1;

    // For plain lyrics, we don't have timestamps, so we can't sync.
    // But we'll return -1 to let the UI handle it (e.g. show all lines at same opacity)
    if (lyrics.format === 'plain') return -1;

    const currentTimeMs = (currentTime * 1000) + 150; // Add 150ms offset for better "live" feel (matches audio latency)

    let low = 0;
    let high = lyrics.lines.length - 1;
    let index = -1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (lyrics.lines[mid].time_ms <= currentTimeMs) {
        index = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    // If we are at the very start of the song and the first line is within 2 seconds,
    // we can optionally highlight it. But let's stay accurate for now.
    return index;
  }, [lyrics, currentTime]);

  return {
    lyrics,
    loading,
    error,
    activeIndex,
  };
};
