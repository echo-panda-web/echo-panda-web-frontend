import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  getAlbums,
  getGenres,
  getSongs,
  getNewReleasesToday,
  getPopularArtists,
  type CatalogSong,
  type CatalogAlbum
} from "../backend/catalogService";
import { useDataCache } from "../contexts/DataCacheContext";
import { getMostPlayedAlbums, trackSongPlay } from "../backend/playTrackingService";
import {
  getAdaptiveRecommendations,
  trackRecommendationEvent,
  type AdaptiveRecommendation
} from "../backend/recommendationService";
import AlbumCard from "../components/AlbumCard";
import Song from "../components/Song";
import ArtistSection from "../components/ArtistsSection";
import SongSection from "../components/SongsSection";
import AppFooter from "../components/AppFooter";
import { FaSpinner, FaChevronLeft, FaChevronRight, FaClock, FaHeart, FaPlay } from "react-icons/fa";
import { useTheme } from "../contexts/ThemeContext";
import { useAudioPlayer } from "../contexts/AudioPlayerContext";

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
  const { isLightMode } = useTheme();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [newReleaseAlbums, setNewReleaseAlbums] = useState<Album[]>([]);
  const [topAlbums, setTopAlbums] = useState<Album[]>([]);
  const [trendingSongs, setTrendingSongs] = useState<CatalogSong[]>([]);
  const [popularArtists, setPopularArtists] = useState<ArtistCard[]>([]);

  const [loadingNewReleases, setLoadingNewReleases] = useState(true);
  const [loadingTopAlbums, setLoadingTopAlbums] = useState(true);
  const [loadingPopularArtists, setLoadingPopularArtists] = useState(true);

  const [recommendations, setRecommendations] = useState<AdaptiveRecommendation[]>([]);
  const [recommendationLimit, setRecommendationLimit] = useState(10);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textColor = isLightMode ? "text-gray-900" : "text-white";

  useEffect(() => {
    fetchCategories();
    fetchNewReleaseAlbums();
    fetchTopAlbums();
    fetchTrendingSongs();
    fetchPopularArtists();
    fetchRecommendations(10);
  }, []);

  const fetchTrendingSongs = async () => {
    try {
      const data = await getSongs(7);
      setTrendingSongs(data);
    } catch (e) {
      console.error(e);
    }
  };

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
      songId: Number(song.id),
      eventType: "recommendation_played",
      recommendationScore: item.recommendation_score,
      recommendationReason: item.recommendation_reason,
    }).catch(() => undefined);
  };

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const data = await getCachedData('discover_genres', async () => {
        const categoriesData = await getGenres();
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
        const albumsData = await getNewReleasesToday(10);
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
        const artistsData = await getPopularArtists(12);
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
        const albumsData = await getMostPlayedAlbums(10);
        return albumsData;
      });
      setTopAlbums(data);
    } catch (error) {
      console.error('Error fetching top albums:', error);
    } finally {
      setLoadingTopAlbums(false);
    }
  };

  const scrollGenres = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth * 0.8 : scrollLeft + clientWidth * 0.8;
      scrollContainerRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return "Unknown Date";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className={`min-h-screen ${isLightMode ? "bg-gray-50" : "bg-black"} transition-colors duration-300 pb-20`}>
      {/* 1. Music Genres Section */}
      {!loadingCategories && categories.length > 0 && (
        <div className="px-4 md:px-8 py-12 max-w-7xl mx-auto animate-fade-up">
          <div className="flex justify-between items-end mb-8 px-2">
            <h2 className={`text-2xl md:text-4xl font-black ${textColor} tracking-tight`}>
              Music <span className="text-blue-500">Genres</span>
            </h2>
            <div className="hidden md:flex gap-3">
              <button onClick={() => scrollGenres('left')} className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${isLightMode ? "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 shadow-sm" : "bg-white/5 border border-white/10 text-white hover:bg-white/10"}`}>
                <FaChevronLeft size={12} />
              </button>
              <button onClick={() => scrollGenres('right')} className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${isLightMode ? "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 shadow-sm" : "bg-white/5 border border-white/10 text-white hover:bg-white/10"}`}>
                <FaChevronRight size={12} />
              </button>
            </div>
          </div>

          <div ref={scrollContainerRef} className="flex overflow-x-auto gap-6 pb-6 custom-scrollbar scroll-smooth snap-x snap-mandatory">
            {categories.map((category, idx) => {
              const bgImages = [
                'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80',
                'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=400&q=80',
                'https://images.unsplash.com/photo-1514525253361-bee871846439?w=400&q=80',
                'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80',
                'https://images.unsplash.com/photo-1459749411177-042180ce673c?w=400&q=80',
              ];
              return (
                <button
                  key={category.id}
                  onClick={() => navigate(`/category/${category.id}`)}
                  className="group relative shrink-0 w-48 h-28 md:w-64 md:h-36 rounded-2xl overflow-hidden snap-start transition-transform duration-500 hover:scale-[1.03]"
                >
                  <img
                    src={bgImages[idx % bgImages.length]}
                    alt={category.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-2"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <h3 className="text-white font-black text-lg md:text-2xl uppercase tracking-tighter drop-shadow-lg group-hover:scale-110 transition-transform duration-300 text-center px-4">
                      {category.name} <span className="text-blue-400">Tracks</span>
                    </h3>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Recommended For You */}
      <section className="px-4 md:px-8 py-8 max-w-7xl mx-auto">
        <h2 className={`text-2xl md:text-4xl font-black mb-6 ${textColor} tracking-tight`}>
          Recommended <span className="text-blue-500">For You</span>
        </h2>
        {loadingRecommendations ? (
          <div className="flex items-center justify-center py-12">
            <FaSpinner className="text-blue-500 text-3xl animate-spin" />
          </div>
        ) : recommendationError ? (
          <div className="text-rose-400 py-6">{recommendationError}</div>
        ) : recommendations.length === 0 ? (
          <div className="text-zinc-500 py-6">No personalized recommendations yet.</div>
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
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleLoadMoreRecommendations}
                className={`px-8 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all ${isLightMode ? "border-zinc-200 text-zinc-700 hover:bg-zinc-100" : "border-white/10 text-white hover:bg-white/5"}`}
              >
                Load More
              </button>
            </div>
          </>
        )}
      </section>

      {/* 3. Popular Artists */}
      <div className="animate-fade-up max-w-7xl mx-auto" style={{ animationDelay: '200ms' }}>
         <div className="px-4 md:px-8 py-8">
            <div className="flex items-end justify-between gap-4 mb-8 px-2">
               <h2 className={`text-2xl md:text-4xl font-black ${textColor} tracking-tight`}>
                  Popular <span className="text-blue-500">Artists</span>
               </h2>
               <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-bold">Real-time plays</span>
            </div>
            {loadingPopularArtists ? (
               <div className="flex items-center justify-center py-12">
                  <FaSpinner className="text-blue-500 text-3xl animate-spin" />
               </div>
            ) : popularArtists.length === 0 ? (
               <div className="text-zinc-500 py-6">No popular artists available.</div>
            ) : (
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
                  {popularArtists.map((artist) => (
                     <button
                        key={artist.id}
                        onClick={() => navigate(`/artist/${artist.id}`)}
                        className="group text-center flex flex-col items-center"
                     >
                        <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden transition-all duration-300 group-hover:scale-105 shadow-xl ${isLightMode ? 'bg-zinc-200' : 'bg-white/5 ring-1 ring-white/10'} relative`}>
                           {artist.image_url ? (
                              <img src={artist.image_url} alt={artist.name} className="w-full h-full object-cover" />
                           ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600" />
                           )}
                        </div>
                        <p className={`mt-3 font-bold truncate w-full text-sm ${isLightMode ? 'text-zinc-900' : 'text-white'} group-hover:text-blue-500 transition-colors`}>{artist.name}</p>
                        <p className="text-[10px] font-bold text-zinc-500 mt-1 uppercase tracking-wider">{artist.monthly_listeners || `${artist.play_count || 0} plays`}</p>
                     </button>
                  ))}
               </div>
            )}
         </div>
      </div>

      {/* 4. Trending Songs List View */}
      <div className="px-4 md:px-8 py-12 max-w-7xl mx-auto animate-fade-up" style={{ animationDelay: '300ms' }}>
        <div className="mb-8 px-2 flex justify-between items-end">
            <h2 className={`text-2xl md:text-4xl font-black ${textColor} tracking-tight`}>
                Trending <span className="text-blue-500">Songs</span>
            </h2>
        </div>

        <div className="w-full">
            <div className={`grid grid-cols-12 gap-4 px-8 py-3 text-[11px] font-black uppercase tracking-[0.2em] ${isLightMode ? 'text-gray-400' : 'text-zinc-500'} border-b ${isLightMode ? 'border-zinc-200' : 'border-white/5'}`}>
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-5 md:col-span-4">Title</div>
                <div className="hidden md:block col-span-2">Release Date</div>
                <div className="col-span-4">Album</div>
                <div className="col-span-2 md:col-span-1 text-right flex justify-end items-center pr-4">
                   <FaClock size={14} />
                </div>
            </div>

            <div className="mt-4 space-y-1">
                {trendingSongs.map((song, i) => (
                    <div
                        key={song.id}
                        className={`grid grid-cols-12 gap-4 items-center px-4 py-3 rounded-2xl transition-all duration-300 group ${isLightMode ? 'hover:bg-zinc-100' : 'hover:bg-white/5'}`}
                    >
                        <div className="col-span-1 text-center text-sm font-black text-zinc-500 group-hover:text-blue-500 transition-colors">
                            #{i + 1}
                        </div>
                        <div className="col-span-5 md:col-span-4 flex items-center gap-4 min-w-0">
                            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-lg relative group/cover">
                                <img src={song.songCover_url || "/logo.webp"} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                <div className="absolute inset-0 bg-blue-600/40 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center">
                                    <FaPlay size={14} className="text-white" />
                                </div>
                            </div>
                            <div className="min-w-0">
                                <h4 className={`text-sm md:text-base font-bold truncate ${isLightMode ? 'text-zinc-900' : 'text-white'} group-hover:text-blue-500 transition-colors`}>{song.title}</h4>
                                <p className={`text-xs font-semibold truncate ${isLightMode ? 'text-zinc-500' : 'text-zinc-500'} uppercase tracking-wider`}>{song.artists[0]?.name}</p>
                            </div>
                        </div>
                        <div className={`hidden md:block col-span-2 text-xs font-bold ${isLightMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                            {formatDate(song.created_at)}
                        </div>
                        <div className={`col-span-4 text-xs font-bold truncate ${isLightMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                            {song.album?.title || "Single"}
                        </div>
                        <div className="col-span-2 md:col-span-1 flex items-center justify-end gap-5 pr-2">
                            <FaHeart size={14} className="text-zinc-600 hover:text-pink-500 cursor-pointer transition-colors" />
                            <span className={`text-xs font-mono font-bold ${isLightMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{formatDuration(song.duration)}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 flex justify-center">
                <Link
                    to="/songs?type=trending"
                    className={`px-10 py-3.5 rounded-full text-xs font-black uppercase tracking-[0.2em] border-2 transition-all ${isLightMode ? 'border-zinc-200 text-zinc-700 hover:bg-zinc-900 hover:text-white hover:border-zinc-900' : 'border-white/10 text-zinc-400 hover:bg-white hover:text-black hover:border-white'} active:scale-95`}
                >
                    View All Trending
                </Link>
            </div>
        </div>
      </div>

      {/* 5. New Release Songs Today */}
      <div className="px-4 md:px-8 py-8 max-w-7xl mx-auto animate-fade-up" style={{ animationDelay: '400ms' }}>
         <h2 className={`text-2xl md:text-4xl font-black mb-8 ${textColor} tracking-tight px-2`}>
            New Release <span className="text-blue-500">Today</span>
         </h2>
         {loadingNewReleases ? (
            <div className="flex items-center justify-center py-12">
               <FaSpinner className="text-blue-500 text-3xl animate-spin" />
            </div>
         ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
               {newReleaseAlbums.map((album) => (
                  <AlbumCard
                     key={album.id}
                     album={album}
                  />
               ))}
            </div>
         )}
      </div>

      {/* 6. Top Albums */}
      <div className="px-4 md:px-8 py-8 max-w-7xl mx-auto animate-fade-up" style={{ animationDelay: '500ms' }}>
         <h2 className={`text-2xl md:text-4xl font-black mb-8 ${textColor} tracking-tight px-2`}>
            Top <span className="text-blue-500">Albums</span>
         </h2>
         {loadingTopAlbums ? (
            <div className="flex items-center justify-center py-12">
               <FaSpinner className="text-blue-500 text-3xl animate-spin" />
            </div>
         ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
               {topAlbums.map((album) => (
                  <AlbumCard
                     key={album.id}
                     album={album}
                  />
               ))}
            </div>
         )}
      </div>

      <AppFooter isLightMode={isLightMode} />
    </div>
  );
};

export default Discover;
