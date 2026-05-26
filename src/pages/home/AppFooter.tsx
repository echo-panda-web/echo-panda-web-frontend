import React from "react";
import {
  FaFacebook,
  FaInstagram,
  FaTiktok,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { isAuthenticated, getCurrentUser } from "../../routes/authContext";

interface Props {
  isLightMode: boolean;
}

const AppFooter: React.FC<Props> = ({ isLightMode }) => {
  const loggedIn = isAuthenticated();
  const user = loggedIn ? getCurrentUser() : null;
  const isArtist = user?.backendRole === "artist" || user?.backendRole === "publicer";
  const bgClass = isLightMode ? "bg-gray-100" : "bg-gray-900";
  const textColor = isLightMode ? "text-gray-900" : "text-white";
  const linkColor = isLightMode
    ? "text-gray-700 hover:text-gray-900"
    : "text-gray-400 hover:text-white";

  return (
    <footer className={`${bgClass} w-full border-t border-gray-700`}>
      <div className="max-w-7xl mx-auto px-6 py-6 sm:py-12">

        {/* DESKTOP / TABLET VIEW */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">

          {/* About - Wide */}
        <div className="lg:col-span-2">
          <h3 className={`font-bold text-lg mb-2 ${textColor}`}>About</h3>
          
          <p className={`${textColor} text-sm leading-relaxed w-4/5`}>
            EchoPanda is a platform created for over <span className="text-pink-500">5 years</span> now.
            It is one of the most popular music streaming websites.
            You can listen and download songs for free. 
            If you want unlimited access, get our 
            <span className="text-blue-500 font-semibold"> Premium Pass.</span>
          </p>
        </div>

          {/* Explore */}
          <div>
            <h3 className={`font-semibold text-lg mb-3 ${textColor}`}>Explore</h3>
            <ul className="space-y-1 text-sm">
              <li><Link to="/discover" className={linkColor}>Discover</Link></li>
              {isArtist && <li><Link to="/artist/studio" className={linkColor}>My Studio</Link></li>}
              <li><Link to="/playlist" className={linkColor}>Playlists</Link></li>
              <li><Link to="/albums" className={linkColor}>Albums</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className={`font-semibold text-lg mb-3 ${textColor}`}>Support</h3>
            <ul className="space-y-1 text-sm">
             <li><Link to="/AboutUs" className={linkColor}>About</Link></li>
              <li><Link to="/policy" className={linkColor}>Policy</Link></li>
              <li><Link to="/support" className={linkColor}>Help Center</Link></li>
            </ul>
          </div>


          {/* Brand */}
          <div>
            <h3 className="font-extrabold text-transparent bg-clip-text bg-linear-to-r from-pink-500 to-blue-500 text-xl">
              EchoPanda
            </h3>

            <div className="flex gap-4 text-xl mt-4">
                <a
                  href="https://www.facebook.com/profile.php?id=61585927881035"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkColor}
                >
                  <FaFacebook />
                </a>

                <a
                  href="https://www.instagram.com/echo87526?igsh=OGp3cjFxdmdyMWpk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkColor}
                >
                  <FaInstagram />
                </a>

                <a
                  href="https://www.tiktok.com/@echo.panda0?_r=1&_t=ZS-92Zgt6parkC"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkColor}
                >
                  <FaTiktok />
                </a>
              </div>

          </div>

        </div>
      </div>

      {/* Copyright */}
      <div className="py-3 text-center text-xs text-gray-500 border-t border-gray-700">
        © 2025 EchoPanda
      </div>
    </footer>
  );
};

export default AppFooter;
 