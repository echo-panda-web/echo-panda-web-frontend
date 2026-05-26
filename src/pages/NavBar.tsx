import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
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
import { useLocation } from "react-router-dom";
import { getCurrentUser, isAuthenticated } from "../routes/authContext";
import { searchContent } from "../backend/searchService";
interface NavBarProps {
  isLightMode: boolean;
  setIsLightMode: (value: boolean) => void;
}

const NavBar: React.FC<NavBarProps> = ({ isLightMode, setIsLightMode }) => {
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
  const [searchResults, setSearchResults] = useState<any>(null);

  // Initialize Web Speech API
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

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  useEffect(() => {
    const loggedIn = isAuthenticated();
    setIsUserLoggedIn(loggedIn);
    if (loggedIn) {
      setUserData(getCurrentUser());
    }
  }, []);

  // Clear search query 
  useEffect(() => {
    if (!location.pathname.startsWith("/search") && searchQuery) {
      setSearchQuery("");
      setSearchResults(null);
    }
  }, [location.pathname]);

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
        // finished
        setDisplayText(voiceText);
        if (!isListening && voiceText.trim()) {
          setTimeout(() => {
            handleAutoSearch(voiceText.trim());
          }, 800);
        }
      }
    };

    rafId = requestAnimationFrame(step);

    return () => {
      if (rafId != null) cancelAnimationFrame(rafId);
    };
  }, [voiceText, isListening]);

  useEffect(() => {
    if (isVoiceSearchOpen && !isListening) {
      startVoiceSearch();
    }
  }, [isVoiceSearchOpen]);

  const startVoiceSearch = () => {
    if (recognitionRef.current && !isListening) {
      setVoiceText("");
      setDisplayText("");
      recognitionRef.current.start();
    }
  };

  const stopVoiceSearch = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

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

  const performSearch = async (query: string) => {
    if (!query.trim()) return;

    try {
      // Perform search from Supabase
      const results = await searchContent(query);
      setSearchResults(results);
      console.log("Search Results:", results);

      // Navigate to search result page with query 
      navigate(`/search?q=${encodeURIComponent(query)}`);
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const headerBg = isLightMode
    ? "bg-white border-gray-200"
    : "bg-black border-gray-800";
  const linkTextColor = isLightMode
    ? "text-gray-600 hover:text-gray-900"
    : "text-gray-300 hover:text-white";
  const inputBg = isLightMode
    ? "bg-gray-200 text-gray-900 placeholder-gray-500"
    : "bg-gray-900 text-white placeholder-gray-400";

  // Voice search modal
  const VoiceSearchModal = () => (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center backdrop-blur-sm z-50">
      <button
        onClick={() => {
          setIsVoiceSearchOpen(false);
          stopVoiceSearch();
        }}
        className="absolute top-8 right-8 text-white hover:text-gray-300 transition-colors z-50"
      >
        <FaTimes className="h-8 w-8" />
      </button>

      <div className="relative w-full h-screen flex flex-col items-center justify-center px-8">
        <div className="flex flex-col items-center gap-6">
          <div
            className={`w-56 h-56 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
              isListening
                ? "bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse scale-110"
                : hasSpoken
                ? "bg-gradient-to-r from-green-500 to-emerald-500"
                : "bg-gradient-to-r from-gray-700 to-gray-800"
            }`}
          >
            <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-lg">
              <FaMicrophone
                className={`h-12 w-12 transition-colors ${
                  isListening
                    ? "text-blue-600 animate-bounce"
                    : hasSpoken
                    ? "text-green-600"
                    : "text-gray-400"
                }`}
              />
            </div>
          </div>

          <div className="text-center">
            <p className="text-white text-3xl font-bold">
              {isListening ? "🎤 Listening..." : hasSpoken ? "✓ Got it!" : "Ready to speak"}
            </p>
            <p className="text-gray-400 mt-2 text-lg">Search songs by voice</p>
          </div>
        </div>

        {displayText && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-900/40 to-purple-900/40 p-8 rounded-2xl max-w-xl border border-blue-500/30 backdrop-blur animate-in fade-in duration-500">
            <p className="text-gray-400 text-sm mb-4">You said:</p>
            <p className="text-white text-2xl font-semibold leading-relaxed break-words">
              {displayText}
              {isListening && <span className="animate-pulse">|</span>}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
   <header
  className={`w-full border-b px-4 md:px-8 py-4 min-h-[90px] flex items-center justify-between ${headerBg}`}
>

      {isVoiceSearchOpen && <VoiceSearchModal />}

      {/* Logo */}
      <NavLink
        to="/"
        className="flex items-center gap-3 text-2xl md:text-3xl font-bold"
      >
        <img
          src="/logo.png"
          alt="Echo Panda Logo"
          className="h-10 md:h-12 w-auto"
        />

        {/* Text */}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
          Echo Panda
        </span>
      </NavLink>

      {/* Search */}
      <div className="flex-1 mx-4 relative max-w-full md:max-w-xl">
        <div className="absolute left-3 top-3 text-gray-400">
          <FaSearch />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            const val = e.target.value;
            setSearchQuery(val);
            if (!val.trim()) {
              //  remove search results and go home
              setSearchResults(null);
              navigate("/");
            }
          }}
          onKeyPress={(e) => {
            if (e.key === "Enter" && searchQuery.trim()) {
              performSearch(searchQuery);
            }
          }}
          placeholder="Search..."
          className={`w-full rounded-full py-2 pl-10 pr-12 focus:ring-2 focus:ring-blue-500 ${inputBg}`}
        />
        <div className="absolute right-3 top-3 flex items-center gap-2">
          {searchQuery.trim() ? (
            <div
              className="text-gray-400 hover:text-blue-500 cursor-pointer transition-colors"
              onClick={() => {
                performSearch(searchQuery);
              }}
              title="Search"
            >
              <FaArrowRight />
            </div>
          ) : (
            <div
              className="text-gray-400 hover:text-blue-500 cursor-pointer transition-colors"
              onClick={() => {
                if (isVoiceSearchOpen) {
                  setIsVoiceSearchOpen(false);
                  stopVoiceSearch();
                } else {
                  setIsVoiceSearchOpen(true);
                }
              }}
              title={isVoiceSearchOpen ? "Close voice search" : "Voice search"}
            >
              {isVoiceSearchOpen ? <FaTimes /> : <FaMicrophone />}
            </div>
          )}
        </div>
      </div>

      {/* Desktop Menu */}
      <div className="hidden md:flex items-center space-x-15">
        <NavLink to="/AboutUs" className={linkTextColor}>
          About Us
        </NavLink>
        <NavLink to="/ContactUs" className={linkTextColor}>
          Contact
        </NavLink>

        {isUserLoggedIn ? (
          <NavLink
            to="/profile"
            className="flex items-center gap-2 px-4 py-2 rounded-full transition-all hover:scale-105"
          >
            {userData?.photoURL ? (
              <img
                src={userData.photoURL}
                alt="Profile"
                className="w-8 h-8 rounded-full border-2 border-blue-500"
              />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-500">
                <FaUser className="text-white text-sm" />
              </div>
            )}
            <span className={`${linkTextColor} text-base`}>
              {userData?.displayName || userData?.username || "Profile"}
            </span>
          </NavLink>
        ) : (
          <>
            {/* Login */}
            <NavLink
              to="/login"
              className="px-7 py-2.5 text-base font-semibold rounded-full border border-blue-500 text-blue-500
                        hover:bg-blue-500 hover:text-white hover:shadow-md
                        transition-all duration-300"
            >
              Login
            </NavLink>

            {/* Sign Up */}
            <NavLink
              to="/register"
              className="px-6 py-2.5 text-base font-semibold rounded-full
                        bg-gradient-to-r from-blue-500 to-purple-600 text-white
                        shadow-md hover:shadow-blue-500/40 hover:scale-105
                        transition-all duration-300"
            >
              Sign Up
            </NavLink>
          </>
        )}
      </div>

      {/* Mobile Menu */}
      <div className="md:hidden">
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <FaBars className="h-6 w-6 text-white" />
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="absolute top-14 right-4 bg-gray-800 text-white w-48 py-3 rounded-xl shadow-lg md:hidden z-50">
          <div className="flex flex-col space-y-2 px-3">
            <NavLink
              to="/aboutUs"
              className="dropdown-item"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About Us
            </NavLink>

            <NavLink
              to="/ContactUs"
              className="dropdown-item"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contact
            </NavLink>

            {isUserLoggedIn ? (
              <NavLink
                to="/profile"
                className="dropdown-item"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Profile
              </NavLink>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className="dropdown-item"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </NavLink>

                <NavLink
                  to="/register"
                  className="dropdown-item bg-blue-600 text-center py-2 rounded-lg hover:bg-blue-700 transition-all"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Register
                </NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default NavBar;
