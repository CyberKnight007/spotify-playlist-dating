import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  limit,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, SwipeAction, Match, SwipeCard } from '../types/user';
import { calculateCompatibility } from '../utils/matching';

export const userService = {
  async createProfile(userId: string, profileData: Partial<UserProfile>): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...profileData,
      id: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  },

  async getProfile(userId: string): Promise<UserProfile | null> {
    const userRef = doc(db, 'users', userId);
    const snapshot = await getDoc(userRef);
    return snapshot.exists() ? (snapshot.data() as UserProfile) : null;
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  async getSwipeCards(currentUserId: string, limitCount: number = 10): Promise<SwipeCard[]> {
    // Get users that haven't been swiped on
    const swipesRef = collection(db, 'swipes');
    const userSwipes = await getDocs(query(swipesRef, where('userId', '==', currentUserId)));
    const swipedUserIds = new Set(userSwipes.docs.map(doc => doc.data().targetUserId));

    // Get potential matches (excluding self and already swiped)
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(
      query(usersRef, where('__name__', '!=', currentUserId), limit(limitCount * 2))
    );

    const potentialMatches = usersSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as UserProfile))
      .filter(user => !swipedUserIds.has(user.id) && user.id !== currentUserId)
      .slice(0, limitCount);

    // Get current user's profile for compatibility calculation
    const currentUser = await this.getProfile(currentUserId);
    if (!currentUser) return [];

    // Transform to SwipeCard format with compatibility
    const cards: SwipeCard[] = await Promise.all(
      potentialMatches.map(async user => {
        const compatibility = await calculateCompatibility(currentUser, user);
        return {
          userId: user.id,
          displayName: user.displayName,
          age: user.age,
          pronouns: user.pronouns,
          bio: user.bio,
          city: user.city,
          avatar: user.avatar,
          compatibility,
          sharedAttributes: [] // Calculate based on playlists
        };
      })
    );

    return cards;
  },

  async recordSwipe(userId: string, targetUserId: string, action: 'like' | 'pass'): Promise<void> {
    const swipeRef = doc(db, 'swipes', `${userId}_${targetUserId}`);
    await setDoc(swipeRef, {
      userId,
      targetUserId,
      action,
      timestamp: serverTimestamp()
    });

    // Check for mutual like (match)
    if (action === 'like') {
      const mutualSwipe = await getDoc(doc(db, 'swipes', `${targetUserId}_${userId}`));
      if (mutualSwipe.exists() && mutualSwipe.data().action === 'like') {
        // Create match
        await this.createMatch(userId, targetUserId);
      }
    }
  },

  async createMatch(userId1: string, userId2: string): Promise<void> {
    const [user1, user2] = await Promise.all([
      this.getProfile(userId1),
      this.getProfile(userId2)
    ]);

    if (!user1 || !user2) return;

    const matchId = [userId1, userId2].sort().join('_');
    const matchRef = doc(db, 'matches', matchId);
    const compatibility = await calculateCompatibility(user1, user2);

    await setDoc(matchRef, {
      id: matchId,
      userId1,
      userId2,
      user1Profile: user1,
      user2Profile: user2,
      compatibility,
      createdAt: serverTimestamp(),
      sharedAttributes: [] // Calculate based on playlists
    });
  },

  async getMatches(userId: string): Promise<Match[]> {
    const matchesRef = collection(db, 'matches');
    const q1 = query(matchesRef, where('userId1', '==', userId));
    const q2 = query(matchesRef, where('userId2', '==', userId));

    const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);

    const matches: Match[] = [
      ...snapshot1.docs.map(doc => doc.data() as Match),
      ...snapshot2.docs.map(doc => doc.data() as Match)
    ];

    return matches.sort((a, b) => {
      const timeA = a.lastMessageAt || a.createdAt;
      const timeB = b.lastMessageAt || b.createdAt;
      return new Date(timeB).getTime() - new Date(timeA).getTime();
    });
  }
};

