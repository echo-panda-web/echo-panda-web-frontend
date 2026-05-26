import { useState, useEffect } from "react";
import { getUserPlaylists } from "../../backend/playlistsService";
import { getSongs } from "../../backend/catalogService";
import { useDataCache } from "../../contexts/DataCacheContext";
import AlbumCard from "../../components/AlbumCard";
import { FaSpinner } from "react-icons/fa";

interface Playlist {
  id: string;
  name: string;
  user_id?: string;
  created_at?: string;
}

interface Props {
  artistId: string;
}

export default function PlaylistSection({ artistId }: Props) {
  const { getCachedData } = useDataCache();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchPlaylists();
  }, [artistId]);

  const fetchPlaylists = async () => {
    try {
      const data = await getCachedData(`artist_playlists_${artistId}`, async () => {
        console.log(`🔄 [Artist Playlists] Fetching playlists for artist ${artistId}...`);

        const [playlists, songs] = await Promise.all([getUserPlaylists(), getSongs(400)]);
        const hasArtistSong = songs.some((song) =>
          (song.artists || []).some((artist) => artist.id === artistId || encodeURIComponent(artist.name) === artistId)
        );

        const filtered = hasArtistSong ? playlists : [];

        console.log(`✅ [Artist Playlists] ${filtered.length} playlists found`);
        return filtered;
      });

      setPlaylists(data);
    } catch (error) {
      console.error('Error fetching playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section>
        <h2 className="text-xl font-semibold mb-4">
          Artist's <span className="text-blue-400">Playlists</span>
        </h2>
        <div className="flex justify-center py-8">
          <FaSpinner className="text-purple-400 text-3xl animate-spin" />
        </div>
      </section>
    );
  }

  if (playlists.length === 0) {
    return null; // Don't show section if no playlists
  }

  const displayedPlaylists = showAll ? playlists : playlists.slice(0, 5);

  return (
    <section>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold">
          Artist's{" "}
          <span className="text-xl font-semibold text-blue-400">Playlist</span>
        </h2>
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-sm text-green-400 hover:text-green-300 transition-colors"
        >
          {showAll ? "View Less" : "View More"}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {displayedPlaylists.map((playlist) => (
          <div key={playlist.id} className="w-full">
            <div className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition cursor-pointer">
              <div className="w-full aspect-square bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg mb-3 flex items-center justify-center text-4xl">
                🎵
              </div>
              <h3 className="font-bold text-sm truncate">{playlist.name}</h3>
              <p className="text-xs text-slate-400">Playlist</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
