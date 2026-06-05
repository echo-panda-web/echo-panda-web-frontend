import React, { useState, useEffect } from "react";
import SongSection from "../components/SongsSection";
import AppFooter from "../components/AppFooter";
import ContactUs from "./ContactUs";
import Song from "../components/Song";
import AlbumCard from "../components/AlbumCard";
import { useNavigate } from "react-router-dom";
import {
  getAdaptiveRecommendations,
  getColdStartRecommendations,
  trackRecommendationEvent,
  type AdaptiveRecommendation,
} from "../backend/recommendationService";
import { getDerivedCategories, getHomeTags, getNewReleasesToday, getPopularArtists } from "../backend/catalogService";
import { useDataCache } from "../contexts/DataCacheContext";
import { getMostPlayedSongs, getRecentlyPlayed, trackSongPlay } from "../backend/playTrackingService";
import { useAudioPlayer } from "../contexts/AudioPlayerContext";

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

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { playSong } = useAudioPlayer();

  const handleDiscover = () => {
    navigate("/discover");
  };

  const handleCreatePlaylist = () => {
    navigate("/playlist");
  };

  const isLightMode = false;
  const { getCachedData } = useDataCache();

  const [adaptiveRecommendations, setAdaptiveRecommendations] = useState<AdaptiveRecommendation[]>([]);
  const [continueListening, setContinueListening] = useState<any[]>([]);
  const [trendingSongs, setTrendingSongs] = useState<any[]>([]);
  const [newReleaseAlbums, setNewReleaseAlbums] = useState<HomeAlbum[]>([]);
  const [popularArtists, setPopularArtists] = useState<HomeArtist[]>([]);
  const [loadingAdaptive, setLoadingAdaptive] = useState(true);
  const [loadingContinue, setLoadingContinue] = useState(true);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingNewReleases, setLoadingNewReleases] = useState(true);
  const [loadingPopularArtists, setLoadingPopularArtists] = useState(true);
  const [adaptiveError, setAdaptiveError] = useState<string | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [genreOptions, setGenreOptions] = useState<string[]>([]);

  useEffect(() => {
    // Fetch dynamic genres and tags
    fetchGenres();
    fetchTags();
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

    try {
      setLoadingTrending(true);
      setTrendingSongs(await getMostPlayedSongs(10));
    } catch (error) {
      console.error("Error loading trending songs:", error);
      setTrendingSongs([]);
    } finally {
      setLoadingTrending(false);
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
      const rec = adaptiveRecommendations.find((item) => item.song.id === Number(song.id));
      if (rec) {
        trackRecommendationEvent({
          songId: song.id,
          eventType: "recommendation_clicked",
          recommendationScore: rec.recommendation_score,
          recommendationReason: rec.recommendation_reason,
        }).catch(() => undefined);

        trackRecommendationEvent({
          songId: song.id,
          eventType: "recommendation_played",
          recommendationScore: rec.recommendation_score,
          recommendationReason: rec.recommendation_reason,
        }).catch(() => undefined);
      }
    }
  };

  const fetchGenres = async () => {
    try {
      const categoryData = await getDerivedCategories();
      const genreNames = (categoryData || []).map((cat: any) => cat.name);
      setGenreOptions(genreNames);
      console.log('✅ [Home] Genres loaded:', genreNames);
    } catch (error) {
      console.error('Error fetching genres:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const data = await getCachedData('home_tags', async () => {
        console.log('🔄 [Home] Fetching active tags...');

        const transformedTags = await getHomeTags();

        console.log(`✅ [Home] ${transformedTags.length} active tags loaded`);
        return transformedTags;
      });

      setTags(data);
      console.log('🏷️ [Home] Tags state updated:', data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  return (
    <div className="w-full max-w-full">
      {/* Hero */}
      {/* Hero */}
      <section className="relative mt-4 mb-8 overflow-hidden min-h-75 md:min-h-112.5 lg:min-h-137.5">
        {/* Bg Image */}
        <div className="absolute inset-0">
          <img
            src="/image.webp"
            alt=""
            className="w-full h-full object-cover object-center"
          />
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40 md:bg-black/20" />

        {/* Content */}
        <div className="relative z-10 px-6 py-16 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center min-h-75">
            {/* Left Content */}
            <div className="space-y-6 text-center md:text-left">
              <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">
                All the <span className="text-blue-500">Best Songs</span>
                <br />
                in One Place
              </h1>
              <p className="text-gray-200 text-sm md:text-base leading-relaxed max-w-xl mx-auto md:mx-0">
                On our website, you can access an amazing collection of popular and
                new songs. Stream high-quality music and enjoy without interruptions —
                whatever your taste, we have it ready for you.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <button
                  onClick={handleDiscover}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  Discover Now
                </button>

                <button
                  onClick={handleCreatePlaylist}
                  className="px-6 py-3 border border-blue-400 text-blue-300 rounded-lg hover:bg-blue-400/20 transition cursor-pointer"
                >
                  Create Playlist
                </button>
              </div>
            </div>

            <div className="hidden md:block" />
          </div>
        </div>
      </section>

      <section className="p-4 md:p-6 lg:p-8 rounded-lg mt-8 mb-8 bg-black">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 text-white">Recommended For You</h2>
        {loadingAdaptive ? (
          <div className="text-sm text-slate-400 py-6">Loading personalized recommendations...</div>
        ) : adaptiveError ? (
          <div className="text-sm text-rose-400 py-6">{adaptiveError}</div>
        ) : adaptiveRecommendations.length === 0 ? (
          <div className="text-sm text-slate-400 py-6">No recommendations yet. Start listening to personalize your feed.</div>
        ) : (
          <div className="space-y-2">
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
      </section>

      <section className="p-4 md:p-6 lg:p-8 rounded-lg mt-8 mb-8 bg-black">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 text-white">Continue Listening</h2>
        {loadingContinue ? (
          <div className="text-sm text-slate-400 py-6">Loading your recent songs...</div>
        ) : continueListening.length === 0 ? (
          <div className="text-sm text-slate-400 py-6">You have no recent songs yet.</div>
        ) : (
          <div className="space-y-2">
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
      </section>

      <section className="p-4 md:p-6 lg:p-8 rounded-lg mt-8 mb-8 bg-black">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 text-white">Trending Now</h2>
        {loadingTrending ? (
          <div className="text-sm text-slate-400 py-6">Loading trending songs...</div>
        ) : trendingSongs.length === 0 ? (
          <div className="text-sm text-slate-400 py-6">No trending songs available.</div>
        ) : (
          <div className="space-y-2">
            {trendingSongs.map((song, index) => (
              <Song
                key={song.id}
                id={String(song.id)}
                index={index + 1}
                title={song.title}
                duration={song.duration || 0}
                artists={song.artists || []}
                album={song.album || null}
                coverUrl={song.songCover_url || song.album?.cover_url || null}
                metadata={`${song.play_count || 0} plays`}
                onPlay={() => handlePlaySong(song, "trending")}
              />
            ))}
          </div>
        )}
      </section>

      <section className="px-4 md:px-8 py-8 max-w-7xl mx-auto">
        <div className="flex items-end justify-between gap-4 mb-6">
          <h2 className="text-3xl font-black text-white tracking-tight">
            New Releases <span className="bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Today</span>
          </h2>
          <span className="text-xs uppercase tracking-[0.3em] text-slate-500">Live feed</span>
        </div>
        {loadingNewReleases ? (
          <div className="flex items-center justify-center py-12">
            <span className="text-slate-400">Loading new releases...</span>
          </div>
        ) : newReleaseAlbums.length === 0 ? (
          <div className="text-slate-400 py-6">No releases today yet.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {newReleaseAlbums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        )}
      </section>

      <section className="px-4 md:px-8 py-8 max-w-7xl mx-auto">
        <div className="flex items-end justify-between gap-4 mb-6">
          <h2 className="text-3xl font-black text-white tracking-tight">
            Popular <span className="bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Artists</span>
          </h2>
          <span className="text-xs uppercase tracking-[0.3em] text-slate-500">Based on real plays</span>
        </div>
        {loadingPopularArtists ? (
          <div className="flex items-center justify-center py-12">
            <span className="text-slate-400">Loading popular artists...</span>
          </div>
        ) : popularArtists.length === 0 ? (
          <div className="text-slate-400 py-6">No popular artists found yet.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {popularArtists.map((artist) => (
              <button
                key={artist.id}
                onClick={() => navigate(`/artist/${artist.id}`)}
                className="group text-left"
              >
                <div className="mx-auto w-28 h-28 rounded-full overflow-hidden ring-1 ring-white/10 bg-white/5 shadow-lg group-hover:scale-105 transition-transform">
                  {artist.image_url ? (
                    <img src={artist.image_url} alt={artist.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500" />
                  )}
                </div>
                <div className="mt-3 text-center">
                  <p className="font-semibold text-white truncate">{artist.name}</p>
                  <p className="text-xs text-slate-400 mt-1">{artist.monthly_listeners || `${artist.play_count || 0} plays`}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Dynamic Tag Sections */}
      {tags.map((tag) => (
        <SongSection
          key={tag.id}
          title={tag.name}
          isLightMode={isLightMode}
          songs={tag.albums}
        />
      ))}

      {/* Contact Us */}
      <div className="mb-12">
        <ContactUs isLightMode={isLightMode} />
      </div>

      {/* Onboarding modal */}
      {/* Footer */}
      <AppFooter isLightMode={isLightMode} />
    </div>
  );
};

export default Home;
