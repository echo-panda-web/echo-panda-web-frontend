const viteEnv = (import.meta as any).env || {};
const BACKEND_API_BASE_URL =
  viteEnv.VITE_BACKEND_API_URL || "http://localhost:8082/api";

const getBackendToken = (): string | null => {
  return localStorage.getItem("userToken") || localStorage.getItem("authToken");
};

const toSongId = (songId: string): number | null => {
  // Backend songs use numeric IDs. Reject UUID values instead of coercing them.
  if (!/^\d+$/.test(songId)) {
    return null;
  }

  return Number.parseInt(songId, 10);
};

const backendRequest = async <T = any>(
  path: string,
  init: RequestInit = {}
): Promise<T> => {
  const token = getBackendToken();

  if (!token) {
    throw new Error("Missing backend auth token");
  }

  const response = await fetch(`${BACKEND_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data?.message || `Request failed with ${response.status}`;
    throw new Error(message);
  }

  return data as T;
};

// Check if a song is in user's favorites
export const isSongFavorite = async (songId: string): Promise<boolean> => {
  if (!getBackendToken()) return false;

  const parsedSongId = toSongId(songId);
  if (parsedSongId === null) return false;

  try {
    const data = await backendRequest<{ is_favorited: boolean }>(
      "/favorites/songs/check",
      {
        method: "POST",
        body: JSON.stringify({ song_id: parsedSongId }),
      }
    );

    return !!data?.is_favorited;
  } catch (error) {
    console.error("Error checking favorite:", error);
    return false;
  }
};

// Add song to favorites
export const addToFavorites = async (songId: string): Promise<boolean> => {
  const parsedSongId = toSongId(songId);

  if (parsedSongId === null) {
    console.error(
      "❌ [Favorites] Invalid song id for backend favorites (expected numeric PostgreSQL id):",
      songId
    );
    return false;
  }

  if (!getBackendToken()) {
    console.error("❌ [Favorites] User not logged in - cannot add to favorites");
    return false;
  }

  console.log(`🔄 [Favorites] Adding song ${parsedSongId} to favorites`);

  try {
    await backendRequest("/favorites/songs", {
      method: "POST",
      body: JSON.stringify({ song_id: parsedSongId }),
    });

    console.log(`✅ [Favorites] Song ${parsedSongId} added to favorites`);
    return true;
  } catch (error: any) {
    if ((error?.message || "").toLowerCase().includes("already in favorites")) {
      return true;
    }

    console.error("❌ [Favorites] Exception adding to favorites:", error);
    return false;
  }
};

// Remove song from favorites
export const removeFromFavorites = async (songId: string): Promise<boolean> => {
  const parsedSongId = toSongId(songId);

  if (parsedSongId === null) {
    console.error(
      "Invalid song id for backend favorites (expected numeric PostgreSQL id)",
      songId
    );
    return false;
  }

  if (!getBackendToken()) {
    console.error("User not logged in");
    return false;
  }

  try {
    await backendRequest("/favorites/songs/remove", {
      method: "POST",
      body: JSON.stringify({ song_id: parsedSongId }),
    });

    console.log(`✅ Song ${parsedSongId} removed from favorites`);
    return true;
  } catch (error: any) {
    if ((error?.message || "").toLowerCase().includes("favorite not found")) {
      return true;
    }

    console.error("Error removing from favorites:", error);
    return false;
  }
};

// Get all favorite songs for current user
export const getUserFavorites = async (): Promise<string[]> => {
  if (!getBackendToken()) return [];

  try {
    const data = await backendRequest<{ data?: any[] }>("/profile/favorite-songs");
    const rows = data?.data || [];

    return rows
      .map((item: any) => item?.favoritable?.id ?? item?.favoritable_id)
      .filter((id: any) => id !== undefined && id !== null)
      .map((id: any) => String(id));
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return [];
  }
};

// Toggle favorite status
export const toggleFavorite = async (songId: string): Promise<boolean> => {
  console.log(`🔄 [Favorites] Toggling favorite status for song ${songId}`);
  const isFav = await isSongFavorite(songId);
  console.log(`📊 [Favorites] Current favorite status: ${isFav ? 'IS FAVORITE' : 'NOT FAVORITE'}`);
  
  if (isFav) {
    console.log(`🔄 [Favorites] Removing from favorites...`);
    return await removeFromFavorites(songId);
  } else {
    console.log(`🔄 [Favorites] Adding to favorites...`);
    return await addToFavorites(songId);
  }
};
