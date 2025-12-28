// ============================================
// USER TYPES
// ============================================

export interface UserProfile {
  id: string;
  email?: string;
  displayName: string;
  bio?: string;
  pronouns?: string;
  age?: number;
  city?: string;
  avatar?: string;
  photoUrl?: string; // Primary profile photo (for new setup flow)
  profileComplete?: boolean; // Whether profile setup is complete
  createdAt?: string;
  updatedAt?: string;
  lastActive?: string;
  spotifyAccessToken?: string;
  spotifyRefreshToken?: string;
  spotifyUserId?: string;
  topGenres?: string[];
  topArtists?: string[];
  topTracks?: UserTrack[];
  location?: {
    latitude: number;
    longitude: number;
  };
  blockedUsers?: string[];
  isPremium?: boolean;
  pushEnabled?: boolean;
  darkModeEnabled?: boolean;
}

export interface UserTrack {
  id: string;
  name: string;
  artist: string;
  albumArt?: string;
  previewUrl?: string | null;
}

// ============================================
// SWIPE TYPES
// ============================================

export interface SwipeAction {
  swiperId: string;
  swipedId: string;
  direction: "left" | "right" | "superlike";
  createdAt?: string;
}

export interface SwipeCard {
  userId: string;
  displayName: string;
  age?: number;
  pronouns?: string;
  bio?: string;
  city?: string;
  avatar?: string;
  compatibility?: number;
  sharedGenres?: string[];
  sharedArtists?: string[];
  sharedTracks?: string[];
  topGenres?: string[];
  topArtists?: string[];
  audioProfile?: {
    dominantMood?: string;
    listeningStyle?: string;
  };
}

// ============================================
// MATCH TYPES
// ============================================

export interface Match {
  id: string;
  // Support both naming conventions - make one or the other required via union
  user1Id?: string;
  user2Id?: string;
  userId1?: string;
  userId2?: string;
  user1Profile?: UserProfile;
  user2Profile?: UserProfile;
  compatibilityScore?: number;
  compatibility?: number;
  sharedArtists?: string[];
  sharedGenres?: string[];
  sharedAttributes?: string[];
  createdAt: string;
  lastMessageAt?: string;
  // UI-specific fields
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isOnline?: boolean;
  sharedPlaylist?: string;
  sharedSongs?: number;
}

// ============================================
// MESSAGE TYPES
// ============================================

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  receiverId: string;
  type: "text" | "song" | "playlist" | "voice" | "image";
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

export interface Conversation {
  matchId: string;
  otherUser: UserProfile;
  lastMessage?: Message;
  unreadCount: number;
}
