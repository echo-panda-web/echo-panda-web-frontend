import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDataCache } from "../../contexts/DataCacheContext";
import { FaSpinner, FaArrowLeft, FaMusic, FaEdit, FaTrash } from "react-icons/fa";
import { getAdminAlbums, getAdminCategories } from "../../backend/adminApi";

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
  created_at: string;
  artists?: Artist[];
}

interface Category {
  id: string;
  name: string;
  description: string;
}

export default function AdminCategoryAlbums() {
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

      const data = await getCachedData(`admin_category_albums_${categoryId}`, async () => {
        const startTime = performance.now();
        console.log(`🔄 [Admin CategoryAlbums] Fetching category ${categoryId}...`);

        const [categories, albumData] = await Promise.all([
          getAdminCategories(),
          getAdminAlbums(500),
        ]);

        const categoryData = categories.find((c) => c.id === categoryId) || null;

        const fetchTime = performance.now() - startTime;
        console.log(`✅ [Admin CategoryAlbums] Data fetched in ${fetchTime.toFixed(0)}ms`);

        const normalized = (categoryData?.name || '').toLowerCase();
        const transformedAlbums: Album[] = (albumData || [])
          .filter((album: any) => {
            if (!normalized) return true;
            const title = String(album.title || '').toLowerCase();
            const artist = String(album.artists?.[0]?.name || '').toLowerCase();
            return title.includes(normalized) || artist.includes(normalized);
          })
          .map((album: any) => ({
            id: album.id,
            title: album.title,
            cover_url: album.cover_url,
            type: album.type,
            created_at: album.created_at,
            artists: album.artists || []
          }));

        console.log(`📊 [Admin CategoryAlbums] Retrieved ${transformedAlbums.length} albums`);
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

  const handleDeleteFromCategory = async (albumId: string) => {
    if (!confirm("Remove this album from this category?")) return;

    try {
      setAlbums(albums.filter(a => a.id !== albumId));
    } catch (error) {
      console.error('Error removing album from category:', error);
      alert('Failed to remove album from category');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex items-center justify-center">
        <FaSpinner className="text-purple-400 text-5xl animate-spin" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-6xl mb-4 opacity-20">🎵</div>
          <p className="text-slate-400 text-xl">Category not found</p>
          <button 
            onClick={() => navigate('/admin/categories')}
            className="mt-4 px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-xl font-bold transition-all"
          >
            Back to Categories
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => navigate('/admin/categories')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
          >
            <FaArrowLeft /> Back to Categories
          </button>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-4xl shadow-2xl">
              <FaMusic />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight">
                {category.name}
              </h1>
              {category.description && (
                <p className="text-slate-400 text-lg mt-2">{category.description}</p>
              )}
            </div>
          </div>
          
          <p className="text-slate-500 font-semibold">
            {albums.length} {albums.length === 1 ? 'album' : 'albums'} in this category
          </p>
        </div>

        {/* Albums Table */}
        {albums.length === 0 ? (
          <div className="text-center py-32 bg-white/5 rounded-3xl border border-white/10">
            <div className="text-6xl mb-4 opacity-20">📀</div>
            <p className="text-slate-400 text-xl">No albums in this category yet</p>
          </div>
        ) : (
          <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-300">Cover</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-300">Title</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-300">Artists</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-300">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-300">Created</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {albums.map((album, idx) => (
                    <tr 
                      key={album.id}
                      className="border-b border-white/5 hover:bg-white/5 transition"
                    >
                      <td className="px-6 py-4">
                        <img 
                          src={album.cover_url || '/placeholder-album.png'} 
                          alt={album.title}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold">{album.title}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {album.artists && album.artists.length > 0
                          ? album.artists.map(a => a.name).join(', ')
                          : 'Unknown Artist'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          album.type === 'album' ? 'bg-purple-500/20 text-purple-300' :
                          album.type === 'single' ? 'bg-pink-500/20 text-pink-300' :
                          'bg-blue-500/20 text-blue-300'
                        }`}>
                          {album.type || 'album'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-sm">
                        {new Date(album.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/admin/albums`)}
                            className="p-2 hover:bg-white/10 rounded-lg text-blue-400 transition"
                            title="Edit Album"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteFromCategory(album.id)}
                            className="p-2 hover:bg-white/10 rounded-lg text-red-400 transition"
                            title="Remove from Category"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
