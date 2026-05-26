import React, { useState } from "react";
import AppFooter from "./home/AppFooter";
import chyta from "../assets/chyta.png";
import mokot from "../assets/mokot.png";
import nimorl from "../assets/nimorl.png";
import rasy from "../assets/rasy.png";
import engyi from "../assets/engyi.png";
import aboutPic1 from "../assets/aboutUsPic/about1.jpg";
import aboutPic2 from "../assets/aboutUsPic/about2.jpg";
import aboutPic3 from "../assets/aboutUsPic/about3.jpg";
import aboutPic4 from "../assets/aboutUsPic/about4.jpg";
import lastSetionPic from "../assets/aboutUsPic/lastSectionPic.png";
const teamMembers = [
  { image: rasy, name: "Pa Borasy", role: "Team Leader" },
  { image: engyi, name: "Thoeun Engyi", role: "Team Member" },
  { image: mokot, name: "Pory Morokot", role: "Team Member" },
  { image: nimorl, name: "Neurn Nimorl", role: "Team Member" },
  { image: chyta, name: "Ney Sokchhyta", role: "Team Member" },
];

const messages = [
  {
    id: 1,
    text: "Bringing independent artists closer to their fans",
    avatar: aboutPic1,
  },
  {
    id: 2,
    text: "I love finding new music that reflects Khmer culture here.",
    avatar: aboutPic2,
  },
  {
    id: 3,
    text: "Discovering hidden gems has never been more exciting or simple.....",
    avatar: aboutPic3,
  },
];

