// Appwrite Configuration
export const APPWRITE_CONFIG = {
  endpoint:
    process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1",
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || "",
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || "",
};

// Spotify Configuration
export const SPOTIFY_CONFIG = {
  clientId: process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID || "",
  clientSecret: process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET || "",
  redirectUri:
    process.env.EXPO_PUBLIC_SPOTIFY_REDIRECT_URI || "playlistmatch://callback",
};

// Collection IDs
export const COLLECTIONS = {
  users: process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID || "",
  swipes: process.env.EXPO_PUBLIC_APPWRITE_SWIPES_COLLECTION_ID || "",
  matches: process.env.EXPO_PUBLIC_APPWRITE_MATCHES_COLLECTION_ID || "",
};
