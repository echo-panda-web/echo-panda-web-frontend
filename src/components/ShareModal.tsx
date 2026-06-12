import React, { useState, useRef } from "react";
import {
  FaInstagram, FaFacebook, FaFacebookMessenger,
  FaTelegramPlane, FaWhatsapp, FaLink, FaTimes, FaDownload, FaExclamationTriangle
} from "react-icons/fa";
import { useTheme } from "../contexts/ThemeContext";
import { buildApiUrl } from "../backend/backendUrls";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "song" | "album" | "artist" | "playlist";
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, type, id, title, subtitle, imageUrl }) => {
  const { isLightMode } = useTheme();
  const [copied, setCopying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;


  // Use the web landing URL for external sharing
  const shareUrl = `${window.location.origin}/share/${type}/${id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shareUrl)}`;

  const handleDownloadCard = async () => {
    try {
      setIsDownloading(true);
      // Open the story card in a new tab so the user can long-press / right-click to save
      const cardHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Echo Panda – ${title}</title>
<style>body{margin:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh;}</style>
</head><body>${cardRef.current?.outerHTML ?? ''}</body></html>`;
      const blob = new Blob([cardHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (!win) alert('Please allow pop-ups to download the card.');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      console.error('Failed to open card', e);
    } finally {
      setIsDownloading(false);
    }
  };

  const trackShare = async (platform: string) => {
    try {
      const token = localStorage.getItem("userToken") || localStorage.getItem("authToken");
      await fetch(buildApiUrl("/shares"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          target_type: type,
          target_id: parseInt(id),
          platform
        }),
      });
    } catch (e) {
      console.error("Failed to track share", e);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopying(true);
    trackShare("copy_link");
    setTimeout(() => setCopying(false), 2000);
  };

  const shareLinks = {
    messenger: `fb-messenger://share/?link=${encodeURIComponent(shareUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(title + " " + shareUrl)}`,
  };

  const platforms = [
    { name: "Instagram", icon: <FaInstagram />, color: "bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500", key: "instagram" },
    { name: "Facebook", icon: <FaFacebook />, color: "bg-blue-600", key: "facebook" },
    { name: "Messenger", icon: <FaFacebookMessenger />, color: "bg-blue-500", key: "messenger" },
    { name: "Telegram", icon: <FaTelegramPlane />, color: "bg-sky-500", key: "telegram" },
    { name: "WhatsApp", icon: <FaWhatsapp />, color: "bg-green-500", key: "whatsapp" },
  ];

  const handlePlatformClick = (platform: any) => {
    trackShare(platform.key);
    if (platform.key === 'instagram') {
      alert("Step 1: Download the Story Card\nStep 2: Open Instagram App\nStep 3: Upload the image to your Story!");
      handleDownloadCard();
    } else {
      window.open(shareLinks[platform.key as keyof typeof shareLinks], "_blank");
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 backdrop-blur-xl bg-black/60 animate-in fade-in duration-300">
      <div className="absolute inset-0" onClick={onClose} />

      <div className={`relative ${isLightMode ? "bg-white" : "bg-[#121212]"} w-full max-w-4xl rounded-[2.5rem] border ${isLightMode ? "border-zinc-200" : "border-white/10"} shadow-2xl flex flex-col md:flex-row overflow-hidden`}>

        {/* Left Side: Preview Card */}
        <div className={`w-full md:w-[45%] p-8 flex flex-col items-center justify-center ${isLightMode ? "bg-zinc-50" : "bg-zinc-900/50"}`}>
          <div className={`mb-6 text-[10px] font-black uppercase tracking-[0.2em] ${isLightMode ? "text-zinc-400" : "text-zinc-500"}`}>
            Story Preview
          </div>

          <div
            ref={cardRef}
            className="relative w-64 aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl bg-black flex flex-col p-6 text-white"
          >
            {/* Background Blur */}
            <div className="absolute inset-0 opacity-40 blur-3xl scale-150">
              <img src={imageUrl || "/logo.webp"} alt="" className="w-full h-full object-cover" />
            </div>

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col">
              <div className="aspect-square w-full rounded-2xl overflow-hidden shadow-2xl mb-6">
                <img src={imageUrl || "/logo.webp"} alt={title} className="w-full h-full object-cover" />
              </div>

              <h3 className="text-xl font-black leading-tight mb-1 truncate">{title}</h3>
              <p className="text-zinc-400 text-sm font-bold truncate mb-6">{subtitle}</p>

              <div className="mt-auto flex flex-col items-center gap-4">
                <div className="bg-white p-2 rounded-xl shadow-lg">
                  <img src={qrCodeUrl} alt="QR Code" className="w-20 h-20" />
                </div>

                <div className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-white">
                  <img src="/logo.webp" alt="" className="w-4 h-4 rounded-full" />
                  Echo Panda
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleDownloadCard}
            disabled={isDownloading}
            className={`mt-8 flex items-center gap-2 px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${isLightMode ? "bg-zinc-200 text-zinc-800 hover:bg-zinc-300" : "bg-white/5 text-white hover:bg-white/10"} disabled:opacity-50`}
          >
            {isDownloading ? "Generating..." : <><FaDownload /> Download Card</>}
          </button>
        </div>

        {/* Right Side: Options */}
        <div className="flex-1 p-8 md:p-12 flex flex-col">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h2 className={`text-3xl font-black ${isLightMode ? "text-zinc-900" : "text-white"} tracking-tight`}>Share</h2>
              <p className={`text-sm mt-1 font-medium ${isLightMode ? "text-zinc-500" : "text-zinc-400"}`}>Spread the vibes with your friends</p>
            </div>
            <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isLightMode ? "hover:bg-zinc-100 text-zinc-400" : "hover:bg-white/5 text-zinc-500"}`}>
              <FaTimes size={24} />
            </button>
          </div>



          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
            {platforms.map((platform) => (
              <button
                key={platform.name}
                onClick={() => handlePlatformClick(platform)}
                className={`flex flex-col items-center gap-3 p-4 rounded-3xl transition-all duration-300 ${isLightMode ? "bg-zinc-50 hover:bg-zinc-100" : "bg-white/5 hover:bg-white/10"} group`}
              >
                <div className={`w-12 h-12 ${platform.color} rounded-2xl flex items-center justify-center text-white text-xl shadow-lg transition-transform group-hover:scale-110 group-active:scale-95`}>
                  {platform.icon}
                </div>
                <span className={`text-[11px] font-black uppercase tracking-widest ${isLightMode ? "text-zinc-500" : "text-zinc-400"}`}>{platform.name}</span>
              </button>
            ))}
          </div>

          <div className="mt-auto">
            <div className={`text-[10px] font-black uppercase tracking-[0.2em] mb-3 px-1 ${isLightMode ? "text-zinc-400" : "text-zinc-500"}`}>
              Direct Link
            </div>
            <div className={`flex items-center gap-2 p-2 rounded-2xl border ${isLightMode ? "bg-zinc-50 border-zinc-200" : "bg-black/40 border-white/10"}`}>
              <div className={`flex-1 px-3 text-xs font-medium truncate ${isLightMode ? "text-zinc-600" : "text-zinc-400"}`}>
                {shareUrl}
              </div>
              <button
                onClick={handleCopyLink}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${copied ? "bg-green-500 text-white" : "bg-blue-600 text-white hover:bg-blue-500"}`}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ShareModal;
