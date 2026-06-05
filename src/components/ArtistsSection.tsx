import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getDerivedArtists } from "../backend/catalogService";
import { useDataCache } from "../contexts/DataCacheContext";
import { useTheme } from "../contexts/ThemeContext";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

interface Artist {
  id: string;
  name: string;
  image_url?: string;
}

interface Props {
  title?: string;
  limit?: number;
  layout?: "carousel" | "grid";
  artists?: Artist[];
  viewAllLink?: string;
}

const ArtistSection: React.FC<Props> = ({ title = "Artists", limit = 10, layout = "carousel", artists: propArtists, viewAllLink }) => {
  const navigate = useNavigate();
  const { isLightMode } = useTheme();
  const { getCachedData } = useDataCache();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const titleParts = title.split(" ");
  const mainTitle = titleParts[0];
  const accentTitle = titleParts.slice(1).join(" ");

  useEffect(() => {
    if (propArtists) {
      setArtists(propArtists);
      setLoading(false);
    } else {
      fetchArtists();
    }
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

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const offset = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75;

      scrollContainerRef.current.scrollTo({
        left: scrollLeft + offset,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="w-full py-4">
      {/* Header Layout Container */}
      <div className="flex justify-between items-center mb-6 px-1">
        <div>
          <h2 className={`text-2xl md:text-3xl font-black tracking-tight ${isLightMode ? "text-zinc-900" : "text-white"}`}>
            {mainTitle} <span className="text-pink-500">{accentTitle}</span>
          </h2>
        </div>

        {/* Action Controls Side Wrapper removed */}
      </div>

      {/* Artists Track Container Row */}
      <div
        ref={scrollContainerRef}
        className={`scrollbar-none ${
          layout === "grid"
            ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5"
            : "flex gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-3"
        }`}
        style={{ scrollbarWidth: 'none' }}
      >
        {artists.map((artist) => (
          <div
            key={artist.id}
            className={`shrink-0 ${layout === "carousel" ? "w-[155px] sm:w-[175px] md:w-[195px] snap-start" : "w-full"}`}
          >
            <div
              onClick={() => navigate(`/artist/${artist.id}`)}
              className="cursor-pointer group flex flex-col items-center text-center"
            >
              {/* Profile Image Frame Wrapper */}
              <div className={`w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden mb-4 relative shadow-xl transition-transform duration-500 group-hover:scale-105 ${isLightMode ? 'bg-zinc-200' : 'bg-zinc-800'}`}>
                {artist.image_url ? (
                  <img
                    src={artist.image_url}
                    alt={artist.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-pink-500 flex items-center justify-center">
                    <span className="text-white text-3xl font-black uppercase">{artist.name.charAt(0)}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              <div className="min-w-0 w-full space-y-1">
                  <h3 className={`font-bold text-sm tracking-tight truncate ${
                    isLightMode ? "text-zinc-900" : "text-white"
                  } group-hover:text-pink-500 transition-colors`}>
                    {artist.name}
                  </h3>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${isLightMode ? "text-zinc-500" : "text-zinc-500"}`}>
                    Artist
                  </p>
              </div>
            </div>
          </div>
        ))}


      </div>
    </section>
  );
};

export default ArtistSection;