import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSpinner, FaMusic, FaTrash } from "react-icons/fa";
import Song from "../components/Song";
import { removeFromFavorites } from "../backend/favoritesService";
import { trackSongPlay } from "../backend/playTrackingService";

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
  created_at: string;
  artists?: Artist[];
  album?: Album;
  added_at?: string;
}

const viteEnv = (import.meta as any).env || {};
const BACKEND_API_BASE_URL =
  viteEnv.VITE_BACKEND_API_URL || "http://localhost:8082/api";

const getBackendToken = (): string | null => {
  return localStorage.getItem("userToken") || localStorage.getItem("authToken");
};



const Favorites: React.FC = () => {
  const navigate = useNavigate();
  const [songs, setSongs] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [rawResponse, setRawResponse] = useState<any>(null);

  useEffect(() => {
    fetchFavoriteSongs();
  }, []);

  const fetchFavoriteSongs = async () => {
    try {
      setLoading(true);
      const startTime = performance.now();
      console.log('🔄 [Favorites] Fetching favorite songs...');

      const data = await (async () => {
        const token = getBackendToken();
        if (!token) {
          return [];
        }

        const response = await fetch(`${BACKEND_API_BASE_URL}/profile/favorite-songs`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch favorite songs");
        }

        const json = await response.json();
        console.debug('[Favorites] raw response', json);
        setRawResponse(json);
        const favorites = json?.data || json?.favorites || json?.songs || [];
        console.debug('[Favorites] extracted favorites length', Array.isArray(favorites) ? favorites.length : typeof favorites, favorites);

        const fetchTime = performance.now() - startTime;
        console.log(`✅ [Favorites] Songs fetched in ${fetchTime.toFixed(0)}ms`);
        console.log(`📊 [Favorites] Retrieved ${favorites.length || 0} songs`);

        const transformedSongs: SongData[] = favorites
          .map((favorite: any) => {
            const song = favorite?.favoritable;
            if (!song) return null;

            return {
              id: String(song.id),
              title: song.title,
              duration: song.duration,
              album_id: song.album_id ? String(song.album_id) : null,
              audio_url: song.audio_url || null,
              songCover_url: song.songCover_url || song.album?.cover_url || null,
              created_at: favorite.created_at || song.created_at,
              artists: song.artist ? [{ id: String(song.id), name: song.artist }] : [],
              album: song.album
                ? {
                    id: String(song.album.id),
                    title: song.album.title,
                    cover_url: song.album.cover_url || song.album.cover_image || undefined,
                  }
                : null,
            };
          })
          .filter(Boolean) as SongData[];

        return transformedSongs;
      });

      setSongs(data);
      console.debug('[Favorites] setSongs called with', Array.isArray(data) ? data.length : typeof data, data);
    } catch (error) {
      console.error('Error fetching favorite songs:', error);
    } finally {
      setLoading(false);
    }
  };



  const handlePlay = (songId: string) => {
    trackSongPlay(songId);
    navigate(`/song/${songId}`);
  };

  const handleAddToPlaylist = (songId: string) => {
    console.log('Add to playlist:', songId);
    // Implement add to playlist logic
  };

  const handleRemoveFavorite = async (songId: string) => {
    const success = await removeFromFavorites(songId);
    if (success) {
      // Refresh the list
      await fetchFavoriteSongs();
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to remove all favorites?')) {
      for (const song of songsList) {
        await removeFromFavorites(song.id);
      }
      setSongs([]);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };
  const toSongData = (favorite: any): SongData | null => {
    const song = favorite?.favoritable || (favorite?.song ?? null) || null;
    if (!song) return null;

    return {
      id: String(song.id),
      title: song.title,
      duration: song.duration,
      album_id: song.album_id ? String(song.album_id) : null,
                    audio_url: song.audio_url || null,
                    songCover_url: song.songCover_url || song.album?.cover_url || null,
      created_at: favorite.created_at || song.created_at || new Date().toISOString(),
      artists: song.artist ? [{ id: String(song.id), name: song.artist }] : [],
      album: song.album
        ? {
            id: String(song.album.id),
            title: song.album.title,
                    cover_url: song.album.cover_url || song.album.cover_image || undefined,
          }
        : null,
    };
  };

  // Derive a single songsList used for counts and rendering. Prefer `songs` state when it's an array,
  // otherwise fall back to the raw API `rawResponse.data` transformed into SongData.
  const songsList: SongData[] = Array.isArray(songs)
    ? songs
    : Array.isArray(songs?.data)
    ? songs.data
    : Array.isArray(rawResponse?.data)
    ? rawResponse.data.map(toSongData).filter(Boolean) as SongData[]
    : Array.isArray(rawResponse?.favorites)
    ? rawResponse.favorites.map(toSongData).filter(Boolean) as SongData[]
    : [];

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-5xl font-black text-white tracking-tight">
              Liked <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Songs</span>
            </h1>
          </div>
          <p className="text-slate-400 text-lg">
            {songsList.length} {songsList.length === 1 ? 'song' : 'songs'}
          </p>
          {songsList.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/30"
            >
              <FaTrash size={16} />
              Clear All
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <FaSpinner className="text-purple-400 text-5xl animate-spin" />
          </div>
        ) : songsList.length === 0 ? (
          <div className="text-center py-32">
            <FaMusic className="text-slate-700 text-6xl mx-auto mb-4" />
            <p className="text-slate-400 text-xl mb-2">No liked songs yet</p>
            <p className="text-slate-500">Songs you like will appear here</p>
          </div>
        ) : (
          <div className="bg-[#0f0f0f] rounded-lg">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 text-xs md:text-sm uppercase tracking-wide text-gray-400 font-medium border-b border-gray-800 pb-2 px-3">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-5 md:col-span-4">Title</div>
              <div className="hidden md:block md:col-span-3">Album</div>
              <div className="hidden md:block md:col-span-2">Added</div>
              <div className="col-span-2 text-right">Time</div>
            </div>

            {/* Song List */}
            <div className="space-y-2 mt-3">
              {songsList.map((song, index) => (
                  <Song
                    key={song.id}
                    id={song.id}
                    index={index + 1}
                    title={song.title}
                    artists={song.artists}
                    album={song.album}
                    duration={song.duration}
                    coverUrl={song.songCover_url}
                    metadata={formatDate(song.created_at)}
                    onPlay={handlePlay}
                    onAddToPlaylist={handleAddToPlaylist}
                    onAddToFavorite={handleRemoveFavorite}
                  />
              ))}
            </div>
          </div>
        )}
      </div>

      
    </div>
  );
};

export default Favorites;
