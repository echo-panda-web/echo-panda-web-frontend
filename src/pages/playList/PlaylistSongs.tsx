import React, { useState } from 'react';
import { FaPlay, FaPause, FaHeart, FaTrash, FaCheck, FaTimes, FaPlus } from 'react-icons/fa';
import { useNavigate,Link } from 'react-router-dom';


interface PlaylistSongsProps {
  songs?: any[];
  onDelete?: (songId: string) => void;
}



const PlaylistSongs: React.FC<PlaylistSongsProps> = ({ songs = [], onDelete }) => {
  const navigate = useNavigate();
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [likedSongs, setLikedSongs] = useState<Set<number>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [selectedSongs, setSelectedSongs] = useState<Set<number>>(new Set());

  const handlePlay = (index: number) => setPlayingIndex(playingIndex === index ? null : index);
  const toggleLike = (index: number) => {
    const newLiked = new Set(likedSongs);
    likedSongs.has(index) ? newLiked.delete(index) : newLiked.add(index);
    setLikedSongs(newLiked);
  };
  const toggleSelectSong = (index: number) => {
    const newSelected = new Set(selectedSongs);
    selectedSongs.has(index) ? newSelected.delete(index) : newSelected.add(index);
    setSelectedSongs(newSelected);
  };

  const handleDelete = (index: number) => {
    if (showDeleteConfirm === index) {
      onDelete && songs[index] && onDelete(songs[index].id);
      setShowDeleteConfirm(null);
    } else {
      setShowDeleteConfirm(index);
      setTimeout(() => setShowDeleteConfirm(null), 3000);
    }
  };


  const deleteSelectedSongs = () => {
    selectedSongs.forEach(index => onDelete && onDelete(songs[index].id));
    setSelectedSongs(new Set());
  };

  
const handlegotoAlbum = () => {
 
  navigate("/albums"); 
};

  const formatDate = () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  if (!songs.length) return <div className="py-20 text-center text-gray-500 italic">No songs found.</div>;

  return (
    <div className="text-white">
      {/* Bulk Actions */}
      {selectedSongs.size > 0 && (
        <div className="mb-1 p-4 bg-red-600/10 border-b border-red-500/20 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-red-600 flex items-center justify-center">
              <span className="text-white font-bold">{selectedSongs.size}</span>
            </div>
            <div>
              <h4 className="font-bold text-white uppercase tracking-tighter">{selectedSongs.size} Items Selected</h4>
              <p className="text-[10px] text-gray-500 uppercase">Awaiting Action</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={deleteSelectedSongs} className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-widest">
              <FaTrash size={12} /> Delete
            </button>
            <button onClick={() => setSelectedSongs(new Set())} className="px-6 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold uppercase tracking-widest">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Songs Table */}
      <div className=" border-white/10 bg-black">
        <div className="grid grid-cols-12 px-6 py-2 text-[10px] font-black tracking-[0.2em] text-gray-500 border-b border-white/10 uppercase bg-neutral-900/50">
          <div className="col-span-1 text-center">
            <button
              onClick={() => selectedSongs.size === songs.length ? setSelectedSongs(new Set()) : setSelectedSongs(new Set(Array.from({ length: songs.length }, (_, i) => i)))}
              className="w-4 h-4 border border-gray-600 flex items-center justify-center hover:border-white transition"
            >
              {selectedSongs.size === songs.length && <FaCheck size={8} className="text-blue-500" />}
            </button>
          </div>
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-4">TITLE</div>
          <div className="col-span-3">ALBUM</div>
          <div className="col-span-2">DATE ADDED</div>
          <div className="col-span-1 text-right">ACTIONS</div>
        </div>

        {/* Song Rows */}
        {songs.map((song, index) => (
          <div key={song.id} className={`group grid grid-cols-12 items-center gap-4 px-6 py-4 transition-colors ${selectedSongs.has(index) ? 'bg-blue-600/10 border-l-2 border-l-blue-500' : 'hover:bg-white/5 border-l-2 border-l-transparent'}`} onDoubleClick={() => handlePlay(index)}>
            
            {/* Select */}
            <div className="col-span-1 flex justify-center">
              <button onClick={() => toggleSelectSong(index)} className={`w-4 h-4 border flex items-center justify-center transition ${selectedSongs.has(index) ? 'border-blue-500 bg-blue-500/20' : 'border-gray-600 hover:border-white'}`}>
                {selectedSongs.has(index) && <FaCheck size={8} className="text-blue-500" />}
              </button>
            </div>

            {/* Track Number */}
            <div className="col-span-1 text-center font-mono text-xs text-gray-500">{playingIndex === index ? <FaPause size={12} className="text-blue-500 mx-auto" /> : index + 1}</div>

            {/* Song Info */}
            <div className="col-span-4 flex items-center gap-4 cursor-pointer">
              <div className="w-10 h-10 shrink-0 bg-neutral-800 overflow-hidden">
                <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-white truncate group-hover:text-blue-400 transition-colors">{song.title}</h4>
                <p className="text-[11px] text-gray-500 truncate uppercase tracking-tighter">{song.artist}</p>
              </div>
            </div>

            <div className="col-span-3 text-xs text-gray-400 truncate uppercase">{song.album}</div>
            <div className="col-span-2 text-[10px] font-mono text-gray-600 uppercase">{formatDate()}</div>

            {/* Actions */}
            <div className="col-span-1 flex items-center justify-end gap-4 ">
              <button onClick={() => toggleLike(index)} className={`transition-colors cursor-pointer ${likedSongs.has(index) ? 'text-red-500' : 'text-gray-600 hover:text-white'}`}><FaHeart size={14} /></button>
              {showDeleteConfirm === index ? (
                <div className="flex items-center gap-1 ">
                  <button onClick={() => handleDelete(index)} className="w-6 h-6 bg-blue-600 flex items-center justify-center "><FaCheck size={10} /></button>
                  <button onClick={() => setShowDeleteConfirm(null)} className="w-6 h-6 bg-red-600 flex items-center justify-center "><FaTimes size={10} /></button>
                </div>
              ) : (
                <button onClick={() => handleDelete(index)} className="text-gray-600 cursor-pointer  hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-poiter"><FaTrash size={12} /></button>
              )}
            </div>
          </div>
        ))}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-neutral-900/30 flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest">
          <div className="flex items-center gap-6">
            <span>{songs.length} Entries</span>
            <span>{Math.floor(songs.length * 3.5)} Minutes Total</span>
          </div>
          <button
      onClick={(e) => {
        e.stopPropagation(); 
         handlegotoAlbum();
      }  }
    className="flex items-center gap-2 text-blue-500 hover:text-blue-400 transition cursor-pointer">
    <FaPlus size={10} />
  <span>Append Track</span>
</button>

        </div>
      </div>
    </div>
  );
};

export default PlaylistSongs;
