import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAlbums, getSongs, getDerivedCategories, CatalogSong, CatalogAlbum } from "../backend/catalogService";
import { getMostPlayedAlbums } from "../backend/playTrackingService";
import { useDataCache } from "../contexts/DataCacheContext";
import { FaSpinner, FaArrowLeft, FaMusic } from "react-icons/fa";
import AlbumCard from "../components/AlbumCard";
import Song from "../components/Song";
import { useTheme } from "../contexts/ThemeContext";
import { useAudioPlayer } from "../contexts/AudioPlayerContextCore";
import { trackSongPlay } from "../backend/playTrackingService";

interface Artist {
  id: string;
  name: string;
  image_url: string;
}

interface Category {
  id: string;
  slug?: string;
  name: string;
  description: string;
}

const CategoryAlbums: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCachedData } = useDataCache();
  const { isLightMode } = useTheme();
  const { playSong } = useAudioPlayer();
  const [category, setCategory] = useState<Category | null>(null);
  const [albums, setAlbums] = useState<CatalogAlbum[]>([]);
  const [topAlbums, setTopAlbums] = useState<CatalogAlbum[]>([]);
  const [songs, setSongs] = useState<CatalogSong[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCategoryData(id);
    }
  }, [id]);

  const fetchCategoryData = async (categoryId: string) => {
    try {
      setLoading(true);

      const data = await getCachedData(`category_page_${categoryId}`, async () => {
        const startTime = performance.now();
        console.log(`🔄 [CategoryPage] Fetching data for category ${categoryId}...`);

        const [categories, albumsData, songsData, mostPlayedAlbumsData] = await Promise.all([
          getDerivedCategories(),
          getAlbums(50, { category_id: categoryId }),
          getSongs(50, { category_id: categoryId }),
          getMostPlayedAlbums(20),
        ]);

        const categoryData = categories.find((c) =>
          String(c.id) === categoryId ||
          c.slug === categoryId ||
          c.name.toLowerCase() === categoryId.toLowerCase()
        ) || null;

        const fetchTime = performance.now() - startTime;
        console.log(`✅ [CategoryPage] Data fetched in ${fetchTime.toFixed(0)}ms`);

        // If no albums found via API with category_id, fallback to name-based filtering for legacy support
        let finalAlbums = albumsData;
        if (finalAlbums.length === 0 && categoryData) {
          console.log("⚠️ [CategoryPage] No albums found via category_id, trying name fallback...");
          const allAlbums = await getAlbums(200);
          const normalizedName = categoryData.name.toLowerCase();
          finalAlbums = allAlbums.filter(a =>
            a.title.toLowerCase().includes(normalizedName) ||
            (a.artists && a.artists.some(art => art.name.toLowerCase().includes(normalizedName)))
          );
        }

        // Filter top albums to only include those in this category
        const albumIds = new Set(finalAlbums.map(a => a.id));
        const categoryTopAlbums = mostPlayedAlbumsData.filter(a => albumIds.has(a.id));

        return {
          category: categoryData,
          albums: finalAlbums,
          topAlbums: categoryTopAlbums,
          songs: songsData
        };
      });

      setCategory(data.category);
      setTopAlbums(data.topAlbums || []);
      setAlbums(data.albums);
      setSongs(data.songs);
    } catch (error) {
      console.error('Error fetching category data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaySong = (songId: string) => {
    const song = songs.find(s => s.id === songId);
    if (song) {
      trackSongPlay(song.id).catch(() => {});
      playSong({
        id: song.id,
        title: song.title,
        artist: song.artists?.map(a => a.name).join(', ') || 'Unknown Artist',
        coverUrl: song.songCover_url || song.album?.cover_url || '',
        audioUrl: song.audio_url || '',
        duration: song.duration
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <FaSpinner className="text-purple-400 text-5xl animate-spin" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 opacity-20">🎵</div>
          <p className="text-gray-400 text-xl">Category not found</p>
          <button
            onClick={() => navigate('/discover')}
            className="mt-4 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold transition-all"
          >
            Back to Discover
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isLightMode ? "bg-gray-50 text-gray-900" : "bg-black text-white"}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <button
          onClick={() => navigate(-1)}
          className={`flex items-center gap-2 ${isLightMode ? "text-gray-500 hover:text-gray-900" : "text-gray-400 hover:text-white"} transition-colors mb-8`}
        >
          <FaArrowLeft size={18} /> Back
        </button>

        <div className="mb-10">
          <div className="flex items-start gap-6 mb-6">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-linear-to-br from-purple-600 to-pink-600 flex items-center justify-center text-5xl md:text-6xl shadow-2xl shrink-0">
              🎵
            </div>
            <div className="flex-1">
              <h1 className={`text-5xl md:text-6xl font-black tracking-tight mb-2 ${isLightMode ? "text-gray-900" : "text-white"}`}>
                {category.name}
              </h1>
              {category.description && (
                <p className={`${isLightMode ? "text-gray-600" : "text-gray-400"} text-lg leading-relaxed`}>{category.description}</p>
              )}
            </div>
          </div>

          <div className="flex gap-4">
             <p className={`${isLightMode ? "text-gray-500" : "text-gray-500"} font-medium`}>
              {albums.length} {albums.length === 1 ? 'album' : 'albums'}
            </p>
            <p className={`${isLightMode ? "text-gray-500" : "text-gray-500"} font-medium`}>
              {songs.length} {songs.length === 1 ? 'song' : 'songs'}
            </p>
          </div>
        </div>

        {/* Songs Section */}
        {songs.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <FaMusic className="text-purple-500" /> Top Songs
            </h2>
            <div className={`${isLightMode ? "bg-white" : "bg-white/5"} rounded-3xl overflow-hidden`}>
              <div className="p-4 space-y-1">
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
                    metadata={new Date(song.created_at).getFullYear().toString()}
                    onPlay={handlePlaySong}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Top Albums Section */}
        {topAlbums.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <FaMusic className="text-purple-500" /> Top Albums
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {topAlbums.map((album) => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>
          </div>
        )}

        {/* All Albums Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Albums</h2>
          {albums.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl">
              <div className="text-6xl mb-4 opacity-20">📀</div>
              <p className={`${isLightMode ? "text-gray-400" : "text-gray-400"} text-xl`}>No albums in this category yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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

export default CategoryAlbums;
