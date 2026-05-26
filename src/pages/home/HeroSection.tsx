import React from "react";
import { useNavigate } from "react-router-dom";

interface Props {
  isLightMode: boolean;
}

const HeroSection: React.FC<Props> = () => {
  const navigate = useNavigate();


 const handleDiscover = () => {
    navigate("/discover");
  };

  const handleCreatePlaylist = () => {
    navigate("/playlist"); 
  };

  return (
    <section className="relative mt-4 mb-8 overflow-hidden min-h-[300px] md:min-h-[450px] lg:min-h-[550px]">
      
      {/* Bg Image */}
      <div className="absolute inset-0">
        <img 
          src="/image.png" 
          alt=""
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* container */}
      <div className="absolute inset-0 bg-black/40 md:bg-black/20"></div>

      {/* Content */}
      <div className="relative z-10 px-6 py-16 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center min-h-[300px]">
          
          {/* Left Content */}
          <div className="space-y-6 text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">
              All the <span className="text-blue-500">Best Songs</span><br />
              in One Place
            </h1>
            
            <p className="text-gray-200 text-sm md:text-base leading-relaxed max-w-xl mx-auto md:mx-0">
              On our website, you can access an amazing collection of popular and new songs.
              Stream high-quality music and enjoy without interruptions — whatever your taste,
              we have it ready for you.
            </p>

            {/* Buttons */}
           <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <button
                onClick={handleDiscover}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                Discover Now
              </button>

              <button
                onClick={handleCreatePlaylist}
                className="px-6 py-3 border border-blue-400 text-blue-300 rounded-lg hover:bg-blue-400/20 transition cursor-pointer"
              >
                Create Playlist
              </button>
            </div>
          </div>

          <div className="hidden md:block" />
        </div>
      </div>

    </section>
  );
};

export default HeroSection;
