# Complete Setup Guide for Production App

This guide will help you set up the full-fledged dating app with real user authentication, profiles, swiping, and matching.

## Prerequisites

1. **Node.js** (v18+)
2. **Expo Account** (free at expo.dev)
3. **Firebase Account** (free tier available)
4. **Spotify Developer Account** (free)

## Step 1: Firebase Setup

### 1.1 Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click "Add project"
3. Enter project name: "Playlist Match" (or your choice)
4. Disable Google Analytics (optional)
5. Click "Create project"

### 1.2 Enable Authentication

1. In Firebase Console, go to **Authentication** > **Get started**
2. Click **Sign-in method** tab
3. Enable **Email/Password**
4. Click **Save**

### 1.3 Create Firestore Database

1. Go to **Firestore Database** > **Create database**
2. Start in **test mode** (for development)
3. Choose a location (closest to your users)
4. Click **Enable**

### 1.4 Get Firebase Config

1. Go to **Project Settings** (gear icon)
2. Scroll to **Your apps**
3. Click **Web** icon (`</>`)
4. Register app name: "Playlist Match Web"
5. Copy the config object

### 1.5 Update Firebase Config

Edit `src/config/apiKeys.ts`:

```typescript
export const FIREBASE_CONFIG = {
  apiKey: 'YOUR_ACTUAL_API_KEY',
  authDomain: 'your-project-id.firebaseapp.com',
  projectId: 'your-project-id',
  storageBucket: 'your-project-id.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abcdef'
};
```

## Step 2: Spotify API Setup

### 2.1 Create Spotify App

1. Go to https://developer.spotify.com/dashboard
2. Click **Create app**
3. Fill in:
   - App name: "Playlist Match"
   - App description: "Dating app based on Spotify playlists"
   - Redirect URI: `playlistmatch://`
4. Click **Save**
5. Copy **Client ID**

### 2.2 Update Spotify Config

Edit `src/config/apiKeys.ts`:

```typescript
export const SPOTIFY_CONFIG = {
  clientId: 'YOUR_SPOTIFY_CLIENT_ID',
  clientSecret: '' // Optional, only if using backend token refresh
};
```

Also update `src/api/spotifyReal.ts`:

```typescript
let SPOTIFY_CLIENT_ID = 'YOUR_SPOTIFY_CLIENT_ID';
```

## Step 3: Install Dependencies

```bash
cd spotify-playlist-dating
npm install
```

## Step 4: Configure App

### 4.1 Update API Keys

Edit `src/config/apiKeys.ts` with your Firebase and Spotify credentials.

### 4.2 Update Spotify API

Edit `src/api/spotifyReal.ts` and set `SPOTIFY_CLIENT_ID` at the top.

### 4.3 Update Firebase Service

The Firebase service (`src/services/firebase.ts`) will automatically use the config from `apiKeys.ts`.

## Step 5: Test Locally

```bash
npm start
```

Then:
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR code with Expo Go on physical device

## Step 6: Build APK

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build APK
npm run build:android:prod
```

## Database Structure

Firestore will automatically create these collections:

### `users` collection
```
users/{userId}
  - id: string
  - email: string
  - displayName: string
  - bio?: string
  - pronouns?: string
  - age?: number
  - city?: string
  - avatar?: string
  - activePlaylistId?: string
  - spotifyAccessToken?: string
  - spotifyRefreshToken?: string
  - createdAt: timestamp
  - updatedAt: timestamp
```

### `swipes` collection
```
swipes/{userId}_{targetUserId}
  - userId: string
  - targetUserId: string
  - action: 'like' | 'pass'
  - timestamp: timestamp
```

### `matches` collection
```
matches/{userId1}_{userId2}
  - id: string
  - userId1: string
  - userId2: string
  - user1Profile: UserProfile
  - user2Profile: UserProfile
  - compatibility: number
  - sharedAttributes: string[]
  - createdAt: timestamp
```

## Security Rules (Firestore)

For production, update Firestore rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /swipes/{swipeId} {
      allow read, write: if request.auth != null;
    }
    
    match /matches/{matchId} {
      allow read: if request.auth != null && 
        (resource.data.userId1 == request.auth.uid || 
         resource.data.userId2 == request.auth.uid);
      allow create: if request.auth != null;
    }
  }
}
```

## Features Implemented

✅ User authentication (Email/Password)
✅ User profile creation and editing
✅ Spotify OAuth integration
✅ Playlist selection
✅ Swipe functionality (like/pass)
✅ Matching algorithm
✅ Match storage and retrieval
✅ Compatibility scoring
✅ Real-time data with Firestore

## Next Steps (Optional Enhancements)

- [ ] Add chat/messaging functionality
- [ ] Implement push notifications
- [ ] Add photo upload for profiles
- [ ] Enhance matching algorithm
- [ ] Add filters (age, location, etc.)
- [ ] Implement reporting/blocking
- [ ] Add premium features
- [ ] Analytics integration

## Troubleshooting

### Firebase not connecting
- Check your config in `apiKeys.ts`
- Verify Firebase project is active
- Check internet connection

### Spotify auth fails
- Verify Client ID is correct
- Check redirect URI matches Spotify dashboard
- Ensure app is registered in Spotify dashboard

### Build fails
- Run `npm install` again
- Clear cache: `expo start -c`
- Check all API keys are set

### No matches showing
- Ensure users have created profiles
- Check Firestore database has data
- Verify swipe functionality is working

## Support

For issues:
1. Check Firebase Console for errors
2. Check Expo build logs
3. Review Firestore security rules
4. Verify all API keys are correct

---

**Your app is now ready for production!** 🚀

