
export interface Song {
  id: number;
  title: string;
  artistId: number;
}

export interface Artist {
  id: number | string;
  name: string;
  image_url?: string;
}

export const songs: Song[] = [
  { id: 1, title: "Blinding Lights", artistId: 1 },
  { id: 2, title: "Shape of You", artistId: 2 },
  { id: 3, title: "Someone Like You", artistId: 3 },
  { id: 4, title: "Rolling in the Deep", artistId: 3 },
  { id: 5, title: "Levitating", artistId: 4 },
  { id: 6, title: "Save Your Tears", artistId: 1 },
  { id: 7, title: "Thinking Out Loud", artistId: 2 },
  { id: 8, title: "Bad Habits", artistId: 2 },
  { id: 9, title: "Halo", artistId: 5 },
  { id: 10, title: "Yellow", artistId: 6 },
  { id: 11, title: "Watermelon Sugar", artistId: 7 },
  { id: 12, title: "Adore You", artistId: 7 },
  { id: 13, title: "Perfect", artistId: 2 },
  { id: 14, title: "Photograph", artistId: 2 },
  { id: 15, title: "Sky Full of Stars", artistId: 6 },
  { id: 16, title: "Happier", artistId: 2 },
  { id: 17, title: "Rolling", artistId: 8 },
  { id: 18, title: "Don't Start Now", artistId: 4 },
  { id: 19, title: "Cheap Thrills", artistId: 9 },
  { id: 20, title: "Shallow", artistId: 10 },
  { id: 21, title: "Someone You Loved", artistId: 11 },
  { id: 22, title: "Memories", artistId: 12 },
  { id: 23, title: "Chasing Cars", artistId: 13 },
  { id: 24, title: "Fix You", artistId: 6 },
  { id: 25, title: "Clocks", artistId: 6 },
   { id: 26, title: "Love Story", artistId: 14 },
   { id: 27, title: "Enchanted", artistId: 14 },
    { id: 28, title: "Blank Space", artistId: 14 }
];

export const artists: Artist[] = [
  { id: 1, name: "The Weeknd" },
  { id: 2, name: "Ed Sheeran" },
  { id: 3, name: "Adele" },
  { id: 4, name: "Dua Lipa" },
  { id: 5, name: "Beyoncé" },
  { id: 6, name: "Coldplay" },
  { id: 7, name: "Harry Styles" },
  { id: 8, name: "Linkin Park" },
  { id: 9, name: "Sia" },
  { id: 10, name: "Lady Gaga" },
  { id: 11, name: "Lewis Capaldi" },
  { id: 12, name: "Maroon 5" },
  { id: 13, name: "Snow Patrol" },
   { id: 14, name: "Taylor Swift" }
];


function levenshtein(a: string, b: string) {
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;
  const matrix: number[][] = Array.from({ length: al + 1 }, () => new Array(bl + 1).fill(0));
  for (let i = 0; i <= al; i++) matrix[i][0] = i;
  for (let j = 0; j <= bl; j++) matrix[0][j] = j;
  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[al][bl];
}


function isSimilar(text: string, q: string) {
  if (!q) return true;
  const t = text.toLowerCase();
  const s = q.toLowerCase();
  if (t.includes(s)) return true;

  const tokens = t.split(/\s+/);
  if (tokens.some((tok) => tok.includes(s))) return true;
  
  const maxDist = Math.max(1, Math.floor(Math.min(t.length, s.length) * 0.25));
  const dist = levenshtein(t, s);
  return dist <= maxDist;
}

export function searchContent(query: string) {
  const q = query.trim();

  // match artists by similarity
  const matchedArtists = artists.filter((a) => isSimilar(a.name, q));

  // match songs if title or artist similar
  const matchedSongs = songs.filter((s) => {
    if (!q) return true;
    const titleMatch = isSimilar(s.title, q);
    const artist = artists.find((a) => a.id === s.artistId);
    const artistMatch = artist ? isSimilar(artist.name, q) : false;
    return titleMatch || artistMatch;
  });

  return { songs: matchedSongs, artists: matchedArtists };
}
