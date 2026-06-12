import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSongs, getDerivedCategories, getDerivedTags, CatalogSong } from "../backend/catalogService";
import { useDataCache } from "../contexts/DataCacheContext";
import { FaSpinner, FaArrowLeft, FaMusic } from "react-icons/fa";
import Song from "../components/Song";
import { useTheme } from "../contexts/ThemeContext";
import { useAudioPlayer } from "../contexts/AudioPlayerContextCore";
import { trackSongPlay } from "../backend/playTrackingService";

interface Category {
  id: string;
  slug?: string;
  name: string;
  description: string;
  image_url?: string;
}

const CATEGORY_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80";

const CategoryAlbums: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCachedData } = useDataCache();
  const { isLightMode } = useTheme();
  const { playSong } = useAudioPlayer();
  const [category, setCategory] = useState<Category | null>(null);
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
        console.log(`🔄 [CategoryPage] Fetching data for category/tag ${categoryId}...`);

        const [categories, tags] = await Promise.all([
          getDerivedCategories(),
          getDerivedTags(),
        ]);

        const tagMatch = tags.find((t) =>
          String(t.id) === categoryId ||
          t.slug === categoryId ||
          t.name.toLowerCase() === categoryId.toLowerCase()
        );

        const categoryMatch = categories.find((c) =>
          String(c.id) === categoryId ||
          c.slug === categoryId ||
          c.name.toLowerCase() === categoryId.toLowerCase()
        );

        const categoryData = tagMatch || categoryMatch || null;
        const isTagPage = Boolean(tagMatch);

        let finalSongs: CatalogSong[] = [];

        if (isTagPage) {
          console.log(`🏷️ [CategoryPage] Identified as TAG, fetching with tag_id filter...`);
          const resolvedTagId = tagMatch?.id || categoryId;
          finalSongs = await getSongs(50, { tag_id: resolvedTagId });

          // Legacy songs may only have mood text set instead of tag_id
          if (finalSongs.length === 0 && tagMatch) {
            finalSongs = await getSongs(50, { category_id: tagMatch.name });
          }
        } else {
          const resolvedCategoryId = categoryMatch?.id || categoryId;
          finalSongs = await getSongs(50, { category_id: resolvedCategoryId });
        }

        const fetchTime = performance.now() - startTime;
        console.log(`✅ [CategoryPage] Data fetched in ${fetchTime.toFixed(0)}ms`);

        return {
          category: categoryData,
          songs: finalSongs,
        };
      });

      setCategory(data.category);
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
      trackSongPlay(song.id).catch(() => { });
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
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden shadow-2xl shrink-0">
              <img
                src={category.image_url || CATEGORY_IMAGE_FALLBACK}
                alt={category.name}
                className="w-full h-full object-cover"
              />
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

          <p className={`${isLightMode ? "text-gray-500" : "text-gray-500"} font-medium`}>
            {songs.length} {songs.length === 1 ? 'song' : 'songs'}
          </p>
        </div>

        {songs.length > 0 ? (
          <div className="mb-12">

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
        ) : (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl">
            <div className="text-6xl mb-4 opacity-20">🎵</div>
            <p className={`${isLightMode ? "text-gray-400" : "text-gray-400"} text-xl`}>No songs in this category yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryAlbums;
