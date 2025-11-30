import * as WebBrowser from "expo-web-browser";
import {
  AudioFeatureKey,
  MatchProfile,
  SpotifyPlaylist,
  SpotifyTrack,
  SpotifyUserProfile,
} from "../types/spotify";

export const SPOTIFY_CONFIG = {
  clientId: "1229e889987745908ae1cd0a35681e3c",
  // Spotify requires HTTPS URL format
  redirectUri: "https://beatbond.gladiatorx.in/spotify-callback",
  scopes: [
    "user-read-email",
    "user-read-private",
    "user-read-recently-played",
    "playlist-read-private",
    "user-top-read",
  ],
};

export const discovery = {
  authorizationEndpoint: "https://accounts.spotify.com/authorize",
  tokenEndpoint: "https://accounts.spotify.com/api/token",
};

WebBrowser.maybeCompleteAuthSession();

export class SpotifyApi {
  private accessToken: string | null = null;

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  getAccessToken() {
    return this.accessToken;
  }

  async fetchPlaylists(): Promise<SpotifyPlaylist[]> {
    // Return mock playlists for demo
    return mockPlaylists;
  }

  async fetchMatches(): Promise<MatchProfile[]> {
    // Return mock matches for demo
    return mockMatches;
  }
}

// ==================== MOCK DATA ====================

// Mock Users with diverse profiles
const mockUsers: SpotifyUserProfile[] = [
  {
    id: "user-1",
    displayName: "River Hart",
    pronouns: "they/them",
    bio: "Brooklyn-based art director mixing ambient and alt R&B",
    city: "Brooklyn, NY",
    avatar: {
      url: "https://images.unsplash.com/photo-1504593811423-6dd665756598?w=400",
    },
  },
  {
    id: "user-2",
    displayName: "Luna Chen",
    pronouns: "she/her",
    bio: "Night owl DJ who lives for the underground scene 🎧",
    city: "Los Angeles, CA",
    avatar: {
      url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
    },
  },
  {
    id: "user-3",
    displayName: "Marcus Williams",
    pronouns: "he/him",
    bio: "Jazz enthusiast by day, electronic producer by night",
    city: "Chicago, IL",
    avatar: {
      url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    },
  },
  {
    id: "user-4",
    displayName: "Sage Morrison",
    pronouns: "they/them",
    bio: "Vinyl collector | Synth lover | Always finding new sounds",
    city: "Portland, OR",
    avatar: {
      url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
    },
  },
  {
    id: "user-5",
    displayName: "Kai Nakamura",
    pronouns: "he/him",
    bio: "From Tokyo with love 🇯🇵 City pop and future funk",
    city: "San Francisco, CA",
    avatar: {
      url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
    },
  },
  {
    id: "user-6",
    displayName: "Aria Patel",
    pronouns: "she/her",
    bio: "Classical meets electronic. Violinist exploring new dimensions",
    city: "Austin, TX",
    avatar: {
      url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
    },
  },
  {
    id: "user-7",
    displayName: "Jordan Blake",
    pronouns: "they/them",
    bio: "Bedroom producer | Lo-fi curator | Coffee addict ☕",
    city: "Seattle, WA",
    avatar: {
      url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400",
    },
  },
  {
    id: "user-8",
    displayName: "Maya Rodriguez",
    pronouns: "she/her",
    bio: "Latin beats meet indie rock. Always dancing 💃",
    city: "Miami, FL",
    avatar: {
      url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400",
    },
  },
];

// Helper to generate audio features
const sampleVector = (seed: number): Record<AudioFeatureKey, number> => ({
  acousticness: Math.min(1, seed * 0.2 + Math.random() * 0.3),
  danceability: Math.min(1, 0.5 + (seed % 0.3) + Math.random() * 0.2),
  energy: Math.min(1, 0.6 + (seed % 0.2) + Math.random() * 0.2),
  instrumentalness: Math.min(1, seed * 0.1 + Math.random() * 0.3),
  liveness: Math.min(1, 0.2 + (seed % 0.2) + Math.random() * 0.2),
  speechiness: Math.min(1, 0.1 + (seed % 0.1) + Math.random() * 0.1),
  valence: Math.min(1, 0.4 + (seed % 0.4) + Math.random() * 0.2),
});

// Real track names for more authentic feel
const trackData = [
  { name: "Midnight City", artist: "M83", album: "Hurry Up, We're Dreaming" },
  { name: "Tadow", artist: "Masego & FKJ", album: "Tadow" },
  { name: "Redbone", artist: "Childish Gambino", album: "Awaken, My Love!" },
  { name: "Electric Feel", artist: "MGMT", album: "Oracular Spectacular" },
  { name: "Get Lucky", artist: "Daft Punk", album: "Random Access Memories" },
  { name: "Blinding Lights", artist: "The Weeknd", album: "After Hours" },
  { name: "Levitating", artist: "Dua Lipa", album: "Future Nostalgia" },
  { name: "Heat Waves", artist: "Glass Animals", album: "Dreamland" },
  { name: "Tame Impala", artist: "Let It Happen", album: "Currents" },
  { name: "Kyoto", artist: "Phoebe Bridgers", album: "Punisher" },
  { name: "Dreams", artist: "Fleetwood Mac", album: "Rumours" },
  { name: "Nights", artist: "Frank Ocean", album: "Blonde" },
  { name: "Pink + White", artist: "Frank Ocean", album: "Blonde" },
  { name: "Solo", artist: "Frank Ocean", album: "Blonde" },
  { name: "Thinkin Bout You", artist: "Frank Ocean", album: "Channel Orange" },
  { name: "Ivy", artist: "Frank Ocean", album: "Blonde" },
  { name: "Self Control", artist: "Frank Ocean", album: "Blonde" },
  { name: "Nikes", artist: "Frank Ocean", album: "Blonde" },
  { name: "Seigfried", artist: "Frank Ocean", album: "Blonde" },
  { name: "White Ferrari", artist: "Frank Ocean", album: "Blonde" },
  { name: "Plastic Love", artist: "Mariya Takeuchi", album: "Variety" },
  { name: "4:00 AM", artist: "Taeko Ohnuki", album: "Sunshower" },
  { name: "Stay With Me", artist: "Miki Matsubara", album: "Pocket Park" },
  { name: "Fly Me to the Moon", artist: "Yumi Arai", album: "14 Jū-tsuki" },
];

// Artwork URLs (high quality Unsplash images)
const artworkUrls = [
  "https://images.unsplash.com/photo-1470229538611-16ba8c7ffbd7?w=400",
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400",
  "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400",
  "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400",
  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400",
  "https://images.unsplash.com/photo-1504898770365-14faca6a7320?w=400",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
  "https://images.unsplash.com/photo-1484755560615-a4c64e778a6c?w=400",
];

// Generate tracks for a playlist
const generateTracks = (startIdx: number, count: number): SpotifyTrack[] =>
  Array.from({ length: count }, (_, i) => {
    const track = trackData[(startIdx + i) % trackData.length];
    return {
      id: `track-${startIdx}-${i}`,
      name: track.name,
      album: track.album,
      artist: track.artist,
      previewUrl: "https://p.scdn.co/mp3-preview/placeholder",
      artwork: { url: artworkUrls[(startIdx + i) % artworkUrls.length] },
      bpm: 90 + Math.floor(Math.random() * 50),
      key: Math.floor(Math.random() * 12),
      audioFeatures: sampleVector(0.5 + i * 0.05),
    };
  });

// Mock Playlists - diverse and extensive
const mockPlaylists: SpotifyPlaylist[] = [
  {
    id: "nightshift-grooves",
    name: "Nightshift Grooves",
    description: "Neo-house for coding past midnight 🌙",
    owner: mockUsers[0],
    cover: {
      url: "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=400",
    },
    followers: 12804,
    tracks: generateTracks(0, 8),
    tags: ["deep house", "focus", "club", "electronic"],
    moodVector: sampleVector(0.72),
  },
  {
    id: "sunday-softness",
    name: "Sunday Softness",
    description: "Cozy guitars, pour-over coffee, and late brunch chats ☕",
    owner: mockUsers[0],
    cover: {
      url: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400",
    },
    followers: 5810,
    tracks: generateTracks(4, 6),
    tags: ["indie", "folk", "mood", "acoustic"],
    moodVector: sampleVector(0.32),
  },
  {
    id: "neon-dreams",
    name: "Neon Dreams",
    description: "Synthwave journeys through retro futures 🌆",
    owner: mockUsers[4],
    cover: {
      url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400",
    },
    followers: 28340,
    tracks: generateTracks(8, 10),
    tags: ["synthwave", "retro", "80s", "electronic"],
    moodVector: sampleVector(0.65),
  },
  {
    id: "late-night-feels",
    name: "Late Night Feels",
    description: "R&B for those 3AM thoughts 💭",
    owner: mockUsers[1],
    cover: {
      url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400",
    },
    followers: 45200,
    tracks: generateTracks(12, 8),
    tags: ["r&b", "soul", "chill", "vibes"],
    moodVector: sampleVector(0.55),
  },
  {
    id: "jazz-cafe",
    name: "Jazz Café Sessions",
    description: "Smooth jazz for focused work and relaxation 🎷",
    owner: mockUsers[2],
    cover: {
      url: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=400",
    },
    followers: 18900,
    tracks: generateTracks(16, 7),
    tags: ["jazz", "instrumental", "focus", "coffee"],
    moodVector: sampleVector(0.42),
  },
  {
    id: "indie-summer",
    name: "Indie Summer",
    description: "Sun-soaked indie vibes for endless road trips 🚗",
    owner: mockUsers[3],
    cover: {
      url: "https://images.unsplash.com/photo-1506485338023-6ce5f36692df?w=400",
    },
    followers: 33450,
    tracks: generateTracks(20, 9),
    tags: ["indie", "summer", "road trip", "feel good"],
    moodVector: sampleVector(0.78),
  },
];

// Mock Matches - more profiles with diverse compatibility
const mockMatches: MatchProfile[] = [
  {
    id: "match-1",
    displayName: "Luna Chen",
    pronouns: "she/her",
    compatibility: 94,
    sharedAttributes: [
      "High energy",
      "Club vibes",
      "Late night listener",
      "Electronic",
    ],
    playlist: mockPlaylists[0],
    anthem: mockPlaylists[0].tracks[0],
    lastActive: "Just now",
  },
  {
    id: "match-2",
    displayName: "Marcus Williams",
    pronouns: "he/him",
    compatibility: 87,
    sharedAttributes: ["Jazz lover", "Instrumental", "Chill vibes"],
    playlist: mockPlaylists[4],
    anthem: mockPlaylists[4].tracks[2],
    lastActive: "2h ago",
  },
  {
    id: "match-3",
    displayName: "Sage Morrison",
    pronouns: "they/them",
    compatibility: 82,
    sharedAttributes: ["Vinyl enthusiast", "Synth sounds", "Retro aesthetic"],
    playlist: mockPlaylists[2],
    anthem: mockPlaylists[2].tracks[1],
    lastActive: "5h ago",
  },
  {
    id: "match-4",
    displayName: "Kai Nakamura",
    pronouns: "he/him",
    compatibility: 79,
    sharedAttributes: ["City pop", "Future funk", "Japanese music"],
    playlist: mockPlaylists[2],
    anthem: mockPlaylists[2].tracks[4],
    lastActive: "1d ago",
  },
  {
    id: "match-5",
    displayName: "Aria Patel",
    pronouns: "she/her",
    compatibility: 76,
    sharedAttributes: ["Classical fusion", "Experimental", "Ambient"],
    playlist: mockPlaylists[1],
    anthem: mockPlaylists[1].tracks[0],
    lastActive: "2d ago",
  },
  {
    id: "match-6",
    displayName: "Jordan Blake",
    pronouns: "they/them",
    compatibility: 73,
    sharedAttributes: ["Lo-fi beats", "Bedroom producer", "Chill hop"],
    playlist: mockPlaylists[3],
    anthem: mockPlaylists[3].tracks[3],
    lastActive: "3d ago",
  },
  {
    id: "match-7",
    displayName: "Maya Rodriguez",
    pronouns: "she/her",
    compatibility: 68,
    sharedAttributes: ["Latin vibes", "Indie rock", "Dancing mood"],
    playlist: mockPlaylists[5],
    anthem: mockPlaylists[5].tracks[2],
    lastActive: "1w ago",
  },
];

// Export for use in other parts of the app
export { mockUsers, mockPlaylists, mockMatches };
