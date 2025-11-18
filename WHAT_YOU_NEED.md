# What You Need to Provide

To make this app fully functional, you need to provide **2 API credentials**:

## 1. Firebase Configuration

**Where to get it:**
1. Go to https://console.firebase.google.com
2. Create a new project (or use existing)
3. Enable Authentication (Email/Password)
4. Create Firestore Database
5. Go to Project Settings > General
6. Copy the Firebase config

**What to provide:**
- `apiKey`
- `authDomain`
- `projectId`
- `storageBucket`
- `messagingSenderId`
- `appId`

**Where to put it:**
Edit `src/config/apiKeys.ts` - replace the `FIREBASE_CONFIG` object.

## 2. Spotify Client ID

**Where to get it:**
1. Go to https://developer.spotify.com/dashboard
2. Create a new app
3. Copy the Client ID
4. Add redirect URI: `playlistmatch://`

**What to provide:**
- `clientId` (Client ID from Spotify dashboard)

**Where to put it:**
1. Edit `src/config/apiKeys.ts` - update `SPOTIFY_CONFIG.clientId`
2. Edit `src/api/spotifyReal.ts` - update `SPOTIFY_CLIENT_ID` at the top

## Quick Setup Checklist

- [ ] Firebase project created
- [ ] Firebase Authentication enabled (Email/Password)
- [ ] Firestore Database created
- [ ] Firebase config copied to `src/config/apiKeys.ts`
- [ ] Spotify app created
- [ ] Spotify Client ID copied to `src/config/apiKeys.ts` and `src/api/spotifyReal.ts`
- [ ] Redirect URI added in Spotify dashboard: `playlistmatch://`

## After Providing Credentials

1. **Test locally:**
   ```bash
   npm install
   npm start
   ```

2. **Build APK:**
   ```bash
   npm install -g eas-cli
   eas login
   npm run build:android:prod
   ```

## What's Already Built

✅ Complete authentication system
✅ User profiles and editing
✅ Spotify OAuth integration
✅ Swipe functionality
✅ Matching algorithm
✅ Real-time database (Firestore)
✅ Match storage and retrieval
✅ Beautiful UI/UX
✅ Navigation system
✅ All screens and components

**You just need to add your API keys and build!**

---

**Once you provide the credentials, I can help you:**
1. Update the config files
2. Test the integration
3. Build the final APK
4. Deploy to users

