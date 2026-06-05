import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  FaSun,
  FaMoon,
  FaMicrophone,
  FaTimes,
  FaSearch,
  FaUser,
  FaBars,
  FaArrowRight,
} from "react-icons/fa";
import { getCurrentUser, isAuthenticated } from "../routes/authContext";
import { searchContent } from "../backend/searchService";
import { useTheme } from "../contexts/ThemeContext";

const NavBar: React.FC = () => {
  const { isLightMode, setIsLightMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isVoiceSearchOpen, setIsVoiceSearchOpen] = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const [displayText, setDisplayText] = useState("");
  const [hasSpoken, setHasSpoken] = useState(false);

  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;
  const recognitionRef = React.useRef<any>(null);

  useEffect(() => {
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setVoiceText("");
        setDisplayText("");
        setHasSpoken(false);
      };

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = "";
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }
        const fullText = finalTranscript + interimTranscript;
        setVoiceText(fullText.trim());
        setHasSpoken(true);
      };

      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, [SpeechRecognition]);

  useEffect(() => {
    const loggedIn = isAuthenticated();
    setIsUserLoggedIn(loggedIn);
    if (loggedIn) setUserData(getCurrentUser());
  }, []);

  useEffect(() => {
    if (!location.pathname.startsWith("/search") && searchQuery) {
      setSearchQuery("");
    }
  }, [location.pathname, searchQuery]);

  useEffect(() => {
    if (!voiceText) {
      setDisplayText("");
      return;
    }
    const duration = 1.2;
    let rafId: number | null = null;
    const start = performance.now();
    const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);

    const step = (now: number) => {
      const elapsedSec = (now - start) / 1000;
      let progress = Math.min(elapsedSec / duration, 1);
      progress = easeOutQuad(progress);
      const chars = Math.floor(progress * voiceText.length);
      setDisplayText(voiceText.slice(0, chars));

      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        setDisplayText(voiceText);
        if (!isListening && voiceText.trim()) {
          setTimeout(() => handleAutoSearch(voiceText.trim()), 800);
        }
      }
    };
    rafId = requestAnimationFrame(step);
    return () => { if (rafId != null) cancelAnimationFrame(rafId); };
  }, [voiceText, isListening]);

  useEffect(() => {
    if (isVoiceSearchOpen && !isListening) startVoiceSearch();
  }, [isVoiceSearchOpen]);

  const startVoiceSearch = () => {
    if (recognitionRef.current && !isListening) {
      setVoiceText("");
      setDisplayText("");
      recognitionRef.current.start();
    }
  };

  const stopVoiceSearch = () => { if (recognitionRef.current) recognitionRef.current.stop(); };

  const handleAutoSearch = (query: string) => {
    if (query.trim()) {
      setSearchQuery(query);
      performSearch(query);
      setTimeout(() => {
        setIsVoiceSearchOpen(false);
        setVoiceText("");
        setDisplayText("");
        setHasSpoken(false);
      }, 1200);
    }
  };

  const performSearch = (query: string) => {
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  // Styled to cleanly merge with the pure dark layout seen in image_cf9a6c.jpg
  const styles = {
    header: isLightMode
      ? "bg-white border-b border-zinc-200"
      : "bg-black border-b border-zinc-900/40", // Pure pitch black to blend into layout background
    input: isLightMode
      ? "bg-zinc-100 text-zinc-900 placeholder-zinc-500 focus:bg-zinc-50 border-zinc-200"
      : "bg-zinc-900/50 text-zinc-100 placeholder-zinc-500 focus:bg-zinc-900/80 border-transparent",
    navLink: isLightMode
      ? "text-zinc-600 hover:text-zinc-900 font-medium"
      : "text-zinc-400 hover:text-zinc-200 font-medium",
    userPill: isLightMode
      ? "bg-zinc-100 hover:bg-zinc-200"
      : "bg-zinc-900/50 hover:bg-zinc-800/60 text-white"
  };

  return (
    <header className={`w-full px-8 py-4 flex items-center justify-between sticky top-0 z-40 transition-colors duration-200 ${styles.header}`}>

      {/* ── VOICE INTERFACE OVERLAY ── */}
      {isVoiceSearchOpen && (
        <div className="fixed inset-0 bg-black/98 flex items-center justify-center backdrop-blur-md z-50">
          <button
            onClick={() => { setIsVoiceSearchOpen(false); stopVoiceSearch(); }}
            className="absolute top-8 right-8 text-zinc-400 hover:text-white transition-colors p-2 rounded-full hover:bg-zinc-900"
          >
            <FaTimes size={20} />
          </button>
          <div className="text-center space-y-6 max-w-xl px-4">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto transition-all duration-300 ${isListening ? "bg-blue-600 shadow-[0_0_40px_rgba(37,99,235,0.4)] scale-105" : "bg-zinc-900"}`}>
              <FaMicrophone size={28} className="text-white" />
            </div>
            <div className="space-y-1">
                <p className="text-white text-lg font-semibold tracking-wide">{isListening ? "Listening..." : "Ready"}</p>
                <p className="text-zinc-500 text-xs font-medium">Say what you're looking for</p>
            </div>
            {displayText && <p className="text-blue-400 text-xl font-medium tracking-tight">"{displayText}"</p>}
          </div>
        </div>
      )}

      {/* ── LEFT: BRAND ARCHITECTURE ── */}
      <NavLink to="/" className="flex items-center gap-2.5 shrink-0 select-none">
        <img
          src="https://www.echopanda.me/logo.webp"
          alt="Logo"
          className="h-7 w-auto object-contain"
        />
        <span className={`text-base font-bold tracking-tight ${isLightMode ? "text-zinc-900" : "text-white"}`}>
          Echo Panda
        </span>
      </NavLink>

      {/* ── CENTER: FLAT SEARCH ── */}
      <div className="flex-1 max-w-md mx-8 relative hidden sm:block">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
          <FaSearch size={13} />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => { const val = e.target.value; setSearchQuery(val); if (!val.trim()) navigate("/"); }}
          onKeyDown={(e) => e.key === "Enter" && searchQuery.trim() && performSearch(searchQuery)}
          placeholder="Search Audio Sequences..."
          className={`w-full rounded-xl py-2 pl-10 pr-10 text-sm outline-none border transition-all duration-200 ${styles.input}`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
          {searchQuery.trim() ? (
            <button
              onClick={() => performSearch(searchQuery)}
              className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${isLightMode ? "bg-zinc-900 text-white hover:bg-zinc-800" : "bg-white text-black hover:bg-zinc-200"}`}
            >
              <FaArrowRight size={8} />
            </button>
          ) : (
            <button
              onClick={() => setIsVoiceSearchOpen(true)}
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-1.5 rounded-md hover:bg-zinc-800/40"
            >
              <FaMicrophone size={12} />
            </button>
          )}
        </div>
      </div>

      {/* ── RIGHT: UTILITIES & AUTH ── */}
      <div className="flex items-center gap-5">
        <nav className="hidden lg:flex items-center gap-6">
          <NavLink to="/AboutUs" className={`text-xs uppercase tracking-wider transition-colors ${styles.navLink}`}>Intelligence</NavLink>
          <NavLink to="/ContactUs" className={`text-xs uppercase tracking-wider transition-colors ${styles.navLink}`}>Support</NavLink>
        </nav>

        {/* Theme Controller */}
        <button
          onClick={() => setIsLightMode(!isLightMode)}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${isLightMode ? "bg-zinc-100 text-zinc-600 hover:bg-zinc-200" : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"}`}
        >
          {isLightMode ? <FaMoon size={13} /> : <FaSun size={13} />}
        </button>

        {/* User Workspace Status */}
        {isUserLoggedIn ? (
          <NavLink to="/profile" className={`flex items-center gap-2.5 p-1 pr-3 rounded-xl transition-colors ${styles.userPill}`}>
            {userData?.photoURL ? (
              <img src={userData.photoURL} alt="Profile" className="w-7 h-7 rounded-lg object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-600 text-white text-[10px]"><FaUser size={10} /></div>
            )}
            <div className="hidden xl:block min-w-0">
                <p className="text-xs font-semibold text-white truncate leading-none mb-0.5">
                    {userData?.displayName || userData?.username || "Authenticated"}
                </p>
                <p className="text-[9px] font-medium text-blue-500 uppercase tracking-wider leading-none">Session Active</p>
            </div>
          </NavLink>
        ) : (
          <NavLink to="/login" className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${isLightMode ? "bg-zinc-900 text-white hover:bg-zinc-800" : "bg-blue-600 text-white hover:bg-blue-500"}`}>
            Log In
          </NavLink>
        )}

        {/* Mobile Navigation Trigger */}
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden text-zinc-400 hover:text-white transition-colors">
            <FaBars size={18} />
        </button>
      </div>

      {/* ── MOBILE ACCORDION OVERLAY ── */}
      {isMobileMenuOpen && (
        <div className={`absolute top-16 right-6 w-48 p-2 rounded-2xl shadow-xl border lg:hidden ${isLightMode ? "bg-white border-zinc-200" : "bg-black border-zinc-900"}`}>
          <div className="flex flex-col">
            <NavLink to="/AboutUs" className="px-4 py-2.5 text-xs font-medium text-zinc-400 hover:bg-zinc-900 hover:text-white rounded-lg transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Intelligence</NavLink>
            <NavLink to="/ContactUs" className="px-4 py-2.5 text-xs font-medium text-zinc-400 hover:bg-zinc-900 hover:text-white rounded-lg transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Support</NavLink>
          </div>
        </div>
      )}
    </header>
  );
};

export default NavBar;