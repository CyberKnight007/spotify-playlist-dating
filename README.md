# Playlist Match - Spotify Dating App

A React Native dating app that matches people based on their Spotify playlists. Find your vibe match through shared musical chemistry!

## Features

- 🎵 **Playlist-Based Matching**: Connect your Spotify account and select playlists that represent your vibe
- 🔥 **Musical Compatibility**: Matches are calculated based on audio features, BPM, energy, and mood
- 🎧 **Anthem Sharing**: Lead with a track that describes your current era
- 💬 **Smart Intros**: AI-suggested conversation starters based on shared sonic overlap
- 🎨 **Beautiful UI**: Modern, dark-themed interface with gradient accents

## Tech Stack

- **React Native** with **Expo** (~51.0)
- **TypeScript** for type safety
- **React Navigation** for routing (Stack + Bottom Tabs)
- **Expo Auth Session** for Spotify OAuth
- **Zustand** for state management (via Context API)
- **Expo Linear Gradient** for beautiful gradients

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for Mac) or Android Emulator / Physical device with Expo Go

### Installation

1. Clone the repository:
```bash
cd spotify-playlist-dating
```

2. Install dependencies:
```bash
npm install
```

3. Configure Spotify API:
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Create a new app
   - Copy your Client ID
   - Update `src/api/spotify.ts` with your `CLIENT_ID`
   - Add redirect URI: `playlistmatch://` (or your custom scheme)

4. Start the development server:
```bash
npm start
```

5. Run on your device:
   - Scan the QR code with Expo Go (iOS/Android)
   - Or press `i` for iOS simulator / `a` for Android emulator

## Project Structure

```
spotify-playlist-dating/
├── App.tsx                 # Root component with providers
├── src/
│   ├── api/
│   │   └── spotify.ts      # Spotify API client & mock data
│   ├── components/
│   │   ├── MatchCard.tsx   # Match profile card
│   │   └── PlaylistCard.tsx # Playlist selection card
│   ├── context/
│   │   └── SpotifyContext.tsx # Global Spotify state
│   ├── navigation/
│   │   └── RootNavigator.tsx  # Navigation setup
│   ├── screens/
│   │   ├── OnboardingScreen.tsx # Spotify connection screen
│   │   ├── PlaylistScreen.tsx   # Playlist selection
│   │   ├── MatchesScreen.tsx    # Match discovery
│   │   └── ProfileScreen.tsx    # User profile
│   ├── theme/
│   │   ├── colors.ts            # Color palette
│   │   └── navigationTheme.ts   # Navigation theming
│   └── types/
│       └── spotify.ts           # TypeScript types
├── assets/                      # Images, icons, etc.
├── package.json
└── README.md
```

## Features in Detail

### Onboarding
- Beautiful gradient welcome screen
- Spotify OAuth integration
- Privacy-focused messaging

### Playlist Selection
- Browse your Spotify playlists
- Select which playlist represents your current vibe
- See playlist stats (followers, tracks, tags)

### Match Discovery
- View potential matches with compatibility scores
- See shared musical attributes
- Preview match's anthem track
- Pull-to-refresh for new matches

### Profile
- View your active playlist
- Edit profile settings
- Manage connected playlists

## Mock Data

The app currently uses mock data for demonstration purposes. To enable real Spotify integration:

1. Complete Spotify OAuth setup
2. Implement real API calls in `src/api/spotify.ts`
3. Set up a backend service for match calculation
4. Replace mock data with actual API responses

## Matching Algorithm (Concept)

The matching algorithm would analyze:
- **Audio Features**: Acousticness, danceability, energy, valence, etc.
- **BPM Range**: Similar tempo preferences
- **Mood Vector**: Overall playlist vibe
- **Track Overlap**: Shared artists or tracks
- **Genre Tags**: Musical style compatibility

## Building APK

To build an APK file for Android installation:

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Build APK:**
   ```bash
   npm run build:apk
   ```

The APK will be built on Expo's servers and you'll get a download link when ready.

**For detailed instructions, see [BUILD_APK.md](./BUILD_APK.md)**

## Development

### Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run web` - Run in web browser
- `npm run lint` - Run ESLint
- `npm run build:apk` - Build Android APK
- `npm run build:android:prod` - Build production Android APK

### Adding New Features

1. Create components in `src/components/`
2. Add screens in `src/screens/`
3. Update navigation in `src/navigation/`
4. Extend types in `src/types/`

## Future Enhancements

- [ ] Real-time messaging
- [ ] Playlist collaboration features
- [ ] Advanced matching filters
- [ ] Social sharing of playlists
- [ ] In-app music preview
- [ ] Push notifications for new matches
- [ ] Profile verification
- [ ] Block/report functionality

## License

This project is for educational purposes. Make sure to comply with Spotify's API terms of service.

## Contributing

Contributions welcome! Please open an issue or submit a pull request.

---

Built with ❤️ using React Native and Expo

