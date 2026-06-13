import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaEllipsisH, FaChevronLeft, FaPlay, FaPause, FaHeart,
  FaCompactDisc, FaSpinner, FaCheckCircle, FaMusic,
  FaTimes, FaShare, FaPlus, FaRegHeart
} from 'react-icons/fa';
import { getGlobalPlayCountMap, trackSongPlay } from '../backend/playTrackingService';
import { getSimilarRecommendations, trackRecommendationEvent, type AdaptiveRecommendation } from '../backend/recommendationService';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { isSongFavorite, toggleFavorite, getUserFavorites } from '../backend/favoritesService';
import { getSignedSongCoverUrl, getSignedArtistImageUrl, getSignedAlbumCoverUrl } from '../backend/songMediaApi';
import { useTheme } from '../contexts/ThemeContext';
import ShareModal from './ShareModal';
import { addSongToPlaylist, getUserPlaylists, createPlaylist, type Playlist } from '../backend/playlistsService';
import { RiPlayListFill } from "react-icons/ri";

const viteEnv = (import.meta as any).env || {};
const BACKEND_API_BASE_URL = viteEnv.VITE_BACKEND_API_URL || 'http://localhost:8082/api';

interface Artist { id: string; name: string; image_url: string; bio?: string; }
interface Album { id: string; title: string; cover_url: string; release_date: string; }
interface SongData {
  id: string; title: string; duration: number; album_id: string | null;
  audio_url: string | null; songCover_url: string | null; created_at: string;
  lyrics?: string; artists?: Artist[]; album?: Album;
  play_count?: number;
}

interface LyricLine {
  time: number;
  text: string;
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const parseLyrics = (rawLyrics: string): LyricLine[] => {
  if (!rawLyrics) return [];
  const lines = rawLyrics.split(/\r\n|\r|\n/);
  const parsedLines: LyricLine[] = [];
  const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{1,3}))?\]/;

  lines.forEach(line => {
    const match = line.match(timeRegex);
    const text = line.replace(timeRegex, '').trim();
    if (match && text) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const fraction = match[3] ? parseInt(match[3]) : 0;
      const divisor = match[3]
        ? match[3].length === 3
          ? 1000
          : match[3].length === 2
            ? 100
            : 10
        : 1;
      const time = minutes * 60 + seconds + (fraction / divisor);
      parsedLines.push({ time, text });
    } else if (text) {
      parsedLines.push({ time: -1, text });
    }
  });

  return parsedLines.sort((a, b) => a.time - b.time);
};

const SongDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { playSong, currentSong: playingSong, isPlaying, currentTime, closePlayer } = useAudioPlayer();
  const { isLightMode } = useTheme();

  const [currentSong, setCurrentSong] = useState<SongData | null>(null);
  const [albumSongs, setAlbumSongs] = useState<SongData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [similarSongs, setSimilarSongs] = useState<AdaptiveRecommendation[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [favoriteSongIds, setFavoriteSongIds] = useState<Set<string>>(new Set());

  // Share & Playlist States
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPlaylistSelectorOpen, setIsPlaylistSelectorOpen] = useState(false);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  // Sync UI with currently playing song
  useEffect(() => {
    if (playingSong && playingSong.id && String(playingSong.id) !== id) {
      navigate(`/song/${playingSong.id}`, { replace: true });
    }
  }, [playingSong?.id, id, navigate]);

  const [parsedLyrics, setParsedLyrics] = useState<LyricLine[]>([]);
  const [activeLyricIndex, setActiveLyricIndex] = useState(-1);
  const lyricsScrollRef = useRef<HTMLDivElement>(null);

  const getArtistName = (artist: any) => {
    if (!artist) return 'Unknown Artist';
    if (typeof artist === 'string') return artist;
    return artist.stage_name || artist.name || 'Unknown Artist';
  };

  useEffect(() => {
    if (id) {
      fetchSongAndAlbum();
      fetchFavorites();
      fetchSimilarSongs(id);
    }
  }, [id]);

  const fetchFavorites = async () => {
    try {
      const favs = await getUserFavorites();
      setFavoriteSongIds(new Set(favs));
      if (id && favs.includes(id)) {
        setIsLiked(true);
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
    }
  };

  useEffect(() => {
    if (currentSong?.lyrics) {
      setParsedLyrics(parseLyrics(currentSong.lyrics));
    } else {
      setParsedLyrics([]);
    }
  }, [currentSong]);

  useEffect(() => {
    if (playingSong?.id === currentSong?.id && parsedLyrics.length > 0) {
      let index = -1;
      for (let i = 0; i < parsedLyrics.length; i += 1) {
        const line: LyricLine = parsedLyrics[i];
        if (line.time !== -1 && line.time <= currentTime) {
          index = i;
        }
      }
      if (index !== activeLyricIndex) {
        setActiveLyricIndex(index);
      }
    }
  }, [currentTime, parsedLyrics, playingSong, currentSong, activeLyricIndex]);

  useEffect(() => {
    const container = lyricsScrollRef.current;
    if (!container || activeLyricIndex < 0 || parsedLyrics.length === 0) return;
    if (playingSong?.id !== currentSong?.id) return;

    const lineElements = container.children;
    const currentEl = lineElements[activeLyricIndex] as HTMLElement | undefined;
    if (!currentEl) return;

    const containerHeight = container.clientHeight;
    const getScrollTarget = (el: HTMLElement) => {
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      return container.scrollTop + (elRect.top - containerRect.top) - containerHeight / 2 + elRect.height / 2;
    };

    const currentLine = parsedLyrics[activeLyricIndex];
    let targetScroll = getScrollTarget(currentEl);

    const nextIdx = activeLyricIndex + 1;
    const nextLine = parsedLyrics[nextIdx];
    if (nextLine && nextLine.time !== -1 && nextLine.time > currentLine.time) {
      const nextEl = lineElements[nextIdx] as HTMLElement | undefined;
      if (nextEl) {
        const lineDuration = nextLine.time - currentLine.time;
        const progress = lineDuration > 0
          ? Math.min(1, Math.max(0, (currentTime - currentLine.time) / lineDuration))
          : 0;
        const currentScroll = getScrollTarget(currentEl);
        const nextScroll = getScrollTarget(nextEl);
        targetScroll = currentScroll + (nextScroll - currentScroll) * progress;
      }
    }

    container.scrollTop = Math.max(0, targetScroll);
  }, [activeLyricIndex, currentTime, parsedLyrics, playingSong?.id, currentSong?.id]);

  const fetchSimilarSongs = async (songId: string) => {
    try {
      setLoadingSimilar(true);
      // Content-based similar songs — GET /recommendations/similar/{song}
      const [rows, playCountMap] = await Promise.all([
        getSimilarRecommendations(songId, 10),
        getGlobalPlayCountMap(500),
      ]);
      if (rows && rows.length > 0) {
        const signedRows = await Promise.all(
          rows.map(async (item) => {
            try {
               const signedCover = await getSignedSongCoverUrl(item.song.id);
               const songIdKey = String(item.song.id);
               return {
                 ...item,
                 song: {
                   ...item.song,
                   play_count: playCountMap.get(songIdKey) ?? item.song.play_count ?? 0,
                   cover_key: signedCover || item.song.cover_key || item.song.album?.cover_url
                 }
               };
            } catch { return item; }
          })
        );
        setSimilarSongs(signedRows);
      } else { setSimilarSongs([]); }
    } catch (error) {
      console.error('Error fetching similar songs:', error);
      setSimilarSongs([]);
    } finally { setLoadingSimilar(false); }
  };

  const handleToggleLike = async (e: React.MouseEvent, songId?: string) => {
    e.stopPropagation();
    const targetId = songId || id;
    if (targetId) {
      const success = await toggleFavorite(targetId);
      if (success) {
        if (targetId === id) setIsLiked(!isLiked);
        setFavoriteSongIds(prev => {
          const next = new Set(prev);
          if (next.has(targetId)) next.delete(targetId);
          else next.add(targetId);
          return next;
        });
      }
    }
  };

  const handleAddToPlaylist = async () => {
    const token = localStorage.getItem("userToken") || localStorage.getItem("authToken") || localStorage.getItem("token");
    if (!token) {
      alert("Please login to add songs to your playlist");
      navigate("/login");
      return;
    }
    try {
      const data = await getUserPlaylists();
      setPlaylists(data);
      setIsPlaylistSelectorOpen(true);
    } catch (error) { console.error("Error loading playlists:", error); }
  };

  const handleCreateAndAdd = async () => {
    if (!newPlaylistName.trim()) return;
    try {
      const newP = await createPlaylist(newPlaylistName);
      await addSongToPlaylist(newP.id, id!);
      alert(`Created "${newP.name}" and added song!`);
      setIsCreatingPlaylist(false);
      setIsPlaylistSelectorOpen(false);
      setNewPlaylistName("");
    } catch (error) { alert("Failed to create playlist"); }
  };

  const handleSelectPlaylist = async (playlistId: string) => {
    if (!id) return;
    try {
      await addSongToPlaylist(playlistId, id);
      alert("Added to playlist!");
      setIsPlaylistSelectorOpen(false);
    } catch (error: any) {
      if (error.message === "Song already in playlist") {
        alert("Song already in playlist");
        setIsPlaylistSelectorOpen(false);
      } else {
        console.error("Error adding song to playlist:", error);
        alert("Failed to add song to playlist");
      }
    }
  };

  const fetchSongAndAlbum = async () => {
    try {
      setLoading(true);
      const [songRes, playCountMap] = await Promise.all([
        fetch(`${BACKEND_API_BASE_URL}/songs/${id}`, { headers: { Accept: 'application/json' } }),
        getGlobalPlayCountMap(500),
      ]);
      if (!songRes.ok) throw new Error(`Failed to fetch song ${id}`);
      const songData = await songRes.json();
      const resolvePlayCount = (songId: string, apiCount?: number) =>
        playCountMap.get(songId) ?? apiCount ?? 0;

      const artistId = songData.artist_id || songData.artist?.id || null;
      const albumId = songData.album_id || songData.album?.id || null;
      const [signedSongCover, signedArtistImage, signedAlbumCover] = await Promise.all([
        getSignedSongCoverUrl(songData.id),
        artistId ? getSignedArtistImageUrl(artistId) : Promise.resolve(null),
        albumId ? getSignedAlbumCoverUrl(albumId) : Promise.resolve(null),
      ]);

      const resolvedCover =
        signedSongCover ||
        signedAlbumCover ||
        songData.cover_url ||
        songData.album?.cover_url ||
        songData.album?.cover_image ||
        null;

      const transformedSong: SongData = {
        id: String(songData.id),
        title: songData.title,
        duration: songData.duration,
        album_id: songData.album_id,
        audio_url: songData.audio_url || null,
        songCover_url: resolvedCover,
        created_at: songData.created_at,
        lyrics: songData.lyrics || "",
        album: songData.album ? {
          id: String(songData.album.id),
          title: songData.album.title,
          cover_url: signedAlbumCover || songData.album.cover_url || songData.album.cover_image,
          release_date: songData.album.release_date
        } : undefined,
        artists: artistId ? [{
            id: String(artistId),
            name: getArtistName(songData.artist),
            image_url: signedArtistImage || '',
            bio: songData.artist?.bio || ''
        }] : []
      };

        setCurrentSong({
          ...transformedSong,
          play_count: resolvePlayCount(String(songData.id), songData.play_count),
        });

        if (songData.album_id) {
          const albumSongsRes = await fetch(`${BACKEND_API_BASE_URL}/songs?album_id=${songData.album_id}&per_page=200`, { headers: { Accept: 'application/json' } });
          if (albumSongsRes.ok) {
            const albumSongsJson = await albumSongsRes.json();
            const data = Array.isArray(albumSongsJson?.data) ? albumSongsJson.data : [];
            setAlbumSongs(data.map((s: any) => ({
              id: String(s.id),
              title: s.title,
              duration: s.duration,
              album_id: s.album_id,
              audio_url: s.audio_url,
              play_count: resolvePlayCount(String(s.id), s.play_count),
              songCover_url: signedAlbumCover || s.album?.cover_url || s.album?.cover_image,
              album: s.album ? { title: s.album.title } : undefined,
              artists: s.artist ? [{ id: String(s.artist_id), name: getArtistName(s.artist) }] : []
            } as any)));
          }
        }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleClose = () => { navigate(-1); };
  const handleStopAndClose = () => { closePlayer(); navigate(-1); };

  const bumpPlayCount = (songId: string) => {
    const bump = (count?: number) => (count || 0) + 1;

    setCurrentSong((prev) =>
      prev?.id === songId ? { ...prev, play_count: bump(prev.play_count) } : prev
    );
    setAlbumSongs((prev) =>
      prev.map((song) =>
        song.id === songId ? { ...song, play_count: bump(song.play_count) } : song
      )
    );
  };

  const handlePlay = async (songToPlay: any) => {
    const tracked = await trackSongPlay(String(songToPlay.id));
    if (tracked) {
      bumpPlayCount(String(songToPlay.id));
    }
    playSong({
      id: songToPlay.id,
      title: songToPlay.title,
      artist: songToPlay.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
      coverUrl: songToPlay.songCover_url || currentSong?.songCover_url || '',
      audioUrl: songToPlay.audio_url || '',
      duration: songToPlay.duration
    });
  };

  const handlePlaySimilar = async (item: AdaptiveRecommendation) => {
    const song = item.song;
    if (!song?.audio_url) return;
    const tracked = await trackSongPlay(String(song.id));
    if (tracked) {
      setSimilarSongs((prev) =>
        prev.map((row) =>
          String(row.song.id) === String(song.id)
            ? { ...row, song: { ...row.song, play_count: (row.song.play_count || 0) + 1 } }
            : row
        )
      );
    }
    playSong({
       id: String(song.id),
       title: song.title,
       artist: song.artist || 'Unknown Artist',
       coverUrl: song.cover_key || song.album?.cover_url || '',
       audioUrl: song.audio_url,
       duration: song.duration || 0,
    });
    trackRecommendationEvent({
       songId: Number(song.id),
       eventType: 'recommendation_clicked',
       recommendationScore: item.recommendation_score,
       recommendationReason: item.recommendation_reason,
    }).catch(() => undefined); // analytics only
  };

  if (loading) return (
    <div className={`flex items-center justify-center h-full min-h-[400px] ${isLightMode ? "bg-white" : "bg-black"}`}>
      <FaSpinner className="animate-spin text-indigo-500" size={30} />
    </div>
  );

  if (!currentSong) return null;

  const artistName = currentSong.artists?.[0]?.name || 'Unknown Artist';
  const songCoverUrl = currentSong.songCover_url;
  const isCurrentlyPlaying = playingSong?.id === currentSong.id;

  const SongTable = ({ songs, title, isRecommended = false }: { songs: any[], title: string, isRecommended?: boolean }) => (
    <section className={`rounded-[2rem] border ${isLightMode ? "bg-white border-gray-100 shadow-sm" : "bg-white/[0.01] border-white/[0.05]"} p-8`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className={`text-xl font-black ${isLightMode ? "text-gray-900" : "text-white"} uppercase tracking-tight`}>
           {title} <span className="text-indigo-500 ml-1">{isRecommended ? "Songs" : ""}</span>
        </h3>
        {isRecommended && <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recommended</span>}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={`text-[10px] font-bold uppercase tracking-widest ${isLightMode ? "text-gray-400" : "text-slate-500"} border-b ${isLightMode ? "border-gray-50" : "border-white/5"}`}>
              <th className="pb-4 w-10 pl-2">#</th>
              <th className="pb-4">Title</th>
              <th className="pb-4 hidden md:table-cell">Album</th>
              <th className="pb-4 hidden sm:table-cell text-right pr-10">Plays</th>
              <th className="pb-4 w-16 text-right pr-2">Time</th>
            </tr>
          </thead>
          <tbody className="before:block before:h-4">
            {songs.map((song, i) => {
              const actualSong = song.song || song; // Handle recommendation wrapper or direct song
              const sId = String(actualSong.id);
              const isThisPlaying = playingSong?.id === sId;
              const sTitle = actualSong.title;
              const sArtist = actualSong.artist || (actualSong.artists?.[0]?.name) || artistName;
              const sAlbum = actualSong.album?.title || (isRecommended ? "Recommended" : currentSong.album?.title || "Single");
              const sDuration = actualSong.duration;
              const sCover = isRecommended ? actualSong.cover_key || actualSong.album?.cover_url : actualSong.songCover_url || currentSong.songCover_url;

              return (
                <tr
                  key={sId}
                  onClick={() => isRecommended ? handlePlaySimilar(song) : handlePlay(song)}
                  className={`group transition-all cursor-pointer rounded-xl ${isThisPlaying ? (isLightMode ? "bg-indigo-50" : "bg-white/5") : (isLightMode ? "hover:bg-gray-50" : "hover:bg-white/[0.02]")}`}
                >
                  <td className="py-3 pl-2 rounded-l-xl">
                    <div className="w-6 h-6 flex items-center justify-center">
                       {isThisPlaying && isPlaying ? <FaPause size={10} className="text-indigo-500" /> : <span className={`text-xs font-bold ${isThisPlaying ? "text-indigo-500" : (isLightMode ? "text-gray-400" : "text-slate-600")} group-hover:hidden`}>{i + 1}</span>}
                       {!isThisPlaying && <FaPlay size={10} className={`hidden group-hover:block ${isLightMode ? "text-gray-900" : "text-white"}`} />}
                       {isThisPlaying && !isPlaying && <FaPlay size={10} className="text-indigo-500" />}
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-md overflow-hidden bg-white/5 shrink-0 border border-white/5">
                          <img src={sCover || ''} className="w-full h-full object-cover" alt="" />
                       </div>
                       <div className="min-w-0">
                          <p className={`text-sm font-bold truncate ${isThisPlaying ? "text-indigo-500" : (isLightMode ? "text-gray-900" : "text-white")}`}>{sTitle}</p>
                          <p className={`text-[11px] font-medium truncate ${isLightMode ? "text-gray-500" : "text-slate-500"}`}>{sArtist}</p>
                       </div>
                    </div>
                  </td>
                  <td className="py-3 hidden md:table-cell">
                    <span className={`text-xs font-bold uppercase tracking-wider ${isLightMode ? "text-gray-400" : "text-slate-500"}`}>{sAlbum}</span>
                  </td>
                  <td className="py-3 hidden sm:table-cell text-right pr-10">
                    <span className={`text-xs font-bold ${isLightMode ? "text-gray-400" : "text-slate-500"}`}>{actualSong.play_count || 0} plays</span>
                  </td>
                  <td className="py-3 text-right pr-2 rounded-r-xl">
                    <span className={`text-xs font-mono font-bold ${isLightMode ? "text-gray-400" : "text-slate-500"}`}>{formatDuration(sDuration)}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );

  return (
    <div className={`relative w-full min-h-screen ${isLightMode ? "bg-gray-50 text-gray-900" : "bg-[#080808] text-white"} font-sans selection:bg-indigo-500/30 overflow-x-hidden pb-12`}>

      {/* Subtle Background Layer */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-b ${isLightMode ? "from-indigo-50 via-gray-50/95 to-gray-50" : "from-indigo-900/10 via-[#080808]/98 to-[#080808]"} z-10`} />
          {songCoverUrl && (
            <img
              src={songCoverUrl}
              className={`w-full h-[500px] object-cover ${isLightMode ? "opacity-10" : "opacity-15"} blur-[80px] scale-110 select-none`}
              alt=""
            />
          )}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8 space-y-8">

         {/* Refined Navigation */}
         <header className="flex items-center justify-between">
            <button onClick={handleClose} className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${isLightMode ? "text-gray-500 hover:text-black" : "text-slate-400 hover:text-white"} transition-colors group`}>
               <FaChevronLeft className="group-hover:-translate-x-1 transition-transform" /> Back
            </button>

            <button
               onClick={handleStopAndClose}
               className={`flex items-center gap-2 px-4 py-2 rounded-xl ${isLightMode ? "bg-white border-gray-200 text-gray-400 hover:text-rose-500" : "bg-white/5 border-white/5 text-slate-500 hover:text-rose-400"} transition-all border text-[10px] font-bold uppercase tracking-widest`}
            >
               Close Player <FaTimes size={12} />
            </button>
         </header>

         {/* Compact Hero Section */}
         <div className={`flex flex-col md:flex-row gap-8 items-center md:items-center ${isLightMode ? "bg-white border-gray-200" : "bg-white/[0.02] border-white/[0.05]"} p-6 md:p-8 rounded-[2rem] backdrop-blur-xl border`}>

            <div className={`w-40 h-40 md:w-56 md:h-56 rounded-2xl overflow-hidden shadow-2xl shrink-0 border ${isLightMode ? "border-gray-100" : "border-white/10"}`}>
               <img src={songCoverUrl || ''} className="w-full h-full object-cover" alt={currentSong.title} />
            </div>

            <div className="flex-1 flex flex-col justify-center text-center md:text-left space-y-6">
               <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                     <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded">Master</span>
                     <span className={`text-[10px] font-bold ${isLightMode ? "text-gray-400" : "text-slate-500"} uppercase tracking-widest`}>
                        {currentSong.album?.title || 'Single'}
                     </span>
                  </div>
                  <h1 className={`text-3xl md:text-5xl font-black ${isLightMode ? "text-gray-900" : "text-white"} tracking-tight leading-tight uppercase`}>
                     {currentSong.title}
                  </h1>
                  <div className="flex items-center justify-center md:justify-start gap-2 group cursor-pointer" onClick={() => navigate(`/artist/${currentSong.artists?.[0]?.id}`)}>
                     <span className={`text-lg font-bold ${isLightMode ? "text-gray-600 hover:text-indigo-600" : "text-slate-300 hover:text-white"} transition-colors`}>{artistName}</span>
                     <FaCheckCircle className="text-indigo-500" size={14} />
                  </div>
               </div>

               <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <button
                    onClick={() => handlePlay(currentSong)}
                    className={`${isLightMode ? "bg-black text-white" : "bg-white text-black"} hover:bg-indigo-600 hover:text-white px-8 py-3 rounded-full font-bold text-[11px] uppercase tracking-widest shadow-lg transition-all flex items-center gap-2 active:scale-95`}
                  >
                    {isCurrentlyPlaying && isPlaying ? <FaPause size={10} /> : <FaPlay size={10} className="ml-0.5" />}
                    {isCurrentlyPlaying && isPlaying ? 'Pause' : 'Play Now'}
                  </button>

                  <div className="flex items-center gap-2">
                     <button
                        onClick={handleToggleLike}
                        className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${isLiked ? 'bg-rose-500 border-rose-500 text-white shadow-lg' : `${isLightMode ? "border-gray-200 text-gray-400 hover:text-gray-600" : "border-white/10 text-slate-500 hover:text-white"}`}`}
                     >
                        <FaHeart size={16} />
                     </button>
                     <button
                        onClick={handleAddToPlaylist}
                        className={`w-10 h-10 rounded-full border ${isLightMode ? "border-gray-200 text-gray-400 hover:text-gray-600" : "border-white/10 text-slate-500 hover:text-white"} flex items-center justify-center transition-all`}
                     >
                        <FaPlus size={16} />
                     </button>
                     <button
                        onClick={() => setIsShareModalOpen(true)}
                        className={`w-10 h-10 rounded-full border ${isLightMode ? "border-gray-200 text-gray-400 hover:text-gray-600" : "border-white/10 text-slate-500 hover:text-white"} flex items-center justify-center transition-all`}
                     >
                        <FaShare size={16} />
                     </button>
                  </div>
               </div>
            </div>
         </div>

         {/* Layout Grid */}
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Main Content */}
            <div className="lg:col-span-8 space-y-8">

               {/* Lyrics */}
               {currentSong.lyrics && (
                  <section className={`rounded-[2rem] border ${isLightMode ? "bg-white border-gray-100 shadow-sm" : "bg-white/[0.01] border-white/[0.05]"} p-8`}>
                     <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-6">Lyrics</h3>
                     <div
                        ref={lyricsScrollRef}
                        className={`text-sm md:text-lg font-bold leading-[1.6] whitespace-pre-wrap ${isLightMode ? "text-gray-800" : "text-slate-200"} max-h-[450px] overflow-y-auto pr-4 custom-scrollbar`}
                      >
                        {parsedLyrics.length > 0 ? (
                          parsedLyrics.map((line, index) => (
                            <div
                              key={index}
                              className={`py-2 transition-colors duration-300 cursor-default ${
                                index === activeLyricIndex
                                  ? 'text-indigo-500 opacity-100'
                                  : 'opacity-30 hover:opacity-50'
                              }`}
                            >
                              {line.text}
                            </div>
                          ))
                        ) : (
                          currentSong.lyrics.split('\n').map((line, i) => (
                            <div key={i} className="py-1">{line}</div>
                          ))
                        )}
                     </div>
                  </section>
               )}

               {/* Tracklist - Album Content */}
               <SongTable songs={albumSongs} title="Album Content" />

               {/* Discovery Section — GET /recommendations/similar/{song} */}
               <SongTable songs={similarSongs} title="More Like This" isRecommended />
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-4 space-y-6">

               {/* Artist Card */}
               <div className={`rounded-[2rem] border ${isLightMode ? "bg-white border-gray-100" : "bg-white/[0.01] border-white/[0.05]"} p-6 space-y-6`}>
                  <div className="flex items-center gap-4">
                     <div className={`w-12 h-12 rounded-xl overflow-hidden border ${isLightMode ? "border-gray-100" : "border-white/10 shadow-lg"}`}>
                        {currentSong.artists?.[0]?.image_url ? (
                           <img src={currentSong.artists[0].image_url} className="w-full h-full object-cover" alt="" />
                        ) : (
                           <div className="w-full h-full flex items-center justify-center bg-indigo-500/10"><FaMusic className="text-indigo-500/40" /></div>
                        )}
                     </div>
                     <div className="min-w-0">
                        <h4 className={`text-sm font-bold ${isLightMode ? "text-gray-900" : "text-white"} truncate`}>{artistName}</h4>
                        <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mt-0.5">Verified Artist</p>
                     </div>
                  </div>
                  <p className={`text-[12px] leading-relaxed line-clamp-3 ${isLightMode ? "text-gray-500" : "text-slate-400"}`}>
                     {currentSong.artists?.[0]?.bio || `Discover the latest releases and sonic journey of ${artistName}.`}
                  </p>
                  <button onClick={() => navigate(`/artist/${currentSong.artists?.[0]?.id}`)} className={`w-full py-3 rounded-xl ${isLightMode ? "bg-gray-100 text-gray-700 hover:bg-gray-200" : "bg-white/5 text-slate-300 hover:bg-white/10"} text-[10px] font-bold uppercase tracking-widest transition-all`}>
                     Artist Profile
                  </button>
               </div>

               {/* Insights Card */}
               <div className={`rounded-[2rem] border ${isLightMode ? "bg-indigo-50/50 border-indigo-100/50" : "bg-indigo-500/[0.02] border-indigo-500/[0.05]"} p-6 space-y-5`}>
                  <h4 className="text-[10px] font-bold text-indigo-400 tracking-[0.2em] uppercase">Information</h4>

                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold uppercase ${isLightMode ? "text-gray-400" : "text-slate-500"}`}>Quality</span>
                        <span className={`text-[10px] font-black ${isLightMode ? "text-gray-900" : "text-white"}`}>24-BIT FLAC</span>
                     </div>
                     <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold uppercase ${isLightMode ? "text-gray-400" : "text-slate-500"}`}>Year</span>
                        <span className={`text-[10px] font-black ${isLightMode ? "text-gray-900" : "text-white"}`}>{new Date(currentSong.created_at).getFullYear()}</span>
                     </div>
                     <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold uppercase ${isLightMode ? "text-gray-400" : "text-slate-500"}`}>License</span>
                        <span className={`text-[10px] font-black ${isLightMode ? "text-gray-900" : "text-white"}`}>Original</span>
                     </div>
                     <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold uppercase ${isLightMode ? "text-gray-400" : "text-slate-500"}`}>Plays</span>
                        <span className={`text-[10px] font-black ${isLightMode ? "text-gray-900" : "text-white"}`}>
                           {(currentSong.play_count || 0).toLocaleString()}
                        </span>
                     </div>
                  </div>
               </div>
            </aside>
         </div>
      </div>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        type="song"
        id={currentSong.id}
        title={currentSong.title}
        subtitle={artistName}
        imageUrl={songCoverUrl || undefined}
      />

      {/* Playlist Selector */}
      {isPlaylistSelectorOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsPlaylistSelectorOpen(false)} />
          <div className={`relative ${isLightMode ? "bg-white" : "bg-[#121212]"} w-full max-w-sm rounded-3xl overflow-hidden border ${isLightMode ? "border-gray-200" : "border-white/10"} shadow-2xl flex flex-col`}>

            <div className="p-6 pb-4">
               <h2 className={`text-xl font-bold ${isLightMode ? "text-gray-900" : "text-white"} mb-1`}>Add to Playlist</h2>
               <p className={`text-[10px] font-bold uppercase tracking-widest ${isLightMode ? "text-gray-400" : "text-white/30"}`}>Your Collection</p>
            </div>

            <div className="px-3 flex-1 max-h-72 overflow-y-auto custom-scrollbar space-y-1 pb-4">
              <button onClick={() => setIsCreatingPlaylist(true)} className={`w-full py-3 px-3 rounded-xl ${isLightMode ? "bg-indigo-50 text-indigo-600" : "bg-indigo-500/10 text-indigo-400"} flex items-center gap-3 text-left transition-colors`}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-500/20"><FaPlus size={12} /></div>
                <span className="font-bold text-xs">Create New Playlist</span>
              </button>

              <div className="h-px bg-white/5 my-2" />

              {playlists.map((playlist) => (
                <button key={playlist.id} onClick={() => handleSelectPlaylist(playlist.id)} className={`w-full py-2 px-3 rounded-xl hover:${isLightMode ? "bg-gray-50" : "bg-white/5"} flex items-center gap-3 text-left transition-all`}>
                  <div className="w-8 h-8 rounded-lg bg-white/5 overflow-hidden flex items-center justify-center">
                    {playlist.image_url ? <img src={playlist.image_url} className="w-full h-full object-cover" alt="" /> : <RiPlayListFill size={14} className="text-white/20" />}
                  </div>
                  <div className="min-w-0">
                    <p className={`${isLightMode ? "text-gray-900" : "text-white"} font-bold text-xs truncate`}>{playlist.name}</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase">{playlist.song_count} tracks</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="p-3 bg-white/5 border-t border-white/5">
              <button onClick={() => setIsPlaylistSelectorOpen(false)} className={`w-full py-3 text-[10px] font-bold uppercase tracking-widest ${isLightMode ? "text-gray-400 hover:text-gray-800" : "text-slate-500 hover:text-white"} transition-colors`}>Cancel</button>
            </div>

            {isCreatingPlaylist && (
              <div className="absolute inset-0 z-10 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center animate-in slide-in-from-bottom duration-300">
                <h3 className="text-lg font-bold text-white mb-4">New Playlist</h3>
                <input
                  autoFocus
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Playlist name..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none mb-4 font-bold text-sm"
                />
                <div className="flex gap-3 w-full">
                  <button onClick={() => setIsCreatingPlaylist(false)} className="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Cancel</button>
                  <button onClick={handleCreateAndAdd} disabled={!newPlaylistName.trim()} className="flex-1 bg-indigo-500 text-white py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all disabled:opacity-50">Create</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
         .custom-scrollbar::-webkit-scrollbar { width: 4px; }
         .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
         .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
         .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.4); }
      `}</style>
    </div>
  );
};

export default SongDetails;
