# Build APK - Step by Step Guide

## Quick Build Instructions

### Step 1: Install EAS CLI (if not already installed)
```bash
npm install -g eas-cli
```

### Step 2: Login to Expo
```bash
eas login
```
(Use your Expo account - create one at expo.dev if needed)

### Step 3: Build the APK
```bash
cd C:\Users\User\Documents\spotify-playlist-dating
npm run build:android:prod
```

### Step 4: Wait for Build
- Build takes 10-15 minutes
- You'll see progress in terminal
- You'll get a download link when done

### Step 5: Download APK
- Click the download link from terminal
- Or check: https://expo.dev/accounts/[your-username]/builds
- Save the APK file anywhere you want

## Alternative: Build Locally (Faster but requires Android Studio)

If you have Android Studio installed:
```bash
eas build --platform android --local --profile production
```

The APK will be in: `android/app/build/outputs/apk/release/`

## What the APK Includes

✅ Full authentication system
✅ User sign up/login
✅ Profile creation
✅ Spotify integration
✅ Swipe functionality
✅ Matching system
✅ All features ready to use

## After Building

1. **Test the APK** on your device first
2. **Share with users** - they can install directly
3. **Users can:**
   - Sign up with email/password
   - Connect Spotify
   - Create profile
   - Swipe on matches
   - See their matches

## Troubleshooting

If build fails:
- Make sure you're logged in: `eas login`
- Check internet connection
- Try: `eas build:configure` first
- Check Expo account has build credits (free tier available)

---

**Ready to build? Run the commands above!** 🚀

