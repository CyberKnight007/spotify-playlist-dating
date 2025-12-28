import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";

const SPOTIFY_API_BASE = "https://api.spotify.com/v1";
const STORAGE_KEYS = {
  ACCESS_TOKEN: "@spotify_access_token",
  REFRESH_TOKEN: "@spotify_refresh_token",
  TOKEN_EXPIRY: "@spotify_token_expiry",
  USER_DATA: "@spotify_user_data",
};

// ============================================
// SPOTIFY API TYPES
// ============================================

export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface SpotifyUserProfile {
  id: string;
  display_name: string;
  email: string;
  images: SpotifyImage[];
  country: string;
  product: string;
  followers: { total: number };
  external_urls: { spotify: string };
}

export interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  images: SpotifyImage[];
  popularity: number;
  external_urls: { spotify: string };
  followers?: { total: number };
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  images: SpotifyImage[];
  release_date: string;
  artists: SpotifyArtist[];
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  duration_ms: number;
  preview_url: string | null;
  popularity: number;
  explicit: boolean;
  external_urls: { spotify: string };
}

export interface SpotifyAudioFeatures {
  id: string;
  acousticness: number;
  danceability: number;
  energy: number;
  instrumentalness: number;
  liveness: number;
  loudness: number;
  speechiness: number;
  valence: number;
  tempo: number;
  key: number;
  mode: number;
  time_signature: number;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string | null;
  images: SpotifyImage[];
  owner: {
    id: string;
    display_name: string;
  };
  public: boolean;
  tracks: {
    total: number;
    href: string;
  };
  external_urls: { spotify: string };
}

export interface SpotifyPlayHistory {
  track: SpotifyTrack;
  played_at: string;
  context: {
    type: string;
    uri: string;
  } | null;
}

// ============================================
// CURRENT PLAYBACK STATE
// ============================================

export interface SpotifyDevice {
  id: string;
  is_active: boolean;
  is_private_session: boolean;
  is_restricted: boolean;
  name: string;
  type: string;
  volume_percent: number;
}

export interface SpotifyPlaybackState {
  device: SpotifyDevice;
  repeat_state: "off" | "track" | "context";
  shuffle_state: boolean;
  context: {
    type: string;
    href: string;
    external_urls: { spotify: string };
    uri: string;
  } | null;
  timestamp: number;
  progress_ms: number;
  is_playing: boolean;
  item: SpotifyTrack | null;
  currently_playing_type: "track" | "episode" | "ad" | "unknown";
}

// ============================================
// SYNCED DATA STRUCTURE
// ============================================

export interface SpotifySyncedData {
  profile: SpotifyUserProfile | null;
  topTracks: {
    shortTerm: SpotifyTrack[];
    mediumTerm: SpotifyTrack[];
    longTerm: SpotifyTrack[];
  };
  topArtists: {
    shortTerm: SpotifyArtist[];
    mediumTerm: SpotifyArtist[];
    longTerm: SpotifyArtist[];
  };
  playlists: SpotifyPlaylist[];
  recentlyPlayed: SpotifyPlayHistory[];
  topGenres: string[];
  audioProfile: AudioProfile;
  lastSynced: string;
}

export interface AudioProfile {
  averageFeatures: {
    acousticness: number;
    danceability: number;
    energy: number;
    instrumentalness: number;
    liveness: number;
    speechiness: number;
    valence: number;
    tempo: number;
  };
  dominantMood: string;
  listeningStyle: string;
}

export interface CompatibilityResult {
  score: number;
  sharedArtists: SpotifyArtist[];
  sharedGenres: string[];
  sharedTracks: SpotifyTrack[];
  audioSimilarity: number;
  insights: string[];
}

// ============================================
// SPOTIFY DATA SERVICE
// ============================================

class SpotifyDataService {
  private accessToken: string | null = null;
  private sound: Audio.Sound | null = null;
  private isPlaying = false;

  // ==========================================
  // TOKEN MANAGEMENT
  // ==========================================

  async setAccessToken(token: string, expiresIn?: number): Promise<void> {
    this.accessToken = token;
    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);

