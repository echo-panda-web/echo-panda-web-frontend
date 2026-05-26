import React from "react";
import { useNavigate } from "react-router-dom";

interface Artist {
  id: string;
  name: string;
  image_url?: string;
}

interface Album {
  id: string | number;
  title: string;
  cover_url?: string;
  type?: string;
  year?: number | string;
  songs?: number | string;
  artists?: Artist[];
}

interface Props {
  album: Album; 
}

export default function AlbumCard({ album }: Props) {
  const navigate = useNavigate();

  const artistNames = album.artists && album.artists.length > 0
    ? album.artists.map(a => a.name).join(', ')
    : 'Various Artists';

  return (
    <div
      onClick={() => navigate(`/album/${album.id}`)}
      className="cursor-pointer group relative h-full flex flex-col bg-zinc-900  p-3 rounded-lg
      "
    >
      <div className="w-full aspect-square bg-zinc-700 rounded-lg flex items-center justify-center mb-4 relative overflow-hidden">
        {album.cover_url ? (
          <img 
            src={album.cover_url} 
            alt={album.title}
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
          {album.songs} songs • {album.year}
        </p>
      </div>
    </div>
  );
}
