import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaSignOutAlt, FaChevronLeft, FaChevronRight, FaPlus, FaMusic
} from "react-icons/fa";
import { Library } from "lucide-react";
import { getSidebarLinks } from "../routes/routeConfig";
import { useTheme } from "../contexts/ThemeContext";
import { getUserPlaylists, type Playlist } from "../backend/playlistsService";

interface SideBarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
}

const SideBar: React.FC<SideBarProps> = ({ isCollapsed = false, onToggleCollapse }) => {
  const { isLightMode } = useTheme();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const navigate = useNavigate();
  const sidebarLinks = getSidebarLinks();

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      const data = await getUserPlaylists();
      setPlaylists(data);
    } catch (error) {
      console.error('Error loading sidebar playlists:', error);
    }
  };

  const handleToggleCollapse = () => {
    if (onToggleCollapse) onToggleCollapse(!isCollapsed);
  };

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    void navigate("/login");
  };

  // Upgraded theme colors to exactly match the premium, modern dashboard aesthetics
  const themeClasses = {
    aside: isLightMode
      ? "bg-white/80 backdrop-blur-md border-r border-gray-100 text-gray-900"
      : "bg-black border-r border-white/5 text-[#e1e7ed]",
    hover: isLightMode
      ? "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
      : "hover:bg-zinc-900 text-[#8a99ad] hover:text-white",
    textMuted: isLightMode
      ? "text-gray-400"
      : "text-[#475467]",
    border: isLightMode
      ? "border-gray-100"
      : "border-[#161b26]"
  };

  return (
    <>
      <aside
        className={`h-screen flex flex-col transition-all duration-300 relative z-40 ${themeClasses.aside} ${
          isCollapsed ? "w-20" : "w-64 md:w-68"
        }`}
      >
        {/* Sleek Minimal Toggle Button */}
        <button
          onClick={handleToggleCollapse}
          className={`hidden md:flex absolute top-6 -right-3 p-1.5 rounded-full border bg-black text-gray-400 hover:text-white shadow-lg transition-all z-50 ${themeClasses.border} hover:scale-105 active:scale-95`}
        >
          {isCollapsed ? <FaChevronRight size={10} /> : <FaChevronLeft size={10} />}
        </button>

        {/* Navigation Section */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden pt-8 pb-4 px-4 hide-scrollbar">
          {!isCollapsed && (
            <div className={`px-4 mb-4 text-[10px] font-bold uppercase tracking-[0.25em] ${themeClasses.textMuted}`}>
              Menu
            </div>
          )}

          <ul className="space-y-1.5">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              return (
                <li key={link.path}>
                  <NavLink
                    to={link.path}
                    title={isCollapsed ? link.label : ""}
                    onClick={() => { if (onToggleCollapse) onToggleCollapse(false); }}
                    className={({ isActive }) => `
                      flex items-center rounded-xl transition-all duration-200 group font-medium
                      ${isCollapsed ? "p-3.5 justify-center" : "py-3 px-4 justify-start"}
                      ${isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/15"
                        : `${themeClasses.hover}`
                      }
                    `}
                  >
                    {Icon ? (
                      <Icon
                        className={`h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                          isCollapsed ? "" : "mr-3.5"
                        }`}
                      />
                    ) : null}

                    {!isCollapsed && (
                      <span className="text-[14px] tracking-wide truncate">
                        {link.label}
                      </span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>

          {/* Spotify-style Library Section */}
          <div className="mt-8">
            <div className={`px-4 mb-4 flex items-center justify-between ${isCollapsed ? "justify-center" : ""}`}>
              {!isCollapsed ? (
                <>
                  <div className={`flex items-center gap-3 text-[12px] font-black uppercase tracking-widest ${isLightMode ? "text-gray-500" : "text-zinc-400"}`}>
                    <Library size={18} />
                    <span>Your Library</span>
                  </div>
                  <button
                    onClick={() => navigate('/playlist')}
                    className={`p-1.5 rounded-full hover:bg-white/10 transition-colors ${isLightMode ? "text-gray-400" : "text-zinc-500"}`}
                  >
                    <FaPlus size={12} />
                  </button>
                </>
              ) : (
                <Library size={20} className={isLightMode ? "text-gray-400" : "text-zinc-500"} />
              )}
            </div>

            <ul className="space-y-1 mt-2">
              {playlists.map((p) => (
                <li key={p.id}>
                  <NavLink
                    to={`/playlist?id=${p.id}`} // We might need to update how PlaylistPage handles IDs
                    className={({ isActive }) => `
                      flex items-center rounded-xl transition-all duration-200 group
                      ${isCollapsed ? "p-3.5 justify-center" : "py-2.5 px-4 justify-start"}
                      ${isActive
                        ? "bg-zinc-800 text-white"
                        : `${themeClasses.hover}`
                      }
                    `}
                  >
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt=""
                        className={`rounded-md object-cover shrink-0 ${isCollapsed ? "w-8 h-8" : "w-10 h-10 mr-3"}`}
                      />
                    ) : (
                      <div className={`rounded-md flex items-center justify-center shrink-0 ${isLightMode ? 'bg-zinc-100' : 'bg-zinc-800'} ${isCollapsed ? "w-8 h-8" : "w-10 h-10 mr-3"}`}>
                        <FaMusic className={isLightMode ? 'text-zinc-400' : 'text-zinc-600'} size={isCollapsed ? 12 : 14} />
                      </div>
                    )}

                    {!isCollapsed && (
                      <div className="min-w-0">
                        <p className="text-[14px] font-bold truncate leading-tight">{p.name}</p>
                        <p className={`text-[11px] ${isLightMode ? 'text-gray-400' : 'text-zinc-500'} font-medium`}>Playlist • {p.song_count} songs</p>
                      </div>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Cleaned Action Section (No more jagged dashed borders) */}
          <div className="mt-8 pt-4 border-t border-transparent">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              aria-label="Sign out"
              className={`flex items-center w-full rounded-xl transition-all duration-200 group font-medium
                ${isCollapsed ? "p-3.5 justify-center" : "py-3 px-4 justify-start"}
                ${isLightMode
                  ? "hover:bg-red-50 text-gray-500 hover:text-red-600"
                  : "hover:bg-red-950/20 text-[#8a99ad] hover:text-red-400"
                }
              `}
            >
              <FaSignOutAlt className="h-[18px] w-[18px] shrink-0 transition-colors duration-200" />
              {!isCollapsed && (
                <span className="ml-3.5 text-[14px] tracking-wide">
                  Sign Out
                </span>
              )}
            </button>
          </div>
        </nav>

        {/* Logout Confirmation - In-sidebar Elegant Toast */}
        {showLogoutConfirm && (
          <div className={`p-4 border-t ${themeClasses.border} animate-fade-in`}>
            <div className={`rounded-xl p-3.5 border ${
              isLightMode
                ? "bg-red-50/50 border-red-100"
                : "bg-black border-red-900/30"
            }`}>
              {!isCollapsed && (
                <p className={`text-xs mb-3 font-medium ${isLightMode ? "text-red-700" : "text-red-400/80"}`}>
                  Confirm signing out?
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleLogout}
                  className="flex-1 py-1.5 rounded-lg font-semibold text-xs transition bg-red-600 text-white hover:bg-red-500 active:scale-95"
                >
                  {isCollapsed ? "Y" : "Log Out"}
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className={`flex-1 py-1.5 rounded-lg font-semibold text-xs transition border ${
                    isLightMode
                      ? "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                      : "border-[#242c3d] bg-[#161b26] text-gray-300 hover:bg-[#202736]"
                  } active:scale-95`}
                >
                  {isCollapsed ? "N" : "Cancel"}
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Embedded core styles */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
      `}</style>
    </>
  );
};

export default SideBar;