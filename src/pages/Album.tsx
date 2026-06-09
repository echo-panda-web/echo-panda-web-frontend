import { useState, useEffect } from "react";
import { getAlbums } from "../backend/catalogService";
import { useDataCache } from "../contexts/DataCacheContext";
import AlbumCard from "../components/AlbumCard";
import { FaSpinner } from "react-icons/fa";
import { useTheme } from "../contexts/ThemeContext";

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
  release_date: string;
  created_at: string;
  songs_count?: number;
  artists?: Artist[];
}

export default function Album() {
  const { isLightMode } = useTheme();
  const { getCachedData } = useDataCache();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    try {
      setLoading(true);

      const data = await getCachedData("album_grid", async () => {
        const startTime = performance.now();
        console.log("🔄 [Album] Fetching albums...");

        const albumsData = await getAlbums(200, 0);

        const fetchTime = performance.now() - startTime;
        console.log(`✅ [Album] Albums fetched in ${fetchTime.toFixed(0)}ms`);
        console.log(`📊 [Album] Retrieved ${albumsData?.length || 0} albums`);

        const transformedAlbums: Album[] = (albumsData || []).map(
          (album: any) => ({
            id: album.id,
            title: album.title,
            cover_url: album.cover_url || "",
            type: album.type,
            songs_count: album.songs_count || 0,
            release_date: album.release_date || "",
            created_at: album.release_date || new Date().toISOString(),
            artists: album.artists || [],
          })
        );

        return transformedAlbums;
      });

      setAlbums(data);
    } catch (error) {
      console.error("Error fetching albums:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${isLightMode ? "bg-gray-50 text-gray-900" : "bg-black text-white"}`}>
      {/* Header */}
      <div className="relative h-96 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transform scale-105"
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80")',
            filter: isLightMode
              ? "blur(2px) brightness(1.2)"
              : "blur(2px) brightness(0.4)",
          }}
        />
        <div className={`absolute inset-0 bg-linear-to-b ${isLightMode ? "from-white/40 via-white/60 to-gray-50" : "from-black/40 via-black/60 to-black"}`} />
        <div className={`absolute inset-0 ${isLightMode ? "bg-linear-to-r from-purple-100/30 via-transparent to-pink-100/30" : "bg-linear-to-r from-purple-900/30 via-transparent to-pink-900/30"}`} />

        <div className="relative z-10 h-full flex flex-col justify-end">
          <div className="px-6 md:px-12 max-w-7xl mx-auto w-full pb-8 md:pb-12">
            <div className={`inline-block mb-4 px-4 py-1.5 ${isLightMode ? "bg-black/10 border-black/20" : "bg-white/10 border-white/20"} backdrop-blur-md rounded-full border`}>
              <span className={`text-sm font-medium ${isLightMode ? "text-gray-900" : "text-white"}`}>Collection</span>
            </div>
            <h1 className={`text-6xl md:text-7xl font-black mb-4 ${isLightMode ? "from-gray-900 via-gray-800 to-gray-700" : "from-white via-white to-gray-300"} bg-linear-to-r bg-clip-text text-transparent tracking-tight`}>
              Albums
            </h1>
            <p className={`text-xl md:text-2xl ${isLightMode ? "text-gray-600" : "text-gray-300"} font-light`}>
              {`Explore your music collection · ${albums.length} albums`}
            </p>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="px-6 md:px-12 py-12 max-w-7xl mx-auto flex items-center justify-center min-h-100">
          <FaSpinner className="text-purple-400 text-5xl animate-spin" />
        </div>
      ) : albums.length === 0 ? (
        <div className="px-6 md:px-12 py-12 max-w-7xl mx-auto text-center min-h-100 flex flex-col items-center justify-center">
          <div className="text-6xl mb-4 opacity-20">🎵</div>
          <p className="text-zinc-400 text-xl">No albums available</p>
        </div>
      ) : (
        <div className="px-6 md:px-12 py-12 max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
          <div className="h-24" />
        </div>
      )}
    </div>
  );
}