import { createBrowserRouter, Navigate, useParams } from "react-router-dom";
import HomeLayout from "../layouts/HomeLayout";
import AuthLayout from "../layouts/AuthLayout";
import { routeConfig } from "./routeConfig";

import ArtistLayout from "../artist/ArtistLayout";
import ProtectedAdminRoute from "../artist/ProtectedAdminRoute";
import Dashboard from "../artist/pages/Dashboard";
import Songs from "../artist/pages/Songs";
import Artists from "../artist/pages/Artists";
import Albums from "../artist/pages/Albums";
import ArtistSettings from "../artist/pages/ArtistSettings";
import ArtistOnboarding from "../artist/pages/ArtistOnboarding";

function RedirectCategoryAlbum() {
  const { id } = useParams();
  return <Navigate to={`/artist/dashboard?legacy=category-${id ?? ""}`} replace />;
}

function RedirectTagAlbums() {
  const { tagId } = useParams();
  return <Navigate to={`/artist/dashboard?legacy=tag-${tagId ?? ""}`} replace />;
}

// Get main routes (menu, library, playlist, general) for HomeLayout
const mainRoutes = routeConfig.filter(
  (route) =>
    ["menu", "library", "playlist", "general", "other"].includes(route.group) &&
    route.component
);

// Get auth routes for AuthLayout
const authRoutes = routeConfig.filter(
  (route) => route.group === "auth" && route.component
);

const router = createBrowserRouter([
  // Auth routes first (so they match before HomeLayout catches everything)
  ...authRoutes.map((route) => ({
    path: route.path,
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: route.component ? <route.component /> : null,
      },
    ],
  })),
  // Public onboarding route for artists (accessible without ProtectedAdminRoute)
  { path: "/artist/onboarding", element: <ArtistOnboarding /> },
  // Home layout with main routes
  {
    path: "/",
    element: <HomeLayout />,
    children: mainRoutes.map((route) => ({
      path: route.path === "/" ? undefined : route.path,
      index: route.path === "/",
      element: route.component ? <route.component /> : null,
    })),
  },
  // Onboarding route (public, not under ProtectedAdminRoute, redirects after completion)
  // removed - now integrated below

  // Artist dashboard routes with ArtistLayout (Protected)
  {
    element: (
      <ProtectedAdminRoute>
        <ArtistLayout />
      </ProtectedAdminRoute>
    ),
    children: [
      { path: "/artist", element: <Navigate to="/artist/dashboard" replace /> },
      { path: "/artist/onboarding", element: <ArtistOnboarding /> },
      { path: "/artist/dashboard", element: <Dashboard /> },
      { path: "/artist/studio", element: <Artists /> },
      { path: "/artist/songs", element: <Songs /> },
      { path: "/artist/albums", element: <Albums /> },
      { path: "/artist/settings", element: <ArtistSettings /> },
    ],
  },
  
]);

export default router;

