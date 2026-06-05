import React from "react";
import {
  FaFacebook,
  FaInstagram,
  FaTiktok,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { isAuthenticated, getCurrentUser } from "../routes/authContext";
import { useTheme } from "../contexts/ThemeContext";

const AppFooter: React.FC = () => {
  const { isLightMode } = useTheme();
  const loggedIn = isAuthenticated();
  const user = loggedIn ? getCurrentUser() : null;
  const isArtist = user?.backendRole === "artist" || user?.backendRole === "publicer";

  // Clean, premium coloring matching your clean album card update
  const bgClass = isLightMode ? "bg-zinc-100" : "bg-zinc-950";
  const borderClass = isLightMode ? "border-zinc-200" : "border-white/[0.05]";
  const textColor = isLightMode ? "text-zinc-800" : "text-zinc-100";
  const subTextColor = isLightMode ? "text-zinc-500" : "text-zinc-400";
  const linkColor = isLightMode
    ? "text-zinc-600 hover:text-zinc-900 transition-colors duration-200"
    : "text-zinc-400 hover:text-zinc-100 transition-colors duration-200";

  return (
    <footer className={`${bgClass} w-full border-t ${borderClass}`}>
      <div className="max-w-7xl mx-auto px-6 py-8 sm:py-12">

        {/* FOOTER GRID */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">

          {/* About Section */}
          <div className="col-span-2">
            <h3 className={`font-bold text-base tracking-wide mb-3 ${textColor}`}>About</h3>
            <p className={`${subTextColor} text-sm leading-relaxed max-w-sm`}>
              EchoPanda is a platform created for over <span className="text-pink-500 font-medium">5 years</span> now.
              It is one of the most popular music streaming websites.
              You can listen and download songs for free.
              If you want unlimited access, get our
              <span className="text-blue-500 font-semibold"> Premium Pass.</span>
            </p>
          </div>

          {/* Explore Links */}
          <div>
            <h3 className={`font-semibold text-sm uppercase tracking-wider mb-3 ${textColor}`}>Explore</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/discover" className={linkColor}>Discover</Link></li>
              {isArtist && <li><Link to="/artist/studio" className={linkColor}>My Studio</Link></li>}
              <li><Link to="/playlist" className={linkColor}>Playlists</Link></li>
              <li><Link to="/albums" className={linkColor}>Albums</Link></li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className={`font-semibold text-sm uppercase tracking-wider mb-3 ${textColor}`}>Support</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/AboutUs" className={linkColor}>About</Link></li>
              <li><Link to="/policy" className={linkColor}>Policy</Link></li>
              <li><Link to="/support" className={linkColor}>Help Center</Link></li>
            </ul>
          </div>

          {/* Brand & Socials */}
          <div className="flex flex-col items-start">
            <h3 className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-blue-500 text-xl tracking-tight">
              EchoPanda
            </h3>

            <div className="flex gap-4 text-lg mt-4">
              <a
                href="https://www.facebook.com/profile.php?id=61585927881035"
                target="_blank"
                rel="noopener noreferrer"
                className={linkColor}
                aria-label="Facebook"
              >
                <FaFacebook />
              </a>

              <a
                href="https://www.instagram.com/echo87526?igsh=OGp3cjFxdmdyMWpk"
                target="_blank"
                rel="noopener noreferrer"
                className={linkColor}
                aria-label="Instagram"
              >
                <FaInstagram />
              </a>

              <a
                href="https://www.tiktok.com/@echo.panda0?_r=1&_t=ZS-92Zgt6parkC"
                target="_blank"
                rel="noopener noreferrer"
                className={linkColor}
                aria-label="TikTok"
              >
                <FaTiktok />
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* Copyright Bar */}
      <div className={`py-4 text-center text-xs ${isLightMode ? "text-zinc-400" : "text-zinc-600"} border-t ${borderClass}`}>
        © 2026 EchoPanda
      </div>
    </footer>
  );
};

export default AppFooter;