# Quick Setup Guide

## Initial Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Spotify API:**
   - Visit https://developer.spotify.com/dashboard
   - Create a new app
   - Copy your Client ID
   - Edit `src/api/spotify.ts` and replace `YOUR_SPOTIFY_CLIENT_ID` with your actual Client ID
   - In Spotify Dashboard, add redirect URI: `playlistmatch://` (or your custom scheme)

3. **Add Assets (Optional):**
   The app references these assets in `app.json`:
   - `assets/icon.png` (1024x1024)
   - `assets/splash.png` (1242x2436 for iOS)
   - `assets/adaptive-icon.png` (1024x1024 for Android)
   - `assets/favicon.png` (48x48 for web)
   
   You can use placeholder images or generate them using tools like:
   - https://www.appicon.co/
   - Expo's asset generation tools

4. **Start the app:**
   ```bash
   npm start
   ```

## Running the App

- **iOS Simulator**: Press `i` in the Expo CLI
- **Android Emulator**: Press `a` in the Expo CLI
- **Physical Device**: 
  - Install Expo Go from App Store/Play Store
  - Scan the QR code shown in terminal/browser

## Current Status

The app uses **mock data** for demonstration. To enable real Spotify integration:

1. Complete the OAuth flow implementation in `src/api/spotify.ts`
2. Implement actual API calls to Spotify Web API
3. Set up a backend service for match calculation
4. Replace mock data with real responses

## Troubleshooting

- **"Module not found"**: Run `npm install` again
- **"Cannot connect to Metro"**: Make sure port 8081 is available
- **Spotify auth fails**: Check your Client ID and redirect URI configuration
- **Assets missing**: The app will work without them, but you'll see warnings

