import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { AudioFeatureKey, SpotifyPlaylist, SpotifyTrack, SpotifyUserProfile } from '../types/spotify';

// Spotify API credentials
let SPOTIFY_CLIENT_ID = '1229e889987745908ae1cd0a35681e3c';
let SPOTIFY_CLIENT_SECRET = 'e69d051d784a41b5ae8ce91b41c11d04';

export function setSpotifyCredentials(clientId: string, clientSecret?: string) {
  SPOTIFY_CLIENT_ID = clientId;
  if (clientSecret) {
    SPOTIFY_CLIENT_SECRET = clientSecret;
  }
}

// Spotify requires HTTPS URL format
// Using your custom domain for redirect
const REDIRECT_URI = 'https://beatbond.gladiatorx.in/spotify-callback';

WebBrowser.maybeCompleteAuthSession();

export class SpotifyApiReal {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  async authorize(): Promise<{ accessToken: string; refreshToken?: string }> {
    const discovery = {
      authorizationEndpoint: 'https://accounts.spotify.com/authorize',
      tokenEndpoint: 'https://accounts.spotify.com/api/token'
    };

    const scopes = [
      'user-read-email',
      'user-read-private',
      'user-read-recently-played',
      'playlist-read-private',
      'playlist-read-collaborative',
      'user-top-read',
      'user-read-playback-state'
    ];

    const response = await AuthSession.startAsync({
      authUrl: `${discovery.authorizationEndpoint}?client_id=${SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
        REDIRECT_URI
      )}&scope=${encodeURIComponent(scopes.join(' '))}&show_dialog=true`
    });

    if (response.type === 'success' && response.params?.code) {
      // Exchange code for tokens (would typically be done on backend)
      // For now, using implicit flow token if available
      if (response.params.access_token) {
        this.accessToken = response.params.access_token;
        this.refreshToken = response.params.refresh_token || null;
        return { accessToken: this.accessToken, refreshToken: this.refreshToken || undefined };
      }
      throw new Error('Token exchange needed - implement backend endpoint');
    } else {
      throw new Error('Spotify authentication was cancelled');
    }
  }

  setTokens(accessToken: string, refreshToken?: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken || null;
  }

  async fetchUserProfile(): Promise<SpotifyUserProfile> {
    if (!this.accessToken) throw new Error('Not authenticated');

    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: `Bearer ${this.accessToken}`
      }
    });

    if (!response.ok) throw new Error('Failed to fetch user profile');

    const data = await response.json();
    return {
      id: data.id,
      displayName: data.display_name || data.id,
      avatar: data.images?.[0] ? { url: data.images[0].url } : undefined,
      bio: undefined,
      pronouns: undefined,
      city: undefined
    };
  }

  async fetchPlaylists(): Promise<SpotifyPlaylist[]> {
    if (!this.accessToken) throw new Error('Not authenticated');

    const response = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
      headers: {
        Authorization: `Bearer ${this.accessToken}`
      }
    });

    if (!response.ok) throw new Error('Failed to fetch playlists');

    const data = await response.json();
    const playlists: SpotifyPlaylist[] = [];

    for (const playlist of data.items) {
      const tracks = await this.fetchPlaylistTracks(playlist.id);
      const moodVector = this.calculateMoodVector(tracks);

      playlists.push({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        owner: {
          id: playlist.owner.id,
          displayName: playlist.owner.display_name || playlist.owner.id
        },
        cover: playlist.images?.[0] ? { url: playlist.images[0].url } : undefined,
        followers: playlist.followers?.total || 0,
        tracks,
        tags: this.extractTags(playlist.name, playlist.description),
        moodVector
      });
    }

    return playlists;
  }

  private async fetchPlaylistTracks(playlistId: string): Promise<SpotifyTrack[]> {
    if (!this.accessToken) return [];

    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`
      }
    });

    if (!response.ok) return [];

    const data = await response.json();
    const trackIds = data.items
      .map((item: any) => item.track?.id)
      .filter((id: string) => id)
      .slice(0, 20)
      .join(',');

    if (!trackIds) return [];

    // Fetch track details and audio features
    const [tracksRes, featuresRes] = await Promise.all([
      fetch(`https://api.spotify.com/v1/tracks?ids=${trackIds}`, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      }),
      fetch(`https://api.spotify.com/v1/audio-features?ids=${trackIds}`, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      })
    ]);

    const tracksData = await tracksRes.json();
    const featuresData = await featuresRes.json();

    return tracksData.tracks.map((track: any, index: number) => {
      const features = featuresData.audio_features[index];
      return {
        id: track.id,
        name: track.name,
        album: track.album.name,
        artist: track.artists[0].name,
        previewUrl: track.preview_url,
        artwork: track.album.images?.[0] ? { url: track.album.images[0].url } : undefined,
        audioFeatures: {
          acousticness: features?.acousticness || 0,
          danceability: features?.danceability || 0,
          energy: features?.energy || 0,
          instrumentalness: features?.instrumentalness || 0,
          liveness: features?.liveness || 0,
          speechiness: features?.speechiness || 0,
          valence: features?.valence || 0
        },
        bpm: features?.tempo || 120,
        key: features?.key || 0
      };
    });
  }

  private calculateMoodVector(tracks: SpotifyTrack[]): Record<AudioFeatureKey, number> {
    if (tracks.length === 0) {
      return {
        acousticness: 0,
        danceability: 0,
        energy: 0,
        instrumentalness: 0,
        liveness: 0,
        speechiness: 0,
        valence: 0
      };
    }

    const sum = tracks.reduce(
      (acc, track) => {
        Object.keys(track.audioFeatures).forEach(key => {
          acc[key as AudioFeatureKey] += track.audioFeatures[key as AudioFeatureKey];
        });
        return acc;
      },
      {
        acousticness: 0,
        danceability: 0,
        energy: 0,
        instrumentalness: 0,
        liveness: 0,
        speechiness: 0,
        valence: 0
      } as Record<AudioFeatureKey, number>
    );

    const avg: Record<AudioFeatureKey, number> = {} as Record<AudioFeatureKey, number>;
    Object.keys(sum).forEach(key => {
      avg[key as AudioFeatureKey] = sum[key as AudioFeatureKey] / tracks.length;
    });

    return avg;
  }

  private extractTags(name: string, description?: string): string[] {
    const text = `${name} ${description || ''}`.toLowerCase();
    const commonTags = ['house', 'techno', 'indie', 'rock', 'pop', 'hip hop', 'r&b', 'jazz', 'folk', 'electronic', 'ambient', 'lofi', 'chill', 'party', 'workout', 'study'];
    return commonTags.filter(tag => text.includes(tag));
  }
}