const resources = [
  {
    id: "01.",
    title: "TOOLS",
    desc: "Professional tools for recording, mixing & mastering",
    gradient: "from-emerald-500/20 to-emerald-900/5",
    accent: "text-emerald-400",
  },
  {
    id: "02.",
    title: "PEOPLE",
    desc: "A strong community of artists, producers, and listeners",

    gradient: "from-orange-900/20 to-orange-900/5",
    accent: "text-orange-400",
  },
  {
    id: "03.",
    title: "ORGAN",
    fullTitle: "ORGANIZATION",
    desc: "Music management, project planning & distribution support",

    gradient: "from-blue-900/20 to-blue-900/5",
    accent: "text-blue-400",
  },
  {
    id: "04.",
    title: "DATAS",
    desc: "Analytics to help artists grow their audience",

    gradient: "from-purple-900/20 to-purple-900/5",
    accent: "text-purple-400",
  },
];
const AboutUs: React.FC = () => {
  const [isLightMode] = useState(false);

  return (
    <>
      <div className="flex flex-col min-h-screen w-full">

        {/* Hero Text */}
        <p className="font-bold text-3xl md:text-5xl mb-6">
          Find EchoPanda best{" "}
          <span className="text-blue-500">digital music experience</span> Tools
        </p>

        {/* Description */}
        <p className="mt-4 text-lg md:text-xl max-w-2xl">
          Explore a new generation of music platforms designed to empower
          artists, connect listeners, and bring authentic Khmer sound to the
          world.
        </p>

        {/* WHO WE ARE */}
        <p className="text-3xl font-bold mt-10 mb-8">
          WHO <span className="text-green-500">WE ARE</span>
        </p>

        {/* Team Members Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mt-10 mb-20 w-full max-w-7xl px-4">
          {teamMembers.map((member, index) => (
            <div key={index} className="flex flex-col items-center">
              <img
                src={member.image}
                alt={member.name}
                className="w-40 h-40 object-cover rounded-full shadow-lg mb-4"
              />
              <h3 className="text-xl font-semibold">{member.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{member.role}</p>
            </div>
          ))}
        </div>
        {/* === */}
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center z-10 mb-20">
          {/* Left Section: Typography */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              The EchoPanda Music Movement <br />
              is built on creativity and <br />
              <span className="text-blue-500">Open-Source</span>
            </h1>
          </div>

          {/* Right Section: Chat Cards */}
          <div className="flex flex-col gap-6 items-end relative">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="flex gap-4 w-full max-w-md items-start"
              >
                <img
                  src={msg.avatar}
                  alt="User Avatar"
                  className="w-10 h-10 rounded-full object-cover border-2 border-slate-700"
                />
                <div className="bg-[#1f2937] border border-slate-700 text-slate-300 p-4 rounded-2xl rounded-tl-none shadow-lg text-sm leading-relaxed">
                  {msg.text}
                </div>
              </div>
            ))}
            <div className="mt-4 flex gap-4 items-center">
              <div className="bg-blue-500 hover:bg-blue-600 transition-colors w-14 h-14 rounded-2xl rounded-br-3xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                ...
              </div>
              <img
                src={aboutPic4}
                alt="User Avatar"
                className="w-10 h-10 rounded-full object-cover border-2 border-yellow-500"
              />
            </div>
          </div>
        </div>
        {/* for the second section  */}

        <div className="mb-20">
          <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 z-10">
            {/* Left Section: Title */}
            <div className="lg:col-span-4 flex flex-col justify-center mb-8 lg:mb-0">
              <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                Resources <br />
                <span className="text-blue-500">We Provide</span>
              </h2>
            </div>

            {/* Right Section: Cards Grid */}
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {resources.map((item) => (
                <div
                  key={item.id}
                  className={`relative bg-[#161f2e] border border-slate-800 p-6 rounded-lg overflow-hidden group hover:border-slate-600 transition-all duration-300 flex flex-col justify-between h-64`}
                >
                  {/* Card ID at top left */}
                  <div className="absolute top-6 left-6 z-10">
                    <span className="text-slate-500 text-lg font-bold">
                      {item.id}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-slate-400 text-xl mb-8 relative z-10 max-w-[90%] mt-8">
                    {item.desc}
                  </p>

                  {/* Bottom: Background Text & Arrow */}
                  <div className="relative z-10 flex justify-end mt-auto">
                    <button className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors">
                      <div className="w-10 h-10 text-slate-400">
                        <svg viewBox="0 0 512 512" fill="none">
                          <path
                            fill="#C4D9FD"
                            d="M0,256c0,141.158,114.842,256,256,256V0C114.842,0,0,114.842,0,256z"
                          />
                          <path
                            fill="#A7C7FC"
                            d="M256,0v512c141.158,0,256-114.842,256-256S397.158,0,256,0z"
                          />
                          <path
                            fill="#5286FA"
                            d="M272.454,161.969c-4.366-4.364-10.283-6.817-16.457-6.817c-6.173,0-12.093,2.453-16.457,6.817 
        L115.422,286.09c-9.087,9.089-9.087,23.824,0.002,32.914c9.087,9.087,23.822,9.087,32.914-0.002l107.661-107.664l107.669,107.666 
        c4.541,4.541,10.498,6.814,16.454,6.814c5.956,0,11.913-2.273,16.455-6.817c9.089-9.089,9.089-23.824,0-32.914L272.454,161.969z"
                          />
                        </svg>
                      </div>
                    </button>
                  </div>

                  {/* Large Background Typography (Watermark) */}
                  <div className="absolute bottom-20 right-0 w-full overflow-hidden pointer-events-none select-none">
                    <span
                      className={`text-6xl  font-bold leading-none opacity-20  translate-y-4 tracking-tighter text-white stroke-text`}
                    >
                      {item.title}
                    </span>
                  </div>

                  {/* Gradient overlay - Triangle shape */}
                  <div
                    className={`absolute bottom-0 right-0 w-0 h-0 border-solid opacity-50`}
                    style={{
                      borderLeft: "200px solid transparent",
                      borderBottom: `200px solid`,
                      borderBottomColor:
                        item.id === "01."
                          ? "rgba(16, 185, 129, 0.2)"
                          : item.id === "02."
                          ? "rgba(249, 115, 22, 0.2)"
                          : item.id === "03."
                          ? "rgba(59, 130, 246, 0.2)"
                          : "rgba(168, 85, 247, 0.2)",
                    }}
                  ></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* third section */}
        <div className="mb-20">
          <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left Section: Typography */}
            <div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                All of our work and vision is defined by phrase <br />
                <span className="text-teal-400">“Being Creative”</span>
              </h2>
            </div>

            {/* Right Section: Illustration */}
            <div className="flex justify-center md:justify-end">
              {/* Replace the src below with the actual URL of your illustration image.
            For now, I'm using a placeholder to represent the laptop/notepad image.
          */}
              <img
                src={lastSetionPic}
                alt="Creative Vision Illustration"
                className="max-w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>

        <AppFooter isLightMode={isLightMode} />
      </div>
    </>
  );
};

export default AboutUs;
