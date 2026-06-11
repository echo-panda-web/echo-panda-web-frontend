import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaMusic, FaHeart, FaPlay, FaPlus, FaTrash, FaFlag, FaShare } from "react-icons/fa";
import { isSongFavorite, toggleFavorite } from "../backend/favoritesService";
import {
  getUserPlaylists,
  createPlaylist,
  addSongToPlaylist,
  isSongInPlaylist,
  type Playlist,
} from "../backend/playlistsService";
import ReportModal from "./ReportModal";
import ShareModal from "./ShareModal";
import { useTheme } from "../contexts/ThemeContext";
import { isAuthenticated } from "../routes/authContext";

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
  metadata?: string;
  onPlay?: (id: string) => void;
  onAddToPlaylist?: (id: string) => void; // optional post-add callback
  onAddToFavorite?: (id: string) => void;
  onRemoveFromPlaylist?: (id: string) => void;
  hideAlbum?: boolean;
  showAddToPlaylist?: boolean;
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
  onRemoveFromPlaylist,
  hideAlbum = false,
  showAddToPlaylist = true,
}) => {
  const navigate = useNavigate();
  const { isLightMode } = useTheme();
  const [hovered, setHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const heartButtonRef = useRef<HTMLButtonElement>(null);

  // Playlist state
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isPlaylistSelectorOpen, setIsPlaylistSelectorOpen] = useState(false);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Check favorite status on mount
  useEffect(() => {
    checkFavoriteStatus();
  }, [id]);

  const checkFavoriteStatus = async () => {
    const isFav = await isSongFavorite(id);
    setIsFavorite(isFav);
  };

  const loadPlaylists = async () => {
    try {
      const data = await getUserPlaylists();
      setPlaylists(data);
    } catch (error) {
      console.error("Error loading playlists:", error);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // ── Context menu ──────────────────────────────────────────────────────────

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault(); // Block default browser menu
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleHeartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setContextMenu({ x: rect.left - 8, y: rect.top + rect.height / 2 });
  };

  const closeContextMenu = () => setContextMenu(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(event.target as Node) &&
        !heartButtonRef.current?.contains(event.target as Node)
      ) {
        closeContextMenu();
      }
    };
    if (contextMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [contextMenu]);

  // ── Favorite ──────────────────────────────────────────────────────────────

  const handleAddToFavorite = async () => {
    const success = await toggleFavorite(id);
    if (success) {
      setIsFavorite((prev) => !prev);
      onAddToFavorite?.(id);
    }
    closeContextMenu();
  };

  // ── Playlist selector ─────────────────────────────────────────────────────

  const openPlaylistSelector = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    closeContextMenu();
    await loadPlaylists();
    setIsPlaylistSelectorOpen(true);
  };

  const closePlaylistSelector = () => {
    setIsPlaylistSelectorOpen(false);
  };

  const handleSelectPlaylist = async (playlistId: string) => {
    try {
      await addSongToPlaylist(playlistId, id);
      onAddToPlaylist?.(id);
      closePlaylistSelector();
    } catch (error: any) {
      if (error.message === "Song already in playlist") {
        alert("Song already in playlist");
        closePlaylistSelector();
      } else {
        console.error("Error adding song to playlist:", error);
      }
    }
  };

  // ── Create playlist ───────────────────────────────────────────────────────

  const openCreatePlaylist = () => {
    setIsPlaylistSelectorOpen(false);
    setNewPlaylistName("");
    setIsCreatePlaylistOpen(true);
  };

  const closeCreatePlaylist = () => {
    setIsCreatePlaylistOpen(false);
    setNewPlaylistName("");
  };

  const handleCreatePlaylist = async () => {
    const name = newPlaylistName.trim();
    if (!name) return;
    try {
      const newPlaylist = await createPlaylist(name);
      if (newPlaylist) {
        await addSongToPlaylist(newPlaylist.id, id);
        onAddToPlaylist?.(id);
      }
      closeCreatePlaylist();
    } catch (error) {
      console.error("Error creating playlist:", error);
    }
  };

  // ── Row actions ───────────────────────────────────────────────────────────

  const handleRowClick = () => onPlay?.(id);

  const handleArtistClick = (e: React.MouseEvent, artistId: string) => {
    e.stopPropagation();
    navigate(`/artist/${artistId}`);
  };

  const handleRemoveFromPlaylist = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemoveFromPlaylist?.(id);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Song row ── */}
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={handleRowClick}
        onContextMenu={handleContextMenu}
        className={`group grid grid-cols-12 items-center gap-4 p-3 rounded-xl bg-transparent ${isLightMode ? "hover:bg-gray-100" : "hover:bg-white/5"} transition-all duration-300 cursor-pointer border border-transparent ${isLightMode ? "hover:border-gray-200" : "hover:border-white/5"}`}
      >
        {/* Index / Play */}
        <div className={`col-span-1 flex justify-center items-center text-sm font-semibold ${isLightMode ? "text-gray-500" : "text-gray-200"}`}>
          {hovered ? <FaPlay size={16} className={isLightMode ? "text-gray-900" : "text-gray-100"} /> : `#${index}`}
        </div>

        {/* Title & Artist */}
        <div
          className={`flex items-center gap-3 min-w-0 ${hideAlbum ? "col-span-9" : "col-span-5 md:col-span-4"
            }`}
        >
          {(coverUrl || album?.cover_url) ? (
            <img
              src={coverUrl || album?.cover_url || undefined}
              alt={title}
              className="w-12 h-12 rounded-md shrink-0 object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                if (placeholder) placeholder.style.display = "flex";
              }}
            />
          ) : null}
          <div
            className="w-12 h-12 bg-linear-to-br from-purple-600 via-pink-500 to-blue-500 rounded-md shrink-0 flex items-center justify-center"
            style={{ display: (coverUrl || album?.cover_url) ? "none" : "flex" }}
          >
            <FaMusic className="text-white text-lg opacity-50" />
          </div>
          <div className="min-w-0">
            <div className={`truncate font-semibold ${hovered ? (isLightMode ? "text-gray-900" : "text-gray-100") : (isLightMode ? "text-gray-800" : "text-gray-200")}`}>
              {title}
            </div>
            <div className={`text-xs ${isLightMode ? "text-gray-500" : "text-gray-400"} truncate`}>
              {artists && artists.length > 0
                ? artists.map((artist, idx) => (
                  <React.Fragment key={artist.id}>
                    {idx > 0 && ", "}
                    <span
                      onClick={(e) => handleArtistClick(e, artist.id)}
                      className={`hover:underline ${isLightMode ? "hover:text-black" : "hover:text-white"} cursor-pointer transition-colors`}
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
          <div className={`hidden md:block md:col-span-3 text-sm ${isLightMode ? "text-gray-500" : "text-gray-300"} truncate`}>
            {album?.title || "Single"}
          </div>
        )}

        {/* Metadata */}
        {!hideAlbum && (
          <div className={`hidden md:block md:col-span-2 text-sm ${isLightMode ? "text-gray-500" : "text-gray-300"}`}>
            {metadata || "-"}
          </div>
        )}

        {/* Heart & Duration */}
        <div className="col-span-2 flex items-center justify-end gap-3 pr-2">
          <button
            ref={heartButtonRef}
            onClick={handleHeartClick}
            className="hover:scale-110 transition-transform"
            aria-label={`favorite-${id}`}
            type="button"
          >
            <FaHeart
              size={16}
              className={isFavorite ? "text-red-400" : (isLightMode ? "text-gray-300" : "text-gray-400")}
            />
          </button>
          <div className={`text-sm font-medium ${isLightMode ? "text-gray-500" : "text-gray-300"} w-12 text-right`}>
            {formatDuration(duration)}
          </div>
        </div>
      </div>

      {/* ── Context menu ── */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{
            position: "fixed",
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
            transform: "translate(-100%, -50%)",
            zIndex: 1000,
          }}
          className={`${isLightMode ? "bg-white text-gray-900 border-gray-200" : "bg-[#282828] text-white border-gray-700/50"} rounded-md shadow-2xl min-w-55 py-1 border animate-in fade-in slide-in-from-right-2 duration-150`}
        >
          <div className="py-1">
            <button
              onClick={handleAddToFavorite}
              className={`w-full px-3 py-2.5 text-left ${isLightMode ? "hover:bg-gray-100" : "hover:bg-gray-700/50"} transition-colors flex items-center gap-3 text-sm`}
            >
              <FaHeart
                size={14}
                className={isFavorite ? "text-red-400" : (isLightMode ? "text-gray-400" : "text-gray-300")}
              />
              <span>{isFavorite ? "Remove from Liked Songs" : "Save to Liked Songs"}</span>
            </button>
          </div>

          {showAddToPlaylist && (
            <div className={`border-t ${isLightMode ? "border-gray-100" : "border-gray-700/50"} py-1`}>
              <button
                onClick={openPlaylistSelector}
                className={`w-full px-3 py-2.5 text-left ${isLightMode ? "hover:bg-gray-100" : "hover:bg-gray-700/50"} transition-colors flex items-center gap-3 text-sm`}
              >
                <FaPlus size={14} className={isLightMode ? "text-gray-400" : "text-gray-300"} />
                <span>Add to Playlist</span>
              </button>
            </div>
          )}

          {onRemoveFromPlaylist && (
            <div className={`border-t ${isLightMode ? "border-gray-100" : "border-gray-700/50"} py-1`}>
              <button
                onClick={(e) => {
                  closeContextMenu();
                  handleRemoveFromPlaylist(e);
                }}
                className={`w-full px-3 py-2.5 text-left ${isLightMode ? "hover:bg-gray-100" : "hover:bg-gray-700/50"} transition-colors flex items-center gap-3 text-sm`}
              >
                <FaTrash size={14} className="text-red-400" />
                <span className="text-red-400">Remove from Playlist</span>
              </button>
            </div>
          )}

          <div className={`border-t ${isLightMode ? "border-gray-100" : "border-gray-700/50"} py-1`}>
            <button
              onClick={() => {
                closeContextMenu();
                setIsShareModalOpen(true);
              }}
              className={`w-full px-3 py-2.5 text-left ${isLightMode ? "hover:bg-gray-100" : "hover:bg-gray-700/50"} transition-colors flex items-center gap-3 text-sm`}
            >
              <FaShare size={14} className={isLightMode ? "text-gray-400" : "text-zinc-400"} />
              <span>Share Song</span>
            </button>
          </div>

          <div className={`border-t ${isLightMode ? "border-gray-100" : "border-gray-700/50"} py-1`}>
            <button
              onClick={() => {
                closeContextMenu();
                if (!isAuthenticated()) {
                  navigate("/login");
                  return;
                }
                setIsReportModalOpen(true);
              }}
              className={`w-full px-3 py-2.5 text-left ${isLightMode ? "hover:bg-gray-100" : "hover:bg-gray-700/50"} transition-colors flex items-center gap-3 text-sm`}
            >
              <FaFlag size={14} className={isLightMode ? "text-gray-400" : "text-slate-400"} />
              <span>Report Song</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Report Modal ── */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        id={id}
        title={title}
      />

      {/* ── Share Modal ── */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        type="song"
        id={id}
        title={title}
        subtitle={artists.map(a => a.name).join(", ")}
        imageUrl={coverUrl || album?.cover_url || undefined}
      />

      {/* ── Playlist selector modal ── */}
      {showAddToPlaylist && isPlaylistSelectorOpen && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center p-6 animate-in fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
            onClick={closePlaylistSelector}
          />
          <div className={`relative ${isLightMode ? "bg-white" : "bg-[#181818]"} w-full max-w-md rounded-3xl p-8 border ${isLightMode ? "border-gray-200" : "border-white/10"} shadow-2xl`}>
            <h2 className={`text-2xl font-black ${isLightMode ? "text-gray-900" : "text-white"} mb-6`}>Add to Playlist</h2>

            <button
              onClick={openCreatePlaylist}
              className={`w-full mb-4 py-3 px-4 rounded-xl ${isLightMode ? "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100" : "bg-white/5 border-white/10 text-white hover:bg-white/10"} border border-dashed hover:border-blue-500/50 transition-all flex items-center gap-3 font-semibold`}
            >
              <FaPlus size={16} />
              <span>Create New Playlist</span>
            </button>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {playlists.length === 0 ? (
                <p className={`${isLightMode ? "text-gray-400" : "text-gray-400"} text-center py-8`}>No playlists yet</p>
              ) : (
                playlists.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => handleSelectPlaylist(playlist.id)}
                    className={`w-full py-3 px-4 rounded-xl ${isLightMode ? "bg-gray-50 hover:bg-gray-100" : "bg-white/5 hover:bg-white/10"} transition-all flex items-center gap-3 text-left group`}
                  >
                    <div className={`w-12 h-12 rounded-lg ${isLightMode ? "bg-gray-200" : "bg-neutral-900"} flex items-center justify-center shrink-0`}>
                      <FaMusic
                        size={20}
                        className={`${isLightMode ? "text-gray-400" : "text-neutral-700"} group-hover:text-blue-500/50 transition`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`${isLightMode ? "text-gray-900" : "text-white"} font-semibold truncate`}>{playlist.name}</p>
                      <p className={`${isLightMode ? "text-gray-500" : "text-gray-400"} text-sm`}>{playlist.song_count} songs</p>
                    </div>
                  </button>
                ))
              )}
            </div>

            <button
              onClick={closePlaylistSelector}
              className={`mt-6 w-full ${isLightMode ? "text-gray-500 hover:text-gray-900" : "text-gray-400 hover:text-white"} font-bold transition`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Create playlist modal ── */}
      {showAddToPlaylist && isCreatePlaylistOpen && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center p-6 animate-in fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
            onClick={closeCreatePlaylist}
          />
          <div className={`relative ${isLightMode ? "bg-white" : "bg-[#181818]"} w-full max-w-sm rounded-3xl p-8 border ${isLightMode ? "border-gray-200" : "border-white/10"} shadow-2xl`}>
            <h2 className={`text-2xl font-black ${isLightMode ? "text-gray-900" : "text-white"} mb-6`}>New Playlist</h2>
            <input
              autoFocus
              type="text"
              placeholder="Playlist name"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className={`w-full ${isLightMode ? "bg-gray-50 border-gray-200 text-gray-900" : "bg-white/5 border-white/10 text-white"} border rounded-xl px-4 py-4 mb-6 outline-none focus:border-blue-500 transition-all`}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreatePlaylist();
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={closeCreatePlaylist}
                className={`flex-1 py-3 ${isLightMode ? "text-gray-500 hover:text-gray-900" : "text-gray-400 hover:text-white"} font-bold transition`}
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePlaylist}
                disabled={!newPlaylistName.trim()}
                className="flex-1 py-3 rounded-full font-bold bg-blue-500 text-white hover:bg-blue-400 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Song;
