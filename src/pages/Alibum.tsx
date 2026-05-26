import React from "react";
import AlbumHeader from "./Album/AlbumHeader";
import AlbumGrid from "./Album/AlbumGrid";

export default function Album() {
  return (
    <div className="min-h-screen bg-linear-to-b from-black via-zinc-950 to-black">
      <AlbumHeader isLightMode={false} />
      <AlbumGrid />
    </div>
  ); 
}
