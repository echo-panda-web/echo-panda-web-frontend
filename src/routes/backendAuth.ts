export type BackendUserRole = "user" | "artist" | "publicer" | "admin";

export interface BackendAuthUser {
  id: number;
  user_id: number;
  name: string;
  email: string;
  role: BackendUserRole;
  artist_id: number | null;
}

export interface BackendAuthResponse {
  message: string;
  user: BackendAuthUser;
  redirect_to: string;
  token: string;
  token_type: string;
}

interface FirebaseLoginPayload {
  email: string;
  name?: string;
  firebase_uid?: string;
  provider?: string;
}

const viteEnv = (import.meta as any).env || {};

const BACKEND_API_BASE_URL =
  viteEnv.VITE_BACKEND_API_URL || "http://localhost:8082/api";

const BACKEND_BASE_URL = viteEnv.VITE_BACKEND_BASE_URL || "http://localhost:8082";

function normalizeRedirectTarget(target: string): string {
  if (target.startsWith("http://") || target.startsWith("https://")) {
    return target;
  }

  return `${BACKEND_BASE_URL}${target.startsWith("/") ? "" : "/"}${target}`;
}

export async function loginFirebaseUserToBackend(
  payload: FirebaseLoginPayload
): Promise<BackendAuthResponse> {
  const response = await fetch(`${BACKEND_API_BASE_URL}/firebase/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to synchronize Firebase login with backend API.");
  }

  return (await response.json()) as BackendAuthResponse;
}

export function getAdminBackendUrl(): string {
  return `${BACKEND_BASE_URL}/admin`;
}

export function resolveRedirectUrl(target: string): string {
  return normalizeRedirectTarget(target);
}
