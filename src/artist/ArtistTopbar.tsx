import React, { useState, useEffect } from "react";
import { FaSearch, FaUser, FaSignOutAlt, FaBell, FaCog } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { auth } from "../routes/firebaseConfig";
import { getSignedArtistImageUrl } from "../backend/songMediaApi";

interface AdminTopbarProps {
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
  onSettingsClick?: () => void;
  onProfileSettingsClick?: () => void;
  onLogout?: () => Promise<void>;
  adminData?: {
    name?: string;
    email: string;
    role: string;
    avatar?: string;
  };
  profileMenuItems?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void | Promise<void>;
    danger?: boolean;
    divider?: boolean;
  }>;
}

export default function AdminTopbar({
  onSearch,
  onNotificationClick,
  onSettingsClick,
  onProfileSettingsClick,
  onLogout,
  adminData,
  profileMenuItems,
}: AdminTopbarProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [signedImageUrl, setSignedImageUrl] = useState<string>("");

  // Load artist data from localStorage or use default
  const getAdminFromStorage = () => {
    try {
      const stored = localStorage.getItem("artistUser");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("Failed to load artist data:", error);
    }
    return {
      name: "Artist",
      email: "artist@echopanda.com",
      role: "Artist",
      avatar: undefined,
    };
  };

  const storedAdmin = adminData || getAdminFromStorage();
  const admin = {
    name:
      storedAdmin?.name ||
      storedAdmin?.displayName ||
      storedAdmin?.email ||
      "Artist",
    email: storedAdmin?.email || "artist@echopanda.com",
    role: storedAdmin?.role || "Artist",
    avatar: storedAdmin?.avatar,
  };

  // Simulate fetching notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // Replace with actual API call
        const mockNotifications = [
          { id: 1, message: "New user registration", timestamp: new Date() },
          { id: 2, message: "System backup completed", timestamp: new Date() },
          { id: 3, message: "New song uploaded", timestamp: new Date() },
        ];
        setNotifications(mockNotifications);
        setUnreadCount(mockNotifications.length);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };

    fetchNotifications();
  }, []);

  // Fetch signed image URL for artist avatar
  useEffect(() => {
    const fetchSignedImageUrl = async () => {
      try {
        const stored = localStorage.getItem("artistUser");
        if (stored) {
          const artistUser = JSON.parse(stored);
          if (artistUser.artist_id) {
            const signedUrl = await getSignedArtistImageUrl(artistUser.artist_id);
            setSignedImageUrl(signedUrl || "");
          }
        }
      } catch (error) {
        console.error("Failed to fetch signed image URL:", error);
      }
    };

    fetchSignedImageUrl();
  }, []);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length >= 2) {
      setIsSearching(true);
      try {
        // Replace with actual search API call
        await new Promise((resolve) => setTimeout(resolve, 300));
        if (onSearch) {
          onSearch(query);
        }
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    } else if (query.trim().length === 0) {
      setIsSearching(false);
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      // Navigate to search results or trigger search
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      if (onLogout) {
        await onLogout();
      } else {
        // Default logout logic
        await auth.signOut();
        localStorage.removeItem("artistUser");
        localStorage.removeItem("authToken");
        navigate("/login");
      }
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  const handleNotificationClick = () => {
    setUnreadCount(0);
    if (onNotificationClick) {
      onNotificationClick();
    }
  };

  const handleSettingsClick = () => {
    if (onSettingsClick) {
      onSettingsClick();
    } else {
      navigate("/artist/settings");
    }
  };

  const handleProfileSettings = async () => {
    setIsProfileDropdownOpen(false);
    if (onProfileSettingsClick) {
      try {
        await Promise.resolve(onProfileSettingsClick());
      } catch (error) {
        console.error("Profile settings action failed:", error);
      }
    } else {
      navigate("/artist/settings");
    }
  };

  const getInitials = (name?: string) => {
    const safeName = String(name || "Artist").trim();
    return safeName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };


  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 shadow-lg border-b border-purple-500/20">
      <div className="flex items-center justify-between px-6 py-4 max-w-full">
        {/* Left Section*/}
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-400 to-pink-400"></div>
         
        </div>

        {/* Center Section  */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search users, songs, playlists..."
              value={searchQuery}
              onChange={handleSearch}
              onKeyPress={handleSearchKeyPress}
              className="w-full px-4 py-2 pl-10 pr-10 rounded-full bg-slate-800/50 border border-purple-500/30 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
            />
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 text-sm" />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors z-10"
              >
                ✕
              </button>
            )}
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Notification Icon */}
          <div className="relative group">
            <button
              onClick={handleNotificationClick}
              className="relative p-2 rounded-full hover:bg-purple-500/10 text-slate-300 hover:text-purple-300 transition-all"
            >
              <FaBell className="text-lg" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full animate-pulse"></span>
              )}
            </button>
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {unreadCount > 0 ? `${unreadCount} notifications` : "No notifications"}
            </span>

            {/* Notification Dropdown Preview */}
            <div className="hidden group-hover:block absolute right-0 mt-2 w-64 bg-slate-800 border border-purple-500/30 rounded-lg shadow-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700 flex justify-between items-center">
                <p className="text-sm font-semibold text-white">Notifications</p>
                {unreadCount > 0 && (
                  <span className="text-xs bg-pink-500 text-white px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="px-4 py-3 border-b border-slate-700 hover:bg-purple-500/10 transition-colors cursor-pointer"
                    >
                      <p className="text-sm text-slate-300">{notif.message}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(notif.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="px-4 py-4 text-center text-slate-400 text-sm">
                    No notifications
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Settings Icon */}
          <button
            onClick={handleSettingsClick}
            className="relative p-2 rounded-full hover:bg-purple-500/10 text-slate-300 hover:text-purple-300 transition-all group"
          >
            <FaCog className="text-lg" />
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Settings
            </span>
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center gap-3 px-3 py-2 rounded-full hover:bg-purple-500/10 transition-all group"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold text-sm">
                {signedImageUrl ? (
                  <img
                    src={signedImageUrl}
                    alt={admin.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  getInitials(admin.name)
                )}
              </div>
              <div className="flex flex-col items-start hidden sm:flex">
                <span className="text-sm font-semibold text-white">{admin.name}</span>
                <span className="text-xs text-slate-400">{admin.role}</span>
              </div>
            </button>

            {/* Dropdown Menu */}
            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-purple-500/30 rounded-lg shadow-lg overflow-hidden z-50">
                <div className="px-4 py-4 border-b border-slate-700">
                  <p className="text-sm font-semibold text-white">{admin.name}</p>
                  <p className="text-xs text-slate-400 mt-1">{admin.email}</p>
                  <span className="inline-block mt-2 text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                    {admin.role}
                  </span>
                </div>

                {/* Default or Custom Menu Items */}
                {profileMenuItems && profileMenuItems.length > 0 ? (
                  <div>
                    {profileMenuItems.map((item, index) => (
                      <React.Fragment key={index}>
                        {item.divider && (
                          <div className="border-t border-slate-700"></div>
                        )}
                        <button
                          onClick={async () => {
                            setIsProfileDropdownOpen(false);
                            await Promise.resolve(item.onClick());
                          }}
                          className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                            item.danger
                              ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
                              : "text-slate-300 hover:bg-purple-500/10 hover:text-purple-300"
                          } ${item.divider ? "" : "border-t border-slate-700"}`}
                        >
                          {item.icon && <span className="text-xs">{item.icon}</span>}
                          {item.label}
                        </button>
                      </React.Fragment>
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Default Menu Items */}
                    <button
                      onClick={handleProfileSettings}
                      className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-purple-500/10 hover:text-purple-300 flex items-center gap-2 transition-colors"
                    >
                      <FaUser className="text-xs" />
                      Profile Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2 transition-colors border-t border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaSignOutAlt className="text-xs" />
                      {isLoggingOut ? "Logging out..." : "Logout"}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
