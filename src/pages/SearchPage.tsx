import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { searchContent, Song, Artist } from "../backend/searchService";
import { useTheme } from "../contexts/ThemeContext";

const SearchPage: React.FC = () => {
  const { isLightMode } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [songs, setSongs] = useState<Song[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Search Effect
  useEffect(() => {
    if (!query.trim()) {
      setSongs([]);
      setArtists([]);
      return;
    }

    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const results = await searchContent(query);
        setSongs(results.songs);
        setArtists(results.artists);
      } catch (error) {
        console.error('Search error:', error);
        setSongs([]);
        setArtists([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSongClick = (songId: number | string) => {
    navigate(`/song/${songId}`);
  };

  const handleArtistClick = (artistId: number | string) => {
    navigate(`/artist/${artistId}`);
  };

  const topArtistName = artists[0]?.name;
  const topArtistSongCount = topArtistName
    ? songs.filter((song) =>
        String(song.artist_name || "").toLowerCase() === topArtistName.toLowerCase()
      ).length
    : 0;
  const showArtistFallback = topArtistName && topArtistSongCount > 0;

  return (
    <div className={`min-h-screen ${isLightMode ? "bg-gray-50 text-gray-900" : "bg-black text-white"}`}>
      <div className={`p-6 md:p-8`}>
        <h1 className={`text-4xl md:text-5xl font-bold mb-2 ${isLightMode ? "text-gray-900" : "text-white"}`}>Search Results</h1>
        {query.trim() ? (
          <p className={`text-lg ${isLightMode ? "text-gray-500" : "text-gray-400"}`}>
            Results for: <span className="font-semibold text-blue-500">"{query}"</span>
          </p>
        ) : (
          <p className={`text-lg ${isLightMode ? "text-gray-500" : "text-gray-400"}`}>
            Enter a search query to find songs and artists
          </p>
        )}
      </div>

      {!query.trim() ? (
        <div className="text-center py-20 px-6">
          <p className={`text-xl ${isLightMode ? "text-gray-400" : "text-gray-500"}`}>
            No search query. Try searching for songs or artists!
          </p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className={isLightMode ? "text-gray-500" : "text-gray-400"}>Searching...</p>
          </div>
        </div>
      ) : songs.length === 0 && artists.length === 0 ? (
        <div className="text-center py-20 px-6">
          <p className={`text-xl ${isLightMode ? "text-gray-400" : "text-gray-500"}`}>
            No results found for "{query}"
          </p>
        </div>
      ) : (
        <div className="p-6 md:p-8 space-y-8">
          {songs.length > 0 && (
            <div>
              <h2 className={`text-2xl font-bold mb-2 ${isLightMode ? "text-gray-900" : "text-white"}`}>
                {showArtistFallback ? `Songs from ${topArtistName} (${songs.length})` : `Songs (${songs.length})`}
              </h2>
              {showArtistFallback ? (
                <p className={`text-sm mb-4 ${isLightMode ? "text-gray-500" : "text-gray-400"}`}>
                  Showing results for the top matching artist.
                </p>
              ) : null}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                {songs.map((song) => (
                  <div
                    key={song.id}
                    onClick={() => handleSongClick(song.id)}
                    className={`cursor-pointer group relative h-full flex flex-col ${isLightMode ? "bg-white border-gray-100 shadow-sm" : "bg-black border-white/5"} p-4 rounded-lg border transition-all hover:shadow-lg`}
                  >
                    <div className={`w-full aspect-square ${isLightMode ? "bg-gray-100" : "bg-zinc-700"} rounded-lg flex items-center justify-center mb-4 relative overflow-hidden`}>
                      {song.cover_url ? (
                        <img
                          src={song.cover_url}
                          alt={song.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg
                          className={`w-10 h-10 ${isLightMode ? "text-gray-300" : "text-zinc-600"}`}
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                        </svg>
                      )}

                      <button
                        className="absolute bottom-3 right-3 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-lg transition-all duration-300 transform bg-green-500 hover:bg-green-600 shadow-green-500/25 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 hover:scale-105 active:scale-95"
                        aria-label={`Play song ${song.title}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSongClick(song.id);
                        }}
                      >
                        <svg
                          className="w-5 h-5 ml-0.5"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>

                      <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                    </div>

                    <div className="flex-1 flex flex-col justify-between space-y-2">
                      <div className="space-y-1">
                        <h3 className={`font-semibold line-clamp-2 leading-tight ${isLightMode ? "text-gray-900" : "text-white"}`}>
                          {song.title}
                        </h3>
                        <p className={`text-sm ${isLightMode ? "text-gray-500" : "text-zinc-400"} line-clamp-1`}>
                          {song.artist_name || (song as any).artists?.map((a: any) => a.name).join(", ") || (song as any).artist || "Unknown Artist"}
                        </p>
                      </div>
                      <p className={`text-xs ${isLightMode ? "text-gray-400" : "text-zinc-400"}`}>
                        Song
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {artists.length > 0 && (
            <div>
              <h2 className={`text-2xl font-bold mb-6 ${isLightMode ? "text-gray-900" : "text-white"}`}>Artists ({artists.length})</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {artists.map((artist) => (
                  <div
                    key={artist.id}
                    onClick={() => handleArtistClick(artist.id)}
                    className={`p-5 rounded-lg ${isLightMode ? "bg-white border-gray-100 shadow-sm" : "bg-black border-white/5 hover:bg-zinc-900"} border cursor-pointer transition-all hover:shadow-lg text-center space-y-3`}
                  >
                    {artist.image_url && (
                      <img
                        src={artist.image_url}
                        alt={artist.name}
                        className="w-full h-40 rounded-lg object-cover"
                      />
                    )}
                    <div className="space-y-1">
                      <p className={`font-semibold line-clamp-2 ${isLightMode ? "text-gray-900" : "text-white"}`}>{artist.name}</p>
                      <p className={`text-xs ${isLightMode ? "text-gray-500" : "text-gray-400"}`}>Artist</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
