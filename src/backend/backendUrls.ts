const viteEnv = (import.meta as any).env || {};

const DEFAULT_BACKEND_API_URL = "http://localhost:8082/api";
const DEFAULT_BACKEND_BASE_URL = "http://localhost:8082";

function ensureHttpProtocol(value: string): string {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("//")) {
    return `http:${trimmed}`;
  }

  return `http://${trimmed.replace(/^\/+/, "")}`;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function joinUrl(base: string, path: string): string {
  const normalizedBase = trimTrailingSlash(base);
  const normalizedPath = String(path || "").trim();

  if (!normalizedPath) {
    return normalizedBase;
  }

  return `${normalizedBase}/${normalizedPath.replace(/^\/+/, "")}`;
}

const apiUrlFromEnv = ensureHttpProtocol(viteEnv.VITE_BACKEND_API_URL || DEFAULT_BACKEND_API_URL);
const baseUrlFromEnv = ensureHttpProtocol(viteEnv.VITE_BACKEND_BASE_URL || "");

const derivedBaseUrl = apiUrlFromEnv.replace(/\/api\/?$/i, "");

export const BACKEND_API_BASE_URL = trimTrailingSlash(apiUrlFromEnv || DEFAULT_BACKEND_API_URL);
export const BACKEND_BASE_URL = trimTrailingSlash(baseUrlFromEnv || derivedBaseUrl || DEFAULT_BACKEND_BASE_URL);

export function buildApiUrl(path: string): string {
  return joinUrl(BACKEND_API_BASE_URL, path);
}

export function resolveMediaUrl(value?: string | null): string | null {
  const raw = String(value || "").trim();
  if (!raw || raw === "null" || raw === "undefined") {
    return null;
  }

  if (/^(https?:|blob:|data:)/i.test(raw)) {
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(raw)) {
      return null;
    }

    return raw;
  }

  if (raw.startsWith("//")) {
    return `http:${raw}`;
  }

  if (raw.startsWith("/")) {
    return `${BACKEND_BASE_URL}${raw}`;
  }

  return joinUrl(BACKEND_BASE_URL, raw);
}