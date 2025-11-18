import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { SpotifyApi } from '../api/spotify';
import { MatchProfile, SpotifyPlaylist } from '../types/spotify';

interface SpotifyState {
  connected: boolean;
  playlists: SpotifyPlaylist[];
  matches: MatchProfile[];
  selectedPlaylist?: SpotifyPlaylist;
  loading: boolean;
  error?: string;
  connect: () => Promise<void>;
  refreshMatches: () => Promise<void>;
  selectPlaylist: (playlist: SpotifyPlaylist) => void;
}

const SpotifyContext = createContext<SpotifyState | undefined>(undefined);
const api = new SpotifyApi();

export const SpotifyProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [matches, setMatches] = useState<MatchProfile[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const connect = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      await api.authorize();
      const data = await api.fetchPlaylists();
      setPlaylists(data);
      setSelectedPlaylist(data[0]);
      setConnected(true);
      const seedMatches = await api.fetchMatches();
      setMatches(seedMatches);
    } catch (err) {
      console.warn(err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
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
      setError(err instanceof Error ? err.message : 'Could not refresh matches');
    } finally {
      setLoading(false);
    }
  }, []);

  const selectPlaylist = useCallback((playlist: SpotifyPlaylist) => {
    setSelectedPlaylist(playlist);
  }, []);

  const value = useMemo(
    () => ({ connected, playlists, matches, selectedPlaylist, loading, error, connect, refreshMatches, selectPlaylist }),
    [connected, playlists, matches, selectedPlaylist, loading, error, connect, refreshMatches, selectPlaylist]
  );

  return <SpotifyContext.Provider value={value}>{children}</SpotifyContext.Provider>;
};

export const useSpotify = () => {
  const ctx = useContext(SpotifyContext);
  if (!ctx) {
    throw new Error('useSpotify must be used inside SpotifyProvider');
  }
  return ctx;
};