    if (expiresIn) {
      const expiry = Date.now() + expiresIn * 1000;
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiry.toString());
    }
  }

  async getStoredToken(): Promise<string | null> {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const expiry = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);

    if (token && expiry) {
      const expiryTime = parseInt(expiry, 10);
      if (Date.now() < expiryTime) {
        this.accessToken = token;
        return token;
      }
    }
    return null;
  }

  async clearData(): Promise<void> {
    this.accessToken = null;
    await this.stopPreview();
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.TOKEN_EXPIRY,
      STORAGE_KEYS.USER_DATA,
    ]);
  }

  async isConnected(): Promise<boolean> {
    const token = await this.getStoredToken();
    return !!token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  // ==========================================
  // API REQUESTS
  // ==========================================

  private async apiRequest<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    if (!this.accessToken) {
      throw new Error("No access token available");
    }

    const response = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired
        await this.clearData();
        throw new Error("Token expired. Please reconnect to Spotify.");
      }
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.error?.message || `Spotify API error: ${response.status}`
      );
    }

    return response.json();
  }

  // ==========================================
  // PROFILE & USER DATA
  // ==========================================

  async getProfile(): Promise<SpotifyUserProfile> {
    return this.apiRequest<SpotifyUserProfile>("/me");
  }

  // ==========================================
  // TOP TRACKS
  // ==========================================

  async getTopTracks(
    timeRange: "short_term" | "medium_term" | "long_term" = "medium_term",
    limit: number = 50
  ): Promise<SpotifyTrack[]> {
    const response = await this.apiRequest<{ items: SpotifyTrack[] }>(
      `/me/top/tracks?time_range=${timeRange}&limit=${limit}`
    );
    return response.items;
  }

  async getAllTopTracks(): Promise<{
    shortTerm: SpotifyTrack[];
    mediumTerm: SpotifyTrack[];
    longTerm: SpotifyTrack[];
  }> {
    const [shortTerm, mediumTerm, longTerm] = await Promise.all([
      this.getTopTracks("short_term", 50),
      this.getTopTracks("medium_term", 50),
      this.getTopTracks("long_term", 50),
    ]);
    return { shortTerm, mediumTerm, longTerm };
  }

  // ==========================================
  // TOP ARTISTS
  // ==========================================

  async getTopArtists(
    timeRange: "short_term" | "medium_term" | "long_term" = "medium_term",
    limit: number = 50
  ): Promise<SpotifyArtist[]> {
    const response = await this.apiRequest<{ items: SpotifyArtist[] }>(
      `/me/top/artists?time_range=${timeRange}&limit=${limit}`
    );
    return response.items;
  }

  async getAllTopArtists(): Promise<{
    shortTerm: SpotifyArtist[];
    mediumTerm: SpotifyArtist[];
    longTerm: SpotifyArtist[];
  }> {
    const [shortTerm, mediumTerm, longTerm] = await Promise.all([
      this.getTopArtists("short_term", 50),
      this.getTopArtists("medium_term", 50),
      this.getTopArtists("long_term", 50),
    ]);
    return { shortTerm, mediumTerm, longTerm };
  }

  // ==========================================
  // PLAYLISTS
  // ==========================================

  async getPlaylists(limit: number = 50): Promise<SpotifyPlaylist[]> {
    const response = await this.apiRequest<{
      items: SpotifyPlaylist[];
      next: string | null;
    }>(`/me/playlists?limit=${limit}`);
    return response.items;
  }

  async getPlaylistTracks(
    playlistId: string,
    limit: number = 100
  ): Promise<SpotifyTrack[]> {
    const response = await this.apiRequest<{
      items: { track: SpotifyTrack }[];
    }>(`/playlists/${playlistId}/tracks?limit=${limit}`);
    return response.items.map((item) => item.track).filter(Boolean);
  }

  // ==========================================
  // RECENTLY PLAYED / LISTENING HISTORY
  // ==========================================

  async getRecentlyPlayed(limit: number = 50): Promise<SpotifyPlayHistory[]> {
    const response = await this.apiRequest<{ items: SpotifyPlayHistory[] }>(
      `/me/player/recently-played?limit=${limit}`
    );
    return response.items;
  }

  // ==========================================
  // CURRENT PLAYBACK STATE & CONTROLS
  // ==========================================

  async getCurrentPlayback(): Promise<SpotifyPlaybackState | null> {
    try {
      const response = await fetch(`${SPOTIFY_API_BASE}/me/player`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      // 204 means no active device
      if (response.status === 204) {
        return null;
      }

      if (response.status === 401) {
        return null;
      }

      if (response.status === 403) {
        return null;
      }

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return null;
    }
  }

  async pausePlayback(): Promise<boolean> {
    try {
      const response = await fetch(`${SPOTIFY_API_BASE}/me/player/pause`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });
      return response.ok || response.status === 204;
    } catch (error) {
      console.error("Error pausing playback:", error);
      return false;
    }
  }

  async resumePlayback(): Promise<boolean> {
    try {
      const response = await fetch(`${SPOTIFY_API_BASE}/me/player/play`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });
      return response.ok || response.status === 204;
    } catch (error) {
      console.error("Error resuming playback:", error);
      return false;
    }
  }

  async skipToNext(): Promise<boolean> {
    try {
      const response = await fetch(`${SPOTIFY_API_BASE}/me/player/next`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });
      return response.ok || response.status === 204;
    } catch (error) {
      console.error("Error skipping to next:", error);
      return false;
    }
  }

  async skipToPrevious(): Promise<boolean> {
    try {
      const response = await fetch(`${SPOTIFY_API_BASE}/me/player/previous`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });
      return response.ok || response.status === 204;
    } catch (error) {
      console.error("Error skipping to previous:", error);
      return false;
    }
  }

  async seekToPosition(positionMs: number): Promise<boolean> {
    try {
      const response = await fetch(
        `${SPOTIFY_API_BASE}/me/player/seek?position_ms=${positionMs}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );
      return response.ok || response.status === 204;
    } catch (error) {
      console.error("Error seeking:", error);
      return false;
    }
  }

  async setVolume(volumePercent: number): Promise<boolean> {
    try {
      const response = await fetch(
        `${SPOTIFY_API_BASE}/me/player/volume?volume_percent=${Math.round(
          volumePercent
        )}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );
      return response.ok || response.status === 204;
    } catch (error) {
      console.error("Error setting volume:", error);
      return false;
    }
  }

  async toggleShuffle(state: boolean): Promise<boolean> {
    try {
      const response = await fetch(
        `${SPOTIFY_API_BASE}/me/player/shuffle?state=${state}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );
      return response.ok || response.status === 204;
    } catch (error) {
      console.error("Error toggling shuffle:", error);
      return false;
    }
  }

  async setRepeatMode(state: "off" | "track" | "context"): Promise<boolean> {
    try {
      const response = await fetch(
        `${SPOTIFY_API_BASE}/me/player/repeat?state=${state}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );
      return response.ok || response.status === 204;
    } catch (error) {
      console.error("Error setting repeat mode:", error);
      return false;
    }
  }

  // ==========================================
  // AUDIO FEATURES
  // ==========================================

  async getAudioFeatures(trackIds: string[]): Promise<SpotifyAudioFeatures[]> {
    if (trackIds.length === 0) return [];

    // API limit is 100 tracks per request
    const chunks: string[][] = [];
    for (let i = 0; i < trackIds.length; i += 100) {
      chunks.push(trackIds.slice(i, i + 100));
    }

    const results: SpotifyAudioFeatures[] = [];
    for (const chunk of chunks) {
      const ids = chunk.join(",");
      const response = await this.apiRequest<{
        audio_features: (SpotifyAudioFeatures | null)[];
      }>(`/audio-features?ids=${ids}`);
      results.push(
        ...(response.audio_features.filter(Boolean) as SpotifyAudioFeatures[])
      );
    }

    return results;
  }

  async getTrackAudioFeatures(
    trackId: string
  ): Promise<SpotifyAudioFeatures | null> {
    try {
      return await this.apiRequest<SpotifyAudioFeatures>(
        `/audio-features/${trackId}`
      );
    } catch {
      return null;
    }
  }

  // ==========================================
  // GENRE EXTRACTION
  // ==========================================

  extractTopGenres(artists: SpotifyArtist[], limit: number = 15): string[] {
    const genreCounts: Record<string, number> = {};

    artists.forEach((artist, index) => {
      // Weight by position (top artists get more weight)
      const weight = Math.max(1, 10 - Math.floor(index / 5));
      artist.genres.forEach((genre) => {
        genreCounts[genre] = (genreCounts[genre] || 0) + weight;
      });
    });

    return Object.entries(genreCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([genre]) => genre);
  }

  // ==========================================
  // AUDIO PROFILE ANALYSIS
  // ==========================================

  calculateAudioProfile(features: SpotifyAudioFeatures[]): AudioProfile {
    if (features.length === 0) {
      return {
        averageFeatures: {
          acousticness: 0.5,
          danceability: 0.5,
          energy: 0.5,
          instrumentalness: 0.1,
          liveness: 0.2,
          speechiness: 0.1,
          valence: 0.5,
          tempo: 120,
        },
        dominantMood: "balanced",
        listeningStyle: "versatile",
      };
    }

    const sum = features.reduce(
      (acc, f) => ({
        acousticness: acc.acousticness + f.acousticness,
        danceability: acc.danceability + f.danceability,
        energy: acc.energy + f.energy,
        instrumentalness: acc.instrumentalness + f.instrumentalness,
        liveness: acc.liveness + f.liveness,
        speechiness: acc.speechiness + f.speechiness,
        valence: acc.valence + f.valence,
        tempo: acc.tempo + f.tempo,
      }),
      {
        acousticness: 0,
        danceability: 0,
        energy: 0,
        instrumentalness: 0,
        liveness: 0,
        speechiness: 0,
        valence: 0,
        tempo: 0,
      }
    );

    const count = features.length;
    const averageFeatures = {
      acousticness: sum.acousticness / count,
      danceability: sum.danceability / count,
      energy: sum.energy / count,
      instrumentalness: sum.instrumentalness / count,
      liveness: sum.liveness / count,
      speechiness: sum.speechiness / count,
      valence: sum.valence / count,
      tempo: sum.tempo / count,
    };

    // Determine dominant mood
    let dominantMood = "balanced";
    if (averageFeatures.valence > 0.6 && averageFeatures.energy > 0.6) {
      dominantMood = "energetic & happy";
    } else if (averageFeatures.valence > 0.6 && averageFeatures.energy < 0.4) {
      dominantMood = "peaceful & content";
    } else if (averageFeatures.valence < 0.4 && averageFeatures.energy > 0.6) {
      dominantMood = "intense & powerful";
    } else if (averageFeatures.valence < 0.4 && averageFeatures.energy < 0.4) {
      dominantMood = "melancholic & reflective";
    } else if (averageFeatures.danceability > 0.7) {
      dominantMood = "groovy & danceable";
    }

    // Determine listening style
    let listeningStyle = "versatile";
    if (averageFeatures.acousticness > 0.6) {
      listeningStyle = "acoustic lover";
    } else if (averageFeatures.instrumentalness > 0.5) {
      listeningStyle = "instrumental enthusiast";
    } else if (
      averageFeatures.energy > 0.7 &&
      averageFeatures.danceability > 0.6
    ) {
      listeningStyle = "party starter";
    } else if (averageFeatures.speechiness > 0.3) {
      listeningStyle = "hip-hop/rap fan";
    }

    return { averageFeatures, dominantMood, listeningStyle };
  }

  // ==========================================
  // TRACK PREVIEW PLAYBACK
  // ==========================================

  private playbackStatusCallback:
    | ((status: {
        isPlaying: boolean;
        progress: number;
        duration: number;
      }) => void)
    | null = null;

  setPlaybackStatusCallback(
    callback:
      | ((status: {
          isPlaying: boolean;
          progress: number;
          duration: number;
        }) => void)
      | null
  ): void {
    this.playbackStatusCallback = callback;
  }

  async playPreview(previewUrl: string): Promise<void> {
    try {
      await this.stopPreview();

      const { sound } = await Audio.Sound.createAsync(
        { uri: previewUrl },
        { shouldPlay: true, volume: 1.0 }
      );

      this.sound = sound;
      this.isPlaying = true;

      // Track playback status with progress
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          const progress = status.positionMillis || 0;
          const duration = status.durationMillis || 30000;

          if (this.playbackStatusCallback) {
            this.playbackStatusCallback({
              isPlaying: status.isPlaying,
              progress,
              duration,
            });
          }

          if (status.didJustFinish) {
            this.isPlaying = false;
            if (this.playbackStatusCallback) {
              this.playbackStatusCallback({
                isPlaying: false,
                progress: 0,
                duration: 30000,
              });
            }
          }
        }
      });
    } catch (error) {
      console.error("Error playing preview:", error);
      throw error;
    }
  }

  async stopPreview(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
      } catch {
        // Ignore cleanup errors
      }
      this.sound = null;
      this.isPlaying = false;
      if (this.playbackStatusCallback) {
        this.playbackStatusCallback({
          isPlaying: false,
          progress: 0,
          duration: 30000,
        });
      }
    }
  }

  async pausePreview(): Promise<void> {
    if (this.sound && this.isPlaying) {
      await this.sound.pauseAsync();
      this.isPlaying = false;
    }
  }

  async resumePreview(): Promise<void> {
    if (this.sound && !this.isPlaying) {
      await this.sound.playAsync();
      this.isPlaying = true;
    }
  }

  async togglePlayback(): Promise<boolean> {
    if (this.sound) {
      if (this.isPlaying) {
        await this.pausePreview();
        return false;
      } else {
        await this.resumePreview();
        return true;
      }
    }
    return false;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  // ==========================================
  // COMPATIBILITY CALCULATION
  // ==========================================

  calculateCompatibility(
    user1Data: SpotifySyncedData,
    user2Data: SpotifySyncedData
  ): CompatibilityResult {
    const insights: string[] = [];
    let totalScore = 0;

    // 1. Shared Artists (30% weight)
    const user1ArtistIds = new Set([
      ...user1Data.topArtists.shortTerm.map((a) => a.id),
      ...user1Data.topArtists.mediumTerm.map((a) => a.id),
      ...user1Data.topArtists.longTerm.map((a) => a.id),
    ]);
    const user2Artists = [
      ...user2Data.topArtists.shortTerm,
      ...user2Data.topArtists.mediumTerm,
      ...user2Data.topArtists.longTerm,
    ];
    const sharedArtists = user2Artists.filter((a) => user1ArtistIds.has(a.id));
    const uniqueSharedArtists = Array.from(
      new Map(sharedArtists.map((a) => [a.id, a])).values()
    );

    const artistScore = Math.min(uniqueSharedArtists.length * 5, 30);
    totalScore += artistScore;
    if (uniqueSharedArtists.length > 5) {
      insights.push(
        `🎤 You share ${uniqueSharedArtists.length} artists in common!`
      );
    } else if (uniqueSharedArtists.length > 0) {
      insights.push(
        `🎤 You both love ${uniqueSharedArtists[0]?.name || "some artists"}!`
      );
    }

    // 2. Shared Genres (25% weight)
    const user1Genres = new Set(user1Data.topGenres);
    const sharedGenres = user2Data.topGenres.filter((g) => user1Genres.has(g));
    const genreScore = Math.min(sharedGenres.length * 3, 25);
    totalScore += genreScore;
    if (sharedGenres.length > 3) {
      insights.push(
        `🎵 Your genre taste overlaps in ${sharedGenres.length} areas!`
      );
    }

    // 3. Shared Tracks (20% weight)
    const user1TrackIds = new Set([
      ...user1Data.topTracks.shortTerm.map((t) => t.id),
      ...user1Data.topTracks.mediumTerm.map((t) => t.id),
      ...user1Data.topTracks.longTerm.map((t) => t.id),
    ]);
    const user2Tracks = [
      ...user2Data.topTracks.shortTerm,
      ...user2Data.topTracks.mediumTerm,
      ...user2Data.topTracks.longTerm,
    ];
    const sharedTracks = user2Tracks.filter((t) => user1TrackIds.has(t.id));
    const uniqueSharedTracks = Array.from(
      new Map(sharedTracks.map((t) => [t.id, t])).values()
    );

    const trackScore = Math.min(uniqueSharedTracks.length * 4, 20);
    totalScore += trackScore;
    if (uniqueSharedTracks.length > 0) {
      insights.push(
        `🎧 You both have "${uniqueSharedTracks[0]?.name}" in your top tracks!`
      );
    }

    // 4. Audio Profile Similarity (25% weight)
    const audioSimilarity = this.calculateAudioSimilarity(
      user1Data.audioProfile,
      user2Data.audioProfile
    );
    const audioScore = audioSimilarity * 25;
    totalScore += audioScore;

    if (audioSimilarity > 0.8) {
      insights.push(`🌊 Your music vibes are incredibly similar!`);
    } else if (audioSimilarity > 0.6) {
      insights.push(`✨ You have compatible listening styles!`);
    }

    // Mood insight
    if (
      user1Data.audioProfile.dominantMood ===
      user2Data.audioProfile.dominantMood
    ) {
      insights.push(
        `💫 You both prefer ${user1Data.audioProfile.dominantMood} music!`
      );
    }

    return {
      score: Math.round(totalScore),
      sharedArtists: uniqueSharedArtists.slice(0, 10),
      sharedGenres: sharedGenres.slice(0, 10),
      sharedTracks: uniqueSharedTracks.slice(0, 10),
      audioSimilarity: Math.round(audioSimilarity * 100),
      insights: insights.slice(0, 4),
    };
  }

  private calculateAudioSimilarity(
    profile1: AudioProfile,
    profile2: AudioProfile
  ): number {
    const features1 = profile1.averageFeatures;
    const features2 = profile2.averageFeatures;

    // Calculate Euclidean distance for normalized features (0-1)
    const normalizedFeatures = [
      "acousticness",
      "danceability",
      "energy",
      "instrumentalness",
      "valence",
    ] as const;

    let sumSquaredDiff = 0;
    for (const feature of normalizedFeatures) {
      const diff = features1[feature] - features2[feature];
      sumSquaredDiff += diff * diff;
    }

    // Normalize tempo difference (typical range 60-180 BPM)
    const tempoDiff = (features1.tempo - features2.tempo) / 120;
    sumSquaredDiff += tempoDiff * tempoDiff;

    const distance = Math.sqrt(sumSquaredDiff / 6);
    // Convert distance to similarity (0-1)
    return Math.max(0, 1 - distance);
  }

  // ==========================================
  // FULL DATA SYNC
  // ==========================================

  async syncAllData(): Promise<SpotifySyncedData> {
    console.log("🎵 Starting full Spotify data sync...");

    try {
      // Fetch all data in parallel
      const [profile, topTracks, topArtists, playlists, recentlyPlayed] =
        await Promise.all([
          this.getProfile().catch((e) => {
            console.error("Failed to get profile:", e);
            return null;
          }),
          this.getAllTopTracks().catch((e) => {
            console.error("Failed to get top tracks:", e);
            return { shortTerm: [], mediumTerm: [], longTerm: [] };
          }),
          this.getAllTopArtists().catch((e) => {
            console.error("Failed to get top artists:", e);
            return { shortTerm: [], mediumTerm: [], longTerm: [] };
          }),
          this.getPlaylists(50).catch((e) => {
            console.error("Failed to get playlists:", e);
            return [];
          }),
          this.getRecentlyPlayed(50).catch((e) => {
            console.error("Failed to get recently played:", e);
            return [];
          }),
        ]);

      // Extract top genres from all artists
      const allArtists = [
        ...topArtists.shortTerm,
        ...topArtists.mediumTerm,
        ...topArtists.longTerm,
      ];
      const topGenres = this.extractTopGenres(allArtists);

      // Get audio features for top tracks
      const allTracks = [
        ...topTracks.shortTerm,
        ...topTracks.mediumTerm.slice(0, 20),
      ];
      const trackIds = allTracks.map((t) => t.id).filter(Boolean);
      const audioFeatures = await this.getAudioFeatures(trackIds).catch(
        () => []
      );
      const audioProfile = this.calculateAudioProfile(audioFeatures);

      const syncedData: SpotifySyncedData = {
        profile,
        topTracks,
        topArtists,
        playlists,
        recentlyPlayed,
        topGenres,
        audioProfile,
        lastSynced: new Date().toISOString(),
      };

      // Cache the data
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_DATA,
        JSON.stringify(syncedData)
      );

      console.log("✅ Spotify data synced successfully:", {
        profile: profile?.display_name,
        shortTermTracks: topTracks.shortTerm.length,
        mediumTermTracks: topTracks.mediumTerm.length,
        longTermTracks: topTracks.longTerm.length,
        shortTermArtists: topArtists.shortTerm.length,
        mediumTermArtists: topArtists.mediumTerm.length,
        longTermArtists: topArtists.longTerm.length,
        playlists: playlists.length,
        recentlyPlayed: recentlyPlayed.length,
        genres: topGenres.length,
        dominantMood: audioProfile.dominantMood,
        listeningStyle: audioProfile.listeningStyle,
      });

      return syncedData;
    } catch (error) {
      console.error("❌ Error syncing Spotify data:", error);
      throw error;
    }
  }

  // Get cached data
  async getCachedData(): Promise<SpotifySyncedData | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  getArtistImageUrl(artist: SpotifyArtist): string | undefined {
    return artist.images?.[0]?.url;
  }

  getTrackImageUrl(track: SpotifyTrack): string | undefined {
    return track.album?.images?.[0]?.url;
  }

  getPlaylistImageUrl(playlist: SpotifyPlaylist): string | undefined {
    return playlist.images?.[0]?.url;
  }

  formatDuration(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }
}

export const spotifyDataService = new SpotifyDataService();
