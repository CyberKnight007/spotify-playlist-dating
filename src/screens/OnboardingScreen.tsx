import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Dimensions, Image } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  interpolate,
  Extrapolation,
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { useSpotify } from "../context/SpotifyContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Custom Spotify Icon Component
const SpotifyIcon = ({
  size = 24,
  color = "#000",
}: {
  size?: number;
  color?: string;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
  </Svg>
);

const slides = [
  {
    icon: "musical-notes",
    color: "#1DB954",
    title: "Match via Playlists",
    subtitle:
      "We analyze BPM, energy, and vibe to find your perfect musical chemistry",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
  },
  {
    icon: "heart",
    color: "#A855F7",
    title: "Share Your Anthem",
    subtitle: "Lead with a track that describes your current era and mood",
    image: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800",
  },
  {
    icon: "chatbubbles",
    color: "#3B82F6",
    title: "Safe Connections",
    subtitle:
      "AI-crafted conversation starters based on your shared sonic overlap",
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800",
  },
];

const OnboardingScreen = () => {
  const { connectSpotify, skipWithMockData, loading, error, connecting } =
    useSpotify();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Animation values
  const logoScale = useSharedValue(0);
  const logoRotate = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const orbScale = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    // Logo animation
    logoScale.value = withSequence(
      withTiming(1.2, { duration: 400 }),
      withSpring(1, { damping: 12 })
    );
    logoRotate.value = withSequence(
      withTiming(15, { duration: 200 }),
      withSpring(0, { damping: 8 })
    );

    // Content fade in
    contentOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));

    // Continuous pulse animation
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );

    // Auto-slide
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value },
      { rotate: `${logoRotate.value}deg` },
    ],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const currentSlideData = slides[currentSlide];

  return (
    <View className="flex-1 bg-dark-950">
      {/* Background Image with Gradient */}
      <View className="absolute inset-0">
        <Image
          source={{ uri: currentSlideData.image }}
          className="w-full h-full"
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
        <LinearGradient
          colors={["#0a0a0a00", "#0a0a0a99", "#0a0a0a"]}
          locations={[0, 0.5, 0.8]}
          className="absolute inset-0"
          style={{ width: "100%", height: "100%" }}
        />
      </View>

      {/* Animated Pulse Orb */}
      <Animated.View
        style={[
          pulseStyle,
          {
            position: "absolute",
            top: SCREEN_HEIGHT * 0.15,
            alignSelf: "center",
          },
        ]}
      >
        <View
          className="w-64 h-64 rounded-full opacity-20"
          style={{ backgroundColor: currentSlideData.color }}
        />
      </Animated.View>

      {/* Content */}
      <View className="flex-1 justify-end px-6 pb-12">
        {/* Logo */}
        <Animated.View style={logoStyle} className="items-center mb-8">
          <View
            className="w-20 h-20 rounded-2xl items-center justify-center"
            style={{ backgroundColor: currentSlideData.color }}
          >
            <Ionicons
              name={currentSlideData.icon as any}
              size={40}
              color="#fff"
            />
          </View>
        </Animated.View>

        {/* Slide Content */}
        <Animated.View style={contentStyle} className="items-center mb-8">
          <Text className="text-white text-3xl font-bold text-center mb-4">
            {currentSlideData.title}
          </Text>
          <Text className="text-dark-300 text-lg text-center px-4">
            {currentSlideData.subtitle}
          </Text>
        </Animated.View>

        {/* Slide Indicators */}
        <View className="flex-row justify-center gap-2 mb-8">
          {slides.map((slide, index) => (
            <Pressable
              key={index}
              onPress={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide ? "w-8" : "w-2"
              }`}
              style={{
                backgroundColor:
                  index === currentSlide
                    ? slide.color
                    : "rgba(255,255,255,0.2)",
              }}
            />
          ))}
        </View>

        {/* Error Message */}
        {error && (
          <Animated.View
            entering={FadeIn.duration(300)}
            className="bg-red-500/20 rounded-xl p-3 mb-4"
          >
            <Text className="text-red-400 text-center text-sm">{error}</Text>
          </Animated.View>
        )}

        {/* Connect Button */}
        <Animated.View entering={FadeInUp.delay(600).duration(500)}>
          <Pressable
            onPress={connectSpotify}
            disabled={loading || connecting}
            className="overflow-hidden rounded-2xl mb-4"
          >
            <LinearGradient
              colors={["#1DB954", "#1ed760"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="py-5 flex-row items-center justify-center"
            >
              <SpotifyIcon size={24} color="#0a0a0a" />
              <Text className="text-dark-950 font-bold text-lg ml-3">
                {loading || connecting
                  ? "Connecting..."
                  : "Connect with Spotify"}
              </Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Secondary Actions */}
        <View className="flex-row gap-4">
          <Pressable
            onPress={skipWithMockData}
            disabled={loading}
            className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 items-center"
          >
            <Text className="text-white font-semibold">
              {loading ? "Loading..." : "Skip for Now"}
            </Text>
          </Pressable>
          <Pressable className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 items-center">
            <Text className="text-white font-semibold">Learn More</Text>
          </Pressable>
        </View>

        {/* Privacy Note */}
        <Text className="text-dark-500 text-xs text-center mt-6 px-8">
          We never post without permission. Your music taste seeds your dating
          energy.
        </Text>
      </View>
    </View>
  );
};

export default OnboardingScreen;
