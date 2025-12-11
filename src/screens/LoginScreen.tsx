import React, { useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Dimensions,
  Alert,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  FadeIn,
  FadeInUp,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { AnimatedButton } from "../components/ui/AnimatedComponents";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [spotifyLoading, setSpotifyLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn, signInWithSpotify, signInWithGoogle } = useAuth();

  // Animation values
  const logoScale = useSharedValue(0);
  const logoRotate = useSharedValue(0);
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(50);
  const orb1Scale = useSharedValue(0.8);
  const orb2Scale = useSharedValue(1.2);
  const orb1X = useSharedValue(-100);
  const orb2X = useSharedValue(100);

  useEffect(() => {
    // Logo animation
    logoScale.value = withSequence(
      withTiming(1.2, { duration: 400, easing: Easing.out(Easing.back(2)) }),
      withSpring(1, { damping: 12 })
    );
    logoRotate.value = withSequence(
      withTiming(10, { duration: 200 }),
      withSpring(0, { damping: 8 })
    );

    // Form animation
    formOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    formTranslateY.value = withDelay(400, withSpring(0, { damping: 20 }));

    // Floating orbs animation
    const animateOrbs = () => {
      orb1Scale.value = withTiming(1.2, { duration: 3000 }, () => {
        orb1Scale.value = withTiming(0.8, { duration: 3000 });
      });
      orb2Scale.value = withTiming(0.8, { duration: 3000 }, () => {
        orb2Scale.value = withTiming(1.2, { duration: 3000 });
      });
      orb1X.value = withTiming(100, { duration: 6000 }, () => {
        orb1X.value = withTiming(-100, { duration: 6000 });
      });
      orb2X.value = withTiming(-100, { duration: 6000 }, () => {
        orb2X.value = withTiming(100, { duration: 6000 });
      });
    };

    animateOrbs();
    const interval = setInterval(animateOrbs, 6000);
    return () => clearInterval(interval);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value },
      { rotate: `${logoRotate.value}deg` },
    ],
  }));

  const formStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  const orb1Style = useAnimatedStyle(() => ({
    transform: [{ scale: orb1Scale.value }, { translateX: orb1X.value }],
  }));

  const orb2Style = useAnimatedStyle(() => ({
    transform: [{ scale: orb2Scale.value }, { translateX: orb2X.value }],
  }));

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleSpotifyLogin = async () => {
    setSpotifyLoading(true);
    setError("");
    try {
      await signInWithSpotify();
    } catch (err: any) {
      console.error("Spotify login error:", err);
      setError(err.message || "Failed to sign in with Spotify");
      Alert.alert(
        "Spotify Login Error",
        err.message || "Failed to sign in with Spotify. Please try again."
      );
    } finally {
      setSpotifyLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Google login error:", err);
      setError(err.message || "Failed to sign in with Google");
      Alert.alert(
        "Google Login Error",
        err.message || "Failed to sign in with Google. Please try again."
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-dark-950">
      {/* Animated Background Orbs */}
      <Animated.View
        style={[orb1Style, { position: "absolute", top: -100, left: -50 }]}
      >
        <LinearGradient
          colors={["#1DB954", "#1DB95400"]}
          style={{ width: 320, height: 320, borderRadius: 160, opacity: 0.3 }}
        />
      </Animated.View>
      <Animated.View
        style={[orb2Style, { position: "absolute", bottom: 100, right: -100 }]}
      >
        <LinearGradient
          colors={["#A855F7", "#A855F700"]}
          style={{ width: 384, height: 384, borderRadius: 192, opacity: 0.2 }}
        />
      </Animated.View>

      {/* Main Content */}
      <View className="flex-1 justify-center px-6">
        {/* Logo Section */}
        <Animated.View style={logoStyle} className="items-center mb-12">
          <View className="w-24 h-24 rounded-3xl bg-primary-500 items-center justify-center">
            <Ionicons name="musical-notes" size={48} color="#0a0a0a" />
          </View>
          <Animated.Text
            entering={FadeInUp.delay(200).duration(600)}
            className="text-4xl font-bold text-white mt-6 tracking-tight"
          >
            BeatBond
          </Animated.Text>
          <Animated.Text
            entering={FadeInUp.delay(400).duration(600)}
            className="text-dark-400 text-lg mt-2"
          >
            Find your vibe match
          </Animated.Text>
        </Animated.View>

        {/* Form */}
        <Animated.View style={formStyle}>
          <View className="bg-white/5 rounded-3xl p-6 border border-white/10">
            {/* Email Input */}
            <View className="mb-4">
              <View className="flex-row items-center bg-white/5 rounded-2xl px-4 border border-white/10">
                <Ionicons name="mail-outline" size={20} color="#64748b" />
                <TextInput
                  className="flex-1 py-4 px-3 text-white text-base"
                  placeholder="Email"
                  placeholderTextColor="#64748b"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Password Input */}
            <View className="mb-4">
              <View className="flex-row items-center bg-white/5 rounded-2xl px-4 border border-white/10">
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#64748b"
                />
                <TextInput
                  className="flex-1 py-4 px-3 text-white text-base"
                  placeholder="Password"
                  placeholderTextColor="#64748b"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#64748b"
                  />
                </Pressable>
              </View>
            </View>

            {/* Error Message */}
            {error ? (
              <Animated.View
                entering={FadeIn.duration(300)}
                className="bg-red-500/20 rounded-xl p-3 mb-4"
              >
                <Text className="text-red-400 text-center text-sm">
                  {error}
                </Text>
              </Animated.View>
            ) : null}

            {/* Sign In Button */}
            <AnimatedButton
              onPress={handleLogin}
              title="Sign In"
              variant="primary"
              size="lg"
              loading={loading}
              className="mt-2"
            />

            {/* Divider */}
            <View className="flex-row items-center my-6">
              <View className="flex-1 h-px bg-white/10" />
              <Text className="text-dark-400 mx-4 text-sm">
                or continue with
              </Text>
              <View className="flex-1 h-px bg-white/10" />
            </View>

            {/* Social Buttons */}
            <View className="flex-row gap-4">
              <Pressable
                onPress={handleSpotifyLogin}
                disabled={spotifyLoading}
                className="flex-1 flex-row items-center justify-center bg-primary-500 py-4 rounded-2xl"
                style={{ opacity: spotifyLoading ? 0.7 : 1 }}
              >
                {spotifyLoading ? (
                  <Text className="text-dark-950 font-bold">Loading...</Text>
                ) : (
                  <>
                    <Ionicons name="musical-notes" size={24} color="#000" />
                    <Text className="text-dark-950 font-bold ml-2">
                      Spotify
                    </Text>
                  </>
                )}
              </Pressable>
              <Pressable
                onPress={handleGoogleLogin}
                disabled={googleLoading}
                className="flex-1 flex-row items-center justify-center bg-white/10 py-4 rounded-2xl border border-white/10"
                style={{ opacity: googleLoading ? 0.7 : 1 }}
              >
                {googleLoading ? (
                  <Text className="text-white font-bold">Loading...</Text>
                ) : (
                  <>
                    <Ionicons name="logo-google" size={24} color="#fff" />
                    <Text className="text-white font-bold ml-2">Google</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>

          {/* Sign Up Link */}
          <Pressable
            onPress={() => navigation.navigate("SignUp")}
            className="mt-6 py-4"
          >
            <Text className="text-dark-400 text-center">
              Don't have an account?{" "}
              <Text className="text-primary-500 font-semibold">Sign Up</Text>
            </Text>
          </Pressable>

          {/* Reset Onboarding - For Testing */}
          <Pressable
            onPress={async () => {
              await AsyncStorage.removeItem("@onboarding_complete");
              navigation.replace("WelcomeOnboarding");
            }}
            className="mt-2 py-2"
          >
            <Text className="text-dark-500 text-center text-xs">
              View Onboarding Again
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
};

export default LoginScreen;
