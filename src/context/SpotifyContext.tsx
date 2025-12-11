import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import Constants from "expo-constants";

import {
  spotifyDataService,
  SpotifySyncedData,
  SpotifyUserProfile,
  SpotifyArtist,
  SpotifyTrack,
  SpotifyPlaylist,
  SpotifyPlayHistory,
  AudioProfile,
  CompatibilityResult,
  SpotifyPlaybackState,
} from "../services/spotifyDataService";
import { useAuth } from "./AuthContext";

// ============================================
// CONFIGURATION
// ============================================

const SPOTIFY_CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID;

const SPOTIFY_SCOPES = [
  "user-read-email",
  "user-read-private",
  "user-read-recently-played",
  "playlist-read-private",
  "playlist-read-collaborative",
  "user-top-read",
  "user-library-read",
  "user-read-playback-state",
  "user-modify-playback-state",
];

const discovery = {
  authorizationEndpoint: "https://accounts.spotify.com/authorize",
  tokenEndpoint: "https://accounts.spotify.com/api/token",
};

WebBrowser.maybeCompleteAuthSession();

// ============================================
// TYPES
// ============================================

interface SpotifyState {
  // Connection state
  connected: boolean;
  connecting: boolean;

  // User profile
  profile: SpotifyUserProfile | null;

  // Music data
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
  audioProfile: AudioProfile | null;

  // UI state
  loading: boolean;
  syncing: boolean;
  error: string | null;
  lastSynced: string | null;

  // Audio playback (previews)
  isPlaying: boolean;
  currentPreviewTrack: SpotifyTrack | null;
  playbackProgress: number;
  playbackDuration: number;

  // Spotify playback state (actual Spotify app)
  spotifyPlayback: SpotifyPlaybackState | null;
  isSpotifyPlaying: boolean;

  // Actions
  connectSpotify: () => Promise<void>;
  disconnectSpotify: () => Promise<void>;
  syncData: () => Promise<void>;
  playTrackPreview: (track: SpotifyTrack) => Promise<void>;
  stopTrackPreview: () => Promise<void>;
  togglePlayback: () => Promise<void>;
  // Spotify controls
  toggleSpotifyPlayback: () => Promise<void>;
  skipToNext: () => Promise<void>;
  skipToPrevious: () => Promise<void>;
  calculateCompatibility: (
    otherUserData: SpotifySyncedData
  ) => CompatibilityResult | null;
  skipWithMockData: () => void;
  getRedirectUri: () => string;
}

const SpotifyContext = createContext<SpotifyState | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

