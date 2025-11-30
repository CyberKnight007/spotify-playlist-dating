import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
  RefreshControl,
  Dimensions,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  SlideInRight,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { userService } from "../services/userService";
import { Match, UserProfile } from "../types/user";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ========================
// MOCK DATA FOR DEMO MODE
// ========================
const DEMO_MATCHES: Match[] = [
  {
    id: "match-1",
    userId1: "demo-user",
    userId2: "luna-chen",
    user1Profile: { id: "demo-user", displayName: "You" },
    user2Profile: {
      id: "luna-chen",
      displayName: "Luna Chen",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
      bio: "Indie soul searching through melodies 🎵",
      topGenres: ["indie", "dream pop", "shoegaze"],
      topArtists: ["Tame Impala", "Beach House", "Phoebe Bridgers"],
    },
    compatibility: 94,
    sharedAttributes: ["Dream Pop", "Late Night Vibes", "Indie"],
    createdAt: new Date().toISOString(),
    lastMessage: "That Tame Impala concert was amazing! 🎸",
    lastMessageTime: "2m ago",
    unreadCount: 2,
    isOnline: true,
    sharedPlaylist: "Indie Dreams",
    sharedSongs: 47,
  },
  {
    id: "match-2",
    userId1: "demo-user",
    userId2: "marcus-williams",
    user1Profile: { id: "demo-user", displayName: "You" },
    user2Profile: {
      id: "marcus-williams",
      displayName: "Marcus Williams",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
      bio: "Jazz at sunset, hip-hop at midnight 🎷",
      topGenres: ["jazz", "hip-hop", "neo-soul"],
      topArtists: ["Kendrick Lamar", "Robert Glasper", "Anderson .Paak"],
    },
    compatibility: 89,
    sharedAttributes: ["Neo-Soul", "Chill Beats", "Late Night"],
    createdAt: new Date().toISOString(),
    lastMessage: "Have you heard the new Glasper album?",
    lastMessageTime: "15m ago",
    unreadCount: 0,
    isOnline: true,
    sharedPlaylist: "Jazz & Hip-Hop Fusion",
    sharedSongs: 32,
  },
  {
    id: "match-3",
    userId1: "demo-user",
    userId2: "sage-morrison",
    user1Profile: { id: "demo-user", displayName: "You" },
    user2Profile: {
      id: "sage-morrison",
      displayName: "Sage Morrison",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
      bio: "Folk stories and acoustic adventures 🌿",
      topGenres: ["folk", "acoustic", "americana"],
      topArtists: ["Bon Iver", "Phoebe Bridgers", "Fleet Foxes"],
    },
    compatibility: 92,
    sharedAttributes: ["Acoustic", "Singer-Songwriter", "Cozy Vibes"],
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    lastMessage: "Let's make a roadtrip playlist! 🚗",
    lastMessageTime: "1h ago",
    unreadCount: 1,
    isOnline: false,
    sharedPlaylist: "Campfire Sessions",
    sharedSongs: 56,
  },
  {
    id: "match-4",
    userId1: "demo-user",
    userId2: "kai-nakamura",
    user1Profile: { id: "demo-user", displayName: "You" },
    user2Profile: {
      id: "kai-nakamura",
      displayName: "Kai Nakamura",
      avatar:
        "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400",
      bio: "Electronic beats & city nights 🌃",
      topGenres: ["electronic", "house", "techno"],
      topArtists: ["Disclosure", "Kaytranada", "Jamie xx"],
    },
    compatibility: 87,
    sharedAttributes: ["Electronic", "Dance", "House"],
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    lastMessage: "That Boiler Room set was fire! 🔥",
    lastMessageTime: "3h ago",
    unreadCount: 0,
    isOnline: true,
    sharedPlaylist: "Club Nights",
    sharedSongs: 28,
  },
  {
    id: "match-5",
    userId1: "demo-user",
    userId2: "aria-patel",
    user1Profile: { id: "demo-user", displayName: "You" },
    user2Profile: {
      id: "aria-patel",
      displayName: "Aria Patel",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
      bio: "Classical trained, pop obsessed 🎹",
      topGenres: ["classical", "pop", "orchestral"],
      topArtists: ["Jacob Collier", "Norah Jones", "Ludovico Einaudi"],
    },
    compatibility: 85,
    sharedAttributes: ["Piano", "Classical Crossover", "Vocal"],
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    lastMessage: "That piano cover was beautiful! 😍",
    lastMessageTime: "5h ago",
    unreadCount: 0,
    isOnline: false,
    sharedPlaylist: "Piano Moments",
    sharedSongs: 23,
  },
  {
    id: "match-6",
    userId1: "demo-user",
    userId2: "jordan-blake",
    user1Profile: { id: "demo-user", displayName: "You" },
    user2Profile: {
      id: "jordan-blake",
      displayName: "Jordan Blake",
      avatar:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400",
      bio: "Rock classics meet modern alt 🎸",
      topGenres: ["rock", "alternative", "grunge"],
      topArtists: ["Arctic Monkeys", "The Strokes", "Nirvana"],
    },
    compatibility: 91,
    sharedAttributes: ["Rock", "Alternative", "Guitar"],
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    lastMessage: "Arctic Monkeys tickets went on sale!",
    lastMessageTime: "8h ago",
    unreadCount: 3,
    isOnline: true,
    sharedPlaylist: "Rock Anthems",
    sharedSongs: 64,
  },
  {
    id: "match-7",
    userId1: "demo-user",
    userId2: "maya-rodriguez",
    user1Profile: { id: "demo-user", displayName: "You" },
    user2Profile: {
      id: "maya-rodriguez",
      displayName: "Maya Rodriguez",
      avatar:
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400",
      bio: "Latin rhythms in my soul 💃",
      topGenres: ["latin", "reggaeton", "salsa"],
      topArtists: ["Bad Bunny", "J Balvin", "Rosalía"],
    },
    compatibility: 83,
    sharedAttributes: ["Latin", "Dance", "Party"],
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    lastMessage: "Salsa night this Friday? 💃",
    lastMessageTime: "12h ago",
    unreadCount: 0,
    isOnline: false,
    sharedPlaylist: "Latin Nights",
    sharedSongs: 41,
  },
  {
    id: "match-8",
    userId1: "demo-user",
    userId2: "river-hart",
    user1Profile: { id: "demo-user", displayName: "You" },
    user2Profile: {
      id: "river-hart",
      displayName: "River Hart",
      avatar:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400",
      bio: "Lo-fi beats to chill to 🌙",
      topGenres: ["lo-fi", "chill-hop", "ambient"],
      topArtists: ["nujabes", "Tomppabeats", "Jinsang"],
    },
    compatibility: 88,
    sharedAttributes: ["Lo-Fi", "Study Beats", "Chill"],
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    lastMessage: "Perfect study playlist! Thanks 📚",
    lastMessageTime: "1d ago",
    unreadCount: 0,
    isOnline: false,
    sharedPlaylist: "Late Night Study",
    sharedSongs: 89,
  },
];

// People who liked you (demo)
const DEMO_LIKES: UserProfile[] = [
  {
    id: "like-1",
    displayName: "Zoe Martinez",
    avatar:
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400",
    bio: "R&B nights and sunrise coffees ☕",
    topGenres: ["r&b", "soul", "neo-soul"],
  },
  {
    id: "like-2",
    displayName: "Ethan Brooks",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
    bio: "Metal head with a soft spot for jazz 🎺",
    topGenres: ["metal", "jazz", "progressive"],
  },
  {
    id: "like-3",
    displayName: "Ava Thompson",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400",
    bio: "Country roads, EDM festivals 🤠",
    topGenres: ["country", "edm", "pop"],
  },
  {
    id: "like-4",
    displayName: "Noah Kim",
    avatar:
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400",
    bio: "K-pop stan with indie secrets 🎤",
    topGenres: ["k-pop", "indie", "electronic"],
  },
];

// Super likes received (demo)
const DEMO_SUPER_LIKES: UserProfile[] = [
  {
    id: "super-1",
    displayName: "Olivia Chen",
    avatar:
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400",
    bio: "Your taste in music is impeccable ⭐",
    topGenres: ["indie", "alternative", "dream pop"],
  },
  {
    id: "super-2",
    displayName: "Liam Foster",
    avatar:
      "https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400",
    bio: "We have 47 songs in common! 🎵",
    topGenres: ["rock", "indie", "folk"],
  },
];

// =================
// ENHANCED COMPONENTS
// =================

// Match Card Component with enhanced features
const MatchCard = ({
  match,
  index,
  onPress,
}: {
  match: Match;
  index: number;
  onPress: () => void;
}) => {
  const otherUser = match.user2Profile;
  const scale = useSharedValue(1);
  const pulse = useSharedValue(1);

  // Pulse animation for unread messages
  useEffect(() => {
    if (match.unreadCount && match.unreadCount > 0) {
      pulse.value = withSequence(
        withTiming(1.2, { duration: 300 }),
        withTiming(1, { duration: 300 })
      );
    }
  }, [match.unreadCount]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  return (
    <Animated.View entering={FadeInRight.delay(index * 80).duration(400)}>
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={animatedStyle}
        className="bg-dark-800/50 rounded-3xl p-4 mb-4 border border-white/5"
      >
        <View className="flex-row items-center">
          {/* Avatar with online status */}
          <View className="relative">
            <Image
              source={{ uri: otherUser.avatar }}
              style={{ width: 72, height: 72, borderRadius: 16 }}
            />
            {/* Online indicator */}
            {match.isOnline && (
              <View
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary-500 border-2 border-dark-950"
                style={{ width: 18, height: 18 }}
              />
            )}
          </View>

          {/* Info */}
          <View className="flex-1 ml-4">
            <View className="flex-row items-center justify-between mb-1">
              <View className="flex-row items-center">
                <Text className="text-white text-lg font-bold">
                  {otherUser.displayName}
                </Text>
                {match.isOnline && (
                  <Text className="text-primary-500 text-xs ml-2">Online</Text>
                )}
              </View>
              <View className="bg-primary-500/20 px-2 py-0.5 rounded-full">
                <Text className="text-primary-500 text-xs font-bold">
                  {match.compatibility}%
                </Text>
              </View>
            </View>

            {/* Last message preview */}
            {match.lastMessage && (
              <Text
                className={`text-sm mb-1 ${
                  match.unreadCount && match.unreadCount > 0
                    ? "text-white font-medium"
                    : "text-dark-400"
                }`}
                numberOfLines={1}
              >
                {match.lastMessage}
              </Text>
            )}

            {/* Time and shared info */}
            <View className="flex-row items-center">
              <Text className="text-dark-500 text-xs">
                {match.lastMessageTime}
              </Text>
              <View className="w-1 h-1 rounded-full bg-dark-600 mx-2" />
              <Text className="text-dark-500 text-xs">
                {match.sharedSongs} shared songs
              </Text>
            </View>
          </View>

          {/* Right side - Unread badge or chat */}
          {match.unreadCount && match.unreadCount > 0 ? (
            <Animated.View style={badgeStyle}>
              <View className="w-8 h-8 rounded-full bg-primary-500 items-center justify-center ml-3">
                <Text className="text-dark-950 text-xs font-bold">
                  {match.unreadCount}
                </Text>
              </View>
            </Animated.View>
          ) : (
            <Pressable className="w-10 h-10 rounded-full bg-white/5 items-center justify-center ml-3">
              <Ionicons name="chatbubble-outline" size={18} color="#64748b" />
            </Pressable>
          )}
        </View>

        {/* Shared Playlist Preview */}
        {match.sharedPlaylist && (
          <View className="mt-3 bg-gradient-to-r from-primary-500/10 to-purple-500/10 rounded-2xl p-3 flex-row items-center border border-white/5">
            <LinearGradient
              colors={["#1DB954", "#A855F7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="musical-notes" size={18} color="#fff" />
            </LinearGradient>
            <View className="flex-1 ml-3">
              <Text className="text-white/50 text-xs">Shared playlist</Text>
              <Text className="text-white font-medium">
                {match.sharedPlaylist}
              </Text>
            </View>
            <Ionicons name="play-circle" size={28} color="#1DB954" />
          </View>
        )}
      </AnimatedPressable>
    </Animated.View>
  );
};

// New Match Badge Component (enhanced)
const NewMatchBadge = ({
  user,
  index,
  isNew = true,
}: {
  user: UserProfile;
  index: number;
  isNew?: boolean;
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View entering={FadeInUp.delay(index * 100).duration(400)}>
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={animatedStyle}
        className="items-center mr-4"
      >
        <View className="relative">
          <LinearGradient
            colors={isNew ? ["#1DB954", "#A855F7"] : ["#A855F7", "#EC4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 3, borderRadius: 999 }}
          >
            <Image
              source={{ uri: user.avatar }}
              style={{
                width: 68,
                height: 68,
                borderRadius: 999,
                borderWidth: 3,
                borderColor: "#0a0a0a",
              }}
            />
          </LinearGradient>
          {isNew && (
            <View className="absolute -bottom-1 -right-1 bg-primary-500 rounded-full p-1.5">
              <Ionicons name="heart" size={12} color="#0a0a0a" />
            </View>
          )}
        </View>
        <Text className="text-white text-xs mt-2 font-medium" numberOfLines={1}>
          {user.displayName.split(" ")[0]}
        </Text>
      </AnimatedPressable>
    </Animated.View>
  );
};

// Likes You Card Component
const LikesYouCard = ({
  users,
  onPress,
}: {
  users: UserProfile[];
  onPress: () => void;
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(150).duration(500)}>
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.98);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        style={animatedStyle}
        className="mx-6 mb-6"
      >
        <LinearGradient
          colors={["#1DB954", "#22c55e", "#16a34a"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 24, padding: 1 }}
        >
          <View className="bg-dark-900 rounded-3xl p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                {/* Stacked avatars */}
                <View className="flex-row" style={{ width: 80 }}>
                  {users.slice(0, 3).map((user, i) => (
                    <Image
                      key={user.id}
                      source={{ uri: user.avatar }}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        borderWidth: 2,
                        borderColor: "#0a0a0a",
                        marginLeft: i > 0 ? -16 : 0,
                        zIndex: 3 - i,
                      }}
                    />
                  ))}
                </View>
                <View className="ml-4">
                  <Text className="text-white font-bold text-lg">
                    {users.length} Likes You
                  </Text>
                  <Text className="text-white/60 text-sm">
                    See who's into your vibe
                  </Text>
                </View>
              </View>
              <View className="bg-white/20 rounded-full p-2">
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </View>
            </View>
          </View>
        </LinearGradient>
      </AnimatedPressable>
    </Animated.View>
  );
};

// Super Likes Section
const SuperLikesSection = ({ users }: { users: UserProfile[] }) => {
  return (
    <Animated.View entering={FadeIn.delay(250).duration(400)} className="mb-6">
      <View className="flex-row items-center justify-between px-6 mb-4">
        <View className="flex-row items-center">
          <Ionicons name="star" size={20} color="#FFD700" />
          <Text className="text-white text-lg font-semibold ml-2">
            Super Likes
          </Text>
        </View>
        <View className="bg-yellow-500/20 px-3 py-1 rounded-full">
          <Text className="text-yellow-500 text-xs font-bold">
            {users.length} NEW
          </Text>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24 }}
      >
        {users.map((user, index) => (
          <Animated.View
            key={user.id}
            entering={FadeInRight.delay(index * 100).duration(400)}
          >
            <Pressable className="mr-4 bg-dark-800/50 rounded-2xl p-3 border border-yellow-500/20">
              <View className="relative">
                <Image
                  source={{ uri: user.avatar }}
                  style={{
                    width: 100,
                    height: 120,
                    borderRadius: 12,
                  }}
                />
                <View className="absolute top-2 right-2 bg-yellow-500 rounded-full p-1">
                  <Ionicons name="star" size={12} color="#0a0a0a" />
                </View>
              </View>
              <Text className="text-white font-medium mt-2" numberOfLines={1}>
                {user.displayName}
              </Text>
              <Text className="text-dark-400 text-xs" numberOfLines={1}>
                {user.bio}
              </Text>
            </Pressable>
          </Animated.View>
        ))}
      </ScrollView>
    </Animated.View>
  );
};

