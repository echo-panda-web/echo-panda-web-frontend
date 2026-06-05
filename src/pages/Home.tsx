import React, { useState, useEffect, useRef } from "react";
import SongSection from "../components/SongsSection";
import ArtistSection from "../components/ArtistsSection";
import AppFooter from "../components/AppFooter";
import ContactUs from "./ContactUs";
import Song from "../components/Song";
import { useNavigate, Link } from "react-router-dom";
import InterestOnboardingModal from "../components/InterestOnboardingModal";
import {
  getRecommendationsForInterests,
  getAdaptiveRecommendations,
  getColdStartRecommendations,
  trackRecommendationEvent,
  type AlbumRef,
  type AdaptiveRecommendation
} from "../backend/recommendationService";
import {
  getDerivedCategories,
  getHomeTags,
  getSongs,
  getNewReleasesToday,
  getPopularArtists,
  type CatalogSong
} from "../backend/catalogService";
import { getMostPlayedSongs, getRecentlyPlayed, trackSongPlay } from "../backend/playTrackingService";
import { useDataCache } from "../contexts/DataCacheContext";
import { useTheme } from "../contexts/ThemeContext";
import { useAudioPlayer } from "../contexts/AudioPlayerContext";
import { FaHeart, FaPlay, FaClock, FaPlus } from "react-icons/fa";
import AlbumCard from "../components/AlbumCard";

interface Tag {
  id: string;
  name: string;
  description: string;
  display_order: number;
  albums: any[];
}

interface HomeAlbum {
  id: string;
  title: string;
  cover_url?: string;
  release_date?: string;
  artists?: Array<{ id: string; name: string; image_url?: string }>;
}

interface HomeArtist {
  id: string;
  name: string;
  image_url?: string;
  play_count?: number;
  monthly_listeners?: string;
}

