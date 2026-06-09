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
exports.getMostPlayedAlbums = exports.getUserListeningStats = exports.getRecentlyPlayed = exports.getMostPlayedSongs = exports.getSongPlayCount = exports.trackSongPlay = void 0;
var viteEnv = import.meta.env || {};
var BACKEND_API_BASE_URL = viteEnv.VITE_BACKEND_API_URL || "http://localhost:8082/api";
var getBackendToken = function () {
    return localStorage.getItem("userToken") || localStorage.getItem("authToken");
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
var getArtistName = function (artistField, artistNameField) {
    if (artistField && typeof artistField === "object") {
        return artistField.stage_name || artistField.name || artistNameField || null;
    }
    if (typeof artistField === "string" && artistField.trim()) {
        return artistField;
    }
    if (artistNameField && artistNameField.trim()) {
        return artistNameField;
    }
    return null;
};
var songMediaApi_1 = require("./songMediaApi");
var songMediaApi_2 = require("./songMediaApi");
var backendUrls_1 = require("./backendUrls");
// Track a song play/listen
var trackSongPlay = function (songId) { return __awaiter(void 0, void 0, void 0, function () {
    var parsed, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                parsed = Number.parseInt(songId, 10);
                if (Number.isNaN(parsed)) {
                    console.error("Invalid numeric song id for trackSongPlay:", songId);
                    return [2 /*return*/, false];
                }
                if (!getBackendToken()) {
                    // Silently return for guests, tracking only for logged in users
                    return [2 /*return*/, false];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, backendRequest("/listen-history", {
                        method: "POST",
                        body: JSON.stringify({ song_id: parsed }),
                    })];
            case 2:
                _a.sent();
                console.log("\u2705 Tracked play for song ".concat(songId));
                return [2 /*return*/, true];
            case 3:
                error_1 = _a.sent();
                console.error("Error tracking play:", error_1);
                return [2 /*return*/, false];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.trackSongPlay = trackSongPlay;
// Get play count for a song (all users)
var getSongPlayCount = function (songId) { return __awaiter(void 0, void 0, void 0, function () {
    var data, parsed_1, row, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, backendRequest("/stats/most-played-songs?limit=200")];
            case 1:
                data = _a.sent();
                parsed_1 = Number.parseInt(songId, 10);
                if (Number.isNaN(parsed_1))
                    return [2 /*return*/, 0];
                row = ((data === null || data === void 0 ? void 0 : data.data) || []).find(function (item) { return item.song_id === parsed_1; });
                return [2 /*return*/, (row === null || row === void 0 ? void 0 : row.play_count) || 0];
            case 2:
                error_2 = _a.sent();
                console.error("Error getting play count:", error_2);
                return [2 /*return*/, 0];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getSongPlayCount = getSongPlayCount;
// Get most played songs (global)
var getMostPlayedSongs = function () {
    var args_1 = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args_1[_i] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([], args_1, true), void 0, function (limit) {
        var result, error_3;
        if (limit === void 0) { limit = 25; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, backendRequest("/stats/most-played-songs?limit=".concat(limit))];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, Promise.all(((result === null || result === void 0 ? void 0 : result.data) || []).map(function (row) { return __awaiter(void 0, void 0, void 0, function () {
                            var song, coverUrl, albumCoverUrl, _a;
                            var _b, _c;
                            return __generator(this, function (_d) {
                                switch (_d.label) {
                                    case 0:
                                        song = row.song;
                                        return [4 /*yield*/, (0, songMediaApi_1.getSignedSongCoverUrl)(song.id)];
                                    case 1:
                                        coverUrl = _d.sent();
                                        if (!((_b = song.album) === null || _b === void 0 ? void 0 : _b.id)) return [3 /*break*/, 3];
                                        return [4 /*yield*/, (0, songMediaApi_2.getSignedAlbumCoverUrl)(song.album.id)];
                                    case 2:
                                        _a = _d.sent();
                                        return [3 /*break*/, 4];
                                    case 3:
                                        _a = null;
                                        _d.label = 4;
                                    case 4:
                                        albumCoverUrl = _a;
                                        return [2 /*return*/, {
                                                id: String(song.id),
                                                title: song.title,
                                                duration: song.duration,
                                                audio_url: song.audio_url || song.original_key || null,
                                                songCover_url: coverUrl || albumCoverUrl || ((_c = song.album) === null || _c === void 0 ? void 0 : _c.cover_url) || null,
                                                album_id: song.album_id ? String(song.album_id) : null,
                                                album: song.album
                                                    ? {
                                                        id: String(song.album.id),
                                                        title: song.album.title,
                                                        cover_url: albumCoverUrl || null,
                                                    }
                                                    : null,
                                                artists: getArtistName(song.artist, song.artist_name)
                                                    ? [{ id: String(song.artist_id || song.id), name: String(getArtistName(song.artist, song.artist_name)), image_url: "" }]
                                                    : [],
                                                play_count: row.play_count,
                                            }];
                                }
                            });
                        }); }))];
                case 2:
                    error_3 = _a.sent();
                    console.error("Error fetching most played songs:", error_3);
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    });
};
exports.getMostPlayedSongs = getMostPlayedSongs;
// Get user's recently played songs
var getRecentlyPlayed = function () {
    var args_1 = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args_1[_i] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([], args_1, true), void 0, function (limit) {
        var result, rows, error_4;
        if (limit === void 0) { limit = 25; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!getBackendToken())
                        return [2 /*return*/, []];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, backendRequest("/listen-history?per_page=".concat(limit))];
                case 2:
                    result = _a.sent();
                    rows = (result === null || result === void 0 ? void 0 : result.data) || [];
                    return [2 /*return*/, Promise.all(rows.map(function (item) { return __awaiter(void 0, void 0, void 0, function () {
                            var song, coverUrl, albumCoverUrl, _a;
                            var _b, _c;
                            return __generator(this, function (_d) {
                                switch (_d.label) {
                                    case 0:
                                        song = item.song;
                                        return [4 /*yield*/, (0, songMediaApi_1.getSignedSongCoverUrl)(song.id)];
                                    case 1:
                                        coverUrl = _d.sent();
                                        if (!((_b = song.album) === null || _b === void 0 ? void 0 : _b.id)) return [3 /*break*/, 3];
                                        return [4 /*yield*/, (0, songMediaApi_2.getSignedAlbumCoverUrl)(song.album.id)];
                                    case 2:
                                        _a = _d.sent();
                                        return [3 /*break*/, 4];
                                    case 3:
                                        _a = null;
                                        _d.label = 4;
                                    case 4:
                                        albumCoverUrl = _a;
                                        return [2 /*return*/, {
                                                id: String(song.id),
                                                title: song.title,
                                                duration: song.duration,
                                                audio_url: song.audio_url || song.original_key || null,
                                                songCover_url: coverUrl || albumCoverUrl || ((_c = song.album) === null || _c === void 0 ? void 0 : _c.cover_url) || null,
                                                album_id: song.album_id ? String(song.album_id) : null,
                                                album: song.album
                                                    ? {
                                                        id: String(song.album.id),
                                                        title: song.album.title,
                                                        cover_url: albumCoverUrl || null,
                                                    }
                                                    : null,
                                                artists: getArtistName(song.artist, song.artist_name)
                                                    ? [{ id: String(song.artist_id || song.id), name: String(getArtistName(song.artist, song.artist_name)), image_url: "" }]
                                                    : [],
                                                listened_at: item.updated_at || item.created_at,
                                            }];
                                }
                            });
                        }); }))];
                case 3:
                    error_4 = _a.sent();
                    console.error("Error fetching recently played:", error_4);
                    return [2 /*return*/, []];
                case 4: return [2 /*return*/];
            }
        });
    });
};
exports.getRecentlyPlayed = getRecentlyPlayed;
// Get user's listening stats
var getUserListeningStats = function () { return __awaiter(void 0, void 0, void 0, function () {
    var result, rows, totalPlays, uniqueSongs, artistCounts_1, topArtist, error_5;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!getBackendToken())
                    return [2 /*return*/, { totalPlays: 0, uniqueSongs: 0, topArtist: null }];
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                return [4 /*yield*/, backendRequest("/listen-history?per_page=200")];
            case 2:
                result = _b.sent();
                rows = (result === null || result === void 0 ? void 0 : result.data) || [];
                totalPlays = rows.reduce(function (sum, item) { return sum + (item.play_count || 0); }, 0);
                uniqueSongs = new Set(rows.map(function (item) { return item.song_id; })).size;
                artistCounts_1 = {};
                rows.forEach(function (item) {
                    var _a, _b;
                    var artistName = getArtistName((_a = item.song) === null || _a === void 0 ? void 0 : _a.artist, (_b = item.song) === null || _b === void 0 ? void 0 : _b.artist_name);
                    var plays = item.play_count || 0;
                    if (artistName) {
                        artistCounts_1[artistName] = (artistCounts_1[artistName] || 0) + plays;
                    }
                });
                topArtist = ((_a = Object.entries(artistCounts_1).sort(function (a, b) { return b[1] - a[1]; })[0]) === null || _a === void 0 ? void 0 : _a[0]) || null;
                return [2 /*return*/, { totalPlays: totalPlays, uniqueSongs: uniqueSongs, topArtist: topArtist }];
            case 3:
                error_5 = _b.sent();
                console.error("Error fetching stats:", error_5);
                return [2 /*return*/, { totalPlays: 0, uniqueSongs: 0, topArtist: null }];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getUserListeningStats = getUserListeningStats;
var resolveAlbumSongsCount = function (album) {
    if (typeof (album === null || album === void 0 ? void 0 : album.songs_count) === "number") {
        return album.songs_count;
    }
    if (Array.isArray(album === null || album === void 0 ? void 0 : album.songs)) {
        return album.songs.length;
    }
    return undefined;
};
var fetchAlbumSongCounts = function () { return __awaiter(void 0, void 0, void 0, function () {
    var counts, list, _i, _a, album, count, error_6;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                counts = new Map();
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                return [4 /*yield*/, backendRequest("/albums?per_page=200&sort_by=latest")];
            case 2:
                list = _b.sent();
                for (_i = 0, _a = (list === null || list === void 0 ? void 0 : list.data) || []; _i < _a.length; _i++) {
                    album = _a[_i];
                    count = resolveAlbumSongsCount(album);
                    if (typeof count === "number") {
                        counts.set(String(album.id), count);
                    }
                }
                return [3 /*break*/, 4];
            case 3:
                error_6 = _b.sent();
                console.error("Error enriching album song counts:", error_6);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/, counts];
        }
    });
}); };
// Get most played albums
var getMostPlayedAlbums = function () {
    var args_1 = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args_1[_i] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([], args_1, true), void 0, function (limit) {
        var result, albums, countsById_1, error_7;
        if (limit === void 0) { limit = 10; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    return [4 /*yield*/, backendRequest("/stats/most-played-albums?limit=".concat(limit))];
                case 1:
                    result = _a.sent();
                    return [4 /*yield*/, Promise.all(((result === null || result === void 0 ? void 0 : result.data) || []).map(function (row) { return __awaiter(void 0, void 0, void 0, function () {
                            var album, signedCoverUrl, _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        album = row.album;
                                        if (!(album === null || album === void 0 ? void 0 : album.id)) return [3 /*break*/, 2];
                                        return [4 /*yield*/, (0, songMediaApi_2.getSignedAlbumCoverUrl)(album.id)];
                                    case 1:
                                        _a = _b.sent();
                                        return [3 /*break*/, 3];
                                    case 2:
                                        _a = null;
                                        _b.label = 3;
                                    case 3:
                                        signedCoverUrl = _a;
                                        return [2 /*return*/, {
                                                id: String(album.id),
                                                title: album.title,
                                                cover_url: signedCoverUrl || (0, backendUrls_1.resolveMediaUrl)(album.cover_url || album.cover_image || album.cover_key) || null,
                                                release_date: album.release_date,
                                                scheduled_at: album.scheduled_at,
                                                created_at: album.created_at,
                                                songs_count: resolveAlbumSongsCount(album),
                                                artists: getArtistName(album.artist, album.artist_name)
                                                    ? [{ id: String(album.artist_id || album.id), name: String(getArtistName(album.artist, album.artist_name)), image_url: "" }]
                                                    : [],
                                                play_count: row.play_count,
                                            }];
                                }
                            });
                        }); }))];
                case 2:
                    albums = _a.sent();
                    if (!albums.some(function (album) { return album.songs_count == null; })) return [3 /*break*/, 4];
                    return [4 /*yield*/, fetchAlbumSongCounts()];
                case 3:
                    countsById_1 = _a.sent();
                    return [2 /*return*/, albums.map(function (album) {
                            var _a, _b;
                            return (__assign(__assign({}, album), { songs_count: (_b = (_a = album.songs_count) !== null && _a !== void 0 ? _a : countsById_1.get(album.id)) !== null && _b !== void 0 ? _b : 0 }));
                        })];
                case 4: return [2 /*return*/, albums];
                case 5:
                    error_7 = _a.sent();
                    console.error("Error fetching most played albums:", error_7);
                    return [2 /*return*/, []];
                case 6: return [2 /*return*/];
            }
        });
    });
};
exports.getMostPlayedAlbums = getMostPlayedAlbums;
