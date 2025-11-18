# APK Build Requirements

## ✅ REQUIRED (To Build APK)

### 1. **Node.js & npm**
- Node.js v18 or later
- npm (comes with Node.js)
- **Check:** `node -v` and `npm -v`

### 2. **Expo Account (Free)**
- Sign up at https://expo.dev (free account works)
- Used for cloud builds
- **No credit card needed**

### 3. **EAS CLI**
- Install: `npm install -g eas-cli`
- Login: `eas login`
- **This is the build tool**

### 4. **Project Dependencies**
- Run: `npm install` in project folder
- Installs all React Native/Expo packages

## ❌ NOT REQUIRED (To Build APK)

### Spotify API Credentials
- **You DON'T need Spotify API to build the APK**
- The app uses **mock data** by default
- APK will build and run without Spotify
- Spotify integration is optional for later

### Android Studio
- **Not needed** - builds run in the cloud
- No local Android SDK required

### Java/JDK
- **Not needed** - cloud builds handle this

### Physical Android Device
- **Not needed** - just to test the APK after building

## 📋 Build Checklist

Before running `npm run build:android:prod`:

- [ ] Node.js installed (`node -v` works)
- [ ] npm installed (`npm -v` works)
- [ ] Project dependencies installed (`npm install` completed)
- [ ] EAS CLI installed (`eas --version` works)
- [ ] Logged into Expo (`eas login` completed)
- [ ] Internet connection (for cloud build)

## 🎯 What Happens Without Spotify API?

The app will:
- ✅ Build successfully
- ✅ Install on Android devices
- ✅ Show all screens and UI
- ✅ Display mock playlists and matches
- ✅ Work fully for testing/demo

The app will NOT:
- ❌ Connect to real Spotify accounts
- ❌ Show real user playlists
- ❌ Find real matches

## 🔧 When You Need Spotify API

Only if you want **real Spotify integration**:

1. **Get Spotify Client ID:**
   - Go to https://developer.spotify.com/dashboard
   - Create app (free)
   - Copy Client ID

2. **Update Code:**
   - Edit `src/api/spotify.ts`
   - Replace `YOUR_SPOTIFY_CLIENT_ID` with your ID

3. **Rebuild APK:**
   - Run `npm run build:android:prod` again

## 📦 What Gets Built

The APK includes:
- ✅ All React Native code
- ✅ All components and screens
- ✅ Navigation system
- ✅ Mock data
- ✅ UI/UX (fully functional)
- ✅ All dependencies bundled

The APK does NOT include:
- ❌ Spotify API credentials (can add later)
- ❌ Backend server (if you add one later)
- ❌ Real user data

## 🚀 Quick Start (Minimal Requirements)

```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login to Expo
eas login

# 3. Build APK (works without Spotify!)
npm run build:android:prod
```

That's it! No Spotify API needed to build.

## 💡 Summary

**To Build APK:**
- ✅ Node.js
- ✅ Expo account (free)
- ✅ EAS CLI
- ✅ Internet connection

**NOT Needed:**
- ❌ Spotify API
- ❌ Android Studio
- ❌ Java/JDK
- ❌ Physical device

**Spotify API is optional** - only needed if you want real Spotify features instead of mock data.

