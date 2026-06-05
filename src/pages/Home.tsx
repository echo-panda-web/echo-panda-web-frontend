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
  getAlbums,
  getNewReleasesToday,
  getPopularArtists,
  type CatalogSong,
  type CatalogAlbum
} from "../backend/catalogService";
import { getRecentlyPlayed, trackSongPlay } from "../backend/playTrackingService";
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
  const [genreOptions, setGenreOptions] = useState<string[]>([]);

  // Data States
  const [adaptiveRecommendations, setAdaptiveRecommendations] = useState<AdaptiveRecommendation[]>([]);
  const [trendingSongs, setTrendingSongs] = useState<CatalogSong[]>([]);
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
    const stored = localStorage.getItem('onboarding:interests');
    if (!stored) setIsOnboardingOpen(true);

    fetchGenres();
    fetchTrendingSongs();
    fetchAdaptiveSections();
    fetchNewUIContent();
  }, []);

  const fetchNewUIContent = async () => {
    try {
      setLoading(prev => ({ ...prev, newReleases: true }));
      setNewReleaseSongs(await getSongs(10));
    } catch (e) { console.error(e); } finally { setLoading(prev => ({ ...prev, newReleases: false })); }

    try {
      setLoading(prev => ({ ...prev, popularArtists: true }));
      setPopularArtists(await getPopularArtists(10));
    } catch (e) { console.error(e); } finally { setLoading(prev => ({ ...prev, popularArtists: false })); }

    try {
      setLoading(prev => ({ ...prev, khmer: true }));
      setKhmerSongs(await getSongs(10)); // Simplified for now
    } catch (e) { console.error(e); } finally { setLoading(prev => ({ ...prev, khmer: false })); }

    try {
      setLoading(prev => ({ ...prev, topAlbums: true }));
      setTopAlbums(await getAlbums(10));
    } catch (e) { console.error(e); } finally { setLoading(prev => ({ ...prev, topAlbums: false })); }

    try {
      setLoading(prev => ({ ...prev, featured: true }));
      const categories = await getDerivedCategories();
      setFeaturedCharts(categories.slice(0, 10));
    } catch (e) { console.error(e); } finally { setLoading(prev => ({ ...prev, featured: false })); }
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
      const data = await getSongs(7);
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
      setGenreOptions((categoryData || []).map((cat: any) => cat.name));
    } catch (error) { console.error(error); }
  };

  const handleOnboardingSave = (interests: string[]) => {
    localStorage.setItem('onboarding:interests', JSON.stringify(interests));
    setIsOnboardingOpen(false);
    fetchAdaptiveSections();
  };

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
              songs={adaptiveRecommendations.map(r => r.song)}
              viewAllLink="/songs?type=recommended"
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

      {/* 3. Trending Songs (List View) */}
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
                      <img src={song.songCover_url || "/logo.webp"} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => handlePlaySong(song)}>
                        <FaPlay size={14} className="text-white fill-current" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h4 className={`text-base font-bold truncate leading-tight ${isLightMode ? 'text-zinc-900' : 'text-white'} group-hover:text-blue-500 transition-colors`}>{song.title}</h4>
                      <p className={`text-xs font-medium truncate mt-1 ${isLightMode ? 'text-zinc-500' : 'text-zinc-400'}`}>{song.artists[0]?.name}</p>
                    </div>
                  </div>
                  <div className={`hidden md:block col-span-2 text-sm font-medium text-center ${isLightMode ? 'text-zinc-500' : 'text-zinc-400'}`}>{formatDate(song.created_at)}</div>
                  <div className={`hidden lg:block col-span-4 text-sm font-medium text-center truncate px-4 ${isLightMode ? 'text-zinc-500' : 'text-zinc-400'}`}>{song.album?.title || "Single"}</div>
                  <div className="col-span-12 md:col-span-1 lg:col-span-1 flex items-center justify-end gap-6">
                    <button className="text-zinc-500 hover:text-pink-500 transition-colors"><FaHeart size={16} /></button>
                    <span className={`text-sm font-medium font-mono ${isLightMode ? 'text-zinc-500' : 'text-zinc-400'}`}>{formatDuration(song.duration)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 flex justify-center">
            <Link
              to="/songs?type=trending"
              className={`flex items-center gap-2 px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                isLightMode ? 'bg-zinc-200 text-zinc-800 hover:bg-zinc-300' : 'bg-zinc-800/80 text-white hover:bg-zinc-700'
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

      <AppFooter isLightMode={isLightMode} />

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
