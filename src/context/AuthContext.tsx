import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { account, ID } from "../services/appwrite";
import type { Models } from "react-native-appwrite";
import { userService } from "../services/userService";
import { UserProfile } from "../types/user";

interface AuthState {
  user: Models.User<Models.Preferences> | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
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

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const currentUser = await account.get();
        setUser(currentUser);
        if (currentUser) {
          const profile = await userService.getProfile(currentUser.$id);
          setUserProfile(profile);
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
    },
    []
  );

  const signIn = useCallback(async (email: string, password: string) => {
    await account.createEmailPasswordSession(email, password);
    const currentUser = await account.get();
    setUser(currentUser);
    const profile = await userService.getProfile(currentUser.$id);
    setUserProfile(profile);
  }, []);

  const logout = useCallback(async () => {
    await account.deleteSession("current");
    setUser(null);
    setUserProfile(null);
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (!user) return;
      await userService.updateProfile(user.$id, updates);
      const updated = await userService.getProfile(user.$id);
      setUserProfile(updated);
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signUp,
        signIn,
        logout,
        updateProfile,
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
