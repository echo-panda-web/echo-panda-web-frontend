import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaEllipsisH, FaSpinner } from "react-icons/fa";
import { useDataCache } from "../../contexts/DataCacheContext";
import { useAudioPlayer } from "../../contexts/AudioPlayerContext";
import { trackSongPlay } from "../../backend/playTrackingService";
import { buildApiUrl } from "../../backend/backendUrls";
import { getSignedAlbumCoverUrl, getSignedSongCoverUrl } from "../../backend/songMediaApi";
import Song from "../../components/Song";

interface Artist {
  id: string;
  name: string;
  image_url?: string;
}

interface AlbumMeta {
  id: string;
  title: string;
  cover_key?: string | null;
  cover_url?: string;
  release_date?: string;
  type?: string;
  artists?: Artist[];
}

interface SongData {
  id: string;
  title: string;
  duration: number;
  album_id: string | null;
  original_key?: string | null;
  audio_url: string | null;
  songCover_url: string | null;
  created_at: string;
  artists?: Artist[];
}

const formatDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const AlbumDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCachedData } = useDataCache();
  const { playSong } = useAudioPlayer();

  const [loading, setLoading] = useState(true);
  const [album, setAlbum] = useState<AlbumMeta | null>(null);
  const [songs, setSongs] = useState<SongData[]>([]);

  useEffect(() => {
    if (id) {
      loadAlbum(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadAlbum = async (albumId: string) => {
    try {
      setLoading(true);

      if (!/^\d+$/.test(albumId)) {
        // Legacy Supabase UUID route id; backend albums use numeric ids.
        setAlbum(null);
        setSongs([]);
        return;
      }

      const data = await getCachedData(`album_details_${albumId}`, async () => {
        const response = await fetch(buildApiUrl(`/albums/${albumId}`), {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch album details");
        }

        const albumData = await response.json();

        const meta: AlbumMeta = {
          id: String(albumData.id),
          title: albumData.title,
          cover_key: albumData.cover_key || null,
          cover_url: (await getSignedAlbumCoverUrl(albumData.id)) || undefined,
          release_date: albumData.release_date || undefined,
          type: albumData.type || undefined,
          artists: albumData.artist
            ? [{ id: String(albumData.id), name: albumData.artist }]
            : [],
        };

        const songsData = Array.isArray(albumData?.songs) ? albumData.songs : [];

        const transformed: SongData[] = await Promise.all((songsData || []).map(async (s: any) => ({
          id: String(s.id),
          title: s.title,
          duration: s.duration,
          album_id: s.album_id ? String(s.album_id) : null,
          original_key: s.original_key || null,
          audio_url: s.original_key || s.audio_url,
          songCover_url: (await getSignedSongCoverUrl(s.id)) || s.songCover_url || meta.cover_url,
          created_at: s.created_at,
          artists: s.artist ? [{ id: String(s.id), name: s.artist }] : [],
        })));

        return { album: meta, songs: transformed };
      });

      setAlbum(data.album);
      setSongs(data.songs);
    } catch (err) {
      if (err instanceof Error && (err.name === 'AbortError' || err.message.includes('NetworkError'))) {
        return;
      }
      console.error("Failed to load album:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaySong = async (songId: string) => {
    const song = songs.find(s => s.id === songId);
    if (!song || !song.audio_url) {
      console.error('Song not found or missing audio URL');
      return;
    }

    const artistNames = song.artists && song.artists.length > 0
      ? song.artists.map(a => a.name).join(", ")
      : "Various Artists";

    playSong({
      id: song.id,
      title: song.title,
      artist: artistNames,
      coverUrl: song.songCover_url || album?.cover_url || '',
      audioUrl: song.original_key || song.audio_url,
      duration: song.duration,
    });

    // Track the play
    await trackSongPlay(song.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <FaSpinner className="animate-spin text-purple-400" size={42} />
      </div>
    );
  }

  if (!album) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
        <p className="text-xl mb-4">Album not found in backend data</p>
        <button onClick={() => navigate(-1)} className="px-6 py-3 bg-purple-600 rounded-lg font-semibold">Go Back</button>
      </div>
    );
  }

  const artistNames = album.artists && album.artists.length > 0
    ? album.artists.map(a => a.name).join(", ")
    : "Various Artists";

  return (
    <div className="min-h-screen bg-black text-gray-200">
      {/* Header */}
      <div className="relative shrink-0 min-h-[380px] flex flex-col justify-end p-10 bg-cover bg-center"
           style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.85)), url('${album.cover_url || ""}')` }}>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="bg-black/40 hover:bg-black/60 p-2 rounded-full text-white transition">
            <FaArrowLeft size={16} />
          </button>
          <button className="bg-black/40 hover:bg-black/60 p-2 rounded-full text-white transition">
            <FaEllipsisH size={16} />
          </button>
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-3">{album.title}</h1>
        <p className="text-gray-300 text-lg">{artistNames}</p>
        <p className="text-gray-400 text-sm mt-1">
          {album.type ? `${album.type} • ` : ""}{formatDate(album.release_date)}
        </p>
      </div>

      {/* Songs list */}
      <div className="p-10">
        <div className="grid grid-cols-12 gap-4 text-xs uppercase tracking-widest text-gray-500 font-bold border-b border-white/5 pb-4">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-9">Title</div>
          <div className="col-span-2 text-right pr-4">Time</div>
        </div>

        <div className="space-y-1 mt-4">
          {songs.map((s, idx) => (
            <Song
              key={s.id}
              id={s.id}
              index={idx + 1}
              title={s.title}
              artists={s.artists}
              album={{ id: album.id, title: album.title, cover_url: album.cover_url }}
              duration={s.duration}
              coverUrl={s.songCover_url}
              metadata={formatDate(s.created_at)}
              hideAlbum={true}
              onPlay={handlePlaySong}
              onAddToPlaylist={() => {/* open playlist modal elsewhere if needed */}}
              onAddToFavorite={() => {/* favorites handled inside Song */}}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AlbumDetails;
