export type AudioFeatureKey =
  | 'acousticness'
  | 'danceability'
  | 'energy'
  | 'instrumentalness'
  | 'liveness'
  | 'speechiness'
  | 'valence';

export interface SpotifyImage {
  url: string;
  width?: number;
  height?: number;
}

export interface SpotifyUserProfile {
  id: string;
  displayName: string;
  avatar?: SpotifyImage;
  bio?: string;
  pronouns?: string;
  city?: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  album: string;
  artist: string;
  previewUrl?: string;
  artwork?: SpotifyImage;
  audioFeatures: Record<AudioFeatureKey, number>;
  bpm: number;
  key: number;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description?: string;
  owner: SpotifyUserProfile;
  cover?: SpotifyImage;
  followers: number;
  tracks: SpotifyTrack[];
  tags: string[];
  moodVector: Record<AudioFeatureKey, number>;
}

export interface MatchProfile {
  id: string;
  displayName: string;
  pronouns?: string;
  compatibility: number;
  sharedAttributes: string[];
  playlist: SpotifyPlaylist;
  anthem?: SpotifyTrack;
  lastActive: string;
}
