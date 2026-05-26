import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FaPlus, FaSearch, FaMusic, 
  FaTrash, FaEdit, FaTimes, FaLayerGroup, FaSpinner 
} from "react-icons/fa";
import { useDataCache } from "../../contexts/DataCacheContext";
import { getAdminCategories } from "../../backend/adminApi";

interface Category {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export default function CategoriesManager() {
  const navigate = useNavigate();
  const { getCachedData, clearCache } = useDataCache();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  // form state
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  });

  // Fetch categories from Supabase
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);

      const data = await getCachedData('admin_categories', async () => {
        const startTime = performance.now();
        console.log('🔄 [Admin] Fetching categories...');

        const data = await getAdminCategories();

        const fetchTime = performance.now() - startTime;
        console.log(`✅ [Admin] Categories fetched in ${fetchTime.toFixed(0)}ms`);
        return data || [];
      });

      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      alert('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  // Filtered categories
  const filtered = useMemo(() => {
    return categories.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [categories, search]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category? This might affect associated albums.")) return;

    clearCache('admin_categories');
    setCategories(categories.filter(c => c.id !== id));
  };

  const openAddModal = () => {
    setEditingCat(null);
    setFormData({
      name: "",
      description: ""
    });
    setShowModal(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCat(cat);
    setFormData({
      name: cat.name,
      description: cat.description
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    try {
      if (editingCat) {
        setCategories(categories.map(c =>
          c.id === editingCat.id
            ? {
                ...c,
                name: formData.name,
                description: formData.description,
                updated_at: new Date().toISOString()
              }
            : c
        ));
      } else {
        const created: Category = {
          id: `local-${Date.now()}`,
          name: formData.name,
          description: formData.description,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setCategories([created, ...categories]);
      }

      clearCache('admin_categories');
      setShowModal(false);
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Failed to save category');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-6 md:p-12 text-white">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-black">
              Genre <span className="text-purple-400">Categories</span>
            </h1>
            <p className="text-slate-400 mt-2 flex items-center gap-2">
              <FaLayerGroup className="text-purple-500" />
              Total Genres: {categories.length}
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition"
          >
            <FaPlus /> Create Category
          </button>
        </div>

        {/* SEARCH */}
        <div className="relative mb-8 max-w-md">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            placeholder="Filter categories..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <FaSpinner className="text-purple-400 text-4xl animate-spin" />
          </div>
        ) : (
          /* GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(cat => (
              <div 
                key={cat.id} 
                onClick={() => navigate(`/admin/CategoryAlbum/${cat.id}`)}
                className="group bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition cursor-pointer hover:scale-105"
              >
                <div className="flex justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <FaMusic />
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(cat);
                      }} 
                      className="p-2 hover:bg-white/10 rounded-lg text-blue-400"
                    >
                      <FaEdit />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(cat.id);
                      }} 
                      className="p-2 hover:bg-white/10 rounded-lg text-red-400"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>

                <h3 className="text-xl font-bold">{cat.name}</h3>
                <p className="text-sm text-slate-400 mb-4">{cat.description || 'No description'}</p>

                <div className="flex justify-between text-sm text-slate-300 border-t border-white/5 pt-4">
                  <span className="text-xs text-slate-500">
                    Created: {new Date(cat.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
            
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-20">
                <div className="text-6xl mb-4 opacity-20">🎵</div>
                <p className="text-slate-400 text-lg">No categories found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 w-full max-w-md rounded-3xl p-8">
            <div className="flex justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {editingCat ? "Edit Genre" : "New Genre"}
              </h2>
              <button onClick={() => setShowModal(false)}><FaTimes /></button>
            </div>

            <div className="space-y-4">
              <input
                placeholder="Genre name"
                className="w-full bg-slate-800 px-4 py-3 rounded-xl outline-none"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
              <textarea
                placeholder="Description"
                className="w-full bg-slate-800 px-4 py-3 rounded-xl h-24 outline-none"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
              <button
                onClick={handleSave}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-4 rounded-xl font-bold"
              >
                {editingCat ? "Update Category" : "Create Category"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