// Filter Tabs Component
const FilterTabs = ({
  activeFilter,
  onFilterChange,
  counts,
}: {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  counts: { all: number; unread: number; online: number };
}) => {
  const filters = [
    { id: "all", label: "All", count: counts.all },
    { id: "unread", label: "Unread", count: counts.unread },
    { id: "online", label: "Online", count: counts.online },
  ];

  return (
    <Animated.View
      entering={FadeIn.delay(200).duration(400)}
      className="flex-row px-6 mb-4"
    >
      {filters.map((filter) => (
        <Pressable
          key={filter.id}
          onPress={() => onFilterChange(filter.id)}
          className={`mr-3 px-4 py-2 rounded-full flex-row items-center ${
            activeFilter === filter.id
              ? "bg-primary-500"
              : "bg-white/5 border border-white/10"
          }`}
        >
          <Text
            className={`font-medium ${
              activeFilter === filter.id ? "text-dark-950" : "text-white"
            }`}
          >
            {filter.label}
          </Text>
          {filter.count > 0 && (
            <View
              className={`ml-2 px-1.5 py-0.5 rounded-full ${
                activeFilter === filter.id ? "bg-dark-950/20" : "bg-white/10"
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  activeFilter === filter.id ? "text-dark-950" : "text-white"
                }`}
              >
                {filter.count}
              </Text>
            </View>
          )}
        </Pressable>
      ))}
    </Animated.View>
  );
};

// ========================
// MAIN MATCHES SCREEN
// ========================
const MatchesScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");

  // Demo mode - load mock data when no authenticated user
  const isDemoMode = !user;

  useEffect(() => {
    loadMatches();
  }, [user]);

  const loadMatches = async () => {
    setLoading(true);
    try {
      if (isDemoMode) {
        // Load demo data
        await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate loading
        setMatches(DEMO_MATCHES);
      } else if (user) {
        const userMatches = await userService.getMatches(user.$id);
        setMatches(userMatches);
      }
    } catch (error) {
      console.error("Failed to load matches:", error);
      // Fallback to demo data on error
      setMatches(DEMO_MATCHES);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMatches();
    setRefreshing(false);
  }, []);

  const handleMatchPress = (match: Match) => {
    // Navigate to parent stack's Message screen
    navigation.getParent()?.navigate("Message", {
      matchId: match.id,
      otherUser: match.user2Profile,
      sharedSongs: match.sharedSongs || [],
    });
  };

  // Filter matches
  const filteredMatches = matches.filter((m) => {
    if (activeFilter === "unread") return m.unreadCount && m.unreadCount > 0;
    if (activeFilter === "online") return m.isOnline;
    return true;
  });

  // Get new matches (last 24 hours)
  const newMatches = matches.filter((m) => {
    const matchDate = new Date(m.createdAt);
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return matchDate > dayAgo;
  });

  // Counts for filter tabs
  const counts = {
    all: matches.length,
    unread: matches.filter((m) => m.unreadCount && m.unreadCount > 0).length,
    online: matches.filter((m) => m.isOnline).length,
  };

  return (
    <View className="flex-1 bg-dark-950">
      {/* Header */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(500)}
        className="px-6 pt-16 pb-4"
      >
        <View className="flex-row items-center justify-between">
          <View>
            <View className="flex-row items-center">
              <Text className="text-white text-3xl font-bold">Matches</Text>
              {isDemoMode && (
                <View className="ml-3 bg-purple-500/20 px-2 py-0.5 rounded-full">
                  <Text className="text-purple-400 text-xs font-medium">
                    Demo
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-dark-400 text-base mt-1">
              {matches.length} people vibe with you
            </Text>
          </View>
          <View className="flex-row">
            <Pressable className="w-11 h-11 rounded-full bg-white/5 items-center justify-center border border-white/10 mr-2">
              <Ionicons name="search-outline" size={20} color="#fff" />
            </Pressable>
            <Pressable className="w-11 h-11 rounded-full bg-white/5 items-center justify-center border border-white/10">
              <Ionicons name="options-outline" size={20} color="#fff" />
            </Pressable>
          </View>
        </View>
      </Animated.View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1DB954"
          />
        }
      >
        {/* Likes You Card (Premium Feature) */}
        {(isDemoMode || DEMO_LIKES.length > 0) && (
          <LikesYouCard
            users={DEMO_LIKES}
            onPress={() => console.log("View likes")}
          />
        )}

        {/* Super Likes Section */}
        {(isDemoMode || DEMO_SUPER_LIKES.length > 0) && (
          <SuperLikesSection users={DEMO_SUPER_LIKES} />
        )}

        {/* New Matches Section */}
        {newMatches.length > 0 && (
          <Animated.View
            entering={FadeIn.delay(200).duration(400)}
            className="mb-6"
          >
            <View className="flex-row items-center justify-between px-6 mb-4">
              <Text className="text-white text-lg font-semibold">
                New Matches
              </Text>
              <View className="bg-primary-500/20 px-2 py-1 rounded-full">
                <Text className="text-primary-500 text-xs font-bold">
                  {newMatches.length} NEW
                </Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24 }}
            >
              {newMatches.map((match, index) => (
                <NewMatchBadge
                  key={match.id}
                  user={match.user2Profile}
                  index={index}
                />
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Filter Tabs */}
        <FilterTabs
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          counts={counts}
        />

        {/* Messages Section */}
        <Animated.View
          entering={FadeIn.delay(300).duration(400)}
          className="px-6"
        >
          <Text className="text-white text-lg font-semibold mb-4">
            Messages
          </Text>

          {loading && matches.length === 0 ? (
            <View className="items-center justify-center py-20">
              <View className="w-16 h-16 rounded-full bg-primary-500/20 items-center justify-center mb-4">
                <Ionicons name="musical-notes" size={32} color="#1DB954" />
              </View>
              <Text className="text-white text-lg">Loading matches...</Text>
            </View>
          ) : filteredMatches.length === 0 ? (
            <View className="items-center justify-center py-16">
              <View className="w-20 h-20 rounded-full bg-dark-800 items-center justify-center mb-4">
                <Ionicons
                  name={
                    activeFilter === "unread"
                      ? "mail-open-outline"
                      : "people-outline"
                  }
                  size={36}
                  color="#64748b"
                />
              </View>
              <Text className="text-white text-lg font-bold text-center mb-2">
                {activeFilter === "unread"
                  ? "All caught up!"
                  : activeFilter === "online"
                  ? "No one online right now"
                  : "No matches yet"}
              </Text>
              <Text className="text-dark-400 text-center px-8">
                {activeFilter === "unread"
                  ? "You've read all your messages"
                  : activeFilter === "online"
                  ? "Check back later to see who's vibing"
                  : "Start swiping to find your vibe match!"}
              </Text>
            </View>
          ) : (
            filteredMatches.map((match, index) => (
              <MatchCard
                key={match.id}
                match={match}
                index={index}
                onPress={() => handleMatchPress(match)}
              />
            ))
          )}
        </Animated.View>

        <View className="h-32" />
      </ScrollView>
    </View>
  );
};

export default MatchesScreen;
