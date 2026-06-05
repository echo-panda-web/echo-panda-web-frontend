import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { FaPlus } from "react-icons/fa";
import { useTheme } from "../contexts/ThemeContext";
import AlbumCard from "./AlbumCard";

interface Props {
  title: string;
  songs?: any[];
  albums?: any[];
  viewAllLink?: string;
  limit?: number;
  offset?: number;
  onItemClick?: (item: any) => void;
}

export default function SongsSection({ title, songs, albums, viewAllLink, onItemClick }: Props) {
  const { isLightMode } = useTheme();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fallback array selector
  const displayItems = songs || albums || [];

  return (
    <div className="w-full space-y-6">
      {/* Header Area */}
      <div className="flex items-center justify-between px-1">
        <h2 className={`text-2xl md:text-3xl font-black tracking-tight ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
          {title.split(" ")[0]} <span className="text-blue-500">{title.split(" ").slice(1).join(" ")}</span>
        </h2>
      </div>

      {/* Smooth Horizontal Scrolling Row Track */}
      <div
        ref={scrollContainerRef}
        className="flex w-full gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 scrollbar-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {displayItems.map((item, idx) => {
          // Robust normalization for different data types (Songs, Albums, Categories)
          const normalizedItem = {
             ...item,
             title: item.title || item.name,
             cover_url: item.cover_url || item.songCover_url || item.image_url || item.cover_key || item.album?.cover_url,
             artists: item.artists || (item.artist ? [{ name: item.artist }] : undefined),
             album_id: item.album_id || item.album?.id || (item.type === 'album' ? item.id : undefined),
             type: item.type || (item.name && !item.title ? 'category' : (item.songCover_url || item.audio_url ? 'Song' : 'album'))
          };

          return (
            <div
              key={item.id || idx}
              className="snap-start shrink-0 w-[160px] sm:w-[185px] md:w-[210px]"
            >
              <AlbumCard
                album={normalizedItem}
                onClick={onItemClick ? () => onItemClick(normalizedItem) : undefined}
              />
            </div>
          );
        })}

        {/* View All Circle at the end of carousel */}
        {viewAllLink && displayItems.length > 0 && (
           <div className="shrink-0 flex flex-col items-center justify-center gap-3 px-8 snap-start">
             <Link
               to={viewAllLink}
               className={`w-14 h-14 rounded-full border flex items-center justify-center transition-all ${
                 isLightMode
                   ? 'border-zinc-200 text-zinc-400 bg-white hover:border-zinc-900 hover:text-zinc-900'
                   : 'border-zinc-800 text-zinc-500 bg-zinc-900/50 hover:border-white hover:text-white'
               }`}
             >
               <FaPlus size={16} />
             </Link>
             <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${isLightMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
               View all
             </span>
           </div>
        )}
      </div>
    </div>
  );
}
