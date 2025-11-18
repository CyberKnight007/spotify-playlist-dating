# Spotify HTTPS Redirect URI Setup

## The Solution

Spotify requires an **HTTPS URL** format like `https://example.org/callback`. Here's how to set it up:

## Option 1: Use Expo Auth Proxy (Easiest - Recommended)

Expo provides an HTTPS redirect URL automatically. Here's what to do:

### Step 1: Get Your Expo Redirect URL

When you run `npm start`, Expo will show you a redirect URL that looks like:
```
https://auth.expo.io/@anonymous/spotify-playlist-dating
```

Or if you're logged into Expo:
```
https://auth.expo.io/@your-username/spotify-playlist-dating
```

### Step 2: Add to Spotify Dashboard

1. Go to https://developer.spotify.com/dashboard
2. Click on your app
3. Click "Edit Settings"
4. Under "Redirect URIs", add:
   ```
   https://auth.expo.io/@anonymous/spotify-playlist-dating
   ```
   (Replace `anonymous` with your actual Expo username if you have one)
5. Click "Add" then "Save"

### Step 3: The Code is Already Updated

The code now uses `useProxy: true` which automatically generates the correct HTTPS URL.

## Option 2: Use a Free Callback Service

If you prefer a custom domain:

### Use a Free Service:
1. Go to https://ngrok.com (free tier available)
2. Create an account
3. Get a free HTTPS URL like: `https://your-random-id.ngrok.io`
4. Add `/callback` to it: `https://your-random-id.ngrok.io/callback`
5. Add this to Spotify Dashboard

### Update Code:
```typescript
const REDIRECT_URI = 'https://your-random-id.ngrok.io/callback';
```

## Option 3: Use Your Own Domain

If you have a domain:

1. Add to Spotify: `https://yourdomain.com/spotify-callback`
2. Update code to use this URL
3. Set up a simple callback page on your server

## How to Find Your Expo Redirect URL

1. Run: `npm start`
2. Look for a line that says:
   ```
   Redirect URI: https://auth.expo.io/@...
   ```
3. Copy that exact URL
4. Add it to Spotify Dashboard

## Quick Test

After adding the redirect URI to Spotify:

1. Run: `npm start`
2. Try connecting Spotify in the app
3. It should redirect properly

## Important Notes

- ✅ The code is already updated to use `useProxy: true`
- ✅ This automatically generates an HTTPS URL
- ✅ You just need to add the URL to Spotify Dashboard
- ✅ The URL format will be: `https://auth.expo.io/@...`

## If You Get an Error

If Spotify still rejects it, try:
- Make sure the URL starts with `https://`
- No trailing slashes
- Exact match between Spotify dashboard and code

Let me know what Expo redirect URL you get, and I can help verify it matches!

