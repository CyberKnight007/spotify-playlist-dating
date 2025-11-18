import { SpotifyPlaylist, SpotifyTrack } from './spotify';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  bio?: string;
  pronouns?: string;
  age?: number;
  city?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  activePlaylistId?: string;
  spotifyAccessToken?: string;
  spotifyRefreshToken?: string;
  spotifyUserId?: string;
}

export interface SwipeAction {
  userId: string;
  targetUserId: string;
  action: 'like' | 'pass';
  timestamp: string;
}

export interface Match {
  id: string;
  userId1: string;
  userId2: string;
  createdAt: string;
  lastMessageAt?: string;
  user1Profile: UserProfile;
  user2Profile: UserProfile;
  compatibility: number;
  sharedAttributes: string[];
}

export interface SwipeCard {
  userId: string;
  displayName: string;
  age?: number;
  pronouns?: string;
  bio?: string;
  city?: string;
  avatar?: string;
  activePlaylist?: SpotifyPlaylist;
  anthem?: SpotifyTrack;
  compatibility?: number;
  sharedAttributes?: string[];
}

