import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  FaArrowLeft, FaPlus, FaTrash, FaSpinner, FaSearch 
} from "react-icons/fa";
import { useDataCache } from "../../contexts/DataCacheContext";
import { getAdminAlbums, getAdminTags } from "../../backend/adminApi";

interface Album {
  id: string;
  title: string;
  cover_url: string;
  artists?: { id: string; name: string }[];
}

interface Tag {
  id: string;
  name: string;
  description: string;
}

export default function TagAlbumsManager() {
  const { tagId } = useParams<{ tagId: string }>();
  const navigate = useNavigate();
  const { getCachedData, clearCache } = useDataCache();
  
  const [tag, setTag] = useState<Tag | null>(null);
  const [assignedAlbums, setAssignedAlbums] = useState<Album[]>([]);
  const [allAlbums, setAllAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (tagId) {
      fetchData();
    }
  }, [tagId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const data = await getCachedData(`admin_tag_albums_${tagId}`, async () => {
        console.log(`🔄 [Admin] Fetching tag albums for tag ${tagId}...`);

        const [tags, allAlbumsData] = await Promise.all([
          getAdminTags(),
          getAdminAlbums(500),
        ]);

        const tagData = tags.find((t) => t.id === tagId) || null;
        const assigned = (tagData?.albums || []).map((album: any) => ({
          id: album.id,
          title: album.title,
          cover_url: album.cover_url || '',
          artists: album.artists || [],
        }));

        const all = (allAlbumsData || []).map((album: any) => ({
          id: album.id,
          title: album.title,
          cover_url: album.cover_url || '',
          artists: album.artists || [],
        }));

        console.log(`✅ [Admin] ${assigned.length} albums assigned to tag`);
        return { tag: tagData, assigned, all };
      });

      setTag(data.tag);
      setAssignedAlbums(data.assigned);
      setAllAlbums(data.all);
    } catch (error) {
      console.error('Error fetching tag albums:', error);
      alert('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAlbum = async (albumId: string) => {
    try {
      clearCache(`admin_tag_albums_${tagId}`);

      const album = allAlbums.find(a => a.id === albumId);
      if (album && !assignedAlbums.some((a) => a.id === album.id)) {
        setAssignedAlbums([...assignedAlbums, album]);
      }

      setShowAddModal(false);
      setSearch("");
    } catch (error: any) {
      console.error('Error adding album to tag:', error);
      alert('Failed to add album');
    }
  };

  const handleRemoveAlbum = async (albumId: string) => {
    if (!confirm("Remove this album from the tag?")) return;

    try {
      clearCache(`admin_tag_albums_${tagId}`);
      setAssignedAlbums(assignedAlbums.filter(a => a.id !== albumId));
    } catch (error) {
      console.error('Error removing album from tag:', error);
      alert('Failed to remove album');
    }
  };

  const availableAlbums = allAlbums.filter(album => 
    !assignedAlbums.some(assigned => assigned.id === album.id) &&
    album.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-6 flex items-center justify-center">
        <FaSpinner className="text-purple-400 text-4xl animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-6 md:p-12 text-white">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/admin/tags')}
            className="p-3 hover:bg-white/10 rounded-xl transition"
          >
            <FaArrowLeft />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-black">
              {tag?.name} <span className="text-purple-400">Albums</span>
            </h1>
            <p className="text-slate-400 mt-2">{tag?.description}</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition"
          >
            <FaPlus /> Add Album
          </button>
        </div>

        {/* ASSIGNED ALBUMS */}
        {assignedAlbums.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl">
            <div className="text-6xl mb-4 opacity-20">📀</div>
            <p className="text-slate-400 text-lg">No albums assigned yet</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 text-purple-400 hover:text-purple-300"
            >
              Add your first album
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {assignedAlbums.map(album => (
              <div key={album.id} className="group relative bg-white/5 rounded-2xl p-4 hover:bg-white/10 transition">
                <img 
                  src={album.cover_url || `https://ui-avatars.com/api/?name=${album.title}`}
                  alt={album.title}
                  className="w-full aspect-square object-cover rounded-xl mb-3"
                />
                <h3 className="font-bold text-sm truncate">{album.title}</h3>
                <p className="text-xs text-slate-400 truncate">
                  {album.artists?.map(a => a.name).join(', ') || 'Unknown'}
                </p>
                
                <button
                  onClick={() => handleRemoveAlbum(album.id)}
                  className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition"
                >
                  <FaTrash size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD ALBUM MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 w-full max-w-4xl rounded-3xl p-8 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between mb-6">
              <h2 className="text-2xl font-bold">Add Album to Tag</h2>
              <button onClick={() => { setShowAddModal(false); setSearch(""); }}>
                <FaArrowLeft />
              </button>
            </div>

            {/* SEARCH */}
            <div className="relative mb-6">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                placeholder="Search albums..."
                className="w-full bg-slate-800 px-4 py-3 pl-12 rounded-xl outline-none"
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
            </div>

            {/* ALBUMS GRID */}
            <div className="overflow-y-auto flex-1">
              {availableAlbums.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  {search ? 'No albums found' : 'All albums are already assigned'}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {availableAlbums.map(album => (
                    <div 
                      key={album.id}
                      onClick={() => handleAddAlbum(album.id)}
                      className="bg-white/5 rounded-xl p-3 hover:bg-white/10 transition cursor-pointer"
                    >
                      <img 
                        src={album.cover_url || `https://ui-avatars.com/api/?name=${album.title}`}
                        alt={album.title}
                        className="w-full aspect-square object-cover rounded-lg mb-2"
                      />
                      <h3 className="font-bold text-sm truncate">{album.title}</h3>
                      <p className="text-xs text-slate-400 truncate">
                        {album.artists?.map(a => a.name).join(', ') || 'Unknown'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
