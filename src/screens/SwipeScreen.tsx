import React, { useEffect, useState, useCallback } from "react";
import { View, Text, Dimensions, Pressable, Image } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
  FadeIn,
  FadeInDown,
  SlideInRight,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { userService } from "../services/userService";
import { SwipeCard as SwipeCardType } from "../types/user";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

// Swipe Card Component
const SwipeCard = ({
  card,
  index,
  totalCards,
  onSwipe,
}: {
  card: SwipeCardType;
  index: number;
  totalCards: number;
  onSwipe: (direction: "like" | "pass") => void;
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const cardScale = useSharedValue(1);
  const context = useSharedValue({ x: 0, y: 0 });

  const panGesture = Gesture.Pan()
    .onStart(() => {
      context.value = { x: translateX.value, y: translateY.value };
      cardScale.value = withSpring(1.02);
    })
    .onUpdate((event) => {
      translateX.value = context.value.x + event.translationX;
      translateY.value = context.value.y + event.translationY * 0.5;
    })
    .onEnd((event) => {
      cardScale.value = withSpring(1);

      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        const direction = event.translationX > 0 ? "like" : "pass";
        translateX.value = withTiming(
          event.translationX > 0 ? SCREEN_WIDTH + 200 : -SCREEN_WIDTH - 200,
          { duration: 300 },
          () => runOnJS(onSwipe)(direction)
        );
        translateY.value = withTiming(event.translationY, { duration: 300 });
      } else {
        translateX.value = withSpring(0, { damping: 20 });
        translateY.value = withSpring(0, { damping: 20 });
      }
    })
    .enabled(index === 0);

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-15, 0, 15],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
        { scale: cardScale.value },
      ],
    };
  });

  const likeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    ),
  }));

  const nopeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP
    ),
  }));

  const stackOffset = index * 8;
  const stackScale = 1 - index * 0.05;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          cardStyle,
          {
            position: "absolute",
            width: SCREEN_WIDTH - 40,
            height: SCREEN_HEIGHT * 0.65,
            zIndex: totalCards - index,
            top: stackOffset,
            transform: [{ scale: stackScale }],
          },
        ]}
        className="rounded-3xl overflow-hidden shadow-2xl"
      >
        {/* Card Background */}
        <Image
          source={{
            uri:
              card.avatar ||
              "https://images.unsplash.com/photo-1494232410401-ad00d5433cfa?w=800",
          }}
          className="absolute inset-0 w-full h-full"
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />

        {/* Gradient Overlay */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.9)"]}
          locations={[0, 0.5, 1]}
          className="absolute inset-0"
          style={{ width: "100%", height: "100%" }}
        />

        {/* LIKE Badge */}
        <Animated.View
          style={likeOpacity}
          className="absolute top-8 left-6 border-4 border-primary-500 rounded-xl px-4 py-2 -rotate-12"
        >
          <Text className="text-primary-500 text-3xl font-black">LIKE</Text>
        </Animated.View>

        {/* NOPE Badge */}
        <Animated.View
          style={nopeOpacity}
          className="absolute top-8 right-6 border-4 border-red-500 rounded-xl px-4 py-2 rotate-12"
        >
          <Text className="text-red-500 text-3xl font-black">NOPE</Text>
        </Animated.View>

        {/* Compatibility Badge */}
        {card.compatibility && (
          <View className="absolute top-6 right-6">
            <LinearGradient
              colors={["#1DB954", "#1ed760"]}
              className="px-4 py-2 rounded-full flex-row items-center"
            >
              <Ionicons name="heart" size={16} color="#000" />
              <Text className="text-dark-950 font-bold ml-1">
                {card.compatibility}%
              </Text>
            </LinearGradient>
          </View>
        )}

        {/* Card Content */}
        <View className="absolute bottom-0 left-0 right-0 p-6">
          <View className="flex-row items-end justify-between mb-4">
            <View className="flex-1">
              <Text className="text-white text-3xl font-bold">
                {card.displayName}
                {card.age && (
                  <Text className="text-white/70 font-normal">
                    , {card.age}
                  </Text>
                )}
              </Text>
              {card.pronouns && (
                <Text className="text-white/60 text-base mt-1">
                  {card.pronouns}
                </Text>
              )}
              {card.city && (
                <View className="flex-row items-center mt-2">
                  <Ionicons
                    name="location-outline"
                    size={14}
                    color="rgba(255,255,255,0.6)"
                  />
                  <Text className="text-white/60 text-sm ml-1">
                    {card.city}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {card.bio && (
            <Text className="text-white/80 text-base mb-4" numberOfLines={2}>
              {card.bio}
            </Text>
          )}

          {/* Music Tags */}
          {card.sharedAttributes && card.sharedAttributes.length > 0 && (
            <View className="flex-row flex-wrap gap-2">
              {card.sharedAttributes.slice(0, 3).map((attr, i) => (
                <View
                  key={i}
                  className="bg-white/10 px-3 py-1.5 rounded-full border border-white/20"
                >
                  <Text className="text-white text-xs">{attr}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Now Playing */}
          {card.activePlaylist && (
            <View className="mt-4 bg-white/10 rounded-2xl p-4 flex-row items-center border border-white/10">
              <View className="w-12 h-12 rounded-xl bg-primary-500/20 items-center justify-center mr-3">
                <Ionicons name="musical-notes" size={24} color="#1DB954" />
              </View>
              <View className="flex-1">
                <Text className="text-white/50 text-xs uppercase tracking-wider">
                  Active Playlist
                </Text>
                <Text className="text-white font-semibold" numberOfLines={1}>
                  {card.activePlaylist.name}
                </Text>
              </View>
            </View>
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

// Main SwipeScreen Component
const SwipeScreen = () => {
  const { user } = useAuth();
  const [cards, setCards] = useState<SwipeCardType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [matchedCard, setMatchedCard] = useState<SwipeCardType | null>(null);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    setIsLoading(true);
    try {
      // Use demo user ID if no real user is logged in
      const userId = user?.$id || "demo-user";
      const newCards = await userService.getSwipeCards(userId, 20);
      setCards(newCards);
      setCurrentIndex(0);
    } catch (error) {
      console.error("Error loading cards:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwipe = useCallback(
    async (direction: "like" | "pass") => {
      if (currentIndex >= cards.length) return;

      const card = cards[currentIndex];
      try {
        const userId = user?.$id || "demo-user";
        const isMatch = await userService.recordSwipe(
          userId,
          card.userId,
          direction
        );

        // Show match animation if it's a match
        if (isMatch && direction === "like") {
          setMatchedCard(card);
          setTimeout(() => setMatchedCard(null), 3000);
        }
      } catch (error) {
        console.error("Error recording swipe:", error);
      }

      setCurrentIndex((prev) => {
        const newIndex = prev + 1;
        if (newIndex >= cards.length - 3) {
          loadCards();
        }
        return newIndex;
      });
    },
    [user, currentIndex, cards]
  );

  const handleButtonSwipe = (direction: "like" | "pass") => {
    handleSwipe(direction);
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-dark-950 items-center justify-center">
        <Animated.View entering={FadeIn.duration(500)}>
          <View className="w-20 h-20 rounded-full bg-primary-500/20 items-center justify-center mb-4">
            <Ionicons name="musical-notes" size={40} color="#1DB954" />
          </View>
          <Text className="text-white text-lg font-medium">
            Finding matches...
          </Text>
        </Animated.View>
      </View>
    );
  }

  if (currentIndex >= cards.length) {
    return (
      <View className="flex-1 bg-dark-950 items-center justify-center px-8">
        <Animated.View
          entering={FadeInDown.duration(600)}
          className="items-center"
        >
          <View className="w-32 h-32 rounded-full bg-dark-800 items-center justify-center mb-6">
            <Ionicons name="musical-notes-outline" size={64} color="#64748b" />
          </View>
          <Text className="text-white text-2xl font-bold text-center mb-3">
            No more profiles
          </Text>
          <Text className="text-dark-400 text-center text-base mb-8">
            Check back later for new matches or expand your preferences
          </Text>
          <Pressable
            onPress={loadCards}
            className="bg-primary-500 px-8 py-4 rounded-2xl"
          >
            <Text className="text-dark-950 font-bold text-lg">Refresh</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  const visibleCards = cards.slice(currentIndex, currentIndex + 3);

  return (
    <GestureHandlerRootView className="flex-1">
      <View className="flex-1 bg-dark-950">
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          className="px-6 pt-16 pb-4"
        >
          <Text className="text-white text-3xl font-bold">Discover</Text>
          <Text className="text-dark-400 text-base mt-1">
            Swipe to find your vibe match
          </Text>
        </Animated.View>

        {/* Cards Container */}
        <View className="flex-1 items-center justify-center px-5">
          {visibleCards
            .map((card, index) => (
              <SwipeCard
                key={card.userId}
                card={card}
                index={index}
                totalCards={visibleCards.length}
                onSwipe={handleSwipe}
              />
            ))
            .reverse()}
        </View>

        {/* Action Buttons */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(500)}
          className="flex-row justify-center items-center gap-8 pb-12 pt-4"
        >
          {/* Rewind Button */}
          <Pressable className="w-14 h-14 rounded-full bg-dark-800 items-center justify-center border border-dark-700">
            <Ionicons name="refresh" size={24} color="#64748b" />
          </Pressable>

          {/* Nope Button */}
          <Pressable
            onPress={() => handleButtonSwipe("pass")}
            className="w-16 h-16 rounded-full bg-dark-800 items-center justify-center border-2 border-red-500"
          >
            <Ionicons name="close" size={32} color="#ef4444" />
          </Pressable>

          {/* Super Like Button */}
          <Pressable className="w-14 h-14 rounded-full bg-dark-800 items-center justify-center border border-accent-blue">
            <Ionicons name="star" size={24} color="#3B82F6" />
          </Pressable>

          {/* Like Button */}
          <Pressable
            onPress={() => handleButtonSwipe("like")}
            className="w-16 h-16 rounded-full bg-dark-800 items-center justify-center border-2 border-primary-500"
          >
            <Ionicons name="heart" size={32} color="#1DB954" />
          </Pressable>

          {/* Boost Button */}
          <Pressable className="w-14 h-14 rounded-full bg-dark-800 items-center justify-center border border-accent-purple">
            <Ionicons name="flash" size={24} color="#A855F7" />
          </Pressable>
        </Animated.View>

        {/* Match Modal */}
        {matchedCard && (
          <Animated.View
            entering={FadeIn.duration(300)}
            className="absolute inset-0 bg-black/90 items-center justify-center z-50"
          >
            <Animated.View entering={FadeInDown.delay(100).springify()}>
              <View className="items-center">
                <View className="flex-row items-center mb-6">
                  <View className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary-500">
                    <Image
                      source={{
                        uri:
                          matchedCard.avatar ||
                          "https://images.unsplash.com/photo-1494232410401-ad00d5433cfa?w=400",
                      }}
                      className="w-full h-full"
                      style={{ width: "100%", height: "100%" }}
                    />
                  </View>
                  <View className="mx-4">
                    <Ionicons name="heart" size={40} color="#1DB954" />
                  </View>
                  <View className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary-500">
                    <Image
                      source={{
                        uri: "https://images.unsplash.com/photo-1504593811423-6dd665756598?w=400",
                      }}
                      className="w-full h-full"
                      style={{ width: "100%", height: "100%" }}
                    />
                  </View>
                </View>

                <Text className="text-primary-500 text-4xl font-black mb-2">
                  IT'S A MATCH!
                </Text>
                <Text className="text-white text-lg text-center px-8">
                  You and {matchedCard.displayName} have liked each other
                </Text>

                <View className="flex-row gap-4 mt-8">
                  <Pressable
                    onPress={() => setMatchedCard(null)}
                    className="bg-white/10 px-8 py-4 rounded-full"
                  >
                    <Text className="text-white font-semibold">
                      Keep Swiping
                    </Text>
                  </Pressable>
                  <Pressable className="bg-primary-500 px-8 py-4 rounded-full">
                    <Text className="text-dark-950 font-bold">
                      Send Message
                    </Text>
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          </Animated.View>
        )}
      </View>
    </GestureHandlerRootView>
  );
};

export default SwipeScreen;
