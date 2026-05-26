import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getDerivedArtists } from "../backend/catalogService";
import { useDataCache } from "../contexts/DataCacheContext";
import AppFooter from "./home/AppFooter";
import HeroBanner from "./artist/HeroBanner";
import PopularSongs from "./artist/PopularSongs";
import AlbumsSection from "./artist/AlbumsSection";
import SingleSongs from "./artist/SingleSongs";
import FansAlsoListen from "./artist/FansAlsoListen";
import { FaSpinner } from "react-icons/fa";

interface Artist {
  id: string;
  name: string;
  image_url?: string;
  bio?: string;
  gender?: string;
  role?: string;
  status?: boolean;
  created_at?: string;
}

const Artist: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getCachedData } = useDataCache();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const isLightMode = false;

  useEffect(() => {
    if (id) {
      fetchArtist(id);
    }
  }, [id]);

  const fetchArtist = async (artistId: string) => {
    try {
      setLoading(true);

      const data = await getCachedData(`artist_${artistId}`, async () => {
        const startTime = performance.now();
        console.log(`🔄 [Artist] Fetching artist ${artistId}...`);

        const artists = await getDerivedArtists(500);
        const artistData = artists.find((a) => a.id === artistId) || artists.find((a) => encodeURIComponent(a.name) === artistId) || null;

        const fetchTime = performance.now() - startTime;
        console.log(`✅ [Artist] Artist fetched in ${fetchTime.toFixed(0)}ms`);

        return artistData;
      });

      setArtist(data);
    } catch (error) {
      if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('NetworkError'))) {
        return;
      }
      console.error('Error fetching artist:', error);
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <FaSpinner className="text-purple-400 text-5xl animate-spin" />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 opacity-20">🎤</div>
          <p className="text-slate-400 text-xl">Artist not found</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <HeroBanner artist={artist} />
      <div className="space-y-10 p-6 text-white">
        <PopularSongs artistId={artist.id} />
        <AlbumsSection artistId={artist.id} />
        <SingleSongs artistId={artist.id} />
        <FansAlsoListen artistId={artist.id} />
      </div>
      <AppFooter isLightMode={isLightMode} />
    </>
  );
};

export default Artist;
