import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Dimensions,
  Pressable,
  FlatList,
  ViewToken,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Extrapolation,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  SlideInRight,
  runOnJS,
  SharedValue,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Onboarding data
const ONBOARDING_DATA: {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  gradientColors: readonly [string, string];
  features: string[];
}[] = [
  {
    id: "1",
    title: "Connect Your Spotify",
    subtitle: "Link your music to find your match",
    description:
      "Connect your Spotify account and let your playlists speak for you. Your music taste is the key to finding compatible connections.",
    icon: "musical-notes",
    gradientColors: ["#1DB954", "#1ed760"] as const,
    features: ["Secure OAuth login", "Private & encrypted", "One-tap connect"],
  },
  {
    id: "2",
    title: "Select Your Vibe",
    subtitle: "Choose playlists that define you",
    description:
      "Pick the playlists that best represent your current mood and personality. These become your musical calling card.",
    icon: "albums",
    gradientColors: ["#A855F7", "#7C3AED"] as const,
    features: ["Curated selection", "Mood matching", "Genre analysis"],
  },
  {
    id: "3",
    title: "Discover Matches",
    subtitle: "Find your sonic soulmate",
    description:
      "Our algorithm analyzes BPM, energy, mood, and genre to find people who truly vibe with your music taste.",
    icon: "heart",
    gradientColors: ["#EC4899", "#F43F5E"] as const,
    features: ["AI-powered matching", "Compatibility scores", "Shared tastes"],
  },
  {
    id: "4",
    title: "Start Vibing",
    subtitle: "Connect through music",
    description:
      "Swipe, match, and start conversations with people who share your musical DNA. Let the music bring you together!",
    icon: "chatbubbles",
    gradientColors: ["#F59E0B", "#EF4444"] as const,
    features: [
      "Smart chat starters",
      "Share songs",
      "Build playlists together",
    ],
  },
];

// Animated Icon Component
const AnimatedIcon = ({
  name,
  gradientColors,
  isActive,
}: {
  name: string;
  gradientColors: readonly [string, string];
  isActive: boolean;
}) => {
  const scale = useSharedValue(0.8);
  const rotate = useSharedValue(0);

  React.useEffect(() => {
    if (isActive) {
      scale.value = withSequence(
        withSpring(1.2, { damping: 8 }),
        withSpring(1, { damping: 12 })
      );
      rotate.value = withSequence(
        withTiming(10, { duration: 150 }),
        withTiming(-10, { duration: 150 }),
        withSpring(0, { damping: 10 })
      );
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <LinearGradient
        colors={[gradientColors[0], gradientColors[1]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 140,
          height: 140,
          borderRadius: 40,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: gradientColors[0],
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 20,
          elevation: 10,
        }}
      >
        <Ionicons
          name={name as keyof typeof Ionicons.glyphMap}
          size={64}
          color="#fff"
        />
      </LinearGradient>
    </Animated.View>
  );
};

// Feature Pill Component
const FeaturePill = ({
  text,
  delay,
  gradientColors,
}: {
  text: string;
  delay: number;
  gradientColors: readonly [string, string];
}) => {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      style={{
        backgroundColor: `${gradientColors[0]}20`,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: `${gradientColors[0]}40`,
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      <Text
        style={{ color: gradientColors[0], fontSize: 13, fontWeight: "600" }}
      >
        {text}
      </Text>
    </Animated.View>
  );
};

// Floating Particles Component
const FloatingParticles = ({ color }: { color: string }) => {
  const particles = Array.from({ length: 6 }, (_, i) => i);

  return (
    <>
      {particles.map((_, index) => {
        const randomX = Math.random() * SCREEN_WIDTH;
        const randomY = Math.random() * 400;
        const randomSize = 4 + Math.random() * 8;
        const randomDelay = index * 500;

        return (
          <Animated.View
            key={index}
            entering={FadeIn.delay(randomDelay).duration(1000)}
            style={{
              position: "absolute",
              left: randomX,
              top: randomY,
              width: randomSize,
              height: randomSize,
              borderRadius: randomSize / 2,
              backgroundColor: color,
              opacity: 0.3,
            }}
          />
        );
      })}
    </>
  );
};

// Single Onboarding Page
const OnboardingPage = ({
  item,
  index,
  scrollX,
}: {
  item: (typeof ONBOARDING_DATA)[0];
  index: number;
  scrollX: SharedValue<number>;
}) => {
  const inputRange = [
    (index - 1) * SCREEN_WIDTH,
    index * SCREEN_WIDTH,
    (index + 1) * SCREEN_WIDTH,
  ];

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.8, 1, 0.8],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.5, 1, 0.5],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollX.value,
      inputRange,
      [50, 0, 50],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }, { translateY }],
      opacity,
    };
  });

  const isActive =
    Math.round(scrollX.value / SCREEN_WIDTH) === index ||
    (scrollX.value === 0 && index === 0);

  return (
    <View
      style={{
        width: SCREEN_WIDTH,
        paddingHorizontal: 32,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Floating Particles */}
      <FloatingParticles color={item.gradientColors[0]} />

      {/* Icon */}
      <Animated.View style={[animatedStyle, { marginBottom: 48 }]}>
        <AnimatedIcon
          name={item.icon}
          gradientColors={item.gradientColors}
          isActive={isActive}
        />
      </Animated.View>

      {/* Title */}
      <Animated.Text
        style={[
          {
            fontSize: 32,
            fontWeight: "800",
            color: "#fff",
            textAlign: "center",
            marginBottom: 8,
          },
        ]}
      >
        {item.title}
      </Animated.Text>

      {/* Subtitle */}
      <Animated.Text
        style={{
          fontSize: 18,
          color: item.gradientColors[0],
          textAlign: "center",
          marginBottom: 16,
          fontWeight: "600",
        }}
      >
        {item.subtitle}
      </Animated.Text>

      {/* Description */}
      <Text
        style={{
          fontSize: 16,
          color: "rgba(255,255,255,0.7)",
          textAlign: "center",
          lineHeight: 24,
          marginBottom: 32,
          paddingHorizontal: 16,
        }}
      >
        {item.description}
      </Text>

      {/* Feature Pills */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {item.features.map((feature, featureIndex) => (
          <FeaturePill
            key={feature}
            text={feature}
            delay={featureIndex * 100}
            gradientColors={item.gradientColors}
          />
        ))}
      </View>
    </View>
  );
};

// Pagination Dots
const PaginationDots = ({
  data,
  scrollX,
}: {
  data: typeof ONBOARDING_DATA;
  scrollX: SharedValue<number>;
}) => {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {data.map((item, index) => {
        const inputRange = [
          (index - 1) * SCREEN_WIDTH,
          index * SCREEN_WIDTH,
          (index + 1) * SCREEN_WIDTH,
        ];

        const DotComponent = () => {
          const dotAnimatedStyle = useAnimatedStyle(() => {
            const width = interpolate(
              scrollX.value,
              inputRange,
              [8, 32, 8],
              Extrapolation.CLAMP
            );
            const opacity = interpolate(
              scrollX.value,
              inputRange,
              [0.4, 1, 0.4],
              Extrapolation.CLAMP
            );

            return {
              width,
              opacity,
            };
          });

          return (
            <Animated.View
              style={[
                dotAnimatedStyle,
                {
                  height: 8,
                  borderRadius: 4,
                  marginHorizontal: 4,
                  backgroundColor: item.gradientColors[0],
                },
              ]}
            />
          );
        };

        return <DotComponent key={index} />;
      })}
    </View>
  );
};

// Main Onboarding Screen
const WelcomeOnboardingScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  const viewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]) {
        setCurrentIndex(Number(viewableItems[0].index));
      }
    }
  ).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = () => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    handleGetStarted();
  };

  const handleGetStarted = async () => {
    try {
      await AsyncStorage.setItem("@onboarding_complete", "true");
      navigation.replace("Login");
    } catch (error) {
      navigation.replace("Login");
    }
  };

  const currentItem = ONBOARDING_DATA[currentIndex];
  const isLastSlide = currentIndex === ONBOARDING_DATA.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: "#05070d" }}>
      {/* Background Gradient */}
      <LinearGradient
        colors={[`${currentItem.gradientColors[0]}15`, "transparent"]}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: SCREEN_HEIGHT * 0.5,
        }}
      />

      {/* Skip Button */}
      <Animated.View
        entering={FadeIn.delay(500)}
        style={{
          position: "absolute",
          top: insets.top + 16,
          right: 24,
          zIndex: 100,
        }}
      >
        <Pressable
          onPress={handleSkip}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: "rgba(255,255,255,0.1)",
          }}
        >
          <Text style={{ color: "rgba(255,255,255,0.7)", fontWeight: "600" }}>
            Skip
          </Text>
        </Pressable>
      </Animated.View>

      {/* Slides */}
      <View style={{ flex: 1, paddingTop: insets.top + 60 }}>
        <FlatList
          ref={flatListRef}
          data={ONBOARDING_DATA}
          renderItem={({ item, index }) => (
            <OnboardingPage item={item} index={index} scrollX={scrollX} />
          )}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onScroll={(e) => {
            scrollX.value = e.nativeEvent.contentOffset.x;
          }}
          scrollEventThrottle={16}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
        />
      </View>

      {/* Bottom Section */}
      <View
        style={{
          paddingHorizontal: 32,
          paddingBottom: insets.bottom + 24,
          alignItems: "center",
        }}
      >
        {/* Pagination */}
        <PaginationDots data={ONBOARDING_DATA} scrollX={scrollX} />

        {/* Next/Get Started Button */}
        <Pressable
          onPress={handleNext}
          style={{ width: "100%", marginTop: 32 }}
        >
          <LinearGradient
            colors={[
              currentItem.gradientColors[0],
              currentItem.gradientColors[1],
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              paddingVertical: 18,
              borderRadius: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: currentItem.gradientColors[0],
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 18,
                fontWeight: "700",
                marginRight: 8,
              }}
            >
              {isLastSlide ? "Get Started" : "Next"}
            </Text>
            <Ionicons
              name={isLastSlide ? "rocket" : "arrow-forward"}
              size={20}
              color="#fff"
            />
          </LinearGradient>
        </Pressable>

        {/* Page Indicator Text */}
        <Text
          style={{
            color: "rgba(255,255,255,0.4)",
            fontSize: 13,
            marginTop: 16,
          }}
        >
          {currentIndex + 1} of {ONBOARDING_DATA.length}
        </Text>
      </View>
    </View>
  );
};

export default WelcomeOnboardingScreen;
