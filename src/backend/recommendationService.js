"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecommendationsForInterests = getRecommendationsForInterests;
exports.getHomeRecommendations = getHomeRecommendations;
exports.trackInteraction = trackInteraction;
exports.getAdaptiveRecommendations = getAdaptiveRecommendations;
exports.getColdStartRecommendations = getColdStartRecommendations;
exports.getSimilarRecommendations = getSimilarRecommendations;
exports.trackRecommendationEvent = trackRecommendationEvent;
var backendUrls_1 = require("./backendUrls");
var catalogService_1 = require("./catalogService");
var songMediaApi_1 = require("./songMediaApi");
var viteEnv = import.meta.env || {};
var BACKEND_API_BASE_URL = viteEnv.VITE_BACKEND_API_URL || "http://localhost:8082/api";
var getBackendToken = function () {
    return (localStorage.getItem("userToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("token"));
};
var backendRequest = function (path_1) {
    var args_1 = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args_1[_i - 1] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([path_1], args_1, true), void 0, function (path, init) {
        var token, headers, response, data;
        if (init === void 0) { init = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    token = getBackendToken();
                    headers = __assign({ Accept: "application/json", "Content-Type": "application/json" }, init.headers);
                    if (token) {
                        headers.Authorization = "Bearer ".concat(token);
                    }
                    return [4 /*yield*/, fetch("".concat(BACKEND_API_BASE_URL).concat(path), __assign(__assign({}, init), { headers: headers }))];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, response.json().catch(function () { return null; })];
                case 2:
                    data = _a.sent();
                    if (!response.ok) {
                        throw new Error((data === null || data === void 0 ? void 0 : data.message) || "Request failed with ".concat(response.status));
                    }
                    return [2 /*return*/, data];
            }
        });
    });
};
var enrichRecommendations = function (recommendations) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, Promise.all(recommendations.map(function (rec) { return __awaiter(void 0, void 0, void 0, function () {
                var song, coverUrl, albumCoverUrl, _a, resolvedCover;
                var _b, _c, _d;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            song = rec.song;
                            if (!(song === null || song === void 0 ? void 0 : song.id))
                                return [2 /*return*/, rec];
                            return [4 /*yield*/, (0, songMediaApi_1.getSignedSongCoverUrl)(song.id)];
                        case 1:
                            coverUrl = _e.sent();
                            if (!((_b = song.album) === null || _b === void 0 ? void 0 : _b.id)) return [3 /*break*/, 3];
                            return [4 /*yield*/, (0, songMediaApi_1.getSignedAlbumCoverUrl)(song.album.id)];
                        case 2:
                            _a = _e.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            _a = null;
                            _e.label = 4;
                        case 4:
                            albumCoverUrl = _a;
                            resolvedCover = coverUrl || albumCoverUrl || ((_c = song.album) === null || _c === void 0 ? void 0 : _c.cover_url) || null;
                            return [2 /*return*/, __assign(__assign({}, rec), { song: __assign(__assign({}, song), { songCover_url: resolvedCover, cover_url: resolvedCover, album: song.album
                                            ? __assign(__assign({}, song.album), { cover_url: albumCoverUrl || ((_d = song.album) === null || _d === void 0 ? void 0 : _d.cover_url) || null }) : song.album }) })];
                    }
                });
            }); }))];
    });
}); };
var normalize = function (value) { return value.trim().toLowerCase(); };
var getToken = function () {
    return localStorage.getItem("userToken") || localStorage.getItem("authToken");
};
var authenticatedRequest = function (path_1) {
    var args_1 = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args_1[_i - 1] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([path_1], args_1, true), void 0, function (path, options) {
        var token, headers, response;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    token = getToken();
                    headers = {
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                    };
                    if (token) {
                        headers["Authorization"] = "Bearer ".concat(token);
                    }
                    return [4 /*yield*/, fetch((0, backendUrls_1.buildApiUrl)(path), __assign(__assign({}, options), { headers: __assign(__assign({}, headers), options.headers) }))];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("Request failed: ".concat(response.statusText));
                    }
                    return [2 /*return*/, response.json()];
            }
        });
    });
};
function getRecommendationsForInterests(interests) {
    return __awaiter(this, void 0, void 0, function () {
        var songs, allAlbumsMap, albums, wanted, matches;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, catalogService_1.getSongs)(500)];
                case 1:
                    songs = _a.sent();
                    allAlbumsMap = new Map();
                    songs.forEach(function (song) {
                        if (!song.album)
                            return;
                        var existing = allAlbumsMap.get(song.album.id);
                        if (!existing) {
                            allAlbumsMap.set(song.album.id, {
                                id: song.album.id,
                                title: song.album.title,
                                cover_url: song.album.cover_url,
                                artists: song.artists || [],
                                type: "album",
                            });
                        }
                    });
                    albums = Array.from(allAlbumsMap.values());
                    if (albums.length === 0)
                        return [2 /*return*/, []];
                    wanted = new Set((interests || []).map(normalize).filter(Boolean));
                    if (wanted.size === 0)
                        return [2 /*return*/, albums.slice(0, 12)];
                    matches = albums.filter(function (album) {
                        var title = normalize(album.title || "");
                        var artists = (album.artists || []).map(function (a) { return normalize(a.name); }).join(" ");
                        for (var _i = 0, wanted_1 = wanted; _i < wanted_1.length; _i++) {
                            var token = wanted_1[_i];
                            if (title.includes(token) || artists.includes(token)) {
                                return true;
                            }
                        }
                        return false;
                    });
                    return [2 /*return*/, matches.length > 0 ? matches.slice(0, 12) : albums.slice(0, 12)];
            }
        });
    });
}
// New Dynamic Recommendation Endpoints
function getHomeRecommendations() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, authenticatedRequest('/recommendations/home')];
        });
    });
}
function trackInteraction(songId, action) {
    return __awaiter(this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, authenticatedRequest('/interactions/track', {
                            method: 'POST',
                            body: JSON.stringify({ song_id: songId, action: action }),
                        })];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    error_1 = _a.sent();
                    console.warn('Failed to track interaction:', error_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getAdaptiveRecommendations() {
    return __awaiter(this, arguments, void 0, function (limit) {
        var payload, error_2;
        if (limit === void 0) { limit = 20; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!getBackendToken()) {
                        return [2 /*return*/, []];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, backendRequest("/recommendations?limit=".concat(Math.max(1, Math.min(limit, 50))))];
                case 2:
                    payload = _a.sent();
                    return [2 /*return*/, enrichRecommendations((payload === null || payload === void 0 ? void 0 : payload.data) || [])];
                case 3:
                    error_2 = _a.sent();
                    console.error("Error fetching adaptive recommendations:", error_2);
                    return [2 /*return*/, []];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function getColdStartRecommendations() {
    return __awaiter(this, arguments, void 0, function (limit) {
        var payload, error_3;
        if (limit === void 0) { limit = 20; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, backendRequest("/recommendations/cold-start?limit=".concat(Math.max(1, Math.min(limit, 50))))];
                case 1:
                    payload = _a.sent();
                    return [2 /*return*/, enrichRecommendations((payload === null || payload === void 0 ? void 0 : payload.data) || [])];
                case 2:
                    error_3 = _a.sent();
                    console.error("Error fetching cold-start recommendations:", error_3);
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getSimilarRecommendations(songId_1) {
    return __awaiter(this, arguments, void 0, function (songId, limit) {
        var payload, error_4;
        if (limit === void 0) { limit = 10; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, backendRequest("/recommendations/similar/".concat(songId, "?limit=").concat(Math.max(1, Math.min(limit, 20))))];
                case 1:
                    payload = _a.sent();
                    return [2 /*return*/, enrichRecommendations((payload === null || payload === void 0 ? void 0 : payload.data) || [])];
                case 2:
                    error_4 = _a.sent();
                    console.error("Error fetching similar recommendations:", error_4);
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function trackRecommendationEvent(event) {
    return __awaiter(this, void 0, void 0, function () {
        var error_5;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!getBackendToken()) {
                        return [2 /*return*/, false];
                    }
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, backendRequest("/recommendations/events", {
                            method: "POST",
                            body: JSON.stringify({
                                song_id: Number(event.songId),
                                event_type: event.eventType,
                                recommendation_score: (_a = event.recommendationScore) !== null && _a !== void 0 ? _a : 0,
                                recommendation_reason: (_b = event.recommendationReason) !== null && _b !== void 0 ? _b : null,
                            }),
                        })];
                case 2:
                    _c.sent();
                    return [2 /*return*/, true];
                case 3:
                    error_5 = _c.sent();
                    console.error("Error tracking recommendation event:", error_5);
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    });
}
