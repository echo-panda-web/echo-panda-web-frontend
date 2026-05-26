import { FaCheckCircle } from "react-icons/fa";

interface Artist {
  id: string;
  name: string;
  image_url?: string;
  bio?: string;
  gender?: string;
  role?: string;
}

interface Props {
  artist: Artist;
  onRefresh?: () => void;
  loading?: boolean;
}

export default function HeroBanner({ artist, onRefresh, loading }: Props) {
  return (
    <div className="relative w-full bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6">
      {/* Background blur effect */}
      <div
        className="absolute inset-0 opacity-30 blur-3xl"
        style={{
          background: "linear-gradient(135deg, rgba(168,85,247,0.3), rgba(236,72,153,0.3))",
          zIndex: 0,
        }}
      ></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-8 max-w-6xl mx-auto">
        {/* Artist Image - Circular */}
        <div className="flex-shrink-0">
          <div className="relative w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-purple-500/50 shadow-2xl shadow-purple-500/50">
            <img
              src={artist.image_url || "https://images.unsplash.com/photo-1511192336575-5a79af67a629"}
              alt={artist.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Artist Info */}
        <div className="flex-grow text-center md:text-left">
          {/* Verified Badge */}
          <div className="flex items-center gap-2 justify-center md:justify-start mb-3">
            <FaCheckCircle className="text-blue-400 text-sm" />
            <span className="text-white text-sm font-semibold">Verified Artist</span>
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={loading}
                className="ml-2 p-1.5 hover:opacity-70 disabled:opacity-40 transition-opacity text-white"
                aria-label="Refresh artist"
              >
                <svg className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
          </div>

          {/* Artist Name */}
          <h1 className="text-5xl md:text-7xl font-black text-white mb-4 drop-shadow-lg">
            {artist.name}
          </h1>

          {/* Monthly Listeners - Placeholder */}
          <p className="text-white/70 text-lg font-medium">
            Discover amazing music from {artist.name}
          </p>
        </div>
      </div>
    </div>
  );
}