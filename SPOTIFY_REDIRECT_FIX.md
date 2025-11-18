# Fixing Spotify Redirect URI Issue

## The Problem

Spotify might not accept `playlistmatch://` directly. Here are **3 solutions**:

## Solution 1: Use Full URL Format (Recommended)

Instead of `playlistmatch://`, use a full URL:

### In Spotify Dashboard:
Add this redirect URI:
```
https://auth.expo.io/@your-username/spotify-playlist-dating
```

**OR** use:
```
http://localhost:19006
```

### Update Code:
The code already uses `AuthSession.makeRedirectUri()` which will generate the correct URI automatically. But we can also hardcode it if needed.

## Solution 2: Use Expo's Auth Redirect (Easiest)

For development, use Expo's built-in redirect:

### In Spotify Dashboard:
Add:
```
exp://localhost:19000
```

This works with Expo Go during development.

## Solution 3: Use HTTP Localhost (For Testing)

### In Spotify Dashboard:
Add:
```
http://localhost:8080
```

Then update the code to use this format.

## What I've Updated

1. ✅ Added `scheme: "playlistmatch"` to `app.json`
2. ✅ Added Android intent filters for deep linking
3. ✅ Code already uses `AuthSession.makeRedirectUri()` which is flexible

## Recommended Approach

**For Development:**
1. In Spotify Dashboard, add: `exp://localhost:19000`
2. Test with Expo Go

**For Production APK:**
1. In Spotify Dashboard, add: `playlistmatch://`
2. The app.json scheme configuration will handle it

**If Spotify still rejects it:**
- Use: `http://localhost:8080` (for testing)
- Or: `https://yourdomain.com/callback` (for production)

## Try This First

1. **In Spotify Dashboard**, try adding:
   ```
   exp://localhost:19000
   ```

2. **If that doesn't work**, try:
   ```
   http://localhost:8080
   ```

3. **For production**, we'll use the custom scheme after the app is built.

Let me know which one works, and I'll update the code accordingly!

