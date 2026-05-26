import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAlbums } from "../../backend/catalogService";
import { useDataCache } from "../../contexts/DataCacheContext";
import AlbumCard from "../../components/AlbumCard";
import { FaSpinner } from "react-icons/fa";

interface Artist {
  id: string;
  name: string;
  image_url: string;
}

interface Album {
  id: string;
  title: string;
  cover_url: string;
  type?: string;
  release_date?: string;
  artists?: Artist[];
}

interface Props {
  title?: string;
  isLightMode?: boolean;
  limit?: number;
  offset?: number; // for deduping across sections
  songs?: any[]; // Pre-fetched songs/albums to display instead of fetching
}

const SongSection: React.FC<Props> = ({
  title = "Songs",
  isLightMode = true,
  limit = 10,
  offset = 0,
  songs,
}) => {
  const bgClass = "bg-black";
  const textColor = isLightMode ? "text-gray-900" : "text-white";

  const navigate = useNavigate();
  const { getCachedData } = useDataCache();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    if (!songs) {
      fetchAlbums();
    } else {
      setAlbums(songs);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, offset, songs]);

  const fetchAlbums = async () => {
    try {
      setLoading(true);

      const data = await getCachedData(`albums_${limit}_${offset}`, async () => {
        const albumsData = await getAlbums(Math.max(1, limit), Math.max(0, offset));

        const transformedAlbums: Album[] = (albumsData || []).map((album: any) => ({
          id: album.id,
          title: album.title,
          cover_url: album.cover_url,
          type: album.type,
          release_date: album.release_date,
          artists: album.artists || []
        }));

        return transformedAlbums;
      });

      setAlbums(data);
    } catch (error) {
      console.error('Error fetching albums:', error);
    } finally {
      setLoading(false);
    }
  };



  const handlePlay = (id: string) => {
    setPlayingId(id);
    window.setTimeout(() => setPlayingId((current) => (current === id ? null : current)), 2000);
  };

  if (loading) {
    return (
      <section className={`${bgClass} p-4 md:p-6 lg:p-8 rounded-lg mt-8 mb-8`}>
        <h2 className={`text-xl md:text-2xl lg:text-3xl font-bold mb-4 ${textColor}`}>
          {title}
        </h2>
        <div className="flex items-center justify-center py-12">
          <FaSpinner className="text-purple-400 text-3xl animate-spin" />
        </div>
      </section>
    );
  }

  if (albums.length === 0) {
    return (
      <section className={`${bgClass} p-4 md:p-6 lg:p-8 rounded-lg mt-8 mb-8`}>
        <h2 className={`text-xl md:text-2xl lg:text-3xl font-bold mb-4 ${textColor}`}>
          {title}
        </h2>
        <div className="text-center py-12 text-zinc-500">No albums available</div>
      </section>
    );
  }

  return (
    <section className={`${bgClass} p-4 md:p-6 lg:p-8 rounded-lg mt-8 mb-8`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-xl md:text-2xl lg:text-3xl font-bold ${textColor}`}>
          {title}
        </h2>
      </div>

      <div className="w-full overflow-x-auto overflow-y-hidden pb-4 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-500">
        <div className="flex gap-4 md:gap-6">
          {albums.map((album) => (
            <div key={album.id} className="w-[160px] sm:w-[180px] md:w-[200px] flex-shrink-0">
              <AlbumCard album={album} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default SongSection;
