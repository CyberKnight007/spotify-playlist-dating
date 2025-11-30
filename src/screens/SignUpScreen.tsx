import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  FadeIn,
  FadeInUp,
  FadeInDown,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { AnimatedButton } from "../components/ui/AnimatedComponents";

const SignUpScreen = ({ navigation }: any) => {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const { signUp } = useAuth();

  // Animation values
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(30);
  const orb1X = useSharedValue(100);
  const orb2X = useSharedValue(-100);

  useEffect(() => {
    formOpacity.value = withDelay(200, withTiming(1, { duration: 500 }));
    formTranslateY.value = withDelay(200, withSpring(0, { damping: 20 }));

    const animateOrbs = () => {
      orb1X.value = withTiming(-100, { duration: 8000 }, () => {
        orb1X.value = withTiming(100, { duration: 8000 });
      });
      orb2X.value = withTiming(100, { duration: 8000 }, () => {
        orb2X.value = withTiming(-100, { duration: 8000 });
      });
    };
    animateOrbs();
    const interval = setInterval(animateOrbs, 8000);
    return () => clearInterval(interval);
  }, []);

  const formStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  const orb1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: orb1X.value }],
  }));

  const orb2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: orb2X.value }],
  }));

  const handleSignUp = async () => {
    if (step === 1) {
      if (!displayName) {
        setError("Please enter your name");
        return;
      }
      setError("");
      setStep(2);
      return;
    }

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await signUp(email, password, displayName);
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-dark-950">
      {/* Animated Background Orbs */}
      <Animated.View
        style={[orb1Style, { position: "absolute", top: 50, right: -100 }]}
      >
        <LinearGradient
          colors={["#A855F7", "#A855F700"]}
          style={{ width: 300, height: 300, borderRadius: 150, opacity: 0.25 }}
        />
      </Animated.View>
      <Animated.View
        style={[orb2Style, { position: "absolute", bottom: 200, left: -100 }]}
      >
        <LinearGradient
          colors={["#1DB954", "#1DB95400"]}
          style={{ width: 350, height: 350, borderRadius: 175, opacity: 0.2 }}
        />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 justify-center px-6 py-12">
            {/* Back Button */}
            <Pressable
              onPress={() => (step === 1 ? navigation.goBack() : setStep(1))}
              className="absolute top-16 left-6 w-10 h-10 rounded-full bg-white/5 items-center justify-center"
            >
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </Pressable>

            {/* Header */}
            <Animated.View
              entering={FadeInUp.duration(500)}
              className="items-center mb-10"
            >
              <View className="w-20 h-20 rounded-2xl bg-accent-purple items-center justify-center mb-6">
                <Ionicons name="person-add" size={40} color="#fff" />
              </View>
              <Text className="text-white text-3xl font-bold">
                {step === 1 ? "What's your name?" : "Create Account"}
              </Text>
              <Text className="text-dark-400 text-base mt-2 text-center">
                {step === 1
                  ? "This is how you'll appear to others"
                  : "Enter your email and create a password"}
              </Text>
            </Animated.View>

            {/* Progress Steps */}
            <View className="flex-row justify-center mb-8 gap-2">
              <View
                className={`h-1.5 w-16 rounded-full ${
                  step >= 1 ? "bg-primary-500" : "bg-white/10"
                }`}
              />
              <View
                className={`h-1.5 w-16 rounded-full ${
                  step >= 2 ? "bg-primary-500" : "bg-white/10"
                }`}
              />
            </View>

            {/* Form */}
            <Animated.View style={formStyle}>
              <View className="bg-white/5 rounded-3xl p-6 border border-white/10">
                {step === 1 ? (
                  /* Step 1: Name */
                  <Animated.View entering={FadeIn.duration(300)}>
                    <View className="mb-4">
                      <Text className="text-dark-400 text-sm mb-2 ml-1">
                        Display Name
                      </Text>
                      <View className="flex-row items-center bg-white/5 rounded-2xl px-4 border border-white/10">
                        <Ionicons
                          name="person-outline"
                          size={20}
                          color="#64748b"
                        />
                        <TextInput
                          className="flex-1 py-4 px-3 text-white text-base"
                          placeholder="Your name"
                          placeholderTextColor="#64748b"
                          value={displayName}
                          onChangeText={setDisplayName}
                          autoFocus
                        />
                      </View>
                    </View>
                  </Animated.View>
                ) : (
                  /* Step 2: Email & Password */
                  <Animated.View entering={FadeIn.duration(300)}>
                    {/* Email */}
                    <View className="mb-4">
                      <Text className="text-dark-400 text-sm mb-2 ml-1">
                        Email
                      </Text>
                      <View className="flex-row items-center bg-white/5 rounded-2xl px-4 border border-white/10">
                        <Ionicons
                          name="mail-outline"
                          size={20}
                          color="#64748b"
                        />
                        <TextInput
                          className="flex-1 py-4 px-3 text-white text-base"
                          placeholder="your@email.com"
                          placeholderTextColor="#64748b"
                          value={email}
                          onChangeText={setEmail}
                          autoCapitalize="none"
                          keyboardType="email-address"
                        />
                      </View>
                    </View>

                    {/* Password */}
                    <View className="mb-4">
                      <Text className="text-dark-400 text-sm mb-2 ml-1">
                        Password
                      </Text>
                      <View className="flex-row items-center bg-white/5 rounded-2xl px-4 border border-white/10">
                        <Ionicons
                          name="lock-closed-outline"
                          size={20}
                          color="#64748b"
                        />
                        <TextInput
                          className="flex-1 py-4 px-3 text-white text-base"
                          placeholder="Create a password"
                          placeholderTextColor="#64748b"
                          value={password}
                          onChangeText={setPassword}
                          secureTextEntry={!showPassword}
                        />
                        <Pressable
                          onPress={() => setShowPassword(!showPassword)}
                        >
                          <Ionicons
                            name={
                              showPassword ? "eye-off-outline" : "eye-outline"
                            }
                            size={20}
                            color="#64748b"
                          />
                        </Pressable>
                      </View>
                    </View>

                    {/* Confirm Password */}
                    <View className="mb-4">
                      <Text className="text-dark-400 text-sm mb-2 ml-1">
                        Confirm Password
                      </Text>
                      <View className="flex-row items-center bg-white/5 rounded-2xl px-4 border border-white/10">
                        <Ionicons
                          name="lock-closed-outline"
                          size={20}
                          color="#64748b"
                        />
                        <TextInput
                          className="flex-1 py-4 px-3 text-white text-base"
                          placeholder="Confirm your password"
                          placeholderTextColor="#64748b"
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          secureTextEntry={!showPassword}
                        />
                      </View>
                    </View>
                  </Animated.View>
                )}

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

                {/* Continue/Sign Up Button */}
                <AnimatedButton
                  onPress={handleSignUp}
                  title={step === 1 ? "Continue" : "Create Account"}
                  variant="primary"
                  size="lg"
                  loading={loading}
                  className="mt-2"
                />

                {step === 2 && (
                  <Text className="text-dark-400 text-xs text-center mt-4 px-4">
                    By signing up, you agree to our Terms of Service and Privacy
                    Policy
                  </Text>
                )}
              </View>

              {/* Sign In Link */}
              <Pressable
                onPress={() => navigation.navigate("Login")}
                className="mt-6 py-4"
              >
                <Text className="text-dark-400 text-center">
                  Already have an account?{" "}
                  <Text className="text-primary-500 font-semibold">
                    Sign In
                  </Text>
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default SignUpScreen;