// Reusable Scroll Animation Wrapper Component
const ScrollReveal: React.FC<{ children: React.ReactNode; delay?: string }> = ({ children, delay = "0ms" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      });
    }, { threshold: 0.05 });

    const current = domRef.current;
    if (current) observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
    };
  }, []);

  return (
    <div
      ref={domRef}
      className={`transition-all duration-700 ease-out transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: delay }}
    >
      {children}
    </div>
  );
};

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isLightMode } = useTheme();
  const { getCachedData } = useDataCache();
  const { playSong } = useAudioPlayer();

  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [recommendedAlbums, setRecommendedAlbums] = useState<AlbumRef[] | undefined>(undefined);
  const [tags, setTags] = useState<Tag[]>([]);
  const [genreOptions, setGenreOptions] = useState<string[]>([]);
  const [trendingSongs, setTrendingSongs] = useState<CatalogSong[]>([]);

  // Adaptive states
  const [adaptiveRecommendations, setAdaptiveRecommendations] = useState<AdaptiveRecommendation[]>([]);
  const [continueListening, setContinueListening] = useState<any[]>([]);
  const [newReleaseAlbums, setNewReleaseAlbums] = useState<HomeAlbum[]>([]);
  const [popularArtists, setPopularArtists] = useState<HomeArtist[]>([]);
  const [loadingAdaptive, setLoadingAdaptive] = useState(true);
  const [loadingContinue, setLoadingContinue] = useState(true);
  const [loadingNewReleases, setLoadingNewReleases] = useState(true);
  const [loadingPopularArtists, setLoadingPopularArtists] = useState(true);
  const [adaptiveError, setAdaptiveError] = useState<string | null>(null);

  const handleDiscover = () => navigate("/discover");
  const handleCreatePlaylist = () => navigate("/playlist");

  useEffect(() => {
    const stored = localStorage.getItem('onboarding:interests');
    if (!stored) {
      setIsOnboardingOpen(true);
    } else {
      try {
        const interests = JSON.parse(stored);
        getRecommendationsForInterests(interests).then(setRecommendedAlbums);
      } catch (e) {
        // ignore
      }
    }

    fetchGenres();
    fetchTags();
    fetchTrendingSongs();
    fetchAdaptiveSections();
    fetchRealTimeDiscoveries();
  }, []);

  const fetchRealTimeDiscoveries = async () => {
    try {
      setLoadingNewReleases(true);
      setNewReleaseAlbums(await getNewReleasesToday(12));
    } catch (error) {
      console.error('Error fetching today new releases:', error);
      setNewReleaseAlbums([]);
    } finally {
      setLoadingNewReleases(false);
    }

    try {
      setLoadingPopularArtists(true);
      setPopularArtists(await getPopularArtists(12));
    } catch (error) {
      console.error('Error fetching popular artists:', error);
      setPopularArtists([]);
    } finally {
      setLoadingPopularArtists(false);
    }
  };

  const fetchAdaptiveSections = async () => {
    try {
      setLoadingAdaptive(true);
      setAdaptiveError(null);
      const recs = await getAdaptiveRecommendations(12);
      const fallback = recs.length === 0 ? await getColdStartRecommendations(12) : recs;
      setAdaptiveRecommendations(fallback || []);
    } catch (error) {
      setAdaptiveError("Unable to load recommendations right now.");
      console.error("Error loading adaptive recommendations:", error);
    } finally {
      setLoadingAdaptive(false);
    }

    try {
      setLoadingContinue(true);
      setContinueListening(await getRecentlyPlayed(10));
    } catch (error) {
      console.error("Error loading continue listening:", error);
      setContinueListening([]);
    } finally {
      setLoadingContinue(false);
    }
  };

  const fetchTrendingSongs = async () => {
    try {
      const data = await getSongs(7);
      setTrendingSongs(data);
    } catch (e) {
      console.error('Error fetching trending songs:', e);
    }
  };

  const handlePlaySong = async (song: any, source: "recommended" | "continue" | "trending") => {
    if (!song?.audio_url) {
      return;
    }

    playSong({
      id: String(song.id),
      title: song.title,
      artist: song.artists?.map((a: any) => a.name).join(", ") || song.artist || "Unknown Artist",
      coverUrl: song.songCover_url || song.cover_url || song.album?.cover_url || "",
      audioUrl: song.audio_url,
      duration: song.duration || 0,
    });

    trackSongPlay(String(song.id)).catch(() => undefined);

    if (source === "recommended") {
      const rec = adaptiveRecommendations.find((item) => String(item.song.id) === String(song.id));
      if (rec) {
        trackRecommendationEvent({
          songId: Number(song.id),
          eventType: "recommendation_clicked",
          recommendationScore: rec.recommendation_score,
          recommendationReason: rec.recommendation_reason,
        }).catch(() => undefined);

        trackRecommendationEvent({
          songId: Number(song.id),
          eventType: "recommendation_played",
          recommendationScore: rec.recommendation_score,
          recommendationReason: rec.recommendation_reason,
        }).catch(() => undefined);
      }
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

  const fetchGenres = async () => {
    try {
      const categoryData = await getDerivedCategories();
      const genreNames = (categoryData || []).map((cat: any) => cat.name);
      setGenreOptions(genreNames);
    } catch (error) {
      console.error('Error fetching genres:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const data = await getCachedData('home_tags', async () => {
        const transformedTags = await getHomeTags();
        return transformedTags;
      });
      setTags(data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleOnboardingSave = (interests: string[]) => {
    localStorage.setItem('onboarding:interests', JSON.stringify(interests));
    setIsOnboardingOpen(false);
    getRecommendationsForInterests(interests).then(setRecommendedAlbums);
  };

  return (
    <div className={`w-full max-w-full min-h-screen space-y-12 pb-12 transition-colors duration-300 ${isLightMode ? 'bg-gray-50' : 'bg-transparent'}`}>

      {/* Premium Hero Banner */}
      <section className="relative mx-4 md:mx-8 mt-6 overflow-hidden rounded-3xl min-h-[340px] md:min-h-[440px] lg:min-h-[500px] shadow-2xl group">
        <div className="absolute inset-0 w-full h-full">
          <img
            src="/image.webp"
            alt="Hero background"
            className="w-full h-full object-cover object-center transform scale-100 group-hover:scale-102 transition-transform duration-700 ease-out"
          />
        </div>

        <div className={`absolute inset-0 bg-gradient-to-r ${isLightMode ? 'from-white/90 via-white/40 to-transparent' : 'from-black/90 via-black/30 to-transparent'}`} />

        <div className="relative z-10 px-8 py-12 md:px-16 md:py-24 flex items-center min-h-[340px] md:min-h-[440px] lg:min-h-[500px]">
          <div className="max-w-xl space-y-6 text-left">
            <h1 className={`text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] ${isLightMode ? 'text-gray-950' : 'text-white'}`}>
              All the <span className="text-blue-500">Best Songs</span>
              <br />
              in One Place
            </h1>

            <p className={`text-xs md:text-sm leading-relaxed max-w-md font-medium tracking-wide ${isLightMode ? 'text-gray-700' : 'text-zinc-300'}`}>
              On our website, you can access an amazing collection of popular and new songs. Stream your favorite tracks in high quality and enjoy without interruptions.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={handleDiscover}
                className="px-6 py-3 bg-blue-500 text-white font-bold text-sm rounded-lg shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all duration-200"
              >
                Discover Now
              </button>

              <button
                onClick={handleCreatePlaylist}
                className={`px-6 py-3 font-bold text-sm rounded-lg border transition-all duration-200 ${
                  isLightMode
                    ? 'border-gray-400 text-gray-800 hover:bg-gray-100/50'
                    : 'border-blue-500/40 text-blue-400 hover:bg-blue-500/10'
                }`}
              >
                Create Playlist
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Recommended Section (Adaptive) */}
      <ScrollReveal>
        <div className="px-4 md:px-8">
           <h2 className={`text-2xl md:text-3xl font-black mb-8 ${isLightMode ? 'text-gray-900' : 'text-white'} tracking-tight`}>
            Recommended <span className="text-blue-500">For You</span>
          </h2>
          {loadingAdaptive ? (
            <div className="text-sm text-zinc-500 py-6">Loading personalized recommendations...</div>
          ) : adaptiveError ? (
            <div className="text-sm text-rose-400 py-6">{adaptiveError}</div>
          ) : adaptiveRecommendations.length === 0 ? (
            <div className="text-sm text-zinc-500 py-6">No recommendations yet. Start listening to personalize your feed.</div>
          ) : (
            <div className="space-y-1">
              {adaptiveRecommendations.map((item, index) => (
                <Song
                  key={item.song.id}
                  id={String(item.song.id)}
                  index={index + 1}
                  title={item.song.title}
                  duration={item.song.duration || 0}
                  artists={item.song.artist ? [{ id: String(item.song.artist_id || item.song.id), name: item.song.artist, image_url: "" }] : []}
                  album={item.song.album ? { id: String(item.song.album.id), title: item.song.album.title, cover_url: item.song.album.cover_url } : null}
                  coverUrl={item.song.cover_key || item.song.album?.cover_url || null}
                  metadata={item.recommendation_reason}
                  onPlay={() => handlePlaySong(item.song, "recommended")}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollReveal>

      {/* Continue Listening */}
      <ScrollReveal>
        <div className="px-4 md:px-8">
           <h2 className={`text-2xl md:text-3xl font-black mb-8 ${isLightMode ? 'text-gray-900' : 'text-white'} tracking-tight`}>
            Continue <span className="text-blue-500">Listening</span>
          </h2>
          {loadingContinue ? (
            <div className="text-sm text-zinc-500 py-6">Loading your recent songs...</div>
          ) : continueListening.length === 0 ? (
            <div className="text-sm text-zinc-500 py-6">You have no recent songs yet.</div>
          ) : (
            <div className="space-y-1">
              {continueListening.map((song, index) => (
                <Song
                  key={song.id}
                  id={String(song.id)}
                  index={index + 1}
                  title={song.title}
                  duration={song.duration || 0}
                  artists={song.artists || []}
                  album={song.album || null}
                  coverUrl={song.songCover_url || song.album?.cover_url || null}
                  metadata={song.listened_at ? `Last listened: ${new Date(song.listened_at).toLocaleDateString()}` : undefined}
                  onPlay={() => handlePlaySong(song, "continue")}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollReveal>

      {/* Trending Songs Section (User's Styled UI) */}
      <ScrollReveal delay="100ms">
        <div className="px-4 md:px-8">
          <h2 className={`text-2xl md:text-3xl font-black mb-10 ${isLightMode ? 'text-gray-900' : 'text-white'} tracking-tight`}>
            Trending <span className="text-blue-500">Songs</span>
          </h2>

          <div className="w-full">
            <div className={`grid grid-cols-12 gap-4 px-4 pb-6 text-[13px] font-bold ${isLightMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
               <div className="col-span-1">#</div>
               <div className="col-span-5 md:col-span-4">Title</div>
               <div className="hidden md:block col-span-2 text-center">Release Date</div>
               <div className="hidden lg:block col-span-4 text-center">album</div>
               <div className="col-span-6 md:col-span-1 lg:col-span-1 text-right">Time</div>
            </div>

            <div className="space-y-1">
              {trendingSongs.map((song, i) => (
                <div
                  key={song.id}
                  className={`grid grid-cols-12 gap-4 items-center px-4 py-3 rounded-xl transition-all duration-300 group ${
                    isLightMode ? 'hover:bg-zinc-100' : 'hover:bg-white/5'
                  }`}
                >
                  <div className={`col-span-1 text-base font-black ${isLightMode ? 'text-zinc-900' : 'text-white'}`}>
                    #{i + 1}
                  </div>

                  <div className="col-span-11 md:col-span-4 flex items-center gap-4 min-w-0">
                    <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 shadow-lg relative group/cover bg-zinc-800">
                      <img
                        src={song.songCover_url || "/logo.webp"}
                        alt=""
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        onError={(e) => { (e.target as HTMLImageElement).src = "/logo.webp"; }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <FaPlay size={14} className="text-white fill-current" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h4 className={`text-base font-bold truncate leading-tight ${isLightMode ? 'text-zinc-900' : 'text-white'} group-hover:text-blue-500 transition-colors`}>
                        {song.title}
                      </h4>
                      <p className={`text-xs font-medium truncate mt-1 ${isLightMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        {song.artists[0]?.name}
                      </p>
                    </div>
                  </div>

                  <div className={`hidden md:block col-span-2 text-sm font-medium text-center ${isLightMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {formatDate(song.created_at)}
                  </div>

                  <div className={`hidden lg:block col-span-4 text-sm font-medium text-center truncate px-4 ${isLightMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {song.album?.title || "Single"}
                  </div>

                  <div className="col-span-12 md:col-span-1 lg:col-span-1 flex items-center justify-end gap-6">
                    <button className="text-zinc-500 hover:text-pink-500 transition-colors">
                      <FaHeart size={16} />
                    </button>
                    <span className={`text-sm font-medium font-mono ${isLightMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      {formatDuration(song.duration)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 flex justify-center">
            <Link
              to="/songs?type=trending"
              className={`flex items-center gap-2 px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                isLightMode
                  ? 'bg-zinc-200 text-zinc-800 hover:bg-zinc-300'
                  : 'bg-zinc-800/80 text-white hover:bg-zinc-700'
              }`}
            >
              <FaPlus size={10} /> View All
            </Link>
          </div>
        </div>
      </ScrollReveal>

      {/* New Releases Today */}
      <ScrollReveal>
        <div className="px-4 md:px-8">
           <div className="flex items-end justify-between gap-4 mb-8">
            <h2 className={`text-2xl md:text-3xl font-black ${isLightMode ? 'text-gray-900' : 'text-white'} tracking-tight`}>
              New Releases <span className="text-blue-500">Today</span>
            </h2>
            <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-bold">Live feed</span>
          </div>
          {loadingNewReleases ? (
            <div className="flex items-center justify-center py-12">
              <span className="text-zinc-500 text-sm">Loading new releases...</span>
            </div>
          ) : newReleaseAlbums.length === 0 ? (
            <div className="text-zinc-500 py-6 text-sm">No releases today yet.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {newReleaseAlbums.map((album) => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>
          )}
        </div>
      </ScrollReveal>

      {/* Popular Artists Today */}
      <ScrollReveal>
        <div className="px-4 md:px-8">
          <div className="flex items-end justify-between gap-4 mb-8">
            <h2 className={`text-2xl md:text-3xl font-black ${isLightMode ? 'text-gray-900' : 'text-white'} tracking-tight`}>
              Popular <span className="text-blue-500">Artists</span>
            </h2>
            <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-bold">Real-time plays</span>
          </div>
          {loadingPopularArtists ? (
            <div className="flex items-center justify-center py-12">
              <span className="text-zinc-500 text-sm">Loading popular artists...</span>
            </div>
          ) : popularArtists.length === 0 ? (
            <div className="text-zinc-500 py-6 text-sm">No popular artists found yet.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
              {popularArtists.map((artist) => (
                <button
                  key={artist.id}
                  onClick={() => navigate(`/artist/${artist.id}`)}
                  className="group text-center flex flex-col items-center"
                >
                  <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden transition-all duration-500 group-hover:scale-105 shadow-xl ${isLightMode ? 'bg-zinc-200' : 'bg-zinc-800'} relative`}>
                    {artist.image_url ? (
                      <img src={artist.image_url} alt={artist.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                         <span className="text-white text-2xl font-black uppercase">{artist.name.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <p className={`mt-3 font-bold truncate w-full text-sm ${isLightMode ? 'text-zinc-900' : 'text-white'} group-hover:text-blue-500 transition-colors`}>{artist.name}</p>
                  <p className="text-[10px] font-bold text-zinc-500 mt-1 uppercase tracking-wider">{artist.monthly_listeners || `${artist.play_count || 0} plays`}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </ScrollReveal>

      {/* Dynamic Tag Sections */}
      {tags.map((tag, index) => (
        <ScrollReveal key={tag.id} delay={`${index * 50}ms`}>
          <div className="px-4 md:px-8">
            <SongSection
              title={tag.name}
              songs={tag.albums}
              viewAllLink={`/category/${tag.id}`}
            />
          </div>
        </ScrollReveal>
      ))}

      {/* Contact Us */}
      <ScrollReveal>
        <div className="px-4 md:px-8 pt-4">
          <div className={`rounded-3xl overflow-hidden ${isLightMode ? 'bg-white shadow-sm' : 'bg-zinc-900/20'}`}>
            <ContactUs isLightMode={isLightMode} />
          </div>
        </div>
      </ScrollReveal>

      {/* Footer */}
      <AppFooter isLightMode={isLightMode} />

      {/* Onboarding modal */}
      <InterestOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onSave={handleOnboardingSave}
        genreOptions={genreOptions}
      />
    </div>
  );
};

export default Home;
