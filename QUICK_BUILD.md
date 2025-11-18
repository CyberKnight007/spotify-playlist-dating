# 🚀 Quick APK Build Guide

## Option 1: Double-Click Build Script (Easiest)

1. **Double-click** `build-apk.bat` in the project folder
2. Follow the prompts
3. Wait 10-15 minutes
4. Download link will appear in terminal

## Option 2: Manual Build (Step by Step)

### Open PowerShell/Terminal in project folder:

```powershell
cd C:\Users\User\Documents\spotify-playlist-dating
```

### Step 1: Install EAS CLI
```powershell
npm install -g eas-cli
```

### Step 2: Login to Expo
```powershell
eas login
```
(Create account at expo.dev if needed - it's free!)

### Step 3: Build APK
```powershell
npm run build:android:prod
```

### Step 4: Wait & Download
- Build takes 10-15 minutes
- Terminal will show progress
- You'll get a download link
- Click it to download APK
- Save it anywhere you want!

## Where APK Will Be Saved

**Option A: Download from Expo**
- Click the download link in terminal
- Save to any folder you choose
- Example: `C:\Users\User\Downloads\app-release.apk`

**Option B: Check Expo Dashboard**
- Go to: https://expo.dev/accounts/[your-username]/builds
- Download from there
- Save anywhere you want

## What Users Can Do

Once you share the APK, users can:

1. ✅ **Install APK** on Android device
2. ✅ **Sign Up** with email/password
3. ✅ **Create Profile** (name, bio, age, etc.)
4. ✅ **Connect Spotify** (OAuth flow)
5. ✅ **Select Playlist** to represent their vibe
6. ✅ **Swipe** on potential matches
7. ✅ **See Matches** when mutual likes happen
8. ✅ **View Profiles** of matches

## Testing Before Sharing

1. **Install APK on your device first**
2. **Test all features:**
   - Sign up
   - Spotify connection
   - Swiping
   - Matching
3. **Fix any issues** if found
4. **Then share** with users

## File Size

Expected APK size: **30-50 MB**

## Ready to Build?

**Just run:**
```powershell
npm run build:android:prod
```

**Or double-click:** `build-apk.bat`

---

**The APK will be ready in 10-15 minutes!** 🎉

