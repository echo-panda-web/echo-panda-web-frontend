import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaMusic, FaHeart, FaPlay, FaPlus } from "react-icons/fa";
import { isSongFavorite, toggleFavorite } from "../backend/favoritesService";

interface Artist {
  id: string;
  name: string;
  image_url?: string;
}

interface Album {
  id: string;
  title: string;
  cover_url?: string;
}

interface SongProps {
  id: string;
  index: number;
  title: string;
  artists?: Artist[];
  album?: Album | null;
  duration: number;
  coverUrl?: string | null;
  metadata?: string; // For custom metadata like "Added date", "Play count", etc.
  onPlay?: (id: string) => void;
  onAddToPlaylist?: (id: string) => void;
  onAddToFavorite?: (id: string) => void;
  hideAlbum?: boolean; // Whether to hide the album column
}

const Song: React.FC<SongProps> = ({
  id,
  index,
  title,
  artists = [],
  album,
  duration,
  coverUrl,
  metadata,
  onPlay,
  onAddToPlaylist,
  onAddToFavorite,
  hideAlbum = false,
}) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Check favorite status on mount
  useEffect(() => {
    checkFavoriteStatus();
  }, [id]);

  const checkFavoriteStatus = async () => {
    const isFav = await isSongFavorite(id);
    setIsFavorite(isFav);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleHeartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setContextMenu({
      x: rect.left,
      y: rect.bottom + 5,
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const handleAddToFavorite = async () => {
    const success = await toggleFavorite(id);
    if (success) {
      setIsFavorite(!isFavorite);
      if (onAddToFavorite) {
        onAddToFavorite(id);
      }
    }
    closeContextMenu();
  };

  const handleAddToPlaylist = () => {
    if (onAddToPlaylist) {
      onAddToPlaylist(id);
    }
    closeContextMenu();
  };

  const handleRowClick = () => {
    if (onPlay) {
      onPlay(id);
    }
  };

  const handleArtistClick = (e: React.MouseEvent, artistId: string) => {
    e.stopPropagation(); // Prevent triggering the row click
    navigate(`/artist/${artistId}`);
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(event.target as Node)
      ) {
        closeContextMenu();
      }
    };

    if (contextMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [contextMenu]);

  return (
    <>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={handleRowClick}
        className="group grid grid-cols-12 items-center gap-4 p-3 rounded-lg bg-gray-800/70 hover:bg-gray-700/70 transition-colors cursor-pointer"
      >
        {/* Index / Play Button */}
        <div className="col-span-1 flex justify-center items-center text-sm font-semibold text-gray-200">
          {hovered ? (
            <FaPlay size={16} className="text-gray-100" />
          ) : (
            `#${index}`
          )}
        </div>

        {/* Title & Artist with Cover */}
        <div className={`flex items-center gap-3 min-w-0 ${hideAlbum ? 'col-span-9' : 'col-span-5 md:col-span-4'}`}>
          {coverUrl || album?.cover_url ? (
            <img
              src={coverUrl || album?.cover_url || ""}
              alt={title}
              className="w-12 h-12 rounded-md shrink-0 object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const placeholder = e.currentTarget
                  .nextElementSibling as HTMLElement;
                if (placeholder) placeholder.style.display = "flex";
              }}
            />
          ) : null}
          <div
            className="w-12 h-12 bg-gradient-to-br from-purple-600 via-pink-500 to-blue-500 rounded-md shrink-0 flex items-center justify-center"
            style={{
              display: coverUrl || album?.cover_url ? "none" : "flex",
            }}
          >
            <FaMusic className="text-white text-lg opacity-50" />
          </div>
          <div className="min-w-0">
            <div
              className={`truncate font-semibold ${
                hovered ? "text-gray-100" : "text-gray-200"
              }`}
            >
              {title}
            </div>
            <div className="text-xs text-gray-400 truncate">
              {artists && artists.length > 0
                ? artists.map((artist, idx) => (
                    <React.Fragment key={artist.id}>
                      {idx > 0 && ", "}
                      <span
                        onClick={(e) => handleArtistClick(e, artist.id)}
                        className="hover:underline hover:text-white cursor-pointer transition-colors"
                      >
                        {artist.name}
                      </span>
                    </React.Fragment>
                  ))
                : "Unknown Artist"}
            </div>
          </div>
        </div>

        {/* Album */}
        {!hideAlbum && (
          <div className="hidden md:block md:col-span-3 text-sm text-gray-300 truncate">
            {album?.title || "Single"}
          </div>
        )}

        {/* Metadata (e.g., Added Date, Play Count, etc.) */}
        {!hideAlbum && (
          <div className="hidden md:block md:col-span-2 text-sm text-gray-300">
            {metadata || "-"}
          </div>
        )}

        {/* Heart & Duration */}
        <div className="col-span-2 flex items-center justify-end gap-10 pr-2">
          <button
            onClick={handleHeartClick}
            className="hover:scale-110 transition-transform"
            aria-label={`favorite-${id}`}
            type="button"
          >
            <FaHeart
              size={16}
              className={isFavorite ? "text-red-400" : "text-gray-400"}
            />
          </button>
          <div className="text-sm font-medium text-gray-300 w-12 text-right">
            {formatDuration(duration)}
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{
            position: "fixed",
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
            zIndex: 1000,
          }}
          className="bg-[#282828] text-white rounded-md shadow-2xl min-w-[220px] py-1 border border-gray-700/50 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="py-1">
            <button
              onClick={handleAddToFavorite}
              className="w-full px-3 py-2.5 text-left hover:bg-gray-700/50 transition-colors flex items-center gap-3 text-sm"
            >
              <FaHeart
                size={14}
                className={isFavorite ? "text-red-400" : "text-gray-300"}
              />
              <span>
                {isFavorite
                  ? "Remove from Liked Songs"
                  : "Save to Liked Songs"}
              </span>
            </button>
          </div>

          <div className="border-t border-gray-700/50 py-1">
            <button
              onClick={handleAddToPlaylist}
              className="w-full px-3 py-2.5 text-left hover:bg-gray-700/50 transition-colors flex items-center gap-3 text-sm"
            >
              <FaPlus size={14} className="text-gray-300" />
              <span>Add to Playlist</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Song;
