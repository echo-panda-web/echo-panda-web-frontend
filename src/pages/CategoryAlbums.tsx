import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAlbums, getDerivedCategories } from "../backend/catalogService";
import { useDataCache } from "../contexts/DataCacheContext";
import { FaSpinner, FaArrowLeft } from "react-icons/fa";
import AlbumCard from "../components/AlbumCard";

interface Artist {
  id: string;
  name: string;
  image_url: string;
}

interface Album {
  id: string;
  title: string;
  cover_url: string;
  type: string;
  artists?: Artist[];
}

interface Category {
  id: string;
  name: string;
  description: string;
}

const CategoryAlbums: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCachedData } = useDataCache();
  const [category, setCategory] = useState<Category | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCategoryAndAlbums(id);
    }
  }, [id]);

  const fetchCategoryAndAlbums = async (categoryId: string) => {
    try {
      setLoading(true);

      const data = await getCachedData(`category_albums_${categoryId}`, async () => {
        const startTime = performance.now();
        console.log(`🔄 [CategoryAlbums] Fetching category ${categoryId}...`);

        const [categories, albumsData] = await Promise.all([
          getDerivedCategories(),
          getAlbums(200, 0),
        ]);

        const categoryData = categories.find((c) => c.id === categoryId) || null;

        const fetchTime = performance.now() - startTime;
        console.log(`✅ [CategoryAlbums] Data fetched in ${fetchTime.toFixed(0)}ms`);

        const normalized = (categoryData?.name || "").toLowerCase();
        const transformedAlbums: Album[] = (albumsData || [])
          .filter((album: any) => {
            if (!normalized) return true;
            const title = String(album.title || "").toLowerCase();
            const artist = String(album.artists?.[0]?.name || "").toLowerCase();
            const type = String(album.type || "").toLowerCase();
            return title.includes(normalized) || artist.includes(normalized) || type.includes(normalized);
          })
          .map((album: any) => ({
            id: album.id,
            title: album.title,
            cover_url: album.cover_url || "",
            type: album.type || "album",
            artists: album.artists || [],
          }));

        return { category: categoryData, albums: transformedAlbums };
      });

      setCategory(data.category);
      setAlbums(data.albums);
    } catch (error) {
      console.error('Error fetching category albums:', error);
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
        >
          <FaArrowLeft size={18} /> Back
        </button>
        
        <div className="mb-10">
          <div className="flex items-start gap-6 mb-6">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-5xl md:text-6xl shadow-2xl flex-shrink-0">
              🎵
            </div>
            <div className="flex-1">
              <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-2">
                {category.name}
              </h1>
              {category.description && (
                <p className="text-gray-400 text-lg leading-relaxed">{category.description}</p>
              )}
            </div>
          </div>
          
          <p className="text-gray-500 font-medium">
            {albums.length} {albums.length === 1 ? 'album' : 'albums'}
          </p>
        </div>

        {albums.length === 0 ? (
          <div className="text-center py-32">
            <div className="text-6xl mb-4 opacity-20">📀</div>
            <p className="text-gray-400 text-xl">No albums in this category yet</p>
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
  );
};

export default CategoryAlbums;
