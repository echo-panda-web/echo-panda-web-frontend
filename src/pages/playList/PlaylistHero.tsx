import React from 'react';
import { Music, Clock, User } from 'lucide-react';

interface Props {
  title: string;
  songCount: number;
  duration: string;
}

export const PlaylistHero: React.FC<Props> = ({ title, songCount, duration }) => {
  return (
    <header className="relative px-4 sm:px-8 pt-20 sm:pt-24 pb-8 bg-linear-to-b from-blue-600/30 via-blue-950/20 to-black overflow-hidden">
      {/* Background blur circle */}
      <div className="absolute top-0 -left-16 sm:-left-20 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Content */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 relative z-10">
        {/* Music icon / Album art */}
        <div className="w-40 sm:w-52 lg:w-60 h-40 sm:h-52 lg:h-60 bg-linear-to-br from-white/10 to-white/5 backdrop-blur-md rounded-xl flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 group">
          <Music className="text-white/20 w-14 h-14 sm:w-20 sm:h-20 lg:w-24 lg:h-24 group-hover:scale-110 transition-transform duration-700" />
        </div>

        {/* Text Info */}
        <div className="flex flex-col gap-2 sm:gap-3 text-center md:text-left">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.15em] text-blue-400">Public Playlist</span>
          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black text-white tracking-tight truncate">{title}</h1>

          {/* Meta info */}
          <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium text-gray-300">
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-500 flex items-center justify-center">
                <User className="text-white w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
              <span className="text-white hover:underline cursor-pointer">User</span>
            </div>
            <span>•</span>
            <span>{songCount} songs</span>
            <span>•</span>
            <div className="flex items-center gap-1 text-gray-400">
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>{duration}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
