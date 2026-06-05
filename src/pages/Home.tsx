import React, { useState, useEffect, useRef } from "react";
import SongSection from "../components/SongsSection";
import ArtistSection from "../components/ArtistsSection";
import AppFooter from "../components/AppFooter";
import ContactUs from "./ContactUs";
import Song from "../components/Song";
import { useNavigate, Link } from "react-router-dom";
// Interest onboarding modal removed
import {
  getAdaptiveRecommendations,
  getColdStartRecommendations,
  trackRecommendationEvent,
  type AdaptiveRecommendation
} from "../backend/recommendationService";
import {
  getDerivedCategories,
  getSongs,
  getNewReleasesToday,
  getPopularArtists,
  type CatalogAlbum
} from "../backend/catalogService";
import { getMostPlayedAlbums, getMostPlayedSongs, trackSongPlay } from "../backend/playTrackingService";
import { useDataCache } from "../contexts/DataCacheContext";
import { useTheme } from "../contexts/ThemeContext";
import { useAudioPlayer } from "../contexts/AudioPlayerContext";
import { FaPlus, FaSpinner } from "react-icons/fa";

interface Tag {
  id: string;
  name: string;
  description: string;
  display_order: number;
  albums: any[];
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
      className={`transition-all duration-700 ease-out transform ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
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

  // interest onboarding removed: no local state needed

  // Data States
  const [adaptiveRecommendations, setAdaptiveRecommendations] = useState<AdaptiveRecommendation[]>([]);
  const [trendingSongs, setTrendingSongs] = useState<any[]>([]);
  const [newReleaseSongs, setNewReleaseSongs] = useState<any[]>([]);
  const [popularArtists, setPopularArtists] = useState<HomeArtist[]>([]);
  const [khmerSongs, setKhmerSongs] = useState<any[]>([]);
  const [topAlbums, setTopAlbums] = useState<CatalogAlbum[]>([]);
  const [featuredCharts, setFeaturedCharts] = useState<any[]>([]);

  const [loading, setLoading] = useState({
    adaptive: true,
    trending: true,
    newReleases: true,
    popularArtists: true,
    khmer: true,
    topAlbums: true,
    featured: true
  });

  useEffect(() => {
    // onboarding interest check removed
    fetchTrendingSongs();
    fetchAdaptiveSections();
    fetchNewUIContent();
  }, []);

  const fetchNewUIContent = async () => {
    try {
      setLoading(prev => ({ ...prev, newReleases: true }));
      setNewReleaseSongs(await getNewReleasesToday(10));
    } catch (e) { console.error(e); } finally { setLoading(prev => ({ ...prev, newReleases: false })); }

    try {
      setLoading(prev => ({ ...prev, popularArtists: true }));
      setPopularArtists(await getPopularArtists(10));
    } catch (e) { console.error(e); } finally { setLoading(prev => ({ ...prev, popularArtists: false })); }

    try {
      setLoading(prev => ({ ...prev, khmer: true }));
      setKhmerSongs(await getSongs(10));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(prev => ({ ...prev, khmer: false }));
    }

    try {
      setLoading(prev => ({ ...prev, topAlbums: true }));
      setTopAlbums(await getMostPlayedAlbums(10));
    } catch (e) { console.error(e); } finally { setLoading(prev => ({ ...prev, topAlbums: false })); }

    try {
      setLoading(prev => ({ ...prev, featured: true }));
      // Fetch top albums instead of generic categories for charts
      const albumsData = await getMostPlayedAlbums(10);
      setFeaturedCharts(albumsData.map(a => ({
        ...a,
        name: a.title, // Map title to name for consistency with UI mapping
        image_url: a.cover_url,
        type: 'album'
      })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(prev => ({ ...prev, featured: false }));
    }
  };

  const fetchAdaptiveSections = async () => {
    try {
      setLoading(prev => ({ ...prev, adaptive: true }));
      const recs = await getAdaptiveRecommendations(10);
      const fallback = recs.length === 0 ? await getColdStartRecommendations(10) : recs;
      setAdaptiveRecommendations(fallback || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(prev => ({ ...prev, adaptive: false }));
    }
  };

  const fetchTrendingSongs = async () => {
    try {
      setLoading(prev => ({ ...prev, trending: true }));
      const data = await getMostPlayedSongs(7);
      setTrendingSongs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(prev => ({ ...prev, trending: false }));
    }
  };

  const handlePlaySong = async (song: any) => {
    if (!song?.audio_url) return;
    playSong({
      id: String(song.id),
      title: song.title,
      artist: song.artists?.map((a: any) => a.name).join(", ") || song.artist || "Unknown Artist",
      coverUrl: song.songCover_url || song.cover_url || song.album?.cover_url || "",
      audioUrl: song.audio_url,
      duration: song.duration || 0,
    });
    trackSongPlay(String(song.id)).catch(() => undefined);
  };

  const handleTrendingPlay = (songId: string) => {
    const song = trendingSongs.find((s) => String(s.id) === String(songId));
    if (song) handlePlaySong(song);
  };

  const handleRecommendationCardClick = async (item: any) => {
    const recommendation = adaptiveRecommendations.find((r) => String(r.song.id) === String(item.id));

    if (recommendation) {
      trackRecommendationEvent({
        songId: recommendation.song.id,
        eventType: 'recommendation_clicked',
        recommendationScore: recommendation.recommendation_score,
        recommendationReason: recommendation.recommendation_reason,
      }).catch(() => undefined);
    }

    navigate(`/song/${item.id}`);
  };

  // fetchGenres and onboarding save handler removed with modal

  return (
    <div className={`w-full max-w-full min-h-screen space-y-16 pb-12 transition-colors duration-300 ${isLightMode ? 'bg-gray-50' : 'bg-transparent'}`}>

      {/* Hero Banner (Keep original refined version) */}
      <section className="relative mx-4 md:mx-8 mt-6 overflow-hidden rounded-3xl min-h-[340px] md:min-h-[440px] lg:min-h-[500px] shadow-2xl group border border-white/5">
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
              All the <span className="text-blue-500">Best Songs</span><br />in One Place
            </h1>
            <p className={`text-xs md:text-sm leading-relaxed max-w-md font-medium tracking-wide ${isLightMode ? 'text-gray-700' : 'text-zinc-300'}`}>
              On our website, you can access an amazing collection of popular and new songs. Stream your favorite tracks in high quality and enjoy without interruptions.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <button onClick={() => navigate("/discover")} className="px-6 py-3 bg-blue-500 text-white font-bold text-sm rounded-lg shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all duration-200">Discover Now</button>
              <button onClick={() => navigate("/playlist")} className={`px-6 py-3 font-bold text-sm rounded-lg border transition-all duration-200 ${isLightMode ? 'border-gray-400 text-gray-800 hover:bg-gray-100/50' : 'border-blue-500/40 text-blue-400 hover:bg-blue-500/10'}`}>Create Playlist</button>
            </div>
          </div>
        </div>
      </section>

      {/* 1. Recommended Songs */}
      <ScrollReveal>
        <div className="px-4 md:px-8">
          <SongSection
            title="Recommended Songs"
            songs={adaptiveRecommendations.map((r) => ({ ...r.song, type: 'Song' }))}
            viewAllLink="/songs?type=recommended"
            onItemClick={handleRecommendationCardClick}
          />
        </div>
      </ScrollReveal>

      {/* 2. New Release Songs */}
      <ScrollReveal>
        <div className="px-4 md:px-8">
          <SongSection
            title="New Release Songs"
            songs={newReleaseSongs}
            viewAllLink="/songs?type=new"
          />
        </div>
      </ScrollReveal>

      {/* 3. Trending Songs */}
      <ScrollReveal delay="100ms">
        <div className="px-4 md:px-8">
          <h2 className={`text-2xl md:text-3xl font-black mb-6 ${isLightMode ? 'text-gray-900' : 'text-white'} tracking-tight`}>
            Trending <span className="text-blue-500">Songs</span>
          </h2>

          {loading.trending ? (
            <div className="flex justify-center py-12">
              <FaSpinner className="animate-spin text-blue-500 text-3xl" />
            </div>
          ) : (
            <div className={`w-full rounded-lg ${isLightMode ? "bg-white border border-gray-100 shadow-sm" : "bg-transparent"}`}>
              <div className={`grid grid-cols-12 gap-4 text-xs md:text-[10px] font-black uppercase tracking-[0.2em] ${isLightMode ? "text-gray-400" : "text-slate-500"} border-b ${isLightMode ? "border-gray-100" : "border-white/5"} pb-4 px-4 md:px-6`}>
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-5 md:col-span-4">Title</div>
                <div className="hidden md:block md:col-span-3">Album</div>
                <div className="hidden md:block md:col-span-2">Plays</div>
                <div className="col-span-2 text-right">Time</div>
              </div>

              <div className="space-y-1 mt-2 px-2 md:px-4 pb-4">
                {trendingSongs.map((song, index) => (
                  <Song
                    key={song.id}
                    id={song.id}
                    index={index + 1}
                    title={song.title}
                    artists={song.artists}
                    album={song.album}
                    duration={song.duration}
                    coverUrl={song.songCover_url}
                    metadata={song.play_count > 0 ? `${song.play_count} plays` : "-"}
                    onPlay={handleTrendingPlay}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="mt-12 flex justify-center">
            <Link
              to="/songs?type=trending"
              className={`flex items-center gap-2 px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${isLightMode ? 'bg-zinc-200 text-zinc-800 hover:bg-zinc-300' : 'bg-zinc-800/80 text-white hover:bg-zinc-700'
                }`}
            >
              <FaPlus size={10} /> View All
            </Link>
          </div>
        </div>
      </ScrollReveal>

      {/* 4. Popular Artists */}
      <ScrollReveal>
        <div className="px-4 md:px-8">
          <ArtistSection
            title="Popular Artists"
            artists={popularArtists}
            viewAllLink="/artist"
          />
        </div>
      </ScrollReveal>

      {/* 5. Song Khmer */}
      <ScrollReveal>
        <div className="px-4 md:px-8">
          <SongSection
            title="Song Khmer"
            songs={khmerSongs}
            viewAllLink="/category/khmer"
          />
        </div>
      </ScrollReveal>

      {/* 6. Top Albums */}
      <ScrollReveal>
        <div className="px-4 md:px-8">
          <SongSection
            title="Top Albums"
            albums={topAlbums}
            viewAllLink="/albums"
          />
        </div>
      </ScrollReveal>

      {/* 7. Featured Charts */}
      <ScrollReveal>
        <div className="px-4 md:px-8">
          <SongSection
            title="Featured Charts"
            songs={featuredCharts}
            viewAllLink="/discover"
          />
        </div>
      </ScrollReveal>

      {/* Contact Us */}
      <ScrollReveal>
        <div className="px-4 md:px-8 pt-4">
          <div className={`rounded-3xl overflow-hidden ${isLightMode ? 'bg-white shadow-sm' : 'bg-zinc-900/20'}`}>
            <ContactUs isLightMode={isLightMode} />
          </div>
        </div>
      </ScrollReveal>

      <AppFooter />

      {/* interest onboarding modal removed */}
    </div>
  );
};

export default Home;