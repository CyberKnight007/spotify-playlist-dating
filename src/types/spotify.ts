// ============================================
// RE-EXPORT TYPES FROM SPOTIFY DATA SERVICE
// ============================================
// This file re-exports the canonical Spotify types from the data service
// for backwards compatibility with existing components

export type {
  SpotifyUserProfile,
  SpotifyArtist,
  SpotifyTrack,
  SpotifyPlaylist,
  SpotifyPlayHistory,
  SpotifyAudioFeatures,
  SpotifyAlbum,
  SpotifyImage,
  SpotifySyncedData,
  AudioProfile,
  CompatibilityResult,
} from "../services/spotifyDataService";

// ============================================
// ADDITIONAL APP-SPECIFIC TYPES
// ============================================

export type AudioFeatureKey =
  | "acousticness"
  | "danceability"
  | "energy"
  | "instrumentalness"
  | "liveness"
  | "speechiness"
  | "valence";

export interface MoodVector {
  acousticness: number;
  danceability: number;
  energy: number;
  instrumentalness: number;
  liveness: number;
  speechiness: number;
  valence: number;
}

// Match profile for swiping
export interface MatchProfile {
  id: string;
  displayName: string;
  pronouns?: string;
  age?: number;
  bio?: string;
  city?: string;
  avatar?: string;
  compatibility: number;
  sharedArtists: string[];
  sharedGenres: string[];
  topGenres: string[];
  topArtists: string[];
  audioProfile?: {
    dominantMood: string;
    listeningStyle: string;
  };
  lastActive: string;
}

// User profile for the app
export interface UserProfile {
  id: string;
  displayName: string;
  email?: string;
  pronouns?: string;
  bio?: string;
  city?: string;
  avatar?: string;
  spotifyUserId?: string;
  topGenres?: string[];
  topArtists?: string[];
  createdAt?: string;
  lastActive?: string;
}

// Swipe action
export interface SwipeAction {
  swiperId: string;
  swipedId: string;
  direction: "left" | "right" | "superlike";
  createdAt: string;
}

// Match between two users
export interface Match {
  id: string;
  user1Id: string;
  user2Id: string;
  user1Profile?: MatchProfile;
  user2Profile?: MatchProfile;
  compatibilityScore: number;
  sharedArtists: string[];
  sharedGenres: string[];
  createdAt: string;
  lastMessageAt?: string;
}

// Message in a conversation
export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  receiverId: string;
  type: "text" | "song" | "playlist" | "voice";
  content: string;
  songData?: {
    id: string;
    name: string;
    artist: string;
    albumArt?: string;
    previewUrl?: string;
  };
  read: boolean;
  createdAt: string;
}

// Conversation summary for the matches list
export interface Conversation {
  matchId: string;
  otherUser: MatchProfile;
  lastMessage?: Message;
  unreadCount: number;
}
