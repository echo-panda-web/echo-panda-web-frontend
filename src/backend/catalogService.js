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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAlbums = getAlbums;
exports.getNewReleasesToday = getNewReleasesToday;
exports.getNewSongReleasesToday = getNewSongReleasesToday;
exports.getSongs = getSongs;
exports.getDerivedArtists = getDerivedArtists;
exports.getPopularArtists = getPopularArtists;
exports.getGenres = getGenres;
exports.getDerivedTags = getDerivedTags;
exports.getDerivedCategories = getDerivedCategories;
exports.getTags = getTags;
exports.getHomeTags = getHomeTags;
var backendUrls_1 = require("./backendUrls");
var songMediaApi_1 = require("./songMediaApi");
var resolveSongsCount = function (album) {
    if (typeof album.songs_count === "number") {
        return album.songs_count;
    }
    if (Array.isArray(album.songs)) {
        return album.songs.length;
    }
    return undefined;
};
var request = function (path) { return __awaiter(void 0, void 0, void 0, function () {
    var res, errorData, errorMessage;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, fetch((0, backendUrls_1.buildApiUrl)(path), {
                    headers: {
                        Accept: "application/json",
                    },
                })];
            case 1:
                res = _a.sent();
                if (!!res.ok) return [3 /*break*/, 3];
                return [4 /*yield*/, res.json().catch(function () { return null; })];
            case 2:
                errorData = _a.sent();
                errorMessage = (errorData === null || errorData === void 0 ? void 0 : errorData.message) ||
                    (errorData === null || errorData === void 0 ? void 0 : errorData.error) ||
                    (errorData === null || errorData === void 0 ? void 0 : errorData.detail) ||
                    (typeof errorData === "string" ? errorData : "") ||
                    res.statusText ||
                    "HTTP ".concat(res.status);
                throw new Error("Request failed: ".concat(errorMessage));
            case 3: return [4 /*yield*/, res.json()];
            case 4: return [2 /*return*/, (_a.sent())];
        }
    });
}); };
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
function getAlbums() {
    return __awaiter(this, arguments, void 0, function (limit, params) {
        var queryParams, data, rows;
        var _this = this;
        if (limit === void 0) { limit = 10; }
        if (params === void 0) { params = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    queryParams = new URLSearchParams(__assign({ per_page: String(Math.max(1, limit)), sort_by: "latest" }, Object.fromEntries(Object.entries(params).map(function (_a) {
                        var k = _a[0], v = _a[1];
                        return [k, String(v)];
                    }))));
                    return [4 /*yield*/, request("/albums?".concat(queryParams.toString()))];
                case 1:
                    data = _a.sent();
                    rows = Array.isArray(data === null || data === void 0 ? void 0 : data.data) ? data.data : [];
                    return [2 /*return*/, Promise.all(rows.map(function (album) { return __awaiter(_this, void 0, void 0, function () {
                            var _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        _a = {
                                            id: String(album.id),
                                            title: album.title,
                                            cover_key: album.cover_key || null
                                        };
                                        return [4 /*yield*/, (0, songMediaApi_1.getSignedAlbumCoverUrl)(album.id)];
                                    case 1: return [2 /*return*/, (_a.cover_url = (_b.sent()) || undefined,
                                            _a.release_date = album.release_date || undefined,
                                            _a.scheduled_at = album.scheduled_at || undefined,
                                            _a.created_at = album.created_at || undefined,
                                            _a.songs_count = album.songs_count || resolveSongsCount(album) || 0,
                                            _a.type = album.type || undefined,
                                            _a.artists = getArtistName(album.artist, album.artist_name)
                                                ? [{ id: String(album.artist_id || album.id), name: String(getArtistName(album.artist, album.artist_name)), image_url: undefined }]
                                                : [],
                                            _a)];
                                }
                            });
                        }); }))];
            }
        });
    });
}
function getNewReleasesToday() {
    return __awaiter(this, arguments, void 0, function (limit) {
        var data, rows, error_1;
        var _this = this;
        if (limit === void 0) { limit = 10; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, request("/albums/new-releases-today?limit=".concat(Math.max(1, limit)))];
                case 1:
                    data = _a.sent();
                    rows = Array.isArray(data === null || data === void 0 ? void 0 : data.data) ? data.data : [];
                    return [2 /*return*/, Promise.all(rows.map(function (album) { return __awaiter(_this, void 0, void 0, function () {
                            var _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        _a = {
                                            id: String(album.id),
                                            title: album.title,
                                            cover_key: album.cover_key || null
                                        };
                                        return [4 /*yield*/, (0, songMediaApi_1.getSignedAlbumCoverUrl)(album.id)];
                                    case 1: return [2 /*return*/, (_a.cover_url = (_b.sent()) || album.cover_url || undefined,
                                            _a.release_date = album.release_date || undefined,
                                            _a.scheduled_at = album.scheduled_at || undefined,
                                            _a.created_at = album.created_at || undefined,
                                            _a.songs_count = resolveSongsCount(album),
                                            _a.type = album.type || undefined,
                                            _a.artists = getArtistName(album.artist, album.artist_name)
                                                ? [{ id: String(album.artist_id || album.id), name: String(getArtistName(album.artist, album.artist_name)), image_url: undefined }]
                                                : [],
                                            _a)];
                                }
                            });
                        }); }))];
                case 2:
                    error_1 = _a.sent();
                    console.error('Error fetching today new releases:', error_1);
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getNewSongReleasesToday() {
    return __awaiter(this, arguments, void 0, function (limit) {
        var data, rows, error_2;
        var _this = this;
        if (limit === void 0) { limit = 10; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, request("/songs/new-releases-today?limit=".concat(Math.max(1, limit)))];
                case 1:
                    data = _a.sent();
                    rows = Array.isArray(data === null || data === void 0 ? void 0 : data.data) ? data.data : [];
                    return [2 /*return*/, Promise.all(rows.map(function (song) { return __awaiter(_this, void 0, void 0, function () {
                            var _a, _b, _c, _d, _e, _f, _g, _h;
                            return __generator(this, function (_j) {
                                return [2 /*return*/, ({
                                        id: String(song.id),
                                        title: song.title,
                                        duration: Number(song.duration || 0),
                                        album_id: (_a = song.album_id) !== null && _a !== void 0 ? _a : null,
                                        original_key: (_b = song.original_key) !== null && _b !== void 0 ? _b : null,
                                        cover_key: (_c = song.cover_key) !== null && _c !== void 0 ? _c : null,
                                        preview_key: (_d = song.preview_key) !== null && _d !== void 0 ? _d : null,
                                        audio_url: (_e = song.audio_url) !== null && _e !== void 0 ? _e : null,
                                        songCover_url: (_g = (_f = song.cover_url) !== null && _f !== void 0 ? _f : song.cover_key) !== null && _g !== void 0 ? _g : null,
                                        created_at: (_h = song.created_at) !== null && _h !== void 0 ? _h : '',
                                        artists: Array.isArray(song.artists) ? song.artists.map(function (artist) { return ({ id: String(artist.id), name: artist.stage_name || artist.name || '', image_url: artist.image_url }); }) : [],
                                        album: song.album ? {
                                            id: String(song.album.id),
                                            title: song.album.title,
                                            cover_url: song.album.cover_url,
                                        } : null,
                                    })];
                            });
                        }); }))];
                case 2:
                    error_2 = _a.sent();
                    console.error('Error fetching today new song releases:', error_2);
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getSongs() {
    return __awaiter(this, arguments, void 0, function (limit, params) {
        var queryParams, data, rows;
        var _this = this;
        if (limit === void 0) { limit = 25; }
        if (params === void 0) { params = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    queryParams = new URLSearchParams(__assign({ per_page: String(Math.max(1, limit)), sort_by: "latest" }, Object.fromEntries(Object.entries(params).map(function (_a) {
                        var k = _a[0], v = _a[1];
                        return [k, String(v)];
                    }))));
                    return [4 /*yield*/, request("/songs?".concat(queryParams.toString()))];
                case 1:
                    data = _a.sent();
                    rows = Array.isArray(data === null || data === void 0 ? void 0 : data.data) ? data.data : [];
                    return [2 /*return*/, Promise.all(rows.map(function (song) { return __awaiter(_this, void 0, void 0, function () {
                            var coverUrl, _a;
                            var _b, _c;
                            var _d, _e;
                            return __generator(this, function (_f) {
                                switch (_f.label) {
                                    case 0: return [4 /*yield*/, (0, songMediaApi_1.getSignedSongCoverUrl)(song.id)];
                                    case 1:
                                        coverUrl = _f.sent();
                                        _b = {
                                            id: String(song.id),
                                            title: song.title,
                                            duration: song.duration,
                                            album_id: song.album_id ? String(song.album_id) : null,
                                            original_key: song.original_key || null,
                                            cover_key: song.cover_key || null,
                                            preview_key: song.preview_key || null,
                                            audio_url: (0, backendUrls_1.resolveMediaUrl)(song.original_key || song.preview_key),
                                            songCover_url: coverUrl || (0, backendUrls_1.resolveMediaUrl)(song.songCover_url || ((_d = song.album) === null || _d === void 0 ? void 0 : _d.cover_url) || ((_e = song.album) === null || _e === void 0 ? void 0 : _e.cover_image)),
                                            created_at: song.created_at,
                                            artists: getArtistName(song.artist, song.artist_name)
                                                ? [{ id: String(song.artist_id || song.id), name: String(getArtistName(song.artist, song.artist_name)), image_url: undefined }]
                                                : []
                                        };
                                        if (!song.album) return [3 /*break*/, 3];
                                        _c = {
                                            id: String(song.album.id),
                                            title: song.album.title
                                        };
                                        return [4 /*yield*/, (0, songMediaApi_1.getSignedAlbumCoverUrl)(song.album.id)];
                                    case 2:
                                        _a = (_c.cover_url = (_f.sent()) || undefined,
                                            _c);
                                        return [3 /*break*/, 4];
                                    case 3:
                                        _a = null;
                                        _f.label = 4;
                                    case 4: return [2 /*return*/, (_b.album = _a,
                                            _b)];
                                }
                            });
                        }); }))];
            }
        });
    });
}
function getDerivedArtists() {
    return __awaiter(this, arguments, void 0, function (limit, search) {
        var response, data, normalizedSearch_1, filtered, withSignedUrls, err_1, songs, albums, map, normalizedSearch, list;
        var _this = this;
        if (limit === void 0) { limit = 10; }
        if (search === void 0) { search = ""; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    return [4 /*yield*/, fetch((0, backendUrls_1.buildApiUrl)('/artists'), {
                            headers: { Accept: 'application/json' },
                        })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.json().catch(function () { return null; })];
                case 2:
                    data = _a.sent();
                    if (!((data === null || data === void 0 ? void 0 : data.data) && Array.isArray(data.data))) return [3 /*break*/, 4];
                    normalizedSearch_1 = search.trim().toLowerCase();
                    filtered = data.data
                        .filter(function (artist) {
                        return normalizedSearch_1 ? artist.name.toLowerCase().includes(normalizedSearch_1) : true;
                    });
                    return [4 /*yield*/, Promise.all(filtered.map(function (artist) { return __awaiter(_this, void 0, void 0, function () {
                            var signedImageUrl;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        signedImageUrl = artist.image_url;
                                        if (!(artist.image_url && artist.id)) return [3 /*break*/, 2];
                                        return [4 /*yield*/, (0, songMediaApi_1.getSignedArtistImageUrl)(artist.id)];
                                    case 1:
                                        signedImageUrl = _a.sent();
                                        _a.label = 2;
                                    case 2: return [2 /*return*/, {
                                            id: artist.id ? String(artist.id) : encodeURIComponent(artist.name),
                                            name: artist.name,
                                            image_url: signedImageUrl || undefined,
                                        }];
                                }
                            });
                        }); }))];
                case 3:
                    withSignedUrls = _a.sent();
                    return [2 /*return*/, withSignedUrls.slice(0, Math.max(1, limit))];
                case 4: return [3 /*break*/, 6];
                case 5:
                    err_1 = _a.sent();
                    console.error('Error fetching artists from public endpoint:', err_1);
                    return [3 /*break*/, 6];
                case 6: return [4 /*yield*/, getSongs(200)];
                case 7:
                    songs = _a.sent();
                    return [4 /*yield*/, getAlbums(200)];
                case 8:
                    albums = _a.sent();
                    map = new Map();
                    songs.forEach(function (song) {
                        song.artists.forEach(function (artist) {
                            if (!map.has(artist.name.toLowerCase())) {
                                map.set(artist.name.toLowerCase(), {
                                    id: encodeURIComponent(artist.name),
                                    name: artist.name,
                                    image_url: artist.image_url,
                                });
                            }
                        });
                    });
                    albums.forEach(function (album) {
                        (album.artists || []).forEach(function (artist) {
                            if (!map.has(artist.name.toLowerCase())) {
                                map.set(artist.name.toLowerCase(), {
                                    id: encodeURIComponent(artist.name),
                                    name: artist.name,
                                    image_url: artist.image_url,
                                });
                            }
                        });
                    });
                    normalizedSearch = search.trim().toLowerCase();
                    list = Array.from(map.values()).filter(function (artist) {
                        return normalizedSearch ? artist.name.toLowerCase().includes(normalizedSearch) : true;
                    });
                    return [2 /*return*/, list.slice(0, Math.max(1, limit))];
            }
        });
    });
}
function getPopularArtists() {
    return __awaiter(this, arguments, void 0, function (limit) {
        var data, rows, error_3;
        var _this = this;
        if (limit === void 0) { limit = 10; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, request("/artists/popular?limit=".concat(Math.max(1, limit)))];
                case 1:
                    data = _a.sent();
                    rows = Array.isArray(data === null || data === void 0 ? void 0 : data.data) ? data.data : [];
                    return [2 /*return*/, Promise.all(rows.map(function (artist) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                return [2 /*return*/, ({
                                        id: String(artist.id),
                                        name: artist.name,
                                        image_url: artist.image_url || undefined,
                                        play_count: artist.play_count,
                                        monthly_listeners: artist.monthly_listeners,
                                    })];
                            });
                        }); }))];
                case 2:
                    error_3 = _a.sent();
                    console.error('Error fetching popular artists:', error_3);
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    });
}
var normalizeCategories = function (items) { return __awaiter(void 0, void 0, void 0, function () {
    var normalized;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Promise.all((Array.isArray(items) ? items : [])
                    .map(function (item) { return __awaiter(void 0, void 0, void 0, function () {
                    var name, id, description, image_url, category;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                name = String((item === null || item === void 0 ? void 0 : item.name) || (item === null || item === void 0 ? void 0 : item.title) || (item === null || item === void 0 ? void 0 : item.genre) || "").trim();
                                if (!name) {
                                    return [2 /*return*/, null];
                                }
                                id = String((item === null || item === void 0 ? void 0 : item.id) || encodeURIComponent(name.toLowerCase()));
                                description = String((item === null || item === void 0 ? void 0 : item.description) || (item === null || item === void 0 ? void 0 : item.summary) || "".concat(name, " music")).trim();
                                return [4 /*yield*/, (0, songMediaApi_1.getSignedGenreImageUrl)(id)];
                            case 1:
                                image_url = _a.sent();
                                category = {
                                    id: id,
                                    slug: (item === null || item === void 0 ? void 0 : item.slug) ? String(item.slug) : undefined,
                                    name: name,
                                    description: description,
                                };
                                if (image_url) {
                                    category.image_url = image_url;
                                }
                                return [2 /*return*/, category];
                        }
                    });
                }); }))];
            case 1:
                normalized = _a.sent();
                return [2 /*return*/, normalized.filter(function (item) { return Boolean(item); })];
        }
    });
}); };
var DEFAULT_GENRES = [
    { id: "khmer", name: "Khmer", description: "Authentic Khmer sound" },
    { id: "pop", name: "Pop", description: "Popular music" },
    { id: "hip-hop", name: "Hip Hop", description: "Hip hop and rap" },
    { id: "rnb", name: "R&B", description: "Rhythm and Blues" },
    { id: "rock", name: "Rock", description: "Rock music" },
    { id: "electronic", name: "Electronic", description: "EDM and electronic" },
    { id: "jazz", name: "Jazz", description: "Jazz music" },
    { id: "classical", name: "Classical", description: "Classical music" },
    { id: "k-pop", name: "K-Pop", description: "Korean pop music" },
    { id: "lo-fi", name: "Lo-Fi", description: "Low fidelity beats" },
];
function getGenres() {
    return __awaiter(this, void 0, void 0, function () {
        var parseResponse, genresRes, data, fromGenres, error_4;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    parseResponse = function (data) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (!Array.isArray(data)) return [3 /*break*/, 2];
                                    return [4 /*yield*/, normalizeCategories(data)];
                                case 1: return [2 /*return*/, _a.sent()];
                                case 2:
                                    if (!Array.isArray(data === null || data === void 0 ? void 0 : data.data)) return [3 /*break*/, 4];
                                    return [4 /*yield*/, normalizeCategories(data.data)];
                                case 3: return [2 /*return*/, _a.sent()];
                                case 4:
                                    if (!Array.isArray(data === null || data === void 0 ? void 0 : data.genres)) return [3 /*break*/, 6];
                                    return [4 /*yield*/, normalizeCategories(data.genres)];
                                case 5: return [2 /*return*/, _a.sent()];
                                case 6: return [2 /*return*/, []];
                            }
                        });
                    }); };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    return [4 /*yield*/, fetch((0, backendUrls_1.buildApiUrl)("/genres"), {
                            headers: { Accept: "application/json" }
                        })];
                case 2:
                    genresRes = _a.sent();
                    if (!genresRes.ok) return [3 /*break*/, 5];
                    return [4 /*yield*/, genresRes.json()];
                case 3:
                    data = _a.sent();
                    return [4 /*yield*/, parseResponse(data)];
                case 4:
                    fromGenres = _a.sent();
                    if (fromGenres.length > 0) {
                        return [2 /*return*/, fromGenres];
                    }
                    _a.label = 5;
                case 5: return [3 /*break*/, 7];
                case 6:
                    error_4 = _a.sent();
                    console.error("Error fetching genres from backend:", error_4);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/, DEFAULT_GENRES];
            }
        });
    });
}
function getDerivedTags() {
    return __awaiter(this, void 0, void 0, function () {
        var res, json, rows, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, fetch((0, backendUrls_1.buildApiUrl)("/tags"), {
                            headers: { Accept: "application/json" }
                        })];
                case 1:
                    res = _a.sent();
                    if (!res.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, res.json()];
                case 2:
                    json = _a.sent();
                    rows = Array.isArray(json) ? json : (Array.isArray(json === null || json === void 0 ? void 0 : json.data) ? json.data : []);
                    if (rows.length > 0) {
                        return [2 /*return*/, rows
                                .filter(function (t) { return t === null || t === void 0 ? void 0 : t.name; })
                                .map(function (t) { return ({
                                // Use tag name as value — Song.mood stores the tag name string
                                id: String(t.name),
                                name: String(t.name),
                                description: t.slug || String(t.name).toLowerCase(),
                            }); })];
                    }
                    _a.label = 3;
                case 3: return [3 /*break*/, 5];
                case 4:
                    error_5 = _a.sent();
                    console.error("Error fetching tags from backend:", error_5);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/, [
                        { id: "chill", name: "Chill", description: "Relaxing vibes" },
                        { id: "workout", name: "Workout", description: "High energy for the gym" },
                        { id: "party", name: "Party", description: "Upbeat celebration music" },
                    ]];
            }
        });
    });
}
function getDerivedCategories() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, getGenres()];
        });
    });
}
function getTags() {
    return __awaiter(this, void 0, void 0, function () {
        var url, res, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    url = (0, backendUrls_1.buildApiUrl)('/tags');
                    return [4 /*yield*/, fetch(url)];
                case 1:
                    res = _a.sent();
                    if (!res.ok)
                        throw new Error("HTTP ".concat(res.status));
                    return [4 /*yield*/, res.json()];
                case 2: return [2 /*return*/, _a.sent()];
                case 3:
                    err_2 = _a.sent();
                    console.warn('Failed to load tags', err_2);
                    return [2 /*return*/, []];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function getHomeTags() {
    return __awaiter(this, void 0, void 0, function () {
        var albums, newReleases, trending;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getAlbums(12)];
                case 1:
                    albums = _a.sent();
                    newReleases = albums.slice(0, 6);
                    trending = albums.slice(6, 12);
                    return [2 /*return*/, [
                            {
                                id: "new-releases",
                                name: "New Releases",
                                description: "Latest albums on Echo Panda",
                                display_order: 1,
                                albums: newReleases,
                            },
                            {
                                id: "trending",
                                name: "Trending",
                                description: "Popular picks right now",
                                display_order: 2,
                                albums: trending,
                            },
                        ]];
            }
        });
    });
}
