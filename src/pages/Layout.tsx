import React, { useState } from "react";
import SideBar from "./SideBar";
import NavBar from "./NavBar";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isLightMode, setIsLightMode] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    // 1. Force the page container to layout items side-by-side (flex-row)
    <div className={`flex h-screen w-screen overflow-hidden ${
      isLightMode ? "bg-gray-50" : "bg-[#030712]"
    }`}>

      {/* LEFT COLUMN: Sidebar occupies its own full column down the screen */}
      <SideBar
        isLightMode={isLightMode}
        isCollapsed={isCollapsed}
        onToggleCollapse={setIsCollapsed}
      />

      {/* RIGHT COLUMN: Holds the top bar and the main content viewport underneath */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">

        {/* Top navbar sits cleanly to the right of the sidebar layout edge */}
        <NavBar
          isLightMode={isLightMode}
          setIsLightMode={setIsLightMode}
        />

        {/* This is where your page content/hero banner displays */}
        <main className="flex-1 overflow-y-auto px-6 md:px-10 py-6 hide-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;