import { databases, DATABASE_ID, COLLECTIONS, ID, Query } from "./appwrite";
import { UserProfile, SwipeAction, Match, SwipeCard } from "../types/user";
import { calculateCompatibility } from "../utils/matching";
import { mockPlaylists, mockUsers } from "../api/spotify";

// ==================== MOCK SWIPE CARDS ====================
const mockSwipeCards: SwipeCard[] = [
  {
    userId: "user-2",
    displayName: "Luna Chen",
    age: 26,
    pronouns: "she/her",
    bio: "Night owl DJ who lives for the underground scene 🎧 Looking for someone to share late night playlists with",
    city: "Los Angeles, CA",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
    activePlaylist: mockPlaylists[0],
    anthem: mockPlaylists[0].tracks[0],
    compatibility: 94,
    sharedAttributes: [
      "High energy",
      "Club vibes",
      "Late night listener",
      "Electronic",
    ],
  },
  {
    userId: "user-3",
    displayName: "Marcus Williams",
    age: 29,
    pronouns: "he/him",
    bio: "Jazz enthusiast by day, electronic producer by night 🎹 Let's make beautiful music together",
    city: "Chicago, IL",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    activePlaylist: mockPlaylists[4],
    anthem: mockPlaylists[4].tracks[2],
    compatibility: 87,
    sharedAttributes: ["Jazz lover", "Instrumental", "Chill vibes", "Producer"],
  },
  {
    userId: "user-4",
    displayName: "Sage Morrison",
    age: 24,
    pronouns: "they/them",
    bio: "Vinyl collector | Synth lover | Always finding new sounds 🎶 My record collection is my personality",
    city: "Portland, OR",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
    activePlaylist: mockPlaylists[2],
    anthem: mockPlaylists[2].tracks[1],
    compatibility: 82,
    sharedAttributes: [
      "Vinyl enthusiast",
      "Synth sounds",
      "Retro aesthetic",
      "Indie",
    ],
  },
  {
    userId: "user-5",
    displayName: "Kai Nakamura",
    age: 27,
    pronouns: "he/him",
    bio: "From Tokyo with love 🇯🇵 City pop and future funk are my jam. Always down for a listening party!",
    city: "San Francisco, CA",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
    activePlaylist: mockPlaylists[2],
    anthem: mockPlaylists[2].tracks[4],
    compatibility: 79,
    sharedAttributes: ["City pop", "Future funk", "Japanese music", "Retro"],
  },
  {
    userId: "user-6",
    displayName: "Aria Patel",
    age: 25,
    pronouns: "she/her",
    bio: "Classical meets electronic. Violinist exploring new dimensions 🎻✨ Seeking sonic adventurers",
    city: "Austin, TX",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
    activePlaylist: mockPlaylists[1],
    anthem: mockPlaylists[1].tracks[0],
    compatibility: 76,
    sharedAttributes: [
      "Classical fusion",
      "Experimental",
      "Ambient",
      "Live music",
    ],
  },
  {
    userId: "user-7",
    displayName: "Jordan Blake",
    age: 23,
    pronouns: "they/them",
    bio: "Bedroom producer | Lo-fi curator | Coffee addict ☕ Looking for someone to vibe with at 2am",
    city: "Seattle, WA",
    avatar:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400",
    activePlaylist: mockPlaylists[3],
    anthem: mockPlaylists[3].tracks[3],
    compatibility: 73,
    sharedAttributes: [
      "Lo-fi beats",
      "Bedroom producer",
      "Chill hop",
      "Night owl",
    ],
  },
  {
    userId: "user-8",
    displayName: "Maya Rodriguez",
    age: 28,
    pronouns: "she/her",
    bio: "Latin beats meet indie rock. Always dancing 💃 Music festivals are my happy place",
    city: "Miami, FL",
    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400",
    activePlaylist: mockPlaylists[5],
    anthem: mockPlaylists[5].tracks[2],
    compatibility: 68,
    sharedAttributes: [
      "Latin vibes",
      "Indie rock",
      "Dancing mood",
      "Festival goer",
    ],
  },
  {
    userId: "user-9",
    displayName: "Alex Rivera",
    age: 30,
    pronouns: "he/him",
    bio: "Music journalist | Playlist perfectionist | Always hunting for the next obsession 📝🎵",
    city: "New York, NY",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
    activePlaylist: mockPlaylists[3],
    anthem: mockPlaylists[3].tracks[1],
    compatibility: 85,
    sharedAttributes: [
      "Music discovery",
      "Diverse taste",
      "Deep cuts",
      "Storytelling",
    ],
  },
  {
    userId: "user-10",
    displayName: "Zoe Kim",
    age: 22,
    pronouns: "she/her",
    bio: "K-pop to shoegaze, I don't discriminate 🌈 Let's share headphones and talk for hours",
    city: "Boston, MA",
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400",
    activePlaylist: mockPlaylists[5],
    anthem: mockPlaylists[5].tracks[0],
    compatibility: 71,
    sharedAttributes: ["K-pop", "Shoegaze", "Eclectic taste", "Open minded"],
  },
  {
    userId: "user-11",
    displayName: "Devon Taylor",
    age: 26,
    pronouns: "they/them",
    bio: "90s hip hop head | Turntablist | Crate digger 📀 Looking for my duet partner",
    city: "Atlanta, GA",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400",
    activePlaylist: mockPlaylists[0],
    anthem: mockPlaylists[0].tracks[5],
    compatibility: 77,
    sharedAttributes: ["Hip hop", "Vinyl culture", "90s music", "DJ"],
  },
];

// Track swiped users in memory for demo
let swipedUserIds = new Set<string>();

// Reset function for demo mode
export const resetMockSwipes = () => {
  swipedUserIds = new Set<string>();
};

// Export mock data for use elsewhere
export { mockSwipeCards };

export const userService = {
  async createProfile(
    userId: string,
    profileData: Partial<UserProfile>
  ): Promise<void> {
    const now = new Date().toISOString();
    await databases.createDocument(DATABASE_ID, COLLECTIONS.USERS, userId, {
      ...profileData,
      id: userId,
      createdAt: now,
      updatedAt: now,
    });
  },

  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const document = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.USERS,
        userId
      );
      return document as unknown as UserProfile;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  },

  async updateProfile(
    userId: string,
    updates: Partial<UserProfile>
  ): Promise<void> {
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.USERS, userId, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },

  async getSwipeCards(
    currentUserId: string,
    limitCount: number = 10
  ): Promise<SwipeCard[]> {
    // For demo mode, return mock swipe cards filtered by already swiped
    try {
      // Try to get real data from database
      const userSwipes = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.SWIPES,
        [Query.equal("userId", currentUserId)]
      );
      const dbSwipedUserIds = new Set(
        userSwipes.documents.map((doc: any) => doc.targetUserId)
      );

      // Get potential matches (excluding self and already swiped)
      const usersResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USERS,
        [Query.notEqual("$id", currentUserId), Query.limit(limitCount * 2)]
      );

      const potentialMatches = usersResponse.documents
        .map((doc: any) => ({ ...doc, id: doc.$id } as unknown as UserProfile))
        .filter(
          (user: UserProfile) =>
            !dbSwipedUserIds.has(user.id) && user.id !== currentUserId
        )
        .slice(0, limitCount);

      if (potentialMatches.length > 0) {
        // Get current user's profile for compatibility calculation
        const currentUser = await this.getProfile(currentUserId);
        if (!currentUser)
          return mockSwipeCards.filter(
            (card) => !swipedUserIds.has(card.userId)
          );

        // Transform to SwipeCard format with compatibility
        const cards: SwipeCard[] = await Promise.all(
          potentialMatches.map(async (user: UserProfile) => {
            const compatibility = await calculateCompatibility(
              currentUser,
              user
            );
            return {
              userId: user.id,
              displayName: user.displayName,
              age: user.age,
              pronouns: user.pronouns,
              bio: user.bio,
              city: user.city,
              avatar: user.avatar,
              compatibility,
              sharedAttributes: [],
            };
          })
        );
        return cards;
      }
    } catch (error) {
      console.log("Using mock swipe cards for demo");
    }

    // Return mock data filtered by swiped users
    return mockSwipeCards
      .filter((card) => !swipedUserIds.has(card.userId))
      .slice(0, limitCount);
  },

  async recordSwipe(
    userId: string,
    targetUserId: string,
    action: "like" | "pass"
  ): Promise<boolean> {
    // Track locally for demo mode
    swipedUserIds.add(targetUserId);

    try {
      const swipeId = `${userId}_${targetUserId}`;
      await databases.createDocument(DATABASE_ID, COLLECTIONS.SWIPES, swipeId, {
        userId,
        targetUserId,
        action,
        timestamp: new Date().toISOString(),
      });

      // Check for mutual like (match)
      if (action === "like") {
        try {
          const mutualSwipe = await databases.getDocument(
            DATABASE_ID,
            COLLECTIONS.SWIPES,
            `${targetUserId}_${userId}`
          );
          if (mutualSwipe && mutualSwipe.action === "like") {
            // Create match
            await this.createMatch(userId, targetUserId);
            return true; // It's a match!
          }
        } catch (error: any) {
          // No mutual swipe exists yet
          if (error.code !== 404) {
            throw error;
          }
        }
      }
    } catch (error) {
      console.log("Using mock swipe recording for demo");
      // For demo, randomly create a match (30% chance on like)
      if (action === "like" && Math.random() < 0.3) {
        return true; // Mock match!
      }
    }

    return false;
  },

  async createMatch(userId1: string, userId2: string): Promise<void> {
    const [user1, user2] = await Promise.all([
      this.getProfile(userId1),
      this.getProfile(userId2),
    ]);

    if (!user1 || !user2) return;

    const matchId = [userId1, userId2].sort().join("_");
    const compatibility = await calculateCompatibility(user1, user2);

    await databases.createDocument(DATABASE_ID, COLLECTIONS.MATCHES, matchId, {
      id: matchId,
      userId1,
      userId2,
      user1Profile: JSON.stringify(user1),
      user2Profile: JSON.stringify(user2),
      compatibility,
      createdAt: new Date().toISOString(),
      sharedAttributes: JSON.stringify([]), // Calculate based on playlists
    });
  },

  async getMatches(userId: string): Promise<Match[]> {
    const [response1, response2] = await Promise.all([
      databases.listDocuments(DATABASE_ID, COLLECTIONS.MATCHES, [
        Query.equal("userId1", userId),
      ]),
      databases.listDocuments(DATABASE_ID, COLLECTIONS.MATCHES, [
        Query.equal("userId2", userId),
      ]),
    ]);

    const matches: Match[] = [
      ...response1.documents.map(
        (doc: any) =>
          ({
            ...doc,
            user1Profile:
              typeof doc.user1Profile === "string"
                ? JSON.parse(doc.user1Profile)
                : doc.user1Profile,
            user2Profile:
              typeof doc.user2Profile === "string"
                ? JSON.parse(doc.user2Profile)
                : doc.user2Profile,
            sharedAttributes:
              typeof doc.sharedAttributes === "string"
                ? JSON.parse(doc.sharedAttributes)
                : doc.sharedAttributes,
          } as unknown as Match)
      ),
      ...response2.documents.map(
        (doc: any) =>
          ({
            ...doc,
            user1Profile:
              typeof doc.user1Profile === "string"
                ? JSON.parse(doc.user1Profile)
                : doc.user1Profile,
            user2Profile:
              typeof doc.user2Profile === "string"
                ? JSON.parse(doc.user2Profile)
                : doc.user2Profile,
            sharedAttributes:
              typeof doc.sharedAttributes === "string"
                ? JSON.parse(doc.sharedAttributes)
                : doc.sharedAttributes,
          } as unknown as Match)
      ),
    ];

    return matches.sort((a, b) => {
      const timeA = a.lastMessageAt || a.createdAt;
      const timeB = b.lastMessageAt || b.createdAt;
      return new Date(timeB).getTime() - new Date(timeA).getTime();
    });
  },
};
