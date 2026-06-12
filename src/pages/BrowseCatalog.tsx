import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getGenres, getDerivedTags } from "../backend/catalogService";
import { useDataCache } from "../contexts/DataCacheContext";
import { useTheme } from "../contexts/ThemeContext";
import AppFooter from "../components/AppFooter";
import { FaSpinner, FaArrowLeft } from "react-icons/fa";

interface CatalogItem {
  id: string;
  slug?: string;
  name: string;
  description: string;
  image_url?: string;
}

type BrowseCatalogProps = {
  type: "genre" | "mood";
};

const GENRE_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80";

const MOOD_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1516062423079-7ca13cdc7f5a?w=400&q=80";

const BrowseCatalog: React.FC<BrowseCatalogProps> = ({ type }) => {
  const navigate = useNavigate();
  const { getCachedData } = useDataCache();
  const { isLightMode } = useTheme();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const isGenre = type === "genre";
  const accent = isGenre ? "Genres" : "Activity";
  const cacheKey = isGenre ? "browse_genres" : "browse_moods";
  const imageFallback = isGenre ? GENRE_IMAGE_FALLBACK : MOOD_IMAGE_FALLBACK;
  const suffix = isGenre ? "Tracks" : "Hits";

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const data = await getCachedData(cacheKey, async () => {
          return isGenre ? getGenres() : getDerivedTags();
        });
        setItems(data || []);
      } catch (error) {
        console.error(`Error fetching ${type} catalog:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [cacheKey, getCachedData, isGenre, type]);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isLightMode ? "bg-gray-50" : "bg-black"}`}>
        <FaSpinner className="animate-spin text-blue-500 text-4xl" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 pb-20 ${isLightMode ? "bg-gray-50" : "bg-black"}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <button
          onClick={() => navigate(-1)}
          className={`flex items-center gap-2 mb-8 transition-colors ${
            isLightMode ? "text-gray-500 hover:text-gray-900" : "text-gray-400 hover:text-white"
          }`}
        >
          <FaArrowLeft size={18} /> Back
        </button>

        <h1 className={`text-4xl md:text-5xl font-black mb-10 tracking-tight ${isLightMode ? "text-zinc-900" : "text-white"}`}>
          {isGenre ? "Music" : "Mood &"}{" "}
          <span className="text-blue-500">{isGenre ? accent : accent}</span>
        </h1>

        {items.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(`/category/${item.slug || item.id}`)}
                className="group relative w-full h-28 md:h-36 rounded-2xl overflow-hidden transition-transform duration-500 hover:scale-[1.03]"
              >
                <img
                  src={item.image_url || imageFallback}
                  alt={item.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <h3 className="text-white font-black text-base md:text-xl uppercase tracking-tighter text-center px-4">
                    {item.name} <span className="text-blue-400">{suffix}</span>
                  </h3>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl">
            <p className={`${isLightMode ? "text-gray-500" : "text-gray-400"} text-xl`}>
              No {isGenre ? "genres" : "moods"} available yet
            </p>
          </div>
        )}
      </div>
      <AppFooter />
    </div>
  );
};

export default BrowseCatalog;
