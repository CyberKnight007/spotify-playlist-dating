import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  View,
  StyleSheet,
  Platform,
  Pressable,
  Dimensions,
  Text,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useAuth } from "../context/AuthContext";
import { useSpotify } from "../context/SpotifyContext";
import LoginScreen from "../screens/LoginScreen";
import MatchesScreen from "../screens/MatchesScreen";
import MessageScreen from "../screens/MessageScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import PlaylistScreen from "../screens/PlaylistScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SignUpScreen from "../screens/SignUpScreen";
import OTPSignUpScreen from "../screens/OTPSignUpScreen";
import ProfileSetupScreen from "../screens/ProfileSetupScreen";
import SwipeScreen from "../screens/SwipeScreen";
import WelcomeOnboardingScreen from "../screens/WelcomeOnboardingScreen";
import LikesScreen from "../screens/LikesScreen";
import { palette } from "../theme/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TAB_BAR_WIDTH = SCREEN_WIDTH - 32;
const TAB_BAR_HEIGHT = 72;

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Tab Icon Component
const TabIcon = ({
  name,
  label,
  focused,
  onPress,
  onLongPress,
}: {
  name: keyof typeof Ionicons.glyphMap;
  label: string;
  focused: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.85, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.tabButton, animatedStyle]}
    >
      {/* Active background pill */}
      {focused && (
        <View style={styles.activeBackground}>
          <LinearGradient
            colors={["rgba(29, 185, 84, 0.3)", "rgba(29, 185, 84, 0.15)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.activeGradient}
          />
        </View>
      )}

      <Ionicons
        name={
          focused ? name : (`${name}-outline` as keyof typeof Ionicons.glyphMap)
        }
        size={24}
        color={focused ? "#1DB954" : "rgba(255,255,255,0.5)"}
      />

      <Text
        style={[
          styles.label,
          { color: focused ? "#1DB954" : "rgba(255,255,255,0.5)" },
        ]}
      >
        {label}
      </Text>

      {/* Active dot indicator */}
      {focused && <View style={styles.activeDot} />}
    </AnimatedPressable>
  );
};

// Floating Glass Tab Bar
const FloatingTabBar = ({
  state,
  descriptors,
  navigation,
}: {
  state: any;
  descriptors: any;
  navigation: any;
}) => {
  const insets = useSafeAreaInsets();

  const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    Swipe: "flame",
    Matches: "heart",
    Playlists: "musical-notes",
    Profile: "person",
  };

  return (
    <View
      style={[styles.container, { bottom: Math.max(insets.bottom, 12) + 8 }]}
    >
      {/* Outer glow */}
      <View style={styles.outerGlow} />

      {/* Main pill container */}
      <View style={styles.pillContainer}>
        {/* Blur background */}
        <BlurView
          intensity={Platform.OS === "ios" ? 50 : 0}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />

        {/* Glass overlay gradient */}
        <LinearGradient
          colors={[
            "rgba(255,255,255,0.12)",
            "rgba(255,255,255,0.06)",
            "rgba(255,255,255,0.02)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: 40 }]}
        />

        {/* Inner dark layer */}
        <View style={styles.innerDark} />

        {/* Border highlight */}
        <View style={styles.borderHighlight} />

        {/* Tab buttons */}
        <View style={styles.tabsRow}>
          {state.routes.map((route: any, index: number) => {
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({ type: "tabLongPress", target: route.key });
            };

            return (
              <TabIcon
                key={route.key}
                name={iconMap[route.name] || "ellipse"}
                label={route.name}
                focused={isFocused}
                onPress={onPress}
                onLongPress={onLongPress}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
};

const AuthStack = () => {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(
    null
  );

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const value = await AsyncStorage.getItem("@onboarding_complete");
        setHasSeenOnboarding(value === "true");
      } catch {
        setHasSeenOnboarding(false);
      }
    };
    checkOnboarding();
  }, []);

  if (hasSeenOnboarding === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={hasSeenOnboarding ? "Login" : "WelcomeOnboarding"}
    >
      <Stack.Screen
        name="WelcomeOnboarding"
        component={WelcomeOnboardingScreen}
      />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="OTPSignUp" component={OTPSignUpScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
    </Stack.Navigator>
  );
};

const TabNavigator = () => (
  <Tab.Navigator
    tabBar={(props) => <FloatingTabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="Swipe" component={SwipeScreen} />
    <Tab.Screen name="Matches" component={MatchesScreen} />
    <Tab.Screen name="Playlists" component={PlaylistScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const AppStack = () => {
  const { connected } = useSpotify();
  const { needsProfileSetup, checkProfileCompletion } = useAuth();
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    const checkProfile = async () => {
      await checkProfileCompletion();
      setCheckingProfile(false);
    };
    checkProfile();
  }, []);

  if (checkingProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }

  // If profile setup is needed, show that first
  if (needsProfileSetup) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      </Stack.Navigator>
    );
  }

  // If Spotify not connected, show onboarding
  if (!connected) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen
        name="Message"
        component={MessageScreen}
        options={{
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="ProfileSetup"
        component={ProfileSetupScreen}
        options={{
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="Likes"
        component={LikesScreen}
        options={{
          animation: "slide_from_bottom",
        }}
      />
    </Stack.Navigator>
  );
};

const RootNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Auth" component={AuthStack} />
      ) : (
        <Stack.Screen name="App" component={AppStack} />
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: palette.background,
  },

  container: {
    position: "absolute",
    left: 16,
    right: 16,
    alignItems: "center",
  },

  outerGlow: {
    position: "absolute",
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 48,
    backgroundColor: "rgba(29, 185, 84, 0.06)",
    ...Platform.select({
      ios: {
        shadowColor: "#1DB954",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
      },
      android: {
        elevation: 0,
      },
    }),
  },

  pillContainer: {
    width: TAB_BAR_WIDTH,
    height: TAB_BAR_HEIGHT,
    borderRadius: 40,
    overflow: "hidden",
    backgroundColor:
      Platform.OS === "android" ? "rgba(15, 15, 20, 0.92)" : "transparent",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
      },
      android: {
        elevation: 16,
      },
    }),
  },

  innerDark: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(8, 8, 12, 0.75)",
    borderRadius: 40,
  },

  borderHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },

  tabsRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
  },

  tabButton: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },

  activeBackground: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    borderRadius: 20,
    overflow: "hidden",
  },

  activeGradient: {
    flex: 1,
    borderRadius: 20,
  },

  label: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 4,
    letterSpacing: 0.3,
  },

  activeDot: {
    position: "absolute",
    bottom: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#1DB954",
  },
});

export default RootNavigator;
