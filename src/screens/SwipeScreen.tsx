import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  Dimensions,
  Pressable,
  Modal,
  ScrollView,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  interpolate,
  Extrapolation,
  useAnimatedScrollHandler,
  withRepeat,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useAuth } from "../context/AuthContext";
import { userService } from "../services/userService";
import { SwipeCard as SwipeCardType } from "../types/user";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.72;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const ROTATION_ANGLE = 10;

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
  sharedTracks?: string[];
  interests?: string[];
  listeningHabits?: string;
  favoriteVenue?: string;
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
  const [showFullBio, setShowFullBio] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

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

            {/* Info Button */}
            <TouchableOpacity
              onPress={() => setShowDetailsModal(true)}
              style={{
                marginLeft: "auto",
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "rgba(255,255,255,0.2)",
                justifyContent: "center",
                alignItems: "center",
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="information-circle" size={22} color="white" />
            </TouchableOpacity>
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

          {/* Bio/Description */}
          {profile.bio && (
            <View style={{ marginTop: 12 }}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowFullBio(!showFullBio)}
              >
                <Text
                  style={{
                    color: "rgba(255,255,255,0.95)",
                    fontSize: 15,
                    lineHeight: 22,
                    marginBottom: 4,
                  }}
                  numberOfLines={showFullBio ? undefined : 3}
                >
                  {profile.bio}
                </Text>
                {profile.bio.length > 100 && (
                  <Text
                    style={{
                      color: "#1DB954",
                      fontSize: 13,
                      fontWeight: "600",
                      marginTop: 2,
                    }}
                  >
                    {showFullBio ? "Show less" : "Read more"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Quick About Badges */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              marginTop: 12,
            }}
          >
            {/* Music Mood Badge */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                backgroundColor: "rgba(138, 43, 226, 0.2)",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "rgba(138, 43, 226, 0.4)",
              }}
            >
              <Ionicons name="musical-notes" size={14} color="#BA55D3" />
              <Text
                style={{ color: "#BA55D3", fontSize: 12, fontWeight: "600" }}
              >
                Vibes Daily
              </Text>
            </View>

            {/* Active Status Badge */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                backgroundColor: "rgba(0, 217, 255, 0.2)",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "rgba(0, 217, 255, 0.4)",
              }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#00D9FF",
                }}
              />
              <Text
                style={{ color: "#00D9FF", fontSize: 12, fontWeight: "600" }}
              >
                Active Now
              </Text>
            </View>
          </View>

          {/* Music Stats */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              marginTop: 12,
            }}
          >
            {profile.sharedTracks && profile.sharedTracks.length > 0 && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  backgroundColor: "rgba(29, 185, 84, 0.3)",
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "rgba(29, 185, 84, 0.5)",
                }}
              >
                <Ionicons name="headset" size={14} color="#1DB954" />
                <Text
                  style={{ color: "white", fontSize: 13, fontWeight: "bold" }}
                >
                  {profile.sharedTracks.length} shared songs
                </Text>
              </View>
            )}
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

          {/* Shared Song Highlight */}
          {profile.sharedTracks && profile.sharedTracks.length > 0 && (
            <View style={{ marginTop: 8 }}>
              <Text
                style={{ color: "#1DB954", fontSize: 14, fontWeight: "600" }}
                numberOfLines={1}
              >
                🎵 You both vibe to {profile.sharedTracks[0]}
              </Text>
            </View>
          )}

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

          {/* Interest Tags */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 6,
              marginTop: 10,
            }}
          >
            {/* Concerts Interest */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: "rgba(255, 107, 129, 0.2)",
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "rgba(255, 107, 129, 0.3)",
              }}
            >
              <Ionicons name="ticket-outline" size={12} color="#FF6B81" />
              <Text
                style={{ color: "#FF6B81", fontSize: 11, fontWeight: "600" }}
              >
                Concert Lover
              </Text>
            </View>

            {/* Playlist Curator */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: "rgba(255, 193, 7, 0.2)",
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "rgba(255, 193, 7, 0.3)",
              }}
            >
              <MaterialCommunityIcons
                name="playlist-music"
                size={12}
                color="#FFC107"
              />
              <Text
                style={{ color: "#FFC107", fontSize: 11, fontWeight: "600" }}
              >
                Playlist Curator
              </Text>
            </View>

            {/* Vinyl Collector */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: "rgba(156, 39, 176, 0.2)",
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "rgba(156, 39, 176, 0.3)",
              }}
            >
              <MaterialCommunityIcons name="album" size={12} color="#9C27B0" />
              <Text
                style={{ color: "#9C27B0", fontSize: 11, fontWeight: "600" }}
              >
                Vinyl Fan
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Detailed Profile Modal */}
      <Modal
        visible={showDetailsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <BlurView intensity={80} tint="dark" style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={{ flex: 1, justifyContent: "flex-end" }}>
              <View
                style={{
                  backgroundColor: "#1E1E1E",
                  borderTopLeftRadius: 30,
                  borderTopRightRadius: 30,
                  maxHeight: SCREEN_HEIGHT * 0.85,
                  paddingBottom: 20,
                }}
              >
                {/* Header */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 20,
                    borderBottomWidth: 1,
                    borderBottomColor: "rgba(255,255,255,0.1)",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <Image
                      source={{ uri: profile.imageUrl }}
                      style={{ width: 50, height: 50, borderRadius: 25 }}
                    />
                    <View>
                      <Text
                        style={{
                          color: "white",
                          fontSize: 20,
                          fontWeight: "bold",
                        }}
                      >
                        {profile.name}, {profile.age}
                      </Text>
                      <Text
                        style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}
                      >
                        {profile.location}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                    <Ionicons name="close" size={28} color="white" />
                  </TouchableOpacity>
                </View>

                {/* Scrollable Content */}
                <ScrollView
                  style={{ maxHeight: SCREEN_HEIGHT * 0.65 }}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Compatibility Score */}
                  <View style={{ padding: 20, paddingBottom: 10 }}>
                    <View
                      style={{
                        backgroundColor: "rgba(29, 185, 84, 0.15)",
                        padding: 16,
                        borderRadius: 16,
                        borderLeftWidth: 4,
                        borderLeftColor: "#1DB954",
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <View>
                          <Text
                            style={{
                              color: "#1DB954",
                              fontSize: 14,
                              fontWeight: "600",
                              marginBottom: 4,
                            }}
                          >
                            Music Compatibility
                          </Text>
                          <Text
                            style={{
                              color: "rgba(255,255,255,0.8)",
                              fontSize: 13,
                            }}
                          >
                            Based on listening habits
                          </Text>
                        </View>
                        <View
                          style={{
                            width: 60,
                            height: 60,
                            borderRadius: 30,
                            backgroundColor: "#1DB954",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Text
                            style={{
                              color: "white",
                              fontSize: 20,
                              fontWeight: "bold",
                            }}
                          >
                            {profile.compatibilityScore}%
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* About Me Section */}
                  {profile.bio && (
                    <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
                      <Text
                        style={{
                          color: "white",
                          fontSize: 18,
                          fontWeight: "bold",
                          marginBottom: 12,
                        }}
                      >
                        About Me
                      </Text>
                      <Text
                        style={{
                          color: "rgba(255,255,255,0.9)",
                          fontSize: 15,
                          lineHeight: 24,
                        }}
                      >
                        {profile.bio}
                      </Text>
                    </View>
                  )}

                  {/* My Music Interests */}
                  <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
                    <Text
                      style={{
                        color: "white",
                        fontSize: 18,
                        fontWeight: "bold",
                        marginBottom: 12,
                      }}
                    >
                      My Music Interests
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: 10,
                      }}
                    >
                      {[
                        "Concert Lover",
                        "Playlist Curator",
                        "Vinyl Fan",
                        "Festival Goer",
                        "Late Night Listener",
                      ].map((interest, index) => (
                        <View
                          key={index}
                          style={{
                            backgroundColor: "rgba(29, 185, 84, 0.2)",
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            borderRadius: 20,
                            borderWidth: 1,
                            borderColor: "rgba(29, 185, 84, 0.4)",
                          }}
                        >
                          <Text
                            style={{
                              color: "#1DB954",
                              fontSize: 14,
                              fontWeight: "600",
                            }}
                          >
                            {interest}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Top Artists */}
                  <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
                    <Text
                      style={{
                        color: "white",
                        fontSize: 18,
                        fontWeight: "bold",
                        marginBottom: 12,
                      }}
                    >
                      Top Artists
                    </Text>
                    {profile.topArtists.slice(0, 5).map((artist, index) => (
                      <View
                        key={index}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingVertical: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: "rgba(255,255,255,0.05)",
                        }}
                      >
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: "rgba(29, 185, 84, 0.2)",
                            justifyContent: "center",
                            alignItems: "center",
                            marginRight: 12,
                          }}
                        >
                          <MaterialCommunityIcons
                            name="account-music"
                            size={20}
                            color="#1DB954"
                          />
                        </View>
                        <Text style={{ color: "white", fontSize: 16, flex: 1 }}>
                          {artist}
                        </Text>
                        <Text
                          style={{
                            color: "rgba(255,255,255,0.5)",
                            fontSize: 14,
                          }}
                        >
                          #{index + 1}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Shared Music */}
                  {profile.sharedTracks && profile.sharedTracks.length > 0 && (
                    <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
                      <Text
                        style={{
                          color: "white",
                          fontSize: 18,
                          fontWeight: "bold",
                          marginBottom: 12,
                        }}
                      >
                        Songs You Both Love
                      </Text>
                      {profile.sharedTracks.slice(0, 5).map((track, index) => (
                        <View
                          key={index}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            paddingVertical: 12,
                            backgroundColor: "rgba(29, 185, 84, 0.08)",
                            paddingHorizontal: 12,
                            borderRadius: 12,
                            marginBottom: 8,
                          }}
                        >
                          <Ionicons
                            name="musical-note"
                            size={20}
                            color="#1DB954"
                            style={{ marginRight: 12 }}
                          />
                          <Text
                            style={{ color: "white", fontSize: 15, flex: 1 }}
                          >
                            {track}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Music Genres */}
                  <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
                    <Text
                      style={{
                        color: "white",
                        fontSize: 18,
                        fontWeight: "bold",
                        marginBottom: 12,
                      }}
                    >
                      Favorite Genres
                    </Text>
                    <View
                      style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                    >
                      {profile.topGenres.map((genre, index) => (
                        <View
                          key={index}
                          style={{
                            backgroundColor: "rgba(138, 43, 226, 0.2)",
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            borderRadius: 16,
                            borderWidth: 1,
                            borderColor: "rgba(138, 43, 226, 0.4)",
                          }}
                        >
                          <Text
                            style={{
                              color: "#BA55D3",
                              fontSize: 13,
                              fontWeight: "600",
                            }}
                          >
                            {genre}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </ScrollView>
              </View>
            </View>
          </SafeAreaView>
        </BlurView>
      </Modal>
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
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null);
  const [showMatch, setShowMatch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const currentCardRef = useRef<any>(null);

  // Filter states
  const [ageRange, setAgeRange] = useState({ min: 18, max: 50 });
  const [maxDistance, setMaxDistance] = useState(100);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [showOnlyOnline, setShowOnlyOnline] = useState(false);

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
        sharedTracks: card.sharedTracks || [],
      }));
      setAllProfiles(formattedProfiles);
      applyFilters(formattedProfiles);
    } catch (error) {
      console.error("Failed to load profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = useCallback(
    (profilesToFilter: Profile[] = allProfiles) => {
      let filtered = profilesToFilter;

      // Age filter
      filtered = filtered.filter(
        (p) => p.age && p.age >= ageRange.min && p.age <= ageRange.max
      );

      // Genre filter
      if (selectedGenres.length > 0) {
        filtered = filtered.filter((p) =>
          p.topGenres.some((genre) =>
            selectedGenres.some((selected) =>
              genre.toLowerCase().includes(selected.toLowerCase())
            )
          )
        );
      }

      setProfiles(filtered);
    },
    [ageRange, selectedGenres, allProfiles]
  );

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
          onPress={() => setShowFilters(true)}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor:
              selectedGenres.length > 0 ? "#1DB954" : "rgba(255,255,255,0.1)",
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

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
      >
        <BlurView intensity={20} tint="dark" style={{ flex: 1 }}>
          <Pressable
            style={{ flex: 1, justifyContent: "flex-end" }}
            onPress={() => setShowFilters(false)}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View
                style={{
                  backgroundColor: "#1a1a2e",
                  borderTopLeftRadius: 30,
                  borderTopRightRadius: 30,
                  paddingBottom: 40,
                  maxHeight: SCREEN_HEIGHT * 0.85,
                }}
              >
                {/* Header */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: 20,
                    borderBottomWidth: 1,
                    borderBottomColor: "rgba(255,255,255,0.1)",
                  }}
                >
                  <Text
                    style={{ fontSize: 24, fontWeight: "bold", color: "white" }}
                  >
                    Filters
                  </Text>
                  <Pressable onPress={() => setShowFilters(false)}>
                    <Ionicons name="close" size={28} color="white" />
                  </Pressable>
                </View>

                <ScrollView style={{ maxHeight: SCREEN_HEIGHT * 0.6 }}>
                  {/* Age Range */}
                  <View style={{ padding: 20 }}>
                    <Text
                      style={{
                        color: "white",
                        fontSize: 18,
                        fontWeight: "600",
                        marginBottom: 16,
                      }}
                    >
                      Age Range
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 12,
                        alignItems: "center",
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            color: "rgba(255,255,255,0.6)",
                            fontSize: 12,
                            marginBottom: 8,
                          }}
                        >
                          Min Age
                        </Text>
                        <TextInput
                          value={String(ageRange.min)}
                          onChangeText={(text) => {
                            if (text === "") {
                              setAgeRange({ ...ageRange, min: 18 });
                              return;
                            }
                            const num = parseInt(text);
                            if (!isNaN(num)) {
                              setAgeRange({
                                ...ageRange,
                                min: Math.max(18, Math.min(num, ageRange.max)),
                              });
                            }
                          }}
                          keyboardType="number-pad"
                          style={{
                            backgroundColor: "rgba(255,255,255,0.1)",
                            color: "white",
                            padding: 12,
                            borderRadius: 12,
                            fontSize: 16,
                            textAlign: "center",
                          }}
                        />
                      </View>
                      <Text
                        style={{
                          color: "rgba(255,255,255,0.6)",
                          paddingTop: 20,
                        }}
                      >
                        -
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            color: "rgba(255,255,255,0.6)",
                            fontSize: 12,
                            marginBottom: 8,
                          }}
                        >
                          Max Age
                        </Text>
                        <TextInput
                          value={String(ageRange.max)}
                          onChangeText={(text) => {
                            if (text === "") {
                              setAgeRange({ ...ageRange, max: 50 });
                              return;
                            }
                            const num = parseInt(text);
                            if (!isNaN(num)) {
                              setAgeRange({
                                ...ageRange,
                                max: Math.max(ageRange.min, Math.min(num, 100)),
                              });
                            }
                          }}
                          keyboardType="number-pad"
                          style={{
                            backgroundColor: "rgba(255,255,255,0.1)",
                            color: "white",
                            padding: 12,
                            borderRadius: 12,
                            fontSize: 16,
                            textAlign: "center",
                          }}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Distance */}
                  <View style={{ padding: 20, paddingTop: 0 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginBottom: 16,
                      }}
                    >
                      <Text
                        style={{
                          color: "white",
                          fontSize: 18,
                          fontWeight: "600",
                        }}
                      >
                        Maximum Distance
                      </Text>
                      <Text
                        style={{
                          color: "#1DB954",
                          fontSize: 16,
                          fontWeight: "600",
                        }}
                      >
                        {maxDistance} km
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      {[10, 25, 50, 100, 500].map((distance) => (
                        <Pressable
                          key={distance}
                          onPress={() => setMaxDistance(distance)}
                          style={{
                            flex: 1,
                            paddingVertical: 12,
                            paddingHorizontal: 8,
                            borderRadius: 12,
                            backgroundColor:
                              maxDistance === distance
                                ? "#1DB954"
                                : "rgba(255,255,255,0.1)",
                          }}
                        >
                          <Text
                            style={{
                              color: "white",
                              textAlign: "center",
                              fontSize: 12,
                              fontWeight:
                                maxDistance === distance ? "600" : "400",
                            }}
                          >
                            {distance}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  {/* Music Genres */}
                  <View style={{ padding: 20, paddingTop: 0 }}>
                    <Text
                      style={{
                        color: "white",
                        fontSize: 18,
                        fontWeight: "600",
                        marginBottom: 16,
                      }}
                    >
                      Music Preferences
                    </Text>
                    <View
                      style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                    >
                      {[
                        "Bollywood",
                        "Pop",
                        "Hip Hop",
                        "Rock",
                        "EDM",
                        "K-Pop",
                        "R&B",
                        "Indie",
                        "Punjabi",
                        "Classical",
                      ].map((genre) => (
                        <Pressable
                          key={genre}
                          onPress={() => {
                            if (selectedGenres.includes(genre)) {
                              setSelectedGenres(
                                selectedGenres.filter((g) => g !== genre)
                              );
                            } else {
                              setSelectedGenres([...selectedGenres, genre]);
                            }
                          }}
                          style={{
                            paddingVertical: 10,
                            paddingHorizontal: 16,
                            borderRadius: 20,
                            backgroundColor: selectedGenres.includes(genre)
                              ? "#1DB954"
                              : "rgba(255,255,255,0.1)",
                            borderWidth: 1,
                            borderColor: selectedGenres.includes(genre)
                              ? "#1DB954"
                              : "rgba(255,255,255,0.2)",
                          }}
                        >
                          <Text
                            style={{
                              color: "white",
                              fontSize: 14,
                              fontWeight: selectedGenres.includes(genre)
                                ? "600"
                                : "400",
                            }}
                          >
                            {genre}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </ScrollView>

                {/* Action Buttons */}
                <View style={{ padding: 20, gap: 12 }}>
                  <Pressable
                    onPress={() => {
                      applyFilters();
                      setShowFilters(false);
                    }}
                    style={{
                      backgroundColor: "#1DB954",
                      paddingVertical: 16,
                      borderRadius: 30,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontSize: 16,
                        fontWeight: "bold",
                      }}
                    >
                      Apply Filters
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setAgeRange({ min: 18, max: 50 });
                      setMaxDistance(100);
                      setSelectedGenres([]);
                      setProfiles(allProfiles);
                    }}
                    style={{
                      paddingVertical: 16,
                      borderRadius: 30,
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.2)",
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontSize: 16,
                        fontWeight: "600",
                      }}
                    >
                      Reset Filters
                    </Text>
                  </Pressable>
                </View>
              </View>
            </Pressable>
          </Pressable>
        </BlurView>
      </Modal>
    </SafeAreaView>
  );
}
