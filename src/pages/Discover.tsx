import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getGenres, getNewReleasesToday, getPopularArtists, type CatalogAlbum } from "../backend/catalogService";
import { useDataCache } from "../contexts/DataCacheContext";
import { getMostPlayedAlbums } from "../backend/playTrackingService";
import { getAdaptiveRecommendations, trackRecommendationEvent, type AdaptiveRecommendation } from "../backend/recommendationService";
import AlbumCard from "../components/AlbumCard";
import Song from "../components/Song";
import AppFooter from "../components/AppFooter";
import { FaSpinner } from "react-icons/fa";
import { useAudioPlayer } from "../contexts/AudioPlayerContext";
import { trackSongPlay } from "../backend/playTrackingService";

interface Category {
  id: string;
  name: string;
  description: string;
}

type Album = CatalogAlbum;

type ArtistCard = {
  id: string;
  name: string;
  image_url?: string;
  play_count?: number;
  monthly_listeners?: string;
};

const Discover: React.FC = () => {
  const navigate = useNavigate();
  const { playSong } = useAudioPlayer();
  const { getCachedData } = useDataCache();
  const isLightMode = false;
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [newReleaseAlbums, setNewReleaseAlbums] = useState<Album[]>([]);
  const [topAlbums, setTopAlbums] = useState<Album[]>([]);
  const [popularArtists, setPopularArtists] = useState<ArtistCard[]>([]);
  const [loadingNewReleases, setLoadingNewReleases] = useState(true);
  const [loadingTopAlbums, setLoadingTopAlbums] = useState(true);
  const [loadingPopularArtists, setLoadingPopularArtists] = useState(true);
  const [recommendations, setRecommendations] = useState<AdaptiveRecommendation[]>([]);
  const [recommendationLimit, setRecommendationLimit] = useState(10);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);

  const circleClass = isLightMode
    ? "bg-gray-200 text-gray-900 border-gray-300"
    : "bg-gray-800 text-white border-gray-700";

  useEffect(() => {
    fetchCategories();
    fetchNewReleaseAlbums();
    fetchTopAlbums();
    fetchPopularArtists();
    fetchRecommendations(10);
  }, []);

  const fetchRecommendations = async (limit: number) => {
    try {
      setLoadingRecommendations(true);
      setRecommendationError(null);

      const data = await getAdaptiveRecommendations(limit);
      setRecommendations(data || []);
      setRecommendationLimit(limit);
    } catch (error) {
      console.error("Error fetching discover recommendations:", error);
      setRecommendationError("Failed to load recommended songs");
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleLoadMoreRecommendations = async () => {
    await fetchRecommendations(recommendationLimit + 10);
  };

  const handlePlayRecommendation = async (item: AdaptiveRecommendation) => {
    const song = item.song;
    if (!song?.audio_url) {
      return;
    }

    playSong({
      id: String(song.id),
      title: song.title,
      artist: song.artist || "Unknown Artist",
      coverUrl: song.cover_key || song.album?.cover_url || "",
      audioUrl: song.audio_url,
      duration: song.duration || 0,
    });

    trackSongPlay(String(song.id)).catch(() => undefined);

    trackRecommendationEvent({
      songId: song.id,
      eventType: "recommendation_played",
      recommendationScore: item.recommendation_score,
      recommendationReason: item.recommendation_reason,
    }).catch(() => undefined);
  };

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);

      const data = await getCachedData('discover_genres', async () => {
        const startTime = performance.now();
        console.log('🔄 [Discover] Fetching categories...');

        const categoriesData = await getGenres();

        const fetchTime = performance.now() - startTime;
        console.log(`✅ [Discover] Categories fetched in ${fetchTime.toFixed(0)}ms`);
        console.log(`📊 [Discover] Retrieved ${categoriesData?.length || 0} categories`);

        return categoriesData || [];
      });

      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchNewReleaseAlbums = async () => {
    try {
      setLoadingNewReleases(true);

      const data = await getCachedData('new_release_albums', async () => {
        const startTime = performance.now();
        console.log('🔄 [Discover] Fetching real-time new releases...');

        const albumsData = await getNewReleasesToday(10);

        const fetchTime = performance.now() - startTime;
        console.log(`✅ [Discover] New releases fetched in ${fetchTime.toFixed(0)}ms`);
        console.log(`📊 [Discover] Retrieved ${albumsData?.length || 0} albums`);

        return albumsData || [];
      });

      setNewReleaseAlbums(data);
    } catch (error) {
      console.error('Error fetching new release albums:', error);
    } finally {
      setLoadingNewReleases(false);
    }
  };

  const fetchPopularArtists = async () => {
    try {
      setLoadingPopularArtists(true);

      const data = await getCachedData('discover_popular_artists', async () => {
        const startTime = performance.now();
        console.log('🔄 [Discover] Fetching popular artists...');

        const artistsData = await getPopularArtists(12);

        const fetchTime = performance.now() - startTime;
        console.log(`✅ [Discover] Popular artists fetched in ${fetchTime.toFixed(0)}ms`);
        console.log(`📊 [Discover] Retrieved ${artistsData.length} artists`);

        return artistsData;
      });

      setPopularArtists(data);
    } catch (error) {
      console.error('Error fetching popular artists:', error);
    } finally {
      setLoadingPopularArtists(false);
    }
  };

  const fetchTopAlbums = async () => {
    try {
      setLoadingTopAlbums(true);

      const data = await getCachedData('discover_top_albums', async () => {
        const startTime = performance.now();
        console.log('🔄 [Discover] Fetching top albums...');

        const albumsData = await getMostPlayedAlbums(10);

        const fetchTime = performance.now() - startTime;
        console.log(`✅ [Discover] Top albums fetched in ${fetchTime.toFixed(0)}ms`);
        console.log(`📊 [Discover] Retrieved ${albumsData.length} albums`);

        return albumsData;
      });

      setTopAlbums(data);
    } catch (error) {
      console.error('Error fetching top albums:', error);
    } finally {
      setLoadingTopAlbums(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Categories Section */}
      {!loadingCategories && categories.length > 0 && (
        <div className="px-4 md:px-8 py-12 max-w-7xl mx-auto">
          <h2 className="text-4xl font-black mb-8 text-white tracking-tight">Music <span className="bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Genres</span></h2>
          <div className="flex overflow-x-auto gap-5 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {categories.map((category, idx) => {
              const colors = [
                'from-purple-600 to-pink-600',
                'from-blue-600 to-cyan-600',
                'from-rose-600 to-orange-600',
                'from-emerald-600 to-teal-600',
                'from-indigo-600 to-purple-600',
                'from-yellow-600 to-orange-600',
              ];
              const colorClass = colors[idx % colors.length];
              return (
                <button
                  key={category.id}
                  onClick={() => navigate(`/category/${category.id}`)}
                  className="group focus:outline-none transition-all duration-300 shrink-0 w-48"
                  aria-label={`View ${category.name} albums`}
                >
                  <div className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl p-6 transition-all duration-300 h-full flex flex-col items-center text-center hover:shadow-xl hover:shadow-purple-500/10 group-hover:scale-50">
                    <div className={`w-16 h-16 rounded-xl bg-linear-to-br ${colorClass} flex items-center justify-center text-3xl mb-3 shadow-lg`}>
                      🎵
                    </div>
                    <h3 className="text-white font-bold text-sm sm:text-base group-hover:text-purple-300 transition-colors line-clamp-2">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="text-gray-400 text-xs mt-2 line-clamp-2">
                        {category.description}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Songs Sections */}
      <section className="px-4 md:px-8 py-8 max-w-7xl mx-auto">
        <h2 className="text-3xl font-black mb-6 text-white tracking-tight">
          Recommended <span className="bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">For You</span>
        </h2>
        {loadingRecommendations ? (
          <div className="flex items-center justify-center py-12">
            <FaSpinner className="text-purple-400 text-3xl animate-spin" />
          </div>
        ) : recommendationError ? (
          <div className="text-rose-400 py-6">{recommendationError}</div>
        ) : recommendations.length === 0 ? (
          <div className="text-slate-400 py-6">No personalized recommendations yet.</div>
        ) : (
          <>
            <div className="space-y-2">
              {recommendations.map((item, index) => (
                <Song
                  key={item.id}
                  id={String(item.song.id)}
                  index={index + 1}
                  title={item.song.title}
                  duration={item.song.duration || 0}
                  artists={item.song.artist ? [{ id: String(item.song.artist_id || item.song.id), name: item.song.artist, image_url: "" }] : []}
                  album={item.song.album ? { id: String(item.song.album.id), title: item.song.album.title, cover_url: item.song.album.cover_url } : null}
                  coverUrl={item.song.cover_key || item.song.album?.cover_url || null}
                  metadata={item.recommendation_reason}
                  onPlay={() => handlePlayRecommendation(item)}
                />
              ))}
            </div>
            <div className="mt-4 flex justify-center">
              <button
                onClick={handleLoadMoreRecommendations}
                className="px-5 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition"
              >
                Load More
              </button>
            </div>
          </>
        )}
      </section>

      {/* New Release Albums */}
      <div className="px-4 md:px-8 py-8 max-w-7xl mx-auto">
        <h2 className="text-3xl font-black mb-6 text-white tracking-tight">
          New Release <span className="bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Today</span>
        </h2>
        {loadingNewReleases ? (
          <div className="flex items-center justify-center py-12">
            <FaSpinner className="text-purple-400 text-3xl animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {newReleaseAlbums.map((album) => (
              <AlbumCard
                key={album.id}
                album={album}
              />
            ))}
          </div>
        )}
      </div>

      <div className="px-4 md:px-8 py-8 max-w-7xl mx-auto">
        <div className="flex items-end justify-between gap-4 mb-6">
          <h2 className="text-3xl font-black text-white tracking-tight">
            Popular <span className="bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Artists</span>
          </h2>
          <span className="text-xs uppercase tracking-[0.3em] text-slate-500">Real-time plays</span>
        </div>
        {loadingPopularArtists ? (
          <div className="flex items-center justify-center py-12">
            <FaSpinner className="text-purple-400 text-3xl animate-spin" />
          </div>
        ) : popularArtists.length === 0 ? (
          <div className="text-slate-400 py-6">No popular artists available.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {popularArtists.map((artist) => (
              <button
                key={artist.id}
                onClick={() => navigate(`/artist/${artist.id}`)}
                className="group focus:outline-none text-left"
              >
                <div className="mx-auto w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white/5 ring-1 ring-white/10 overflow-hidden transition-transform duration-200 group-hover:scale-105">
                  {artist.image_url ? (
                    <img src={artist.image_url} alt={artist.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600" />
                  )}
                </div>
                <p className="mt-3 text-center text-sm sm:text-base font-medium truncate text-white">{artist.name}</p>
                <p className="mt-1 text-center text-xs text-slate-400">{artist.monthly_listeners || `${artist.play_count || 0} plays`}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Top Albums */}
      <div className="px-4 md:px-8 py-8 max-w-7xl mx-auto">
        <h2 className="text-3xl font-black mb-6 text-white tracking-tight">
          Top <span className="bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Albums</span>
        </h2>
        {loadingTopAlbums ? (
          <div className="flex items-center justify-center py-12">
            <FaSpinner className="text-purple-400 text-3xl animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {topAlbums.map((album) => (
              <AlbumCard
                key={album.id}
                album={album}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <AppFooter isLightMode={isLightMode} />
    </div>
  );
};

export default Discover;
