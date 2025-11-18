import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { AudioFeatureKey, MatchProfile, SpotifyPlaylist, SpotifyTrack, SpotifyUserProfile } from '../types/spotify';

const CLIENT_ID = '1229e889987745908ae1cd0a35681e3c';
// Spotify requires HTTPS URL format
// Using your custom domain for redirect
const REDIRECT_URI = 'https://beatbond.gladiatorx.in/spotify-callback';

WebBrowser.maybeCompleteAuthSession();

export class SpotifyApi {
  private accessToken: string | null = null;

  async authorize() {
    const discovery = {
      authorizationEndpoint: 'https://accounts.spotify.com/authorize',
      tokenEndpoint: 'https://accounts.spotify.com/api/token'
    };

    const scopes = [
      'user-read-email',
      'user-read-private',
      'user-read-recently-played',
      'playlist-read-private',
      'user-top-read'
    ];

    const response = await AuthSession.startAsync({
      authUrl: `${discovery.authorizationEndpoint}?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(
        REDIRECT_URI
      )}&scope=${encodeURIComponent(scopes.join(' '))}`
    });

    if (response.type === 'success' && response.params?.access_token) {
      this.accessToken = response.params.access_token;
    } else {
      throw new Error('Spotify authentication was cancelled');
    }
  }

  async fetchPlaylists(): Promise<SpotifyPlaylist[]> {
    if (!this.accessToken) {
      return mockPlaylists;
    }

    // Real API call would go here. For now we fall back to mock data so the app stays demoable.
    return mockPlaylists;
  }

  async fetchMatches(): Promise<MatchProfile[]> {
    // In a real build you would send playlist fingerprints to your backend and return matches.
    return mockMatches;
  }
}

const mockUser: SpotifyUserProfile = {
  id: 'me',
  displayName: 'River Hart',
  pronouns: 'they/them',
  bio: 'Brooklyn-based art director mixing ambient and alt R&B',
  avatar: {
    url: 'https://images.unsplash.com/photo-1504593811423-6dd665756598'
  }
};

const mockTracks = (prefix: string): SpotifyTrack[] =>
  new Array(6).fill(null).map((_, index) => ({
    id: `${prefix}-${index}`,
    name: `${prefix} Track ${index + 1}`,
    album: `${prefix} Album`,
    artist: ['Peggy Gou', 'Kaytranada', 'Fred again..'][index % 3],
    previewUrl: 'https://p.scdn.co/mp3-preview/placeholder',
    artwork: {
      url: 'https://images.unsplash.com/photo-1470229538611-16ba8c7ffbd7'
    },
    bpm: 110 + index * 3,
    key: index,
    audioFeatures: sampleVector(0.5 + index * 0.03)
  }));

const sampleVector = (seed: number): Record<AudioFeatureKey, number> => ({
  acousticness: seed * 0.2,
  danceability: 0.5 + (seed % 0.3),
  energy: 0.6 + (seed % 0.2),
  instrumentalness: seed * 0.1,
  liveness: 0.2 + (seed % 0.2),
  speechiness: 0.1 + (seed % 0.1),
  valence: 0.4 + (seed % 0.4)
});

const mockPlaylists: SpotifyPlaylist[] = [
  {
    id: 'nightshift-grooves',
    name: 'Nightshift Grooves',
    description: 'Neo-house for coding past midnight',
    owner: mockUser,
    cover: {
      url: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1'
    },
    followers: 12804,
    tracks: mockTracks('Nightshift'),
    tags: ['deep house', 'focus', 'club'],
    moodVector: sampleVector(0.72)
  },
  {
    id: 'sunday-softness',
    name: 'Sunday Softness',
    description: 'Cozy guitars, pour-over coffee, and late brunch chats',
    owner: mockUser,
    cover: {
      url: 'https://images.unsplash.com/photo-1506157786151-b8491531f063'
    },
    followers: 5810,
    tracks: mockTracks('Sunday'),
    tags: ['indie', 'folk', 'mood'],
    moodVector: sampleVector(0.32)
  }
];

const mockMatches: MatchProfile[] = mockPlaylists.map((playlist, idx) => ({
  id: `match-${idx}`,
  displayName: (['Kira', 'Milo'][idx] ?? 'Cam') as string,
  pronouns: ['she/her', 'he/him'][idx],
  compatibility: 84 - idx * 12,
  sharedAttributes: idx === 0 ? ['High energy', 'Shared BPM band'] : ['Acoustic blend', 'Mellow moods'],
  playlist,
  anthem: playlist.tracks[0],
  lastActive: idx === 0 ? '2h ago' : '1d ago'
}));
