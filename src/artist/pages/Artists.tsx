import React from "react";
import { NavLink } from "react-router-dom";
import {
  FaChartLine,
  FaCheckCircle,
  FaCompactDisc,
  FaCrown,
  FaEdit,
  FaFileAlt,
  FaImage,
  FaMusic,
  FaPlus,
  FaPlayCircle,
  FaRegChartBar,
  FaSave,
  FaUpload,
  FaUserCircle,
} from "react-icons/fa";

interface StudioCapability {
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
}

const capabilities: StudioCapability[] = [
  {
    title: "Upload Songs",
    description: "Add new tracks and queue them for processing.",
    icon: <FaUpload />,
    route: "/artist/songs",
  },
  {
    title: "Upload Album Covers",
    description: "Create artwork and attach it to releases.",
    icon: <FaImage />,
    route: "/artist/albums",
  },
  {
    title: "Create Albums",
    description: "Build albums, EPs, and singles from your own catalog.",
    icon: <FaCompactDisc />,
    route: "/artist/albums",
  },
  {
    title: "Release Singles",
    description: "Prepare standalone releases and schedule publishing.",
    icon: <FaPlayCircle />,
    route: "/artist/albums",
  },
  {
    title: "Edit Song Metadata",
    description: "Update title, duration, track order, and release info.",
    icon: <FaEdit />,
    route: "/artist/songs",
  },
  {
    title: "Upload Lyrics",
    description: "Attach synced .lrc lyrics to any song.",
    icon: <FaFileAlt />,
    route: "/artist/songs",
  },
  {
    title: "Save Drafts",
    description: "Keep unreleased work private until it is ready.",
    icon: <FaSave />,
    route: "/artist/albums",
  },
  {
    title: "Publish Releases",
    description: "Move a draft into a public release when everything is ready.",
    icon: <FaCheckCircle />,
    route: "/artist/albums",
  },
  {
    title: "Manage Profile",
    description: "Update your artist bio, image, and public profile.",
    icon: <FaUserCircle />,
    route: "/artist/settings",
  },
  {
    title: "Streaming Analytics",
    description: "Track plays, listeners, and release performance.",
    icon: <FaChartLine />,
    route: "/artist/dashboard",
  },
  {
    title: "Play Counts",
    description: "See which songs are getting traction over time.",
    icon: <FaRegChartBar />,
    route: "/artist/dashboard",
  },
  {
    title: "Listener Statistics",
    description: "Review audience growth and listening patterns.",
    icon: <FaCrown />,
    route: "/artist/dashboard",
  },
];

const quickActions = [
  { label: "Upload Song", route: "/artist/songs", icon: <FaMusic /> },
  { label: "Create Album", route: "/artist/albums", icon: <FaPlus /> },
  { label: "Open Analytics", route: "/artist/dashboard", icon: <FaChartLine /> },
  { label: "Edit Profile", route: "/artist/settings", icon: <FaUserCircle /> },
];

export default function ArtistsManager() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-6 md:p-12 text-white font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-200 text-xs font-bold uppercase tracking-[0.2em]">
              <FaCrown /> Artist Studio
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Build and publish your own <span className="text-purple-400">Echo Panda</span> catalog.
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              This workspace is for artists only. Manage your own songs, albums, covers, lyrics,
              publishing status, and analytics from one place.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full lg:w-auto">
            {quickActions.map((action) => (
              <NavLink
                key={action.label}
                to={action.route}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white hover:border-purple-500/40 hover:bg-white/10 transition-all"
              >
                {action.icon}
                {action.label}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Scope</p>
            <p className="mt-3 text-2xl font-black text-white">Own content only</p>
            <p className="mt-2 text-sm text-slate-400">Artists can only manage releases and profile data that belongs to their account.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Publishing</p>
            <p className="mt-3 text-2xl font-black text-white">Drafts to public</p>
            <p className="mt-2 text-sm text-slate-400">Keep releases private, finish metadata, then publish when ready.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Insights</p>
            <p className="mt-3 text-2xl font-black text-white">Plays and listeners</p>
            <p className="mt-2 text-sm text-slate-400">See streaming analytics, play counts, and listener statistics for your releases.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {capabilities.map((item) => (
            <NavLink
              key={item.title}
              to={item.route}
              className="group rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/10 transition-all hover:-translate-y-1 hover:border-purple-500/40 hover:bg-white/10"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xl shadow-lg shadow-purple-500/20">
                  {item.icon}
                </div>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 group-hover:text-purple-300 transition-colors">
                  Open
                </span>
              </div>
              <h2 className="mt-5 text-xl font-black text-white">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.description}</p>
            </NavLink>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-6 backdrop-blur-md">
            <h2 className="text-2xl font-black text-white">Artist release flow</h2>
            <div className="mt-5 space-y-4">
              {[
                "Upload your audio file",
                "Attach album cover and metadata",
                "Add synced lyrics in .lrc format",
                "Save as draft for later",
                "Publish when everything is ready",
              ].map((step, index) => (
                <div key={step} className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500/15 text-purple-300 font-black">
                    {index + 1}
                  </div>
                  <p className="pt-1 text-slate-300">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-6 backdrop-blur-md">
            <h2 className="text-2xl font-black text-white">Artist rules</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Artists must never manage other artists’ content. Every upload, release, lyric file,
              profile edit, and analytics view should be scoped to the authenticated artist account.
            </p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {[
                "Own songs only",
                "Own albums only",
                "Own profile only",
                "Own analytics only",
              ].map((rule) => (
                <div key={rule} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200">
                  {rule}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
