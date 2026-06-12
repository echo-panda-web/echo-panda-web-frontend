import React from "react";
import { useNavigate } from "react-router-dom";

interface Artist {
  id: string;
  name: string;
  image_url?: string;
}

interface Album {
  id: string | number;
  album_id?: string | number | null;
  title?: string;
  name?: string;
  cover_url?: string;
  songCover_url?: string;
  image_url?: string;
  cover_key?: string | null;
  type?: string;
  year?: number | string;
  songs?: number | string;
  songs_count?: number;
  release_date?: string;
  scheduled_at?: string;
  created_at?: string;
  artists?: Artist[];
}

const resolveSongCount = (album: Album): number => {
  const type = String(album.type || "").toLowerCase();
  if (type === "song") return 1;
  if (typeof album.songs === "number") return album.songs;
  if (Array.isArray(album.songs)) return album.songs.length;
  return album.songs_count ?? 0;
};

const resolveReleaseYear = (album: Album): number | string => {
  // Validate album.year is actually a number or string, not an object
  if (album.year != null && album.year !== "" && typeof album.year !== "object") {
    return album.year;
  }

  const dateSource = album.release_date || album.scheduled_at || album.created_at;
  if (dateSource && typeof dateSource === "string") {
    const year = new Date(dateSource).getFullYear();
    if (!Number.isNaN(year)) return year;
  }

  return "Unknown";
};

interface Props {
  album: Album;
  onClick?: () => void;
}

export default function AlbumCard({ album, onClick }: Props) {
  const navigate = useNavigate();

  const handleDefaultNavigation = () => {
    const type = String(album.type || '').toLowerCase();

    if (type === 'song') {
      navigate(`/song/${album.id}`);
      return;
    }

    if (type === 'category' || type === 'genre') {
      navigate(`/category/${album.id}`);
      return;
    }

    navigate(`/album/${album.id}`);
  };

  const type = String(album.type || '').toLowerCase();
  const formatArtistName = (name: any): string => {
    if (name == null) return '';
    if (typeof name === 'string') return name.trim();
    if (typeof name === 'object') {
      if (typeof name.stage_name === 'string' && name.stage_name.trim()) return name.stage_name.trim();
      if (typeof name.name === 'string' && name.name.trim()) return name.name.trim();
      if (typeof name.name === 'object') return formatArtistName(name.name);
      if (typeof name.stage_name === 'object') return formatArtistName(name.stage_name);
      return '';
    }
    return String(name);
  };

  const artistNames =
    album.artists && album.artists.length > 0
      ? album.artists
          .map((a) => formatArtistName(a?.name))
          .filter(Boolean)
          .join(', ')
      : type === 'song'
        ? 'Unknown Artist'
        : 'Various Artists';

  const songCount = resolveSongCount(album);
  const releaseYear = resolveReleaseYear(album);
  const songFooter = type === 'song' ? 'Song' : `${String(songCount).trim() || 0} songs • ${String(releaseYear).trim() || 'Unknown'}`;

  return (
    <div
      onClick={() => (onClick ? onClick() : handleDefaultNavigation())}
      className="cursor-pointer group relative h-full flex flex-col bg-zinc-900 p-3 rounded-lg"
    >
      <div className="w-full aspect-square bg-zinc-700 rounded-lg flex items-center justify-center mb-4 relative overflow-hidden">
        {album.cover_url ? (
          <img
            crossOrigin="anonymous"
            src={album.cover_url}
            alt={album.title}
            loading="lazy"
            decoding="async"
            draggable={false}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
            className="w-full h-full object-cover"
          />
        ) : (
          <svg
            className="w-10 h-10 text-zinc-600"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
        )}

        <button
          className="absolute bottom-3 right-3 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-lg transition-all duration-300 transform bg-green-500 hover:bg-green-600 shadow-green-500/25 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 hover:scale-105 active:scale-95"
          aria-label={`Play album ${album.title}`}
        >
          <svg
            className="w-5 h-5 ml-0.5"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>

        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold line-clamp-2 min-h-10 leading-tight">
            {album.title}
          </h3>

          <p className="text-sm text-zinc-400 line-clamp-1 mb-1">
            {artistNames}
          </p>
        </div>

        <p className="text-xs text-zinc-400 mt-auto">
          {songFooter}
        </p>
      </div>
    </div>
  );
}