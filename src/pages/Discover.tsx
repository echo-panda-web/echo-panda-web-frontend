import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  getGenres,
  getPopularArtists,
  getDerivedCategories,
  type CatalogAlbum
} from "../backend/catalogService";
import { useDataCache } from "../contexts/DataCacheContext";
import { getMostPlayedAlbums, getMostPlayedSongs, trackSongPlay } from "../backend/playTrackingService";
import AlbumCard from "../components/AlbumCard";
import Song from "../components/Song";
import AppFooter from "../components/AppFooter";
import { FaSpinner, FaPlus } from "react-icons/fa";
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
  const [topAlbums, setTopAlbums] = useState<Album[]>([]);
  const [trendingSongs, setTrendingSongs] = useState<any[]>([]);
  const [popularArtists, setPopularArtists] = useState<ArtistCard[]>([]);
  const [featuredCharts, setFeaturedCharts] = useState<any[]>([]);

  const [loadingTopAlbums, setLoadingTopAlbums] = useState(true);
  const [loadingPopularArtists, setLoadingPopularArtists] = useState(true);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingTrending, setLoadingTrending] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchTopAlbums();
    fetchTrendingSongs();
    fetchPopularArtists();
    fetchFeaturedCharts();
  }, []);

  const fetchTrendingSongs = async () => {
    try {
      setLoadingTrending(true);
      const data = await getMostPlayedSongs(7);
      setTrendingSongs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTrending(false);
    }
  };

  const fetchFeaturedCharts = async () => {
    try {
      setLoadingFeatured(true);
      // Fetch top albums instead of genres for "Featured Charts" as requested
      const albumsData = await getMostPlayedAlbums(10);
      setFeaturedCharts(albumsData.map(a => ({
        ...a,
        name: a.title, // Map title to name for consistency with UI mapping
        image_url: a.cover_url
      })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingFeatured(false);
    }
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

  const handlePlaySong = (song: any) => {
    if (!song.audio_url) return;
    playSong({
      id: String(song.id),
      title: song.title,
      artist: song.artists?.[0]?.name || "Unknown Artist",
      coverUrl: song.songCover_url || song.cover_key || song.album?.cover_url || "",
      audioUrl: song.audio_url,
      duration: song.duration || 0,
    });
    trackSongPlay(String(song.id)).catch(() => undefined);
  };

  const handleTrendingPlay = (songId: string) => {
    const song = trendingSongs.find((s) => String(s.id) === String(songId));
    if (song) handlePlaySong(song);
  };

  const SectionTitle = ({ main, accent }: { main: string, accent: string }) => (
    <h2 className={`text-2xl md:text-3xl font-black mb-8 tracking-tight ${isLightMode ? 'text-zinc-900' : 'text-white'}`}>
      {main} <span className="text-blue-500">{accent}</span>
    </h2>
  );

  const ViewAllCircle = ({ link }: { link: string }) => (
    <div className="shrink-0 flex flex-col items-center justify-center gap-3 px-8 snap-start">
      <Link
        to={link}
        className={`w-14 h-14 rounded-full border flex items-center justify-center transition-all ${
          isLightMode
            ? 'border-zinc-200 text-zinc-400 bg-white hover:border-zinc-900 hover:text-zinc-900'
            : 'border-zinc-800 text-zinc-500 bg-zinc-900/50 hover:border-white hover:text-white'
        }`}
      >
        <FaPlus size={16} />
      </Link>
      <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${isLightMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
        View all
      </span>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 pb-20 ${isLightMode ? "bg-gray-50" : "bg-black"}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 space-y-20">

        {/* 1. Music Genres Section */}
        <section>
          <SectionTitle main="Music" accent="Genres" />
          {loadingCategories ? (
            <div className="flex justify-center py-10"><FaSpinner className="animate-spin text-blue-500 text-2xl" /></div>
          ) : (
            <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-none snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
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
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <h3 className="text-white font-black text-lg md:text-2xl uppercase tracking-tighter text-center px-4">
                        {category.name} <span className="text-blue-400">Tracks</span>
                      </h3>
                    </div>
                  </button>
                );
              })}
              <ViewAllCircle link="/categories" />
            </div>
          )}
        </section>

        {/* 2. Featured Charts Section */}
        <section>
          <SectionTitle main="Featured" accent="Charts" />
          {loadingFeatured ? (
             <div className="flex justify-center py-10"><FaSpinner className="animate-spin text-blue-500 text-2xl" /></div>
          ) : (
            <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-none snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
               {featuredCharts.map((chart) => (
                  <div key={chart.id} className="shrink-0 w-[180px] md:w-[220px] snap-start group cursor-pointer" onClick={() => navigate(`/category/${chart.id}`)}>
                    <div className="aspect-square rounded-2xl overflow-hidden mb-4 shadow-lg bg-zinc-800">
                       <img src={chart.image_url || 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=400&q=80'} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    </div>
                    <h3 className={`font-bold text-sm truncate ${isLightMode ? 'text-zinc-900' : 'text-zinc-200'}`}>Top Songs {chart.name}</h3>
                  </div>
               ))}
               <ViewAllCircle link="/discover" />
            </div>
          )}
        </section>

        {/* 3. Popular Artists Section */}
        <section>
          <SectionTitle main="Popular" accent="Artists" />
          {loadingPopularArtists ? (
            <div className="flex justify-center py-10"><FaSpinner className="animate-spin text-blue-500 text-2xl" /></div>
          ) : (
            <div className="flex overflow-x-auto gap-8 pb-4 scrollbar-none snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {popularArtists.map((artist) => (
                <button
                  key={artist.id}
                  onClick={() => navigate(`/artist/${artist.id}`)}
                  className="group flex flex-col items-center shrink-0 w-28 md:w-36 snap-start"
                >
                  <div className={`w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden transition-all duration-300 group-hover:scale-105 shadow-xl ${isLightMode ? 'bg-zinc-200' : 'bg-zinc-800 ring-1 ring-white/10'} relative mb-4`}>
                    {artist.image_url ? (
                      <img src={artist.image_url} alt={artist.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-black">{artist.name.charAt(0)}</div>
                    )}
                  </div>
                  <p className={`font-bold truncate w-full text-xs md:text-sm text-center ${isLightMode ? 'text-zinc-900' : 'text-zinc-200'} group-hover:text-blue-500 transition-colors`}>{artist.name}</p>
                </button>
              ))}
              <ViewAllCircle link="/artist" />
            </div>
          )}
        </section>

        {/* 4. Trending Songs Section */}
        <section>
          <SectionTitle main="Trending" accent="Songs" />
          {loadingTrending ? (
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

              <div className="mt-6 pb-4 flex justify-center">
                <Link
                  to="/songs?type=trending"
                  className={`flex items-center gap-2 px-10 py-3 rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all border ${
                    isLightMode
                      ? 'border-zinc-200 text-zinc-800 hover:bg-zinc-900 hover:text-white'
                      : 'border-white/10 text-white hover:bg-white hover:text-black'
                  }`}
                >
                  <FaPlus size={10} /> View All
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* 5. Top Albums Section */}
        <section>
          <SectionTitle main="Top" accent="Albums" />
          {loadingTopAlbums ? (
             <div className="flex justify-center py-10"><FaSpinner className="animate-spin text-blue-500 text-2xl" /></div>
          ) : (
            <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-none snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
               {topAlbums.map((album) => (
                  <div key={album.id} className="shrink-0 w-[180px] md:w-[220px] snap-start">
                    <AlbumCard album={album} />
                  </div>
               ))}
               <ViewAllCircle link="/albums" />
            </div>
          )}
        </section>

      </div>
      <AppFooter />
    </div>
  );
};

export default Discover;
