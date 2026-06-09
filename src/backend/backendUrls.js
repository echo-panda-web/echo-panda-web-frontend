"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BACKEND_BASE_URL = exports.BACKEND_API_BASE_URL = void 0;
exports.buildApiUrl = buildApiUrl;
exports.resolveMediaUrl = resolveMediaUrl;
var viteEnv = import.meta.env || {};
var DEFAULT_BACKEND_API_URL = "http://localhost:8082/api";
var DEFAULT_BACKEND_BASE_URL = "http://localhost:8082";
function ensureHttpProtocol(value) {
    var trimmed = String(value || "").trim();
    if (!trimmed) {
        return "";
    }
    if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
    }
    if (trimmed.startsWith("//")) {
        return "http:".concat(trimmed);
    }
    return "http://".concat(trimmed.replace(/^\/+/, ""));
}
function trimTrailingSlash(value) {
    return value.replace(/\/+$/, "");
}
function joinUrl(base, path) {
    var normalizedBase = trimTrailingSlash(base);
    var normalizedPath = String(path || "").trim();
    if (!normalizedPath) {
        return normalizedBase;
    }
    return "".concat(normalizedBase, "/").concat(normalizedPath.replace(/^\/+/, ""));
}
var apiUrlFromEnv = ensureHttpProtocol(viteEnv.VITE_BACKEND_API_URL || DEFAULT_BACKEND_API_URL);
var baseUrlFromEnv = ensureHttpProtocol(viteEnv.VITE_BACKEND_BASE_URL || "");
var derivedBaseUrl = apiUrlFromEnv.replace(/\/api\/?$/i, "");
exports.BACKEND_API_BASE_URL = trimTrailingSlash(apiUrlFromEnv || DEFAULT_BACKEND_API_URL);
exports.BACKEND_BASE_URL = trimTrailingSlash(baseUrlFromEnv || derivedBaseUrl || DEFAULT_BACKEND_BASE_URL);
function buildApiUrl(path) {
    return joinUrl(exports.BACKEND_API_BASE_URL, path);
}
function resolveMediaUrl(value) {
    var raw = String(value || "").trim();
    if (!raw || raw === "null" || raw === "undefined") {
        return null;
    }
    // If it's already a full URL with protocol
    if (/^(https?:|blob:|data:)/i.test(raw)) {
        // If it's a localhost URL, ensure it's not being filtered out accidentally
        // unless you specifically want to block localhost media
        return raw;
    }
    // Protocol relative
    if (raw.startsWith("//")) {
        return "http:".concat(raw);
    }
    // Root relative - append base URL
    if (raw.startsWith("/")) {
        return "".concat(exports.BACKEND_BASE_URL).concat(raw);
    }
    // Handle localhost or IP with port but no protocol
    if (/^(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/i.test(raw)) {
        return "http://".concat(raw);
    }
    // Handle generic domain:port/path without protocol
    if (/^[^/\s]+:\d+(\/.*)?$/.test(raw)) {
        return "http://".concat(raw);
    }
    // Fallback: join with backend base URL
    return joinUrl(exports.BACKEND_BASE_URL, raw);
}
