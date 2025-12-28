import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { Platform } from "react-native";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { account, ID } from "../services/appwrite";
import type { Models, OAuthProvider } from "react-native-appwrite";
import { userService } from "../services/userService";
import { UserProfile } from "../types/user";
import { spotifyDataService } from "../services/spotifyDataService";
import { notificationService } from "../services/notificationService";

interface AuthState {
  user: Models.User<Models.Preferences> | null;
  userProfile: UserProfile | null;
  loading: boolean;
  needsProfileSetup: boolean;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithSpotify: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  checkProfileCompletion: () => Promise<boolean>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(
    null
  );
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const currentUser = await account.get();
        setUser(currentUser);
        if (currentUser) {
          try {
            const profile = await userService.getProfile(currentUser.$id);
            setUserProfile(profile);
            // Register push token
            notificationService.savePushToken(currentUser.$id);
          } catch (profileError: any) {
            // Profile doesn't exist in database, create one
            console.log(
              "[Auth] Profile not found, creating new profile for user:",
              currentUser.$id
            );
            try {
              await userService.createProfile(currentUser.$id, {
                email: currentUser.email,
                displayName:
                  currentUser.name ||
                  currentUser.email?.split("@")[0] ||
                  "User",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
              const newProfile = await userService.getProfile(currentUser.$id);
              setUserProfile(newProfile);
              console.log("[Auth] Profile created successfully");
            } catch (createError) {
              console.error("[Auth] Failed to create profile:", createError);
              // User exists but profile creation failed - still allow access
              setUserProfile(null);
            }
          }
        }
      } catch (error) {
        // No active session
        setUser(null);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      const newUser = await account.create(
        ID.unique(),
        email,
        password,
        displayName
      );
      await account.createEmailPasswordSession(email, password);
      const currentUser = await account.get();
      setUser(currentUser);

      await userService.createProfile(currentUser.$id, {
        email,
        displayName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      const profile = await userService.getProfile(currentUser.$id);
      setUserProfile(profile);
      // Register push token
      notificationService.savePushToken(currentUser.$id);
    },
    []
  );

  const signIn = useCallback(async (email: string, password: string) => {
    await account.createEmailPasswordSession(email, password);
    const currentUser = await account.get();
    setUser(currentUser);

    try {
      const profile = await userService.getProfile(currentUser.$id);
      setUserProfile(profile);
      // Register push token
      notificationService.savePushToken(currentUser.$id);
    } catch (profileError) {
      // Profile doesn't exist, create one
      console.log(
        "[Auth] Profile not found during sign in, creating new profile"
      );
      await userService.createProfile(currentUser.$id, {
        email,
        displayName: currentUser.name || email.split("@")[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      const newProfile = await userService.getProfile(currentUser.$id);
      setUserProfile(newProfile);
    }
  }, []);

  const signInWithSpotify = useCallback(async () => {
    try {
      // Create deep link that works across Expo environments
      const deepLink = new URL(makeRedirectUri({ preferLocalhost: true }));
      if (!deepLink.hostname) {
        deepLink.hostname = "localhost";
      }
      const scheme = `${deepLink.protocol}//`; // e.g. 'exp://' or 'appwrite-callback-<PROJECT_ID>://'

      console.log("Spotify OAuth - Redirect URI:", deepLink.toString());

      // Define Spotify scopes for accessing user data and playlists
      const scopes = [
        "user-read-email",
        "user-read-private",
        "playlist-read-private",
        "playlist-read-collaborative",
        "user-top-read",
        "user-library-read",
      ];

      // Create OAuth2 session with Spotify
      const authUrlResult = await account.createOAuth2Token(
        "spotify" as OAuthProvider,
        `${deepLink}`,
        `${deepLink}`,
        scopes
      );

      if (!authUrlResult) {
        throw new Error("Failed to create OAuth2 URL");
      }

      const authUrl = authUrlResult.toString();
      console.log("Spotify OAuth - Auth URL:", authUrl);

      // Open the browser for OAuth
      const result = await WebBrowser.openAuthSessionAsync(authUrl, scheme);

      console.log("Spotify OAuth - Result:", result);

      if (result.type === "success" && result.url) {
        // Parse the URL to get the tokens
        const url = new URL(result.url);
        const params = new URLSearchParams(url.search);
        const secret = params.get("secret");
        const userId = params.get("userId");

        console.log("Spotify OAuth - Secret:", secret ? "received" : "missing");
        console.log("Spotify OAuth - UserId:", userId);

        if (secret && userId) {
          // Create session with the token
          await account.createSession(userId, secret);

          // Get the current user
          const currentUser = await account.get();
          setUser(currentUser);

          // Try to get existing profile or create new one
          try {
            const profile = await userService.getProfile(currentUser.$id);
            setUserProfile(profile);
          } catch (profileError) {
            // Profile doesn't exist, create one
            console.log("Creating new profile for Spotify user");
            await userService.createProfile(currentUser.$id, {
              email: currentUser.email,
              displayName: currentUser.name || currentUser.email.split("@")[0],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            const newProfile = await userService.getProfile(currentUser.$id);
            setUserProfile(newProfile);
          }

          // Register push token
          notificationService.savePushToken(currentUser.$id);

          console.log("Spotify OAuth - Login successful!");
        }
      } else if (result.type === "cancel") {
        console.log("Spotify OAuth - User cancelled");
      }
    } catch (error) {
      console.error("Spotify OAuth Error:", error);
      throw error;
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      // Create deep link that works across Expo environments
      const deepLink = new URL(makeRedirectUri({ preferLocalhost: true }));
      if (!deepLink.hostname) {
        deepLink.hostname = "localhost";
      }
      const scheme = `${deepLink.protocol}//`; // e.g. 'exp://' or 'appwrite-callback-<PROJECT_ID>://'

      console.log("Google OAuth - Redirect URI:", deepLink.toString());

      // Create OAuth2 session with Google
      const authUrlResult = await account.createOAuth2Token(
        "google" as OAuthProvider,
        `${deepLink}`,
        `${deepLink}`
      );

      if (!authUrlResult) {
        throw new Error("Failed to create OAuth2 URL");
      }

      const authUrl = authUrlResult.toString();
      console.log("Google OAuth - Auth URL:", authUrl);

      // Open the browser for OAuth
      const result = await WebBrowser.openAuthSessionAsync(authUrl, scheme);

      if (result.type === "success" && result.url) {
        const url = new URL(result.url);
        const params = new URLSearchParams(url.search);
        const secret = params.get("secret");
        const userId = params.get("userId");

        if (secret && userId) {
          await account.createSession(userId, secret);
          const currentUser = await account.get();
          setUser(currentUser);

          try {
            const profile = await userService.getProfile(currentUser.$id);
            setUserProfile(profile);
          } catch (profileError) {
            console.log("Creating new profile for Google user");
            await userService.createProfile(currentUser.$id, {
              email: currentUser.email,
              displayName: currentUser.name || currentUser.email.split("@")[0],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            const newProfile = await userService.getProfile(currentUser.$id);
            setUserProfile(newProfile);
          }
          console.log("Google OAuth - Login successful!");
        }
      } else if (result.type === "cancel") {
        console.log("Google OAuth - User cancelled");
      }
    } catch (error) {
      console.error("Google OAuth Error:", error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Remove push token
      if (user) {
        await notificationService.removePushToken(user.$id);
      }

      // Clear Spotify session and tokens
      await spotifyDataService.clearData();
      console.log("✅ Spotify session cleared");
    } catch (error) {
      console.log("Note: Error clearing Spotify data:", error);
    }

    // Delete Appwrite session
    await account.deleteSession("current");
    setUser(null);
    setUserProfile(null);
  }, [user]);

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (!user) return;
      await userService.updateProfile(user.$id, updates);
      const updated = await userService.getProfile(user.$id);
      setUserProfile(updated);

      // Check if profile is now complete
      if (updates.profileComplete) {
        setNeedsProfileSetup(false);
      }
    },
    [user]
  );

  const checkProfileCompletion = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const profile = await userService.getProfile(user.$id);
      if (!profile) {
        setNeedsProfileSetup(true);
        return false;
      }

      const isComplete = !!(
        profile.photoUrl &&
        profile.bio &&
        profile.age &&
        profile.profileComplete
      );

      setNeedsProfileSetup(!isComplete);
      return isComplete;
    } catch (error) {
      console.error("[Auth] Error checking profile completion:", error);
      setNeedsProfileSetup(true);
      return false;
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        needsProfileSetup,
        signUp,
        signIn,
        signInWithSpotify,
        signInWithGoogle,
        logout,
        updateProfile,
        checkProfileCompletion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
