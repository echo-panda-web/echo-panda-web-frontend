import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDataCache } from "../contexts/DataCacheContext";
import { FaSpinner, FaMusic } from "react-icons/fa";
import Song from "../components/Song";
import AlbumCard from "../components/AlbumCard";
import { getMostPlayedSongs, getMostPlayedAlbums, trackSongPlay } from "../backend/playTrackingService";
import { useAudioPlayer } from "../contexts/AudioPlayerContextCore";
import { useTheme } from "../contexts/ThemeContext";

interface Artist {
  id: string;
  name: string;
  image_url: string;
}

interface Album {
  id: string;
  title: string;
  cover_url: string;
}

interface SongData {
  id: string;
  title: string;
  duration: number;
  album_id: string | null;
  audio_url: string | null;
  songCover_url: string | null;
  play_count: number;
  created_at: string;
  artists?: Artist[];
  album?: Album;
}

const MostPlayed: React.FC = () => {
  const navigate = useNavigate();
  const { playSong } = useAudioPlayer();
  const { getCachedData } = useDataCache();
  const { isLightMode } = useTheme();
  const [songs, setSongs] = useState<SongData[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAlbums, setLoadingAlbums] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchMostPlayedSongs();
    fetchMostPlayedAlbums();

  }, []);

  const fetchMostPlayedSongs = async () => {
    try {
      setLoading(true);

      const data = await getCachedData('most_played_songs', async () => {
        const startTime = performance.now();
        console.log('🔄 [MostPlayed] Fetching most played songs...');

        const songsData = await getMostPlayedSongs(25);

        const fetchTime = performance.now() - startTime;
        console.log(`✅ [MostPlayed] Songs fetched in ${fetchTime.toFixed(0)}ms`);
        console.log(`📊 [MostPlayed] Retrieved ${songsData.length} songs`);

        return songsData;
      });

      setSongs(data);
    } catch (error) {
      console.error('Error fetching most played songs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMostPlayedAlbums = async () => {
    try {
      setLoadingAlbums(true);

      const data = await getCachedData('most_played_albums', async () => {
        const startTime = performance.now();
        console.log('🔄 [MostPlayed] Fetching most played albums...');

        const albumsData = await getMostPlayedAlbums(10);

        const fetchTime = performance.now() - startTime;
        console.log(`✅ [MostPlayed] Albums fetched in ${fetchTime.toFixed(0)}ms`);
        console.log(`📊 [MostPlayed] Retrieved ${albumsData.length} albums with play counts`);

        const transformedAlbums = albumsData.map((album: any) => ({
          id: album.id,
          title: album.title,
          artist: album.artists?.[0]?.name || 'Unknown Artist',
          cover_url: album.cover_url || '',
          year: album.release_date ? new Date(album.release_date).getFullYear() : null,
          play_count: album.play_count,
          artists: album.artists || [],
          songs: album.play_count || 0,
        }));

        return transformedAlbums;
      });

      setAlbums(data);
    } catch (error) {
      console.error('Error fetching most played albums:', error);
    } finally {
      setLoadingAlbums(false);
    }
  };

  const handlePlay = async (songId: string) => {
    console.log('🎵 [MostPlayed] handlePlay called with songId:', songId);

    // Find the song data
    const song = songs.find(s => s.id === songId);

    if (!song) {
      console.error('❌ [MostPlayed] Song not found:', songId);
      return;
    }

    console.log('🎵 [MostPlayed] Song data:', song);
    console.log('🎵 [MostPlayed] Audio URL:', song.audio_url);

    if (!song.audio_url) {
      console.error('❌ [MostPlayed] No audio URL available for this song');
      showToast('This song has no audio file');
      return;
    }

    try {
      // Start playing immediately
      playSong({
        id: song.id,
        title: song.title,
        artist: song.artists?.map(a => a.name).join(', ') || 'Unknown Artist',
        coverUrl: song.songCover_url || song.album?.cover_url || '',
        audioUrl: song.audio_url || song.original_key,
        duration: song.duration
      });

      // Track the play in background (don't await)
      trackSongPlay(songId).catch(err =>
        console.error('Failed to track play:', err)
      );
    } catch (error) {
      console.error('❌ [MostPlayed] Error playing song:', error);
      showToast('Failed to play song');
    }
  };


  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className={`min-h-screen ${isLightMode ? "bg-gray-50 text-gray-900" : "bg-black text-white"} py-8`}>
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg animate-slide-up z-50">
          {toastMessage}
        </div>
      )}

      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className={`text-5xl font-black ${isLightMode ? "text-gray-900" : "text-white"} tracking-tight`}>
              Most <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-pink-400">Played</span>
            </h1>
          </div>
          <p className={`${isLightMode ? "text-gray-500" : "text-slate-400"} text-lg`}>Your most played tracks</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <FaSpinner className="text-purple-400 text-5xl animate-spin" />
          </div>
        ) : songs.length === 0 ? (
          <div className="text-center py-32">
            <FaMusic className={`${isLightMode ? "text-gray-300" : "text-slate-700"} text-6xl mx-auto mb-4`} />
            <p className={`${isLightMode ? "text-gray-500" : "text-slate-400"} text-xl`}>No songs played yet</p>
          </div>
        ) : (
          <div className={`${isLightMode ? "bg-white border border-gray-100 shadow-sm" : "bg-black"} rounded-lg mb-12`}>
            {/* Table Header */}
            <div className={`grid grid-cols-12 gap-4 text-xs md:text-[10px] font-black uppercase tracking-[0.2em] ${isLightMode ? "text-gray-400" : "text-slate-500"} border-b ${isLightMode ? "border-gray-100" : "border-white/5"} pb-4 px-6`}>
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-5 md:col-span-4">Title</div>
              <div className="hidden md:block md:col-span-3">Album</div>
              <div className="hidden md:block md:col-span-2">Plays</div>
              <div className="col-span-2 text-right">Time</div>
            </div>

            {/* Song List */}
            <div className="space-y-1 mt-6">
              {songs.map((song, index) => (
                <Song
                  key={song.id}
                  id={song.id}
                  index={index + 1}
                  title={song.title}
                  artists={song.artists}
                  album={song.album}
                  duration={song.duration}
                  coverUrl={song.songCover_url}
                  metadata={song.play_count > 0 ? `${song.play_count} plays` : '-'}
                  onPlay={handlePlay}

                />
              ))}
            </div>
          </div>
        )}

        <div className="mt-12">
          <h2 className={`text-2xl font-bold ${isLightMode ? "text-gray-900" : "text-white"} mb-6`}>
            Most Played Albums
          </h2>
          {loadingAlbums ? (
            <div className="flex items-center justify-center py-16">
              <FaSpinner className="text-purple-400 text-4xl animate-spin" />
            </div>
          ) : albums.length === 0 ? (
            <div className="text-center py-16">
              <FaMusic className={`${isLightMode ? "text-gray-300" : "text-slate-700"} text-5xl mx-auto mb-4`} />
              <p className={`${isLightMode ? "text-gray-500" : "text-slate-400"}`}>No albums found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {albums.map((album) => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MostPlayed;
