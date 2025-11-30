import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as AuthSession from "expo-auth-session";

import { SpotifyApi, SPOTIFY_CONFIG, discovery } from "../api/spotify";
import { MatchProfile, SpotifyPlaylist } from "../types/spotify";

interface SpotifyState {
  connected: boolean;
  playlists: SpotifyPlaylist[];
  matches: MatchProfile[];
  selectedPlaylist?: SpotifyPlaylist;
  loading: boolean;
  error?: string;
  connect: () => Promise<void>;
  skipWithMockData: () => void;
  refreshMatches: () => Promise<void>;
  selectPlaylist: (playlist: SpotifyPlaylist) => void;
}

const SpotifyContext = createContext<SpotifyState | undefined>(undefined);
const api = new SpotifyApi();

export const SpotifyProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [connected, setConnected] = useState(false);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [matches, setMatches] = useState<MatchProfile[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  // Use the new useAuthRequest hook
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: SPOTIFY_CONFIG.clientId,
      scopes: SPOTIFY_CONFIG.scopes,
      redirectUri: SPOTIFY_CONFIG.redirectUri,
      responseType: AuthSession.ResponseType.Token,
    },
    discovery
  );

  // Handle auth response
  useEffect(() => {
    if (response?.type === "success") {
      const { access_token } = response.params;
      if (access_token) {
        api.setAccessToken(access_token);
        handleAuthSuccess();
      }
    } else if (response?.type === "error") {
      setError(response.error?.message || "Authentication failed");
      setLoading(false);
    } else if (response?.type === "cancel" || response?.type === "dismiss") {
      setError("Authentication was cancelled");
      setLoading(false);
    }
  }, [response]);

  const handleAuthSuccess = async () => {
    try {
      const data = await api.fetchPlaylists();
      setPlaylists(data);
      setSelectedPlaylist(data[0]);
      setConnected(true);
      const seedMatches = await api.fetchMatches();
      setMatches(seedMatches);
    } catch (err) {
      console.warn(err);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const connect = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      await promptAsync();
    } catch (err) {
      console.warn(err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }, [promptAsync]);

  // Skip authentication and use mock data
  const skipWithMockData = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      // Load mock playlists and matches without authentication
      const data = await api.fetchPlaylists();
      setPlaylists(data);
      setSelectedPlaylist(data[0]);
      const seedMatches = await api.fetchMatches();
      setMatches(seedMatches);
      setConnected(true);
    } catch (err) {
      console.warn(err);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshMatches = useCallback(async () => {
    setLoading(true);
    try {
      const updated = await api.fetchMatches();
      setMatches(updated);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not refresh matches"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const selectPlaylist = useCallback((playlist: SpotifyPlaylist) => {
    setSelectedPlaylist(playlist);
  }, []);

  const value = useMemo(
    () => ({
      connected,
      playlists,
      matches,
      selectedPlaylist,
      loading,
      error,
      connect,
      skipWithMockData,
      refreshMatches,
      selectPlaylist,
    }),
    [
      connected,
      playlists,
      matches,
      selectedPlaylist,
      loading,
      error,
      connect,
      skipWithMockData,
      refreshMatches,
      selectPlaylist,
    ]
  );

  return (
    <SpotifyContext.Provider value={value}>{children}</SpotifyContext.Provider>
  );
};

export const useSpotify = () => {
  const ctx = useContext(SpotifyContext);
  if (!ctx) {
    throw new Error("useSpotify must be used inside SpotifyProvider");
  }
  return ctx;
};
