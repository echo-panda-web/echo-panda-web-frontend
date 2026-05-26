import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FaPlus, FaSearch, FaTags, 
  FaTrash, FaEdit, FaTimes, FaArrowUp, FaArrowDown, FaSpinner,
  FaToggleOn, FaToggleOff
} from "react-icons/fa";
import { useDataCache } from "../../contexts/DataCacheContext";
import { getAdminTags } from "../../backend/adminApi";

interface Tag {
  id: string;
  name: string;
  description: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function TagsManager() {
  const navigate = useNavigate();
  const { getCachedData, clearCache } = useDataCache();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  // form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_active: true
  });

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);

      const data = await getCachedData('admin_tags', async () => {
        console.log('🔄 [Admin] Fetching tags...');

        const data = await getAdminTags();
        console.log(`✅ [Admin] ${data?.length || 0} tags fetched`);
        return data || [];
      });

      setTags(data);
    } catch (error) {
      console.error('Error fetching tags:', error);
      alert('Failed to fetch tags');
    } finally {
      setLoading(false);
    }
  };

  // Filtered tags
  const filtered = useMemo(() => {
    return tags.filter(t =>
      t.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [tags, search]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this tag? All album associations will also be removed.")) return;

    clearCache('admin_tags');
    setTags(tags.filter(t => t.id !== id));
  };

  const handleToggleActive = async (tag: Tag) => {
    try {
      clearCache('admin_tags');
      setTags(tags.map(t =>
        t.id === tag.id ? { ...t, is_active: !t.is_active } : t
      ));
    } catch (error) {
      console.error('Error toggling tag status:', error);
      alert('Failed to update tag status');
    }
  };

  const handleMoveOrder = async (tag: Tag, direction: 'up' | 'down') => {
    const currentIndex = tags.findIndex(t => t.id === tag.id);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === tags.length - 1)
    ) {
      return;
    }

    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const swapTag = tags[swapIndex];

    try {
      clearCache('admin_tags');
      
      const newTags = [...tags];
      [newTags[currentIndex], newTags[swapIndex]] = [newTags[swapIndex], newTags[currentIndex]];
      setTags(newTags);
    } catch (error) {
      console.error('Error reordering tags:', error);
      alert('Failed to reorder tags');
    }
  };

  const openAddModal = () => {
    setEditingTag(null);
    setFormData({
      name: "",
      description: "",
      is_active: true
    });
    setShowModal(true);
  };

  const openEditModal = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      description: tag.description,
      is_active: tag.is_active
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    try {
      if (editingTag) {
        setTags(tags.map(t =>
          t.id === editingTag.id
            ? {
                ...t,
                name: formData.name,
                description: formData.description,
                is_active: formData.is_active,
                updated_at: new Date().toISOString()
              }
            : t
        ));
      } else {
        const maxOrder = Math.max(...tags.map(t => t.display_order), 0);

        const created: Tag = {
          id: `local-${Date.now()}`,
          name: formData.name,
          description: formData.description,
          is_active: formData.is_active,
          display_order: maxOrder + 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setTags([...tags, created]);
      }

      clearCache('admin_tags');
      setShowModal(false);
    } catch (error) {
      console.error('Error saving tag:', error);
      alert('Failed to save tag');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-6 md:p-12 text-white">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-black">
              Collection <span className="text-purple-400">Tags</span>
            </h1>
            <p className="text-slate-400 mt-2 flex items-center gap-2">
              <FaTags className="text-purple-500" />
              Organize albums into custom sections for the home page
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition"
          >
            <FaPlus /> Create Tag
          </button>
        </div>

        {/* SEARCH */}
        <div className="relative mb-8 max-w-md">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            placeholder="Search tags..."
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
          /* LIST */
          <div className="space-y-4">
            {filtered.map((tag, index) => (
              <div 
                key={tag.id} 
                className="group bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition flex items-center justify-between"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleMoveOrder(tag, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-white/10 rounded text-slate-400 disabled:opacity-30"
                    >
                      <FaArrowUp size={12} />
                    </button>
                    <button
                      onClick={() => handleMoveOrder(tag, 'down')}
                      disabled={index === filtered.length - 1}
                      className="p-1 hover:bg-white/10 rounded text-slate-400 disabled:opacity-30"
                    >
                      <FaArrowDown size={12} />
                    </button>
                  </div>

                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg font-bold">
                    {tag.display_order}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold">{tag.name}</h3>
                      {tag.is_active ? (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Active</span>
                      ) : (
                        <span className="px-2 py-1 bg-slate-500/20 text-slate-400 text-xs rounded-full">Inactive</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 mt-1">{tag.description || 'No description'}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/admin/tag-albums/${tag.id}`)}
                    className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition"
                  >
                    Manage Albums
                  </button>
                  <button
                    onClick={() => handleToggleActive(tag)}
                    className={`p-3 rounded-lg ${tag.is_active ? 'text-green-400 hover:bg-green-500/10' : 'text-slate-400 hover:bg-slate-500/10'}`}
                  >
                    {tag.is_active ? <FaToggleOn size={20} /> : <FaToggleOff size={20} />}
                  </button>
                  <button 
                    onClick={() => openEditModal(tag)} 
                    className="p-3 hover:bg-white/10 rounded-lg text-blue-400"
                  >
                    <FaEdit />
                  </button>
                  <button 
                    onClick={() => handleDelete(tag.id)} 
                    className="p-3 hover:bg-white/10 rounded-lg text-red-400"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
            
            {filtered.length === 0 && (
              <div className="text-center py-20">
                <div className="text-6xl mb-4 opacity-20">🏷️</div>
                <p className="text-slate-400 text-lg">No tags found</p>
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
                {editingTag ? "Edit Tag" : "New Tag"}
              </h2>
              <button onClick={() => setShowModal(false)}><FaTimes /></button>
            </div>

            <div className="space-y-4">
              <input
                placeholder="Tag name (e.g., K-POP Songs)"
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
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5"
                />
                <label htmlFor="is_active" className="text-slate-300">Active (shown on home page)</label>
              </div>
              <button
                onClick={handleSave}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-4 rounded-xl font-bold"
              >
                {editingTag ? "Update Tag" : "Create Tag"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