export const SpotifyProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { updateProfile } = useAuth();

  // Connection state
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // User profile
  const [profile, setProfile] = useState<SpotifyUserProfile | null>(null);

  // Music data
  const [topTracks, setTopTracks] = useState<{
    shortTerm: SpotifyTrack[];
    mediumTerm: SpotifyTrack[];
    longTerm: SpotifyTrack[];
  }>({ shortTerm: [], mediumTerm: [], longTerm: [] });

  const [topArtists, setTopArtists] = useState<{
    shortTerm: SpotifyArtist[];
    mediumTerm: SpotifyArtist[];
    longTerm: SpotifyArtist[];
  }>({ shortTerm: [], mediumTerm: [], longTerm: [] });

  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<SpotifyPlayHistory[]>(
    []
  );
  const [topGenres, setTopGenres] = useState<string[]>([]);
  const [audioProfile, setAudioProfile] = useState<AudioProfile | null>(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // Audio playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPreviewTrack, setCurrentPreviewTrack] =
    useState<SpotifyTrack | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(30000);

  // Spotify playback state (actual Spotify app)
  const [spotifyPlayback, setSpotifyPlayback] =
    useState<SpotifyPlaybackState | null>(null);
  const [isSpotifyPlaying, setIsSpotifyPlaying] = useState(false);
  const playbackPollInterval = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  // Set up playback status callback
  useEffect(() => {
    spotifyDataService.setPlaybackStatusCallback((status) => {
      setIsPlaying(status.isPlaying);
      setPlaybackProgress(status.progress);
      setPlaybackDuration(status.duration);

      // Clear track when playback finishes
      if (!status.isPlaying && status.progress === 0) {
        setCurrentPreviewTrack(null);
      }
    });

    return () => {
      spotifyDataService.setPlaybackStatusCallback(null);
    };
  }, []);

  // Poll for Spotify playback state when connected
  useEffect(() => {
    const fetchPlaybackState = async () => {
      if (!connected) return;

      try {
        const playback = await spotifyDataService.getCurrentPlayback();
        setSpotifyPlayback(playback);
        setIsSpotifyPlaying(playback?.is_playing ?? false);
      } catch (error) {
        // Silently handle errors
      }
    };

    if (connected) {
      // Fetch immediately
      fetchPlaybackState();
      // Then poll every 1 second for real-time updates
      playbackPollInterval.current = setInterval(fetchPlaybackState, 1000);
    }

    return () => {
      if (playbackPollInterval.current) {
        clearInterval(playbackPollInterval.current);
        playbackPollInterval.current = null;
      }
    };
  }, [connected]);

  // ============================================
  // OAUTH SETUP
  // ============================================

  // Detect if running in Expo Go vs standalone/dev build
  const isExpoGo = Constants.appOwnership === "expo";

  // Generate the correct redirect URI based on environment
  const redirectUri = makeRedirectUri({
    scheme: "playlistmatch",
    path: "callback",
    // In Expo Go, this will generate exp://... URL
    // In standalone/dev builds, this will use the custom scheme
  });

  // Log for debugging
  useEffect(() => {
    console.log("=================================");
    console.log("🎵 SPOTIFY OAUTH CONFIGURATION");
    console.log("=================================");
    console.log("Environment:", isExpoGo ? "Expo Go" : "Standalone/Dev Build");
    console.log("Client ID:", SPOTIFY_CLIENT_ID);
    console.log("Redirect URI:", redirectUri);
    console.log("");
    console.log("⚠️  ADD THIS EXACT URI TO SPOTIFY DASHBOARD:");
    console.log(`   ${redirectUri}`);
    console.log("");
    console.log("   Go to: https://developer.spotify.com/dashboard");
    console.log("   → Select your app → Settings → Redirect URIs");
    console.log("=================================");
  }, [redirectUri, isExpoGo]);

  // Auth request hook - Using Authorization Code flow with PKCE
  // This is the recommended flow for mobile apps
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: SPOTIFY_CLIENT_ID,
      scopes: SPOTIFY_SCOPES,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    },
    discovery
  );

  // ============================================
  // DATA APPLICATION
  // ============================================

  const applySpotifyData = useCallback((data: SpotifySyncedData) => {
    setProfile(data.profile);
    setTopTracks(data.topTracks);
    setTopArtists(data.topArtists);
    setPlaylists(data.playlists);
    setRecentlyPlayed(data.recentlyPlayed);
    setTopGenres(data.topGenres);
    setAudioProfile(data.audioProfile);
    setLastSynced(data.lastSynced);
  }, []);

  // ============================================
  // AUTH SUCCESS HANDLER
  // ============================================

  const handleAuthSuccess = useCallback(
    async (accessToken: string, expiresIn: number) => {
      try {
        setConnecting(true);
        setSyncing(true);
        setError(null);

        console.log("🔑 Setting access token...");
        await spotifyDataService.setAccessToken(accessToken, expiresIn);

        console.log("📡 Syncing Spotify data...");
        const data = await spotifyDataService.syncAllData();
        applySpotifyData(data);

        // Update user profile in Appwrite
        if (data.profile && updateProfile) {
          console.log("💾 Updating Appwrite profile...");
          await updateProfile({
            spotifyUserId: data.profile.id,
            topGenres: data.topGenres,
            topArtists: data.topArtists.mediumTerm
              .slice(0, 5)
              .map((a: SpotifyArtist) => a.name),
            avatar: data.profile.images?.[0]?.url,
          });
        }

        setConnected(true);
        console.log("✅ Spotify connected successfully!");
      } catch (err) {
        console.error("❌ Error during auth:", err);
        setError(
          err instanceof Error ? err.message : "Failed to connect to Spotify"
        );
      } finally {
        setConnecting(false);
        setSyncing(false);
      }
    },
    [applySpotifyData, updateProfile]
  );

  // ============================================
  // CHECK EXISTING CONNECTION
  // ============================================

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const isConnected = await spotifyDataService.isConnected();
        if (isConnected) {
          console.log("📱 Found existing Spotify connection");
          const cachedData = await spotifyDataService.getCachedData();
          if (cachedData) {
            applySpotifyData(cachedData);
            setConnected(true);
          }
        }
      } catch (err) {
        console.log("No existing Spotify connection");
      } finally {
        setLoading(false);
      }
    };

    checkConnection();
  }, [applySpotifyData]);

  // ============================================
  // OAUTH RESPONSE HANDLER
  // ============================================

  useEffect(() => {
    if (!response) return;

    console.log("📨 OAuth Response:", response.type);

    const exchangeCodeForToken = async (code: string) => {
      try {
        console.log("🔄 Exchanging code for token...");

        // Exchange the authorization code for an access token using PKCE
        const tokenResponse = await AuthSession.exchangeCodeAsync(
          {
            clientId: SPOTIFY_CLIENT_ID,
            code,
            redirectUri,
            extraParams: {
              code_verifier: request?.codeVerifier || "",
            },
          },
          discovery
        );

        if (tokenResponse.accessToken) {
          console.log("✅ Got access token!");
          handleAuthSuccess(
            tokenResponse.accessToken,
            tokenResponse.expiresIn || 3600
          );
        } else {
          setError("No access token received");
          setConnecting(false);
        }
      } catch (err) {
        console.error("❌ Token exchange error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to exchange code for token"
        );
        setConnecting(false);
      }
    };

    if (response.type === "success") {
      const { code } = response.params;
      if (code) {
        console.log("✅ Got authorization code!");
        exchangeCodeForToken(code);
      } else {
        setError("No authorization code received");
        setConnecting(false);
      }
    } else if (response.type === "error") {
      console.error("❌ OAuth Error:", response.error);
      setError(response.error?.message || "Authentication failed");
      setConnecting(false);
    } else if (response.type === "cancel" || response.type === "dismiss") {
      console.log("🚫 OAuth cancelled");
      setConnecting(false);
    }
  }, [response, handleAuthSuccess, request, redirectUri]);

  // ============================================
  // ACTIONS
  // ============================================

  const connectSpotify = useCallback(async () => {
    if (!request) {
      setError("OAuth request not ready. Please try again.");
      return;
    }

    console.log("🚀 Starting Spotify OAuth...");
    setConnecting(true);
    setError(null);

    try {
      await promptAsync();
    } catch (err) {
      console.error("❌ Error starting OAuth:", err);
      setError(
        err instanceof Error ? err.message : "Failed to start authentication"
      );
      setConnecting(false);
    }
  }, [promptAsync, request]);

  const disconnectSpotify = useCallback(async () => {
    try {
      console.log("🔌 Disconnecting from Spotify...");
      await spotifyDataService.clearData();

      setConnected(false);
      setProfile(null);
      setTopTracks({ shortTerm: [], mediumTerm: [], longTerm: [] });
      setTopArtists({ shortTerm: [], mediumTerm: [], longTerm: [] });
      setPlaylists([]);
      setRecentlyPlayed([]);
      setTopGenres([]);
      setAudioProfile(null);
      setLastSynced(null);

      if (updateProfile) {
        await updateProfile({
          spotifyUserId: undefined,
          spotifyAccessToken: undefined,
          spotifyRefreshToken: undefined,
        });
      }

      console.log("✅ Disconnected from Spotify");
    } catch (err) {
      console.error("❌ Error disconnecting:", err);
      setError(err instanceof Error ? err.message : "Failed to disconnect");
    }
  }, [updateProfile]);

  const syncData = useCallback(async () => {
    if (!connected) {
      console.log("⚠️ Cannot sync - not connected");
      return;
    }

    console.log("🔄 Manually syncing Spotify data...");
    setSyncing(true);
    setError(null);

    try {
      const data = await spotifyDataService.syncAllData();
      applySpotifyData(data);
      console.log("✅ Data synced successfully!");
    } catch (err) {
      console.error("❌ Sync error:", err);
      setError(err instanceof Error ? err.message : "Failed to sync data");
    } finally {
      setSyncing(false);
    }
  }, [connected, applySpotifyData]);

  // ============================================
  // TRACK PREVIEW PLAYBACK
  // ============================================

  const playTrackPreview = useCallback(async (track: SpotifyTrack) => {
    if (!track.preview_url) {
      setError("No preview available for this track");
      return;
    }

    try {
      console.log("▶️ Playing preview:", track.name);
      await spotifyDataService.playPreview(track.preview_url);
      setIsPlaying(true);
      setCurrentPreviewTrack(track);
    } catch (err) {
      console.error("❌ Error playing preview:", err);
      setError("Failed to play preview");
    }
  }, []);

  const stopTrackPreview = useCallback(async () => {
    try {
      await spotifyDataService.stopPreview();
      setIsPlaying(false);
      setCurrentPreviewTrack(null);
      setPlaybackProgress(0);
    } catch (err) {
      console.error("❌ Error stopping preview:", err);
    }
  }, []);

  const togglePlayback = useCallback(async () => {
    try {
      const nowPlaying = await spotifyDataService.togglePlayback();
      setIsPlaying(nowPlaying);
    } catch (err) {
      console.error("❌ Error toggling playback:", err);
    }
  }, []);

  // ============================================
  // COMPATIBILITY CALCULATION
  // ============================================

  const calculateCompatibility = useCallback(
    (otherUserData: SpotifySyncedData): CompatibilityResult | null => {
      if (!connected || !profile) return null;

      const myData: SpotifySyncedData = {
        profile,
        topTracks,
        topArtists,
        playlists,
        recentlyPlayed,
        topGenres,
        audioProfile: audioProfile || {
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
        },
        lastSynced: lastSynced || new Date().toISOString(),
      };

      return spotifyDataService.calculateCompatibility(myData, otherUserData);
    },
    [
      connected,
      profile,
      topTracks,
      topArtists,
      playlists,
      recentlyPlayed,
      topGenres,
      audioProfile,
      lastSynced,
    ]
  );

  // ============================================
  // MOCK DATA (for development)
  // ============================================

  const skipWithMockData = useCallback(() => {
    console.log("📝 Using mock data...");
    setProfile({
      id: "mock-user",
      display_name: "Demo User",
      email: "demo@example.com",
      images: [],
      country: "US",
      product: "premium",
      followers: { total: 42 },
      external_urls: { spotify: "https://spotify.com" },
    });
    setTopGenres(["pop", "indie", "rock", "electronic", "hip-hop"]);
    setAudioProfile({
      averageFeatures: {
        acousticness: 0.3,
        danceability: 0.7,
        energy: 0.65,
        instrumentalness: 0.1,
        liveness: 0.2,
        speechiness: 0.1,
        valence: 0.6,
        tempo: 125,
      },
      dominantMood: "energetic & happy",
      listeningStyle: "party starter",
    });
    setConnected(true);
    setLastSynced(new Date().toISOString());
  }, []);

  const getRedirectUri = useCallback(() => redirectUri, [redirectUri]);

  // ============================================
  // SPOTIFY PLAYBACK CONTROLS
  // ============================================

  const toggleSpotifyPlayback = useCallback(async () => {
    if (!connected) return;

    try {
      if (isSpotifyPlaying) {
        await spotifyDataService.pausePlayback();
        setIsSpotifyPlaying(false);
      } else {
        await spotifyDataService.resumePlayback();
        setIsSpotifyPlaying(true);
      }
      // Refresh playback state
      const playback = await spotifyDataService.getCurrentPlayback();
      setSpotifyPlayback(playback);
    } catch (error) {
      console.error("Error toggling Spotify playback:", error);
    }
  }, [connected, isSpotifyPlaying]);

  const skipToNext = useCallback(async () => {
    if (!connected) return;

    try {
      await spotifyDataService.skipToNext();
      // Wait a bit then refresh playback state
      setTimeout(async () => {
        const playback = await spotifyDataService.getCurrentPlayback();
        setSpotifyPlayback(playback);
        setIsSpotifyPlaying(playback?.is_playing ?? false);
      }, 500);
    } catch (error) {
      console.error("Error skipping to next:", error);
    }
  }, [connected]);

  const skipToPrevious = useCallback(async () => {
    if (!connected) return;

    try {
      await spotifyDataService.skipToPrevious();
      // Wait a bit then refresh playback state
      setTimeout(async () => {
        const playback = await spotifyDataService.getCurrentPlayback();
        setSpotifyPlayback(playback);
        setIsSpotifyPlaying(playback?.is_playing ?? false);
      }, 500);
    } catch (error) {
      console.error("Error skipping to previous:", error);
    }
  }, [connected]);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value = useMemo(
    () => ({
      // Connection state
      connected,
      connecting,

      // User profile
      profile,

      // Music data
      topTracks,
      topArtists,
      playlists,
      recentlyPlayed,
      topGenres,
      audioProfile,

      // UI state
      loading,
      syncing,
      error,
      lastSynced,

      // Audio playback (previews)
      isPlaying,
      currentPreviewTrack,
      playbackProgress,
      playbackDuration,

      // Spotify playback (actual Spotify app)
      spotifyPlayback,
      isSpotifyPlaying,
      toggleSpotifyPlayback,
      skipToNext,
      skipToPrevious,

      // Actions
      connectSpotify,
      disconnectSpotify,
      syncData,
      playTrackPreview,
      stopTrackPreview,
      togglePlayback,
      calculateCompatibility,
      skipWithMockData,
      getRedirectUri,
    }),
    [
      connected,
      connecting,
      profile,
      topTracks,
      topArtists,
      playlists,
      recentlyPlayed,
      topGenres,
      audioProfile,
      loading,
      syncing,
      error,
      lastSynced,
      isPlaying,
      currentPreviewTrack,
      playbackProgress,
      playbackDuration,
      spotifyPlayback,
      isSpotifyPlaying,
      toggleSpotifyPlayback,
      skipToNext,
      skipToPrevious,
      connectSpotify,
      disconnectSpotify,
      syncData,
      playTrackPreview,
      stopTrackPreview,
      togglePlayback,
      calculateCompatibility,
      skipWithMockData,
      getRedirectUri,
    ]
  );

  return (
    <SpotifyContext.Provider value={value}>{children}</SpotifyContext.Provider>
  );
};

// ============================================
// HOOK
// ============================================

export const useSpotify = () => {
  const ctx = useContext(SpotifyContext);
  if (!ctx) {
    throw new Error("useSpotify must be used inside SpotifyProvider");
  }
  return ctx;
};

// Re-export types for convenience
export type {
  SpotifyUserProfile,
  SpotifyArtist,
  SpotifyTrack,
  SpotifyPlaylist,
  SpotifyPlayHistory,
  SpotifySyncedData,
  AudioProfile,
  CompatibilityResult,
};
