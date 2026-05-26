import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getDerivedArtists } from "../backend/catalogService";
import { useDataCache } from "../contexts/DataCacheContext";
import AppFooter from "./home/AppFooter";
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

const ArtistsList: React.FC = () => {
  const { getCachedData } = useDataCache();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const isLightMode = false;

  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    try {
      setLoading(true);

      const data = await getCachedData('all_artists', async () => {
        const startTime = performance.now();
        console.log("🔄 [ArtistsList] Fetching all artists...");

        const artistsData = await getDerivedArtists(500);

        const fetchTime = performance.now() - startTime;
        console.log(
          `✅ [ArtistsList] Artists fetched in ${fetchTime.toFixed(0)}ms. Count: ${artistsData?.length || 0}`
        );

        return artistsData || [];
      });

      setArtists(data);
    } catch (error) {
      if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('NetworkError'))) {
        return;
      }
      console.error("Error fetching artists:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredArtists = artists.filter((artist) =>
    artist.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <FaSpinner className="text-purple-400 text-5xl animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      {/* Header Section */}
      <div className="relative overflow-hidden pt-12 pb-8">
        <div className="absolute inset-0 opacity-20 blur-3xl" style={{
          background: "linear-gradient(135deg, rgba(168,85,247,0.4), rgba(236,72,153,0.4))",
        }}></div>
        
        <div className="relative z-10 p-8 max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-6xl font-black text-white mb-3">
              Popular <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400">artists</span>
            </h1>
            <div className="h-1 w-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
            <p className="text-slate-400 text-lg mt-4">Discover your favorite musicians</p>
          </div>

        </div>
      </div>

      {/* Artists Grid */}
      <div className="p-8 max-w-7xl mx-auto">
        {filteredArtists.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {filteredArtists.map((artist) => (
              <div
                key={artist.id}
                onClick={() => navigate(`/artist/${artist.id}`)}
                className="group cursor-pointer text-center"
              >
                {/* Circular Image */}
                <div className="relative mb-4 aspect-square rounded-full overflow-hidden border-2 border-purple-500/30 group-hover:border-purple-400 transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.5)]">
                  <img
                    src={
                      artist.image_url ||
                      "https://images.unsplash.com/photo-1511192336575-5a79af67a629"
                    }
                    alt={artist.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>

                {/* Artist Info */}
                <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors truncate">
                  {artist.name}
                </h3>
                <p className="text-slate-400 text-sm">Artist</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 opacity-20">🎤</div>
            <p className="text-slate-400 text-xl">
              {searchQuery ? "No artists found" : "No artists available"}
            </p>
          </div>
        )}
      </div>

      <AppFooter isLightMode={isLightMode} />
    </div>
  );
};

export default ArtistsList;
