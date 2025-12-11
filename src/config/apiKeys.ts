// Appwrite Configuration - Hardcoded for reliability
export const APPWRITE_CONFIG = {
  endpoint: "https://sgp.cloud.appwrite.io/v1",
  projectId: "692c0bae0033b9e34774",
  databaseId: "6933e7230002691f918d", // beatbond database (created via CLI)
  storageBucketId: "avatars", // For user profile images
};

// Spotify Configuration
export const SPOTIFY_CONFIG = {
  clientId: process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID || "",
  clientSecret: process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET || "",
  redirectUri:
    process.env.EXPO_PUBLIC_SPOTIFY_REDIRECT_URI || "playlistmatch://callback",
};

// Collection IDs - Hardcoded for reliability
export const COLLECTIONS = {
  users: "users",
  swipes: "swipes",
  matches: "matches",
  messages: "messages",
};
