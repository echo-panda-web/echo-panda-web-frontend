import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useTheme } from "../contexts/ThemeContext";
import AlbumCard from "./AlbumCard"; // Or wherever your updated AlbumCard is located

interface Props {
  title: string;
  songs?: any[];
  albums?: any[]; // supporting either property name
  viewAllLink?: string;
  limit?: number;
  offset?: number;
}

export default function SongsSection({ title, songs, albums, viewAllLink }: Props) {
  const { isLightMode } = useTheme();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fallback array selector
  const displayItems = songs || albums || [];

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      // Adjust scroll width factor smoothly
      const offset = direction === "left" ? -clientWidth * 0.75 : clientWidth * 0.75;
      scrollContainerRef.current.scrollTo({
        left: scrollLeft + offset,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Header Area */}
      <div className="flex items-center justify-between px-1">
        {/* Section Heading Title */}
        <h2 className={`text-2xl md:text-3xl font-black tracking-tight ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
          {title.split(" ")[0]} <span className="text-blue-500">{title.split(" ").slice(1).join(" ")}</span>
        </h2>

        {/* Navigation Control Area positioned precisely like image_a86c5b.png */}
        <div className="flex items-center gap-4">
          {/* View All Text Action Link shifted right next to buttons */}
          {viewAllLink && (
            <Link
              to={viewAllLink}
              className={`text-xs font-black uppercase tracking-[0.15em] transition-colors ${
                isLightMode
                  ? "text-gray-500 hover:text-blue-500"
                  : "text-zinc-400 hover:text-blue-400"
              }`}
            >
              View All
            </Link>
          )}

          {/* Carousel Arrow Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                isLightMode
                  ? "bg-gray-200/70 hover:bg-gray-200 text-gray-700"
                  : "bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white"
              } border ${isLightMode ? 'border-gray-300/30' : 'border-white/5'}`}
              aria-label="Scroll left"
            >
              <FaChevronLeft size={11} />
            </button>
            <button
              onClick={() => scroll("right")}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                isLightMode
                  ? "bg-gray-200/70 hover:bg-gray-200 text-gray-700"
                  : "bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white"
              } border ${isLightMode ? 'border-gray-300/30' : 'border-white/5'}`}
              aria-label="Scroll right"
            >
              <FaChevronRight size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* Smooth Horizontal Scrolling Row Track */}
      <div
        ref={scrollContainerRef}
        className="flex w-full gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 scrollbar-none"
        style={{ scrollbarWidth: 'none' }}
      >
        {displayItems.map((item, idx) => (
          <div
            key={item.id || idx}
            className="snap-start shrink-0 w-[160px] sm:w-[185px] md:w-[205px]"
          >
            {/* Renders your pristine custom AlbumCard without internal buttons */}
            <AlbumCard album={item} />
          </div>
        ))}


      </div>
    </div>
  );
}