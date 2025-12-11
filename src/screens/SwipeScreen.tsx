import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  Image,
  Dimensions,
  Pressable,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useAuth } from "../context/AuthContext";
import { userService } from "../services/userService";
import { SwipeCard as SwipeCardType } from "../types/user";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.9;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.65;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const ROTATION_ANGLE = 15;

// Spring config for smooth animations
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 200,
  mass: 0.5,
};

// Type for compatibility with existing Profile interface
type Profile = {
  id: string;
  name: string;
  age?: number;
  bio?: string;
  location?: string;
  imageUrl: string;
  topArtists: string[];
  topGenres: string[];
  compatibilityScore: number;
  sharedArtists: number;
  sharedGenres: number;
};

interface SwipeCardProps {
  profile: Profile;
  isFirst: boolean;
  onSwipe: (direction: "left" | "right") => void;
  onSuperLike: () => void;
}

const SwipeCard: React.FC<SwipeCardProps> = ({
  profile,
  isFirst,
  onSwipe,
  onSuperLike,
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const cardScale = useSharedValue(1);
  const context = useSharedValue({ x: 0, y: 0 });

  const handleSwipeComplete = useCallback(
    (direction: "left" | "right") => {
      onSwipe(direction);
    },
    [onSwipe]
  );

  const resetPosition = useCallback(() => {
    translateX.value = withSpring(0, SPRING_CONFIG);
    translateY.value = withSpring(0, SPRING_CONFIG);
    cardScale.value = withSpring(1, SPRING_CONFIG);
  }, [translateX, translateY, cardScale]);

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { x: translateX.value, y: translateY.value };
      cardScale.value = withTiming(1.02, { duration: 100 });
    })
    .onUpdate((event) => {
      translateX.value = context.value.x + event.translationX;
      translateY.value = context.value.y + event.translationY * 0.5;
    })
    .onEnd((event) => {
      const velocityThreshold = 500;
      const shouldSwipeRight =
        translateX.value > SWIPE_THRESHOLD ||
        event.velocityX > velocityThreshold;
      const shouldSwipeLeft =
        translateX.value < -SWIPE_THRESHOLD ||
        event.velocityX < -velocityThreshold;

      if (shouldSwipeRight) {
        translateX.value = withSpring(
          SCREEN_WIDTH * 1.5,
          { ...SPRING_CONFIG, velocity: event.velocityX },
          () => runOnJS(handleSwipeComplete)("right")
        );
        translateY.value = withSpring(event.translationY * 0.5, SPRING_CONFIG);
      } else if (shouldSwipeLeft) {
        translateX.value = withSpring(
          -SCREEN_WIDTH * 1.5,
          { ...SPRING_CONFIG, velocity: event.velocityX },
          () => runOnJS(handleSwipeComplete)("left")
        );
        translateY.value = withSpring(event.translationY * 0.5, SPRING_CONFIG);
      } else {
        runOnJS(resetPosition)();
      }
    })
    .enabled(isFirst);

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-ROTATION_ANGLE, 0, ROTATION_ANGLE],
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

  const likeOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const nopeOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          {
            position: "absolute",
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            borderRadius: 20,
            overflow: "hidden",
            backgroundColor: "#1a1a2e",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 10,
          },
          cardStyle,
        ]}
      >
        {/* Background Image */}
        <Image
          source={{ uri: profile.imageUrl }}
          style={{
            width: "100%",
            height: "100%",
            position: "absolute",
          }}
          resizeMode="cover"
        />

        {/* Gradient Overlay */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "60%",
          }}
          className="bg-gradient-to-t from-black/90 via-black/50 to-transparent"
        />

        {/* Like/Nope Overlays */}
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 40,
              left: 20,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderWidth: 4,
              borderColor: "#1DB954",
              borderRadius: 8,
              transform: [{ rotate: "-15deg" }],
              zIndex: 10,
            },
            likeOverlayStyle,
          ]}
        >
          <Text
            style={{
              fontSize: 32,
              fontWeight: "bold",
              color: "#1DB954",
              letterSpacing: 2,
            }}
          >
            LIKE
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            {
              position: "absolute",
              top: 40,
              right: 20,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderWidth: 4,
              borderColor: "#FF4B4B",
              borderRadius: 8,
              transform: [{ rotate: "15deg" }],
              zIndex: 10,
            },
            nopeOverlayStyle,
          ]}
        >
          <Text
            style={{
              fontSize: 32,
              fontWeight: "bold",
              color: "#FF4B4B",
              letterSpacing: 2,
            }}
          >
            NOPE
          </Text>
        </Animated.View>

        {/* Compatibility Badge */}
        <View
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            backgroundColor: "rgba(29, 185, 84, 0.9)",
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
          }}
        >
          <MaterialCommunityIcons name="music-note" size={16} color="white" />
          <Text style={{ color: "white", fontWeight: "bold", fontSize: 14 }}>
            {profile.compatibilityScore}%
          </Text>
        </View>

        {/* Profile Info */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: 20,
            paddingBottom: 24,
          }}
        >
          {/* Name and Age */}
          <View
            style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}
          >
            <Text
              style={{
                fontSize: 28,
                fontWeight: "bold",
                color: "white",
              }}
            >
              {profile.name}
            </Text>
            <Text
              style={{
                fontSize: 22,
                color: "rgba(255,255,255,0.8)",
              }}
            >
              {profile.age}
            </Text>
          </View>

          {/* Location */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              marginTop: 4,
            }}
          >
            <Ionicons
              name="location-outline"
              size={14}
              color="rgba(255,255,255,0.7)"
            />
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
              {profile.location}
            </Text>
          </View>

          {/* Bio */}
          <Text
            style={{
              color: "rgba(255,255,255,0.9)",
              fontSize: 15,
              marginTop: 8,
            }}
            numberOfLines={2}
          >
            {profile.bio}
          </Text>

          {/* Music Stats */}
          <View
            style={{
              flexDirection: "row",
              gap: 16,
              marginTop: 12,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: "rgba(255,255,255,0.15)",
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 16,
              }}
            >
              <Ionicons name="people" size={14} color="#1DB954" />
              <Text style={{ color: "white", fontSize: 13 }}>
                {profile.sharedArtists} shared artists
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: "rgba(255,255,255,0.15)",
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 16,
              }}
            >
              <Ionicons name="musical-notes" size={14} color="#1DB954" />
              <Text style={{ color: "white", fontSize: 13 }}>
                {profile.sharedGenres} genres
              </Text>
            </View>
          </View>

          {/* Top Genres */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              marginTop: 12,
            }}
          >
            {profile.topGenres.slice(0, 3).map((genre, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: "rgba(29, 185, 84, 0.3)",
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "rgba(29, 185, 84, 0.5)",
                }}
              >
                <Text
                  style={{ color: "#1DB954", fontSize: 12, fontWeight: "600" }}
                >
                  {genre}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

// Background card component (non-interactive)
const BackgroundCard: React.FC<{ profile: Profile; index: number }> = ({
  profile,
  index,
}) => {
  const scale = 1 - index * 0.05;
  const translateY = index * 10;

  return (
    <View
      style={{
        position: "absolute",
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 20,
        overflow: "hidden",
        backgroundColor: "#1a1a2e",
        transform: [{ scale }, { translateY }],
        opacity: 1 - index * 0.2,
        zIndex: -index,
      }}
    >
      <Image
        source={{ uri: profile.imageUrl }}
        style={{
          width: "100%",
          height: "100%",
        }}
        resizeMode="cover"
      />
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "50%",
        }}
        className="bg-gradient-to-t from-black/90 to-transparent"
      />
    </View>
  );
};

export default function SwipeScreen() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null);
  const [showMatch, setShowMatch] = useState(false);
  const currentCardRef = useRef<any>(null);

  const currentProfile = profiles[0];
  const nextProfiles = profiles.slice(1, 3);

  // Load swipe cards on mount
  React.useEffect(() => {
    loadProfiles();
  }, [user]);

  const loadProfiles = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const swipeCards = await userService.getSwipeCards(user.$id);
      // Convert SwipeCardType to Profile format
      const formattedProfiles: Profile[] = swipeCards.map((card) => ({
        id: card.userId,
        name: card.displayName,
        age: card.age,
        bio: card.bio,
        location: card.city,
        imageUrl: card.avatar || "https://via.placeholder.com/400",
        topArtists: card.topArtists || [],
        topGenres: card.topGenres || [],
        compatibilityScore: card.compatibility || 0,
        sharedArtists: card.sharedArtists?.length || 0,
        sharedGenres: card.sharedGenres?.length || 0,
      }));
      setProfiles(formattedProfiles);
    } catch (error) {
      console.error("Failed to load profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = useCallback(
    async (direction: "left" | "right") => {
      if (!user || !currentProfile) return;

      try {
        // Record the swipe in database
        await userService.recordSwipe({
          swiperId: user.$id,
          swipedId: currentProfile.id,
          direction,
        });

        // If swiped right, check for match
        if (direction === "right") {
          const isMatch = await userService.checkForMatch(
            user.$id,
            currentProfile.id
          );

          if (isMatch) {
            // Create the match
            await userService.createMatch(
              user.$id,
              currentProfile.id,
              currentProfile.compatibilityScore
            );
            setMatchedProfile(currentProfile);
            setShowMatch(true);
          }
        }
      } catch (error) {
        console.error("Error handling swipe:", error);
      }

      // Remove current profile from stack
      setProfiles((prev) => prev.slice(1));
    },
    [currentProfile, user]
  );

  const handleSuperLike = useCallback(() => {
    if (currentProfile) {
      setMatchedProfile(currentProfile);
      setShowMatch(true);
      setProfiles((prev) => prev.slice(1));
    }
  }, [currentProfile]);

  const handleLikePress = useCallback(() => {
    // Trigger swipe right programmatically
    handleSwipe("right");
  }, [handleSwipe]);

  const handleNopePress = useCallback(() => {
    // Trigger swipe left programmatically
    handleSwipe("left");
  }, [handleSwipe]);

  const closeMatchModal = () => {
    setShowMatch(false);
    setMatchedProfile(null);
  };

  if (profiles.length === 0) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#121212" }}
        edges={["top"]}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 40,
          }}
        >
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: "rgba(29, 185, 84, 0.1)",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <MaterialCommunityIcons
              name="music-note-off"
              size={48}
              color="#1DB954"
            />
          </View>
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: "white",
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            No more profiles
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: "rgba(255,255,255,0.6)",
              textAlign: "center",
              lineHeight: 24,
            }}
          >
            Check back later for more music lovers who share your taste!
          </Text>
          <Pressable
            onPress={() => loadProfiles()}
            style={{
              marginTop: 32,
              backgroundColor: "#1DB954",
              paddingHorizontal: 32,
              paddingVertical: 14,
              borderRadius: 30,
            }}
          >
            <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
              Refresh Profiles
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#121212" }}
      edges={["top"]}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 12,
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: "bold", color: "white" }}>
          Discover
        </Text>
        <Pressable
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "rgba(255,255,255,0.1)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="options-outline" size={22} color="white" />
        </Pressable>
      </View>

      {/* Card Stack */}
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Background cards */}
        {nextProfiles.map((profile, index) => (
          <BackgroundCard
            key={profile.id}
            profile={profile}
            index={index + 1}
          />
        ))}

        {/* Active card */}
        {currentProfile && (
          <SwipeCard
            key={currentProfile.id}
            profile={currentProfile}
            isFirst={true}
            onSwipe={handleSwipe}
            onSuperLike={handleSuperLike}
          />
        )}
      </View>

      {/* Action Buttons */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          gap: 20,
          paddingVertical: 24,
          paddingBottom: 32,
        }}
      >
        {/* Nope Button */}
        <Pressable
          onPress={handleNopePress}
          style={({ pressed }) => ({
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: pressed
              ? "rgba(255, 75, 75, 0.2)"
              : "rgba(255,255,255,0.1)",
            justifyContent: "center",
            alignItems: "center",
            borderWidth: 2,
            borderColor: "#FF4B4B",
            transform: [{ scale: pressed ? 0.95 : 1 }],
          })}
        >
          <Ionicons name="close" size={32} color="#FF4B4B" />
        </Pressable>

        {/* Super Like Button */}
        <Pressable
          onPress={handleSuperLike}
          style={({ pressed }) => ({
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: pressed
              ? "rgba(0, 191, 255, 0.2)"
              : "rgba(255,255,255,0.1)",
            justifyContent: "center",
            alignItems: "center",
            borderWidth: 2,
            borderColor: "#00BFFF",
            transform: [{ scale: pressed ? 0.95 : 1 }],
          })}
        >
          <Ionicons name="star" size={24} color="#00BFFF" />
        </Pressable>

        {/* Like Button */}
        <Pressable
          onPress={handleLikePress}
          style={({ pressed }) => ({
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: pressed
              ? "rgba(29, 185, 84, 0.2)"
              : "rgba(255,255,255,0.1)",
            justifyContent: "center",
            alignItems: "center",
            borderWidth: 2,
            borderColor: "#1DB954",
            transform: [{ scale: pressed ? 0.95 : 1 }],
          })}
        >
          <Ionicons name="heart" size={32} color="#1DB954" />
        </Pressable>
      </View>

      {/* Match Modal */}
      <Modal
        visible={showMatch}
        transparent
        animationType="fade"
        onRequestClose={closeMatchModal}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.9)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              alignItems: "center",
              paddingVertical: 40,
              paddingHorizontal: 30,
              borderRadius: 24,
              backgroundColor: "#1a1a2e",
              width: "100%",
              maxWidth: 340,
            }}
          >
            {/* Celebration Icon */}
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: "rgba(29, 185, 84, 0.2)",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <MaterialCommunityIcons
                name="music-note-plus"
                size={40}
                color="#1DB954"
              />
            </View>

            <Text
              style={{
                fontSize: 28,
                fontWeight: "bold",
                color: "#1DB954",
                marginBottom: 8,
              }}
            >
              It's a Match!
            </Text>

            <Text
              style={{
                fontSize: 16,
                color: "rgba(255,255,255,0.7)",
                textAlign: "center",
                marginBottom: 24,
              }}
            >
              You and {matchedProfile?.name} have similar music taste!
            </Text>

            {matchedProfile && (
              <Image
                source={{ uri: matchedProfile.imageUrl }}
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  borderWidth: 4,
                  borderColor: "#1DB954",
                  marginBottom: 24,
                }}
              />
            )}

            <View style={{ flexDirection: "row", gap: 12, width: "100%" }}>
              <Pressable
                onPress={closeMatchModal}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 30,
                  backgroundColor: "rgba(255,255,255,0.1)",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "white", fontWeight: "600" }}>
                  Keep Swiping
                </Text>
              </Pressable>

              <Pressable
                onPress={closeMatchModal}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 30,
                  backgroundColor: "#1DB954",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "white", fontWeight: "600" }}>
                  Send Message
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
