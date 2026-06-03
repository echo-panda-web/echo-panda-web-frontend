import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import SideBar from "../pages/SideBar";
import  NavBar  from '../pages/NavBar';
import Player from '../components/Player';
import { getCurrentUser } from "../routes/authContext";

const HomeLayout: React.FC = () => {
  const [isLightMode, setIsLightMode] = useState(false);
  // Start collapsed by default on first run
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Keep the sidebar collapsed on small screens, but do not auto-expand on larger screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarCollapsed(true);
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Persistent role-based redirection
  useEffect(() => {
    const user = getCurrentUser();
    // If the user is an artist/publicer/admin and is at the root or public pages,
    // redirect them to their dedicated dashboard to maintain their role UI.
    if (user && ["artist", "publicer", "admin"].includes(user.role || "")) {
      // Only redirect if they are not already navigating to a specific public page they might need
      // but usually, artists want to stay in their dashboard.
      if (location.pathname === "/" || location.pathname === "/login" || location.pathname === "/register") {
        navigate("/artist/dashboard", { replace: true });
      }
    }
  }, [location.pathname, navigate]);

  const mainBg = isLightMode ? "bg-gray-50" : "bg-black";
  const textColor = isLightMode ? "text-gray-900" : "text-white";

 return (
    <div className="flex flex-col h-screen">
      {/* NavBar at the top */}
      <NavBar isLightMode={isLightMode} setIsLightMode={setIsLightMode} />

      {/* Content area with sidebar */}
      <div className={`flex flex-1 ${mainBg} ${textColor} overflow-hidden`}>
        <SideBar 
          isLightMode={isLightMode}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={setIsSidebarCollapsed}
        />

        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-12 w-full">
          <Outlet />
        </main>

        
      </div>
      
      {/* Global Player at the bottom */}
      <Player />
    </div>
  );
};

export default HomeLayout;
