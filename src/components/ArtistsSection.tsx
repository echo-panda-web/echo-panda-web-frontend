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

        {/* Action Controls Side Wrapper */}
        <div className="flex items-center gap-4">
          {viewAllLink && (
            <Link
              to={viewAllLink}
              className={`text-[11px] font-bold uppercase tracking-[0.2em] transition-colors ${
                isLightMode ? "text-zinc-500 hover:text-pink-500" : "text-zinc-400 hover:text-pink-400"
              }`}
            >
              View All
            </Link>
          )}

          {layout === "carousel" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => scroll('left')}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isLightMode
                    ? "bg-zinc-200 hover:bg-zinc-300 text-zinc-700"
                    : "bg-[#181818] hover:bg-[#282828] text-zinc-400 hover:text-white"
                }`}
                aria-label="Scroll left"
              >
                <FaChevronLeft size={10} />
              </button>
              <button
                onClick={() => scroll('right')}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isLightMode
                    ? "bg-zinc-200 hover:bg-zinc-300 text-zinc-700"
                    : "bg-[#181818] hover:bg-[#282828] text-zinc-400 hover:text-white"
                }`}
                aria-label="Scroll right"
              >
                <FaChevronRight size={10} />
              </button>
            </div>
          )}
        </div>
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
              className={`cursor-pointer group relative h-full flex flex-col p-4 rounded-xl transition-colors duration-300 ${
                isLightMode ? "bg-zinc-100 hover:bg-zinc-200/70" : "bg-[#181818] hover:bg-[#282828]"
              }`}
            >
              {/* Profile Image Frame Wrapper */}
              <div className="w-full aspect-square bg-zinc-800 rounded-lg overflow-hidden mb-4 relative shadow-md">
                {artist.image_url ? (
                  <img
                    src={artist.image_url}
                    alt={artist.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-800/80 flex items-center justify-center">
                    <span className="text-zinc-500 text-3xl font-black uppercase">{artist.name.charAt(0)}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* Title & Role Descriptor Box */}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div className="space-y-1">
                  <h3 className={`font-bold text-sm tracking-tight truncate ${
                    isLightMode ? "text-zinc-900" : "text-white"
                  }`}>
                    {artist.name}
                  </h3>
                  <p className={`text-xs ${isLightMode ? "text-zinc-500" : "text-zinc-400"}`}>
                    Artist
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}


      </div>
    </section>
  );
};

export default ArtistSection;