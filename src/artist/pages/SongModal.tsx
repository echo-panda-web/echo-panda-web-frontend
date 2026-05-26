import React, { useState, useEffect } from "react";
import {
  FaTimes, FaMusic, FaClock, FaMicrophone, 
  FaCompactDisc, FaSpinner, FaUpload, FaImage
} from "react-icons/fa";
import { createSong, updateSong } from "../../backend/adminApi";
import { deleteArtistMedia, uploadArtistMedia } from "../artistStudioApi";

interface Artist {
  id: string;
  name: string;
  image_url: string;
}

interface Album {
  id: string;
  title: string;
  cover_url: string;
}

interface Song {
  id: string;
  title: string;
  duration: number;
  album_id: string | null;
  track_number?: number;
  audio_url: string;
  songCover_url: string;
  original_key?: string | null;
  cover_key?: string | null;
  created_at: string;
  updated_at: string;
  artists?: Artist[];
  album?: Album;
}

interface SongModalProps {
  show: boolean;
  editingSong: Song | null;
  allArtists: Artist[];
  allAlbums: Album[];
  onClose: () => void;
  onSave: () => void;
}

export default function SongModal({
  show,
  editingSong,
  allArtists,
  allAlbums,
  onClose,
  onSave
}: SongModalProps) {
  const [formData, setFormData] = useState<Partial<Song>>({
    title: "",
    duration: 0,
    album_id: null,
    audio_url: "",
    songCover_url: ""
  });

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");

  const [selectedArtistIds, setSelectedArtistIds] = useState<string[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState({ audio: 0 });
  const [uploading, setUploading] = useState(false);

  // Reset form when modal opens/closes or editingSong changes
  useEffect(() => {
    if (editingSong) {
      setFormData({
        title: editingSong.title,
        duration: editingSong.duration,
        album_id: editingSong.album_id,
        audio_url: editingSong.audio_url,
        songCover_url: editingSong.songCover_url
      });
      setSelectedArtistIds(editingSong.artists?.map(a => a.id) || []);
    } else {
      setFormData({
        title: "",
        duration: 0,
        album_id: null,
        audio_url: "",
        songCover_url: ""
      });
      setSelectedArtistIds([]);
    }
    setAudioFile(null);
    setUploadProgress({ audio: 0 });
    setCoverFile(null);
    setCoverPreview("");
  }, [editingSong, show]);

  // Format duration from seconds to mm:ss
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Parse duration from mm:ss to seconds
  const parseDuration = (duration: string): number => {
    const [mins, secs] = duration.split(':').map(Number);
    return (mins || 0) * 60 + (secs || 0);
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/flac', 'audio/aac'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.mp3')) {
      alert('Please upload a valid audio file (MP3, WAV, FLAC, or AAC)');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert('Audio file must be less than 50MB');
      return;
    }

    setAudioFile(file);
    // if title and album already present, auto-upload and create
    (async () => {
      if ((formData.title || editingSong?.title) && (formData.album_id || editingSong?.album_id)) {
        try {
          setUploading(true);
          const audioResult = await uploadArtistMedia({ file, purpose: 'song_audio' });
          const audioKey = audioResult.key;

          // If a cover file is selected, upload it too and include its URL
          let coverKey: string | undefined = undefined;
          if (coverFile) {
            try {
              const coverResult = await uploadArtistMedia({ file: coverFile, purpose: 'album_cover' });
              coverKey = coverResult.key;
            } catch (err) {
              console.warn('Failed to upload song cover during auto-create:', err);
            }
          }

          // if editing, update; otherwise create
          if (editingSong) {
            await updateSong(editingSong.id, {
              title: formData.title || editingSong.title,
              duration: formData.duration || editingSong.duration || 1,
              album_id: String(formData.album_id || editingSong.album_id || ''),
              artist: allArtists.find((artist) => selectedArtistIds.includes(artist.id))?.name || 'Unknown Artist',
              track_number: editingSong.track_number || 1,
              original_key: audioKey,
              cover_key: coverKey || editingSong.cover_key || undefined,
            });
          } else {
            await createSong({
              title: formData.title || file.name,
              duration: formData.duration || 180,
              album_id: String(formData.album_id || ''),
              artist: allArtists.find((artist) => selectedArtistIds.includes(artist.id))?.name || 'Unknown Artist',
              track_number: 1,
              original_key: audioKey || null,
              cover_key: coverKey || undefined,
            });
          }
          onSave();
          onClose();
        } catch (err) {
          console.error('Auto upload/create failed', err);
        } finally {
          setUploading(false);
        }
      }
    })();
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return alert('Please upload an image');
    if (file.size > 5 * 1024 * 1024) return alert('Cover must be <= 5MB');
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!formData.title) {
      alert('Please enter a song title');
      return;
    }

    if (!editingSong && !audioFile) {
      alert('Please upload an audio file');
      return;
    }

    if (!formData.album_id) {
      alert('Please select an album');
      return;
    }

    try {
      setUploading(true);
      // Upload audio file if new file selected
      let audioKey: string | undefined = undefined;
      // coverUrl may be set if a coverFile is uploaded
      let coverKey: string | undefined = undefined;

      if (audioFile) {
        setUploadProgress({ audio: 0 });
        const audioResult = await uploadArtistMedia({ file: audioFile, purpose: 'song_audio' });
        audioKey = audioResult.key;
        setUploadProgress({ audio: 100 });
        
        // Upload cover if present
        let coverKey: string | undefined = undefined;
        if (coverFile) {
          try {
            const coverResult = await uploadArtistMedia({ file: coverFile, purpose: 'album_cover' });
            coverKey = coverResult.key;
          } catch (err) {
            console.warn('Failed to upload cover image:', err);
          }
        }

        // Delete old audio if updating
        if (editingSong?.audio_url) {
          try {
            await deleteArtistMedia({ url: editingSong.audio_url });
          } catch (err) {
            console.warn('Failed to delete old audio:', err);
          }
        }
      }
      if (editingSong) {
        await updateSong(editingSong.id, {
          title: formData.title || '',
          duration: formData.duration || 1,
          album_id: String(formData.album_id || ''),
          artist: allArtists.find((artist) => selectedArtistIds.includes(artist.id))?.name || 'Unknown Artist',
          track_number: editingSong.track_number || 1,
          original_key: audioKey,
          cover_key: coverKey || editingSong?.cover_key || undefined,
        });

        console.log('✅ Song updated successfully');
      } else {
        await createSong({
          title: formData.title || '',
          duration: formData.duration || 1,
          album_id: String(formData.album_id || ''),
          artist: allArtists.find((artist) => selectedArtistIds.includes(artist.id))?.name || 'Unknown Artist',
          track_number: 1,
          original_key: audioKey || null,
          cover_key: coverKey || undefined,
        });

        console.log('✅ Song inserted successfully');
      }

      onSave();
      onClose();
    } catch (error: any) {
      console.error('❌ Error saving song:', error);
      const errorMessage = error?.message || 'Unknown error';
      const errorDetails = error?.details || '';
      alert(`Failed to save song: ${errorMessage}${errorDetails ? '\n' + errorDetails : ''}`);
    } finally {
      setUploading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-white/10 w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-bold text-white">{editingSong ? 'Update Track' : 'Add New Track'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><FaTimes size={24}/></button>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Song Title</label>
            <input 
              required
              value={formData.title || ''} 
              onChange={(e) => setFormData({...formData, title: e.target.value})} 
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-purple-500 text-white" 
              placeholder="e.g. Midnight Dreams" 
            />
          </div>

          {/* Song Cover Upload */}
          {/* Audio File Upload */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Song Cover Image</label>
            <label className="block cursor-pointer">
              <div className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-8 hover:bg-white/10 transition-all flex items-center justify-center flex-col gap-2">
                <FaImage className="text-purple-300 text-2xl" />
                <div className="text-slate-300">Choose cover image (JPG, PNG, WEBP - Max 5MB)</div>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
            </label>
            {coverPreview && <img src={coverPreview} alt="cover" className="mt-3 h-24 w-24 rounded-lg object-cover border border-white/10" />}

            <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex items-center gap-2 mt-4">
              <FaMusic /> Audio File {!editingSong && <span className="text-red-400">*</span>}
            </label>
            <label className="cursor-pointer block">
              <div className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 hover:bg-white/10 transition-all flex items-center gap-3">
                <FaUpload className="text-pink-400" />
                <span className="text-slate-300">
                  {audioFile ? audioFile.name : formData.audio_url ? 'Audio uploaded ✓' : 'Choose audio file (MP3, WAV, FLAC - Max 50MB)'}
                </span>
              </div>
              <input 
                type="file"
                accept="audio/mpeg,audio/mp3,audio/wav,audio/flac,audio/aac"
                onChange={handleAudioChange}
                className="hidden"
                required={!editingSong}
              />
            </label>
            {uploadProgress.audio > 0 && uploadProgress.audio < 100 && (
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div 
                  className="bg-pink-500 h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress.audio}%` }}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex items-center gap-2">
                <FaClock /> Duration (MM:SS)
              </label>
              <input 
                value={formatDuration(formData.duration || 0)} 
                onChange={(e) => setFormData({...formData, duration: parseDuration(e.target.value)})} 
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-purple-500 text-white" 
                placeholder="3:45" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex items-center gap-2">
                <FaCompactDisc /> Album
              </label>
              <select 
                value={formData.album_id || ''} 
                onChange={(e) => setFormData({...formData, album_id: e.target.value || null})} 
                className="w-full bg-slate-800 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-purple-500 text-white"
              >
                <option value="">No Album</option>
                {allAlbums.map(album => (
                  <option key={album.id} value={album.id}>{album.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Artists Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex items-center gap-2">
              <FaMicrophone /> Select Artists
            </label>
            <div className="bg-slate-800 border border-white/10 rounded-xl p-3 max-h-40 overflow-y-auto">
              {allArtists.length === 0 ? (
                <p className="text-slate-500 text-sm">No artists available</p>
              ) : (
                <div className="space-y-2">
                  {allArtists.map(artist => (
                    <label key={artist.id} className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded-lg">
                      <input 
                        type="checkbox"
                        checked={selectedArtistIds.includes(artist.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedArtistIds([...selectedArtistIds, artist.id]);
                          } else {
                            setSelectedArtistIds(selectedArtistIds.filter(id => id !== artist.id));
                          }
                        }}
                        className="w-4 h-4 accent-purple-500"
                      />
                      <img 
                        src={artist.image_url || `https://ui-avatars.com/api/?name=${artist.name}&background=random`}
                        className="w-6 h-6 rounded-full object-cover"
                        alt=""
                      />
                      <span className="text-sm text-white">{artist.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 flex gap-4">
          <button 
            onClick={onClose} 
            disabled={uploading}
            className="flex-1 px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={uploading}
            className="flex-1 px-6 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 font-bold hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <FaSpinner className="animate-spin" />
                Uploading...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
