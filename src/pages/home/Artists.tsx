import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getDerivedArtists } from "../../backend/catalogService";
import { useDataCache } from "../../contexts/DataCacheContext";
import { FaSpinner } from "react-icons/fa";

interface Artist {
  id: string;
  name: string;
  image_url?: string;
}

interface Props {
  title?: string;
  isLightMode?: boolean;
  limit?: number; // how many artists to show
  layout?: "carousel" | "grid"; // display style
  artists?: Artist[]; // optional pre-fetched artists
}

const ArtistSection: React.FC<Props> = ({ title = "Artists", isLightMode = true, limit = 10, layout = "carousel", artists: propArtists }) => {
  const navigate = useNavigate();
  const { getCachedData } = useDataCache();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const bgClass = "bg-transparent";
  const textColor = isLightMode ? "text-gray-900" : "text-white";

  useEffect(() => {
    if (propArtists) {
      setArtists(propArtists);
      setLoading(false);
    } else {
      fetchArtists();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, propArtists]);

  const fetchArtists = async () => {
    try {
      setLoading(true);

      const data = await getCachedData(`artists_limit${limit}`, async () => {
        const artistsData = await getDerivedArtists(Math.max(1, limit));
        return artistsData || [];
      });

      setArtists(data);
    } catch (error) {
      if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('NetworkError'))) {
        return;
      }
      console.error('Error fetching artists:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={`${bgClass} p-4 rounded-lg`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-2xl font-bold ${textColor}`}>{title}</h2>
      </div>

      {layout === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
          {artists.map((artist) => (
            <button
              key={artist.id}
              onClick={() => navigate(`/artist/${artist.id}`)}
              className="group focus:outline-none"
              aria-label={`Open artist ${artist.name}`}
            >
              <div className="mx-auto w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gray-600/60 ring-1 ring-white/10 overflow-hidden transition-transform duration-200 group-hover:scale-105">
                {artist.image_url ? (
                  <img src={artist.image_url} alt={artist.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-600/60" />
                )}
              </div>
              <p className={`mt-3 text-center text-sm sm:text-base font-medium truncate ${textColor}`}>{artist.name}</p>
            </button>
          ))}
        </div>
      ) : (
        <div
          className="flex gap-6 overflow-x-auto scroll-hide pb-3 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {artists.map((artist) => (
            <button
              key={artist.id}
              onClick={() => navigate(`/artist/${artist.id}`)}
              className="flex flex-col items-center shrink-0 w-28 sm:w-32 snap-start cursor-pointer group"
              aria-label={`Open artist ${artist.name}`}
            >
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gray-600/60 ring-1 ring-white/10 overflow-hidden transition-transform duration-200 group-hover:scale-105">
                {artist.image_url ? (
                  <img src={artist.image_url} alt={artist.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-600/60" />
                )}
              </div>
              <p className={`mt-2 text-center text-sm font-medium truncate ${textColor}`}>{artist.name}</p>
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

export default ArtistSection;
