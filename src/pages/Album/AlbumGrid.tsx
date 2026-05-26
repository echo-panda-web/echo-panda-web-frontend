import React, { useState, useEffect } from "react";
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
  type: string;
  release_date: string;
  created_at: string;
  artists?: Artist[];
}

export default function AlbumGrid() {
  const { getCachedData } = useDataCache();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    try {
      setLoading(true);

      const data = await getCachedData('album_grid', async () => {
        const startTime = performance.now();
        console.log('🔄 [AlbumGrid] Fetching albums...');

        const albumsData = await getAlbums(25, 0);

        const fetchTime = performance.now() - startTime;
        console.log(`✅ [AlbumGrid] Albums fetched in ${fetchTime.toFixed(0)}ms`);
        console.log(`📊 [AlbumGrid] Retrieved ${albumsData?.length || 0} albums`);

        const transformedAlbums: Album[] = (albumsData || []).map((album: any) => ({
          id: album.id,
          title: album.title,
          cover_url: album.cover_url || "",
          type: album.type,
          release_date: album.release_date || "",
          created_at: album.release_date || new Date().toISOString(),
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

  if (loading) {
    return (
      <div className="px-6 md:px-12 py-12 max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
        <FaSpinner className="text-purple-400 text-5xl animate-spin" />
      </div>
    );
  }

  if (albums.length === 0) {
    return (
      <div className="px-6 md:px-12 py-12 max-w-7xl mx-auto text-center min-h-[400px] flex flex-col items-center justify-center">
        <div className="text-6xl mb-4 opacity-20">🎵</div>
        <p className="text-zinc-400 text-xl">No albums available</p>
      </div>
    );
  }

  return (
    <div className="px-6 md:px-12 py-12 max-w-7xl mx-auto">
      <div className="grid grid-cols-2  md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 ">
        {albums.map((album) => (
          <AlbumCard key={album.id} album={album} />
        ))}
      </div>

      <div className="h-24" />
    </div>
  );
}
