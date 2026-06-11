import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FaChartLine,
  FaMusic,
  FaCompactDisc,
  FaUpload,
  FaSave,
  FaCheckCircle,
  FaUserCircle,
  FaCamera,
  FaSpinner,
} from "react-icons/fa";
import { uploadArtistMedia } from "./artistStudioApi";

interface MenuItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  action?: string;
}

const menus: MenuItem[] = [
  { name: "Analytics", path: "/artist/dashboard", icon: <FaChartLine /> },
  { name: "Songs", path: "/artist/songs", icon: <FaMusic /> },
  { name: "Releases", path: "/artist/albums", icon: <FaCompactDisc /> },
  { name: "Upload Song", path: "/artist/songs", icon: <FaUpload />, action: "upload" },
  { name: "Draft Releases", path: "/artist/drafts", icon: <FaSave /> },
  { name: "Publish", path: "/artist/publish", icon: <FaCheckCircle /> },
  { name: "Profile", path: "/artist/settings", icon: <FaUserCircle /> },
];

export default function ArtistSidebar() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const currentAction = searchParams.get("action");

  // ─── LOGO STATE MANAGEMENT ──────────────────────────────────────────
  const [logoUrl, setLogoUrl] = useState<string>(() => {
    return localStorage.getItem("echopanda_custom_logo") || "https://www.echopanda.me/logo.webp";
  });
  const [logoUploading, setLogoUploading] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLogoUploading(true);

      // Upload using your studio API pipeline
      const uploaded = await uploadArtistMedia({ file, purpose: "album_cover" });

      // Fallback preview URL generation
      const localPreviewUrl = URL.createObjectURL(file);
      setLogoUrl(localPreviewUrl);

      // Persist locally for session consistency
      localStorage.setItem("echopanda_custom_logo", localPreviewUrl);
    } catch (err) {
      console.error("Failed to upload custom studio logo:", err);
    } finally {
      setLogoUploading(false);
    }
  };

  const baseLayout = "w-64 bg-[#0a0a0c] text-slate-100 border-r border-white/[0.06] h-full flex flex-col select-none font-sans";
  const headerLayout = "flex items-center px-6 border-b border-white/[0.06] h-20 bg-gradient-to-b from-white/[0.01] to-transparent";
  const footerLayout = "p-4 border-t border-white/[0.04] bg-white/[0.01]";

  return (
    <aside className={baseLayout}>
      <div className={headerLayout}>
        <div className="flex items-center gap-3 group">

          {/* Interactive Logo Frame matching image_d9c054.png */}
          <div className="relative flex items-center justify-center h-11 w-11 rounded-xl bg-gradient-to-tr from-[#8651f7] to-[#9e73f9] shadow-md shadow-indigo-500/10 transition-transform duration-300 overflow-hidden group/logo">
            {logoUploading ? (
              <FaSpinner className="animate-spin text-white text-sm" />
            ) : logoUrl ? (
              <img src={logoUrl} alt="Custom Studio Logo" className="h-full w-full object-cover" />
            ) : (
              <span className="text-white text-xs font-semibold tracking-tight">Echo</span>
            )}

            {/* Hidden upload action trigger overlay */}
            <label className="absolute inset-0 bg-black/70 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
              <FaCamera size={12} className="text-white" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
                disabled={logoUploading}
              />
            </label>
          </div>

          {/* Sidebar Identity Information */}
          <div className="flex flex-col">
            <NavLink to="/" className="text-base font-black tracking-tight text-white hover:text-indigo-200 transition-colors duration-200 leading-tight">
              Echo Panda
            </NavLink>
            <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-400 mt-0.5">
              Creator Suite
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links Mapping */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        {menus.map((menu, index) => {
          const pathWithAction = menu.action ? `${menu.path}?action=${menu.action}` : menu.path;
          const isActionMatch = menu.action ? currentAction === menu.action : !currentAction;

          return (
            <NavLink
              key={`${menu.path}-${index}`}
              to={pathWithAction}
              className={({ isActive }) => {
                const isTrulyActive = isActive && isActionMatch;
                const baseItemClass = "flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative border";
                const activeClass = "bg-gradient-to-r from-indigo-500/15 to-purple-500/5 text-white border-indigo-500/20 shadow-lg shadow-black/20";
                const inactiveClass = "text-slate-400 border-transparent hover:bg-white/[0.03] hover:text-slate-100";

                return `${baseItemClass} ${isTrulyActive ? activeClass : inactiveClass}`;
              }}
            >
              {({ isActive }) => {
                const isTrulyActive = isActive && isActionMatch;
                return (
                  <>
                    {isTrulyActive && (
                      <span className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-indigo-400 shadow-[0_0_8px_#818cf8]" />
                    )}
                    <span className={`text-base transition-transform duration-200 group-hover:scale-105 ${
                      isTrulyActive ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-200"
                    }`}>
                      {menu.icon}
                    </span>
                    <span className="tracking-wide">{menu.name}</span>
                  </>
                );
              }}
            </NavLink>
          );
        })}
      </nav>

      {/* Persistent Footer Workspace Branding */}
      <div className={footerLayout}>
        <div className="px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04] flex flex-col items-center justify-center text-center">
          <p className="text-xs font-bold text-slate-300 tracking-wide">Echo Panda</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-0.5">Artist Studio v1.0</p>
        </div>
      </div>
    </aside>
  );
}