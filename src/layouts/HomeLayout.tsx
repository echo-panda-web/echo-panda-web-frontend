import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import SideBar from "../pages/SideBar";
import  NavBar  from '../pages/NavBar';
import Player from '../components/Player';

const HomeLayout: React.FC = () => {
  const [isLightMode, setIsLightMode] = useState(false);
  // Start collapsed by default on first run
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

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
