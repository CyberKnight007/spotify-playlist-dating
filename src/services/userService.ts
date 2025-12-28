import {
  databases,
  DATABASE_ID,
  COLLECTIONS,
  ID,
  Query,
  storage,
  Permission,
  Role,
} from "./appwrite";
import { APPWRITE_CONFIG } from "../config/apiKeys";
import { UserProfile, SwipeAction, Match, SwipeCard } from "../types/user";
import { matchingService } from "./matchingService";

const STORAGE_BUCKET_ID = APPWRITE_CONFIG.storageBucketId;

export const userService = {
  // ==================== PROFILE MANAGEMENT ====================
  async createProfile(
    userId: string,
    profileData: Partial<UserProfile>
  ): Promise<void> {
    const now = new Date().toISOString();

    // Only include fields that are guaranteed to exist in the schema
    const docData: Record<string, any> = {
      id: userId,
      displayName: profileData.displayName || "User",
      createdAt: profileData.createdAt || now,
      updatedAt: profileData.updatedAt || now,
      lastActive: now,
    };

    // Add optional fields only if they have values
    if (profileData.email) {
      docData.email = profileData.email;
    }

    if (profileData.bio) {
      docData.bio = profileData.bio;
    }

    if (profileData.age) {
      docData.age = profileData.age;
    }

    if (profileData.photoUrl) {
      docData.photoUrl = profileData.photoUrl;
    }

    if (profileData.avatar) {
      docData.avatar = profileData.avatar;
    }

    if (profileData.profileComplete !== undefined) {
      docData.profileComplete = profileData.profileComplete;
    }

    if (profileData.city) {
      docData.city = profileData.city;
    }

    if (profileData.location) {
      docData.latitude = profileData.location.latitude;
      docData.longitude = profileData.location.longitude;
    }

    await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.USERS,
      userId,
      docData,
      [
        Permission.read(Role.any()), // Anyone can view profile
        Permission.update(Role.user(userId)), // Only user can update
        Permission.delete(Role.user(userId)), // Only user can delete
      ]
    );
  },

  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const doc = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.USERS,
        userId
      );
      const profile = doc as unknown as UserProfile;
      if (doc.latitude && doc.longitude) {
        profile.location = {
          latitude: doc.latitude,
          longitude: doc.longitude,
        };
      }
      return profile;
    } catch {
      return null;
    }
  },

  async updateProfile(
    userId: string,
    updates: Partial<UserProfile>
  ): Promise<void> {
    // Only include known safe fields to avoid schema mismatch errors
    const updateData: Record<string, any> = {
      lastActive: new Date().toISOString(),
    };

    // Whitelist of fields that can be updated
    const safeFields = [
      "displayName",
      "email",
      "bio",
      "age",
      "city",
      "avatar",
      "photoUrl",
      "pronouns",
      "spotifyUserId",
      "spotifyAccessToken",
      "spotifyRefreshToken",
      "topGenres",
      "topArtists",
      "topTracks",
      "isOnline",
      "lastSeen",
      "isTyping",
      "lastTyping",
      "pushToken",
      "pushEnabled",
      "unreadCount",
      "matchCount",
      "profileComplete",
      "updatedAt",
      "location",
      "blockedUsers",
      "isPremium",
      "darkModeEnabled",
    ];

    for (const field of safeFields) {
      if (field === "location" && updates.location) {
        updateData.latitude = updates.location.latitude;
        updateData.longitude = updates.location.longitude;
        continue;
      }
      if (updates[field as keyof UserProfile] !== undefined) {
        updateData[field] = updates[field as keyof UserProfile];
      }
    }

    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.USERS,
        userId,
        updateData
      );
    } catch (error: any) {
      // Handle missing attribute error gracefully
      if (
        error.message &&
        error.message.includes('Unknown attribute: "topTracks"')
      ) {
        console.warn(
          "⚠️ 'topTracks' attribute missing in Appwrite. Retrying without it."
        );
        delete updateData.topTracks;
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.USERS,
          userId,
          updateData
        );
      } else {
        throw error;
      }
    }
  },

  // ==================== SAFETY & MODERATION ====================
  async updateLocation(
    userId: string,
    location: { latitude: number; longitude: number }
  ): Promise<void> {
    await this.updateProfile(userId, { location });
  },

  async blockUser(currentUserId: string, blockedUserId: string): Promise<void> {
    const currentUser = await this.getProfile(currentUserId);
    const blockedUsers = currentUser?.blockedUsers || [];
    if (!blockedUsers.includes(blockedUserId)) {
      blockedUsers.push(blockedUserId);
      await this.updateProfile(currentUserId, { blockedUsers });
    }
  },

  async reportUser(
    reporterId: string,
    reportedId: string,
    reason: string
  ): Promise<void> {
    // In a real app, this would create a document in a 'reports' collection
    // For now, we'll just log it and block the user
    console.log(`User ${reporterId} reported ${reportedId} for: ${reason}`);
    await this.blockUser(reporterId, reportedId);
  },

  async unmatch(matchId: string): Promise<void> {
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.MATCHES, matchId);
  },

  async getReceivedLikes(userId: string): Promise<SwipeCard[]> {
    try {
      // 1. Get swipes where swipedId == userId AND direction == 'right'
      const receivedSwipes = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.SWIPES,
        [
          Query.equal("swipedId", userId),
          Query.equal("direction", ["right", "superlike"]),
          Query.limit(100),
          Query.orderDesc("createdAt"),
        ]
      );

      if (receivedSwipes.total === 0) return [];

      // 2. Get swipes where swiperId == userId (users I have already swiped on)
      const mySwipes = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.SWIPES,
        [Query.equal("swiperId", userId), Query.limit(1000)]
      );

      const mySwipedIds = new Set(
        mySwipes.documents.map((doc: any) => doc.swipedId)
      );

      // 3. Filter out users I've already swiped on
      // We only want to show users who liked me, but I haven't acted on yet
      const potentialMatchIds = [
        ...new Set(
          receivedSwipes.documents
            .map((doc: any) => doc.swiperId)
            .filter((id: string) => !mySwipedIds.has(id))
        ),
      ];

      if (potentialMatchIds.length === 0) return [];

      // 4. Fetch profiles for these users
      const profiles = await Promise.all(
        potentialMatchIds.map(async (id) => {
          try {
            return await this.getProfile(id);
          } catch (e) {
            return null;
          }
        })
      );

      // 5. Convert to SwipeCard format
      return profiles
        .filter((p): p is UserProfile => p !== null)
        .map((p) => ({
          userId: p.id,
          displayName: p.displayName,
          age: p.age,
          pronouns: p.pronouns,
          bio: p.bio,
          city: p.city,
          avatar: p.photoUrl || p.avatar,
          topGenres: p.topGenres,
          topArtists: p.topArtists,
        }));
    } catch (error) {
      console.error("Error fetching received likes:", error);
      return [];
    }
  },

  // ==================== SWIPE MANAGEMENT ====================
  async recordSwipe(swipe: SwipeAction): Promise<void> {
    await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.SWIPES,
      ID.unique(),
      {
        swiperId: swipe.swiperId,
        swipedId: swipe.swipedId,
        direction: swipe.direction,
        createdAt: new Date().toISOString(),
      }
    );
  },

  async checkForMatch(userId1: string, userId2: string): Promise<boolean> {
    try {
      // Check if both users swiped right on each other
      const swipes = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.SWIPES,
        [
          Query.equal("swiperId", userId2),
          Query.equal("swipedId", userId1),
          Query.equal("direction", "right"),
        ]
      );
      return swipes.total > 0;
    } catch {
      return false;
    }
  },

  async createMatch(
    userId1: string,
    userId2: string,
    compatibilityScore: number
  ): Promise<string> {
    try {
      // Get both user profiles
      const [user1, user2] = await Promise.all([
        this.getProfile(userId1),
        this.getProfile(userId2),
      ]);

      if (!user1 || !user2) {
        throw new Error("User profiles not found");
      }

      // Calculate detailed compatibility with shared data
      const genreResult = matchingService.calculateGenreMatch(
        user1.topGenres || [],
        user2.topGenres || []
      );

      const artistResult = matchingService.calculateArtistOverlap(
        user1.topArtists || [],
        user2.topArtists || []
      );

      const matchId = ID.unique();
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.MATCHES,
        matchId,
        {
          user1Id: userId1,
          user2Id: userId2,
          compatibilityScore,
          sharedGenres: genreResult.shared,
          sharedArtists: artistResult.shared,
          createdAt: new Date().toISOString(),
        }
      );

      console.log(
        `✅ Match created: ${matchId} with ${compatibilityScore}% compatibility`
      );
      return matchId;
    } catch (error) {
      console.error("Error creating match:", error);
      // Fallback to basic match creation
      const matchId = ID.unique();
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.MATCHES,
        matchId,
        {
          user1Id: userId1,
          user2Id: userId2,
          compatibilityScore,
          createdAt: new Date().toISOString(),
        }
      );
      return matchId;
    }
  },

  // ==================== DISCOVERY ====================
  async getSwipeCards(currentUserId: string): Promise<SwipeCard[]> {
    try {
      // Get current user's profile for matching
      const currentUser = await this.getProfile(currentUserId);
      if (!currentUser) {
        return [];
      }

      // Get all users except current user
      const users = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USERS,
        [Query.notEqual("$id", currentUserId), Query.limit(100)]
      );

      // Get users already swiped by current user
      const swipes = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.SWIPES,
        [Query.equal("swiperId", currentUserId)]
      );

      const swipedIds = new Set(
        swipes.documents.map((doc: any) => doc.swipedId)
      );

      // Add blocked users to filtered list
      const blockedUsers = new Set(currentUser.blockedUsers || []);

      // Helper for distance calculation
      const calculateDistance = (
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
      ) => {
        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      // Filter out already swiped users, blocked users, and check distance
      const swipeCards: SwipeCard[] = await Promise.all(
        users.documents
          .filter((doc: any) => {
            // Filter swiped and blocked
            if (swipedIds.has(doc.$id) || blockedUsers.has(doc.$id))
              return false;

            // Filter by distance
            if (currentUser.location && doc.location) {
              const distance = calculateDistance(
                currentUser.location.latitude,
                currentUser.location.longitude,
                doc.location.latitude,
                doc.location.longitude
              );

              // Premium users get 100km radius, Free users get 4km
              const maxDistance = currentUser.isPremium ? 100 : 4;

              if (distance > maxDistance) return false;
            }
            return true;
          })
          .map(async (doc: any) => {
            const potentialMatch: UserProfile = {
              id: doc.$id,
              displayName: doc.displayName || "Anonymous",
              age: doc.age,
              pronouns: doc.pronouns,
              bio: doc.bio || "",
              city: doc.city || "",
              avatar: doc.avatar || "",
              topGenres: doc.topGenres || [],
              topArtists: doc.topArtists || [],
            };

            // Calculate compatibility score using matching algorithm
            const compatibilityScore =
              matchingService.calculateQuickCompatibility(
                currentUser,
                potentialMatch
              );

            // Find shared genres and artists
            const sharedGenres =
              currentUser.topGenres?.filter((g) =>
                potentialMatch.topGenres?.some(
                  (g2) => g.toLowerCase() === g2.toLowerCase()
                )
              ) || [];

            const sharedArtists =
              currentUser.topArtists?.filter((a) =>
                potentialMatch.topArtists?.some(
                  (a2) => a.toLowerCase() === a2.toLowerCase()
                )
              ) || [];

            const sharedTracks =
              currentUser.topTracks
                ?.filter((t) =>
                  potentialMatch.topTracks?.some((t2) => t.id === t2.id)
                )
                .map((t) => t.name) || [];

            return {
              userId: doc.$id,
              displayName: potentialMatch.displayName,
              age: potentialMatch.age,
              pronouns: potentialMatch.pronouns,
              bio: potentialMatch.bio,
              city: potentialMatch.city,
              avatar: potentialMatch.avatar,
              compatibility: compatibilityScore,
              sharedGenres,
              sharedArtists,
              sharedTracks,
              topGenres: potentialMatch.topGenres || [],
              topArtists: potentialMatch.topArtists || [],
            };
          })
      );

      // Sort by compatibility score (highest first)
      return swipeCards.sort(
        (a, b) => (b.compatibility || 0) - (a.compatibility || 0)
      );
    } catch (error) {
      console.error("Error fetching swipe cards:", error);
      return [];
    }
  },

  async markAsSwiped(userId: string): Promise<void> {
    // This is now handled by recordSwipe
  },

  // ==================== MATCHES ====================
  async getMatches(userId: string): Promise<Match[]> {
    try {
      const matchDocs = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.MATCHES,
        [
          Query.or([
            Query.equal("user1Id", userId),
            Query.equal("user2Id", userId),
          ]),
          Query.orderDesc("createdAt"),
        ]
      );

      // Fetch user profiles for each match
      const matchesWithProfiles = await Promise.all(
        matchDocs.documents.map(async (doc: any) => {
          const otherUserId =
            doc.user1Id === userId ? doc.user2Id : doc.user1Id;
          const otherUserProfile = await this.getProfile(otherUserId);

          return {
            id: doc.$id,
            userId1: doc.user1Id,
            userId2: doc.user2Id,
            user1Profile: doc.user1Id === userId ? null : otherUserProfile,
            user2Profile: doc.user2Id === userId ? otherUserProfile : null,
            compatibility: doc.compatibilityScore || 0,
            sharedAttributes: doc.sharedGenres || [],
            sharedGenres: doc.sharedGenres || [],
            sharedArtists: doc.sharedArtists || [],
            createdAt: doc.createdAt,
            lastMessage: undefined, // Will be populated from messages if needed
            lastMessageTime: undefined,
            unreadCount: 0,
            isOnline: false, // Can be enhanced with real-time status
            sharedSongs: 0, // Can be calculated from Spotify data
          } as Match;
        })
      );

      return matchesWithProfiles;
    } catch (error) {
      console.error("Error fetching matches:", error);
      return [];
    }
  },

  async getMatchById(matchId: string): Promise<Match | null> {
    try {
      const match = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.MATCHES,
        matchId
      );
      return match as unknown as Match;
    } catch {
      return null;
    }
  },

  // ==================== IMAGE UPLOAD ====================
  async uploadAvatar(userId: string, imageUri: string): Promise<string> {
    try {
      console.log("[UserService] Starting avatar upload for user:", userId);
      console.log("[UserService] Image URI:", imageUri);
      console.log("[UserService] Storage Bucket ID:", STORAGE_BUCKET_ID);

      // Generate unique file ID
      const fileId = ID.unique();
      const fileName = `avatar_${userId}_${Date.now()}.jpg`;

      // For React Native, we need to create a proper file object
      // The URI from expo-image-picker is a local file path
      const file = {
        uri: imageUri,
        name: fileName,
        type: "image/jpeg",
      };

      console.log("[UserService] Uploading file:", file);

      // Upload to Appwrite Storage
      const uploadedFile = await storage.createFile(
        STORAGE_BUCKET_ID,
        fileId,
        file as any
      );

      console.log(
        "[UserService] File uploaded successfully:",
        uploadedFile.$id
      );

      // Get the file URL - use getFileView for public access
      const fileUrl = storage
        .getFileView(STORAGE_BUCKET_ID, uploadedFile.$id)
        .toString();

      console.log("[UserService] File URL:", fileUrl);

      // Update user profile with new avatar URL
      await this.updateProfile(userId, { avatar: fileUrl });

      console.log("[UserService] Profile updated with new avatar");

      return fileUrl;
    } catch (error: any) {
      console.error("[UserService] Error uploading avatar:", error);
      console.error(
        "[UserService] Error details:",
        JSON.stringify(error, null, 2)
      );
      throw error;
    }
  },

  async deleteAvatar(fileId: string): Promise<void> {
    try {
      await storage.deleteFile(STORAGE_BUCKET_ID, fileId);
    } catch (error) {
      console.error("Error deleting avatar:", error);
    }
  },
};

export default userService;
