import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
  RefreshControl,
  Dimensions,
  Modal,
} from "react-native";
import { BlurView } from "expo-blur";
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

import { SwipeCard as SwipeCardType } from "../types/user";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Premium Modal Component
const PremiumModal = ({
  visible,
  onClose,
  onUpgrade,
}: {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="slide"
    onRequestClose={onClose}
  >
    <BlurView
      intensity={80}
      tint="dark"
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
    >
      <View className="bg-dark-900 w-[90%] rounded-3xl overflow-hidden border border-primary-500/30">
        <LinearGradient
          colors={["#1DB954", "#158a3d"]}
          className="p-6 items-center"
        >
          <View className="w-16 h-16 rounded-full bg-white/20 items-center justify-center mb-4">
            <Ionicons name="heart" size={32} color="#fff" />
          </View>
          <Text className="text-white text-2xl font-bold text-center">
            See Who Liked You
          </Text>
          <Text className="text-white/80 text-center mt-2">
            Upgrade to Premium to see everyone who swiped right on you
            instantly!
          </Text>
        </LinearGradient>

        <View className="p-6">
          <View className="flex-row items-center mb-4">
            <Ionicons name="checkmark-circle" size={24} color="#1DB954" />
            <Text className="text-white ml-3 text-lg">Unlimited Swipes</Text>
          </View>
          <View className="flex-row items-center mb-4">
            <Ionicons name="checkmark-circle" size={24} color="#1DB954" />
            <Text className="text-white ml-3 text-lg">See Who Liked You</Text>
          </View>
          <View className="flex-row items-center mb-6">
            <Ionicons name="checkmark-circle" size={24} color="#1DB954" />
            <Text className="text-white ml-3 text-lg">Travel Mode</Text>
          </View>

          <Pressable
            onPress={onUpgrade}
            className="bg-primary-500 py-4 rounded-full items-center mb-3"
          >
            <Text className="text-dark-950 font-bold text-lg">Get Premium</Text>
          </Pressable>

          <Pressable onPress={onClose} className="py-3 items-center">
            <Text className="text-dark-400 font-medium">Maybe Later</Text>
          </Pressable>
        </View>
      </View>
    </BlurView>
  </Modal>
);

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
  const otherUser = match.user2Profile || {
    id: "unknown",
    displayName: "Unknown User",
    avatar: "https://via.placeholder.com/72",
  };
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
  isPremium = false,
}: {
  users: UserProfile[];
  onPress: () => void;
  isPremium?: boolean;
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
                      blurRadius={isPremium ? 0 : 10}
                    />
                  ))}
                </View>
                <View className="ml-4">
                  <Text className="text-white font-bold text-lg">
                    {users.length} Likes You
                  </Text>
                  <Text className="text-white/60 text-sm">
                    {isPremium ? "Tap to see them" : "Upgrade to see who"}
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
  const { user, userProfile, updateProfile } = useAuth();
  const navigation = useNavigation<any>();
  const [matches, setMatches] = useState<Match[]>([]);
  const [receivedLikes, setReceivedLikes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  useEffect(() => {
    loadMatches();
  }, [user]);

  const loadMatches = async () => {
    setLoading(true);
    try {
      if (user) {
        const [userMatches, likes] = await Promise.all([
          userService.getMatches(user.$id),
          userService.getReceivedLikes(user.$id),
        ]);
        setMatches(userMatches);
        setReceivedLikes(likes);
      }
    } catch (error) {
      console.error("Failed to load matches:", error);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    // Simulate upgrade
    if (userProfile) {
      await updateProfile({ isPremium: true });
      setShowPremiumModal(false);
      // Refresh to show unblurred
      loadMatches();
    }
  };

  const handleLikesPress = () => {
    if (userProfile?.isPremium) {
      // Navigate to Likes screen
      navigation.getParent()?.navigate("Likes");
    } else {
      setShowPremiumModal(true);
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
            <Text className="text-white text-3xl font-bold">Matches</Text>
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
        {/* Likes You Section */}
        {receivedLikes.length > 0 && (
          <LikesYouCard
            users={receivedLikes}
            onPress={handleLikesPress}
            isPremium={userProfile?.isPremium}
          />
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
                  user={
                    match.user2Profile || {
                      id: "unknown",
                      displayName: "Unknown",
                    }
                  }
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

      <PremiumModal
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onUpgrade={handleUpgrade}
      />
    </View>
  );
};

export default MatchesScreen;
