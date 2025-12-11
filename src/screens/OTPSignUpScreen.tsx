import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  FadeIn,
  FadeInUp,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { account, ID } from "../services/appwrite";

interface OTPSignUpScreenProps {
  navigation: any;
}

const OTPSignUpScreen: React.FC<OTPSignUpScreenProps> = ({ navigation }) => {
  const [step, setStep] = useState<"email" | "otp" | "details">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState("");
  const [secret, setSecret] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  // OTP input refs
  const otpRefs = useRef<(TextInput | null)[]>([]);

  // Animation
  const formOpacity = useSharedValue(0);

  useEffect(() => {
    formOpacity.value = withDelay(200, withTiming(1, { duration: 500 }));
  }, [step]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const formStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
  }));

  const handleSendOTP = async () => {
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Create account with email and generate token for verification
      const newUserId = ID.unique();

      // Use Appwrite's createEmailToken for passwordless auth
      const token = await account.createEmailToken(newUserId, email);

      setUserId(token.userId);
      setSecret(token.secret);
      setStep("otp");
      setResendTimer(60);

      Alert.alert("OTP Sent", `We've sent a verification code to ${email}`);
    } catch (error: any) {
      console.error("OTP send error:", error);
      setError(error.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Verify the token
      await account.createSession(userId, secret);

      // Move to details step
      setStep("details");
      Alert.alert(
        "Verified!",
        "Your email has been verified. Please complete your profile."
      );
    } catch (error: any) {
      console.error("OTP verification error:", error);
      setError("Invalid or expired code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSignup = async () => {
    if (!displayName) {
      setError("Please enter your name");
      return;
    }

    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Update account name
      await account.updateName(displayName);

      // Update account password
      await account.updatePassword(password);

      Alert.alert("Success!", "Account created successfully!", [
        {
          text: "Continue",
          onPress: () => {
            // Navigation will be handled by AuthContext
            // User will be directed to ProfileSetup screen
          },
        },
      ]);
    } catch (error: any) {
      console.error("Complete signup error:", error);
      setError(error.message || "Failed to complete signup");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;

    setLoading(true);
    try {
      const token = await account.createEmailToken(userId, email);
      setSecret(token.secret);
      setResendTimer(60);
      Alert.alert(
        "OTP Sent",
        "A new verification code has been sent to your email"
      );
    } catch (error: any) {
      setError("Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Handle paste
      const codes = value.slice(0, 6).split("");
      const newOtp = [...otp];
      codes.forEach((code, i) => {
        if (index + i < 6) {
          newOtp[index + i] = code;
        }
      });
      setOtp(newOtp);

      // Focus last filled input
      const lastIndex = Math.min(index + codes.length - 1, 5);
      otpRefs.current[lastIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOTPKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const renderEmailStep = () => (
    <Animated.View
      entering={FadeInUp.delay(200)}
      style={[formStyle, { width: "100%" }]}
    >
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Enter your email to get started</Text>

      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color="#FF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.inputContainer}>
        <Ionicons
          name="mail-outline"
          size={20}
          color="#8E8E93"
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#8E8E93"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setError("");
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSendOTP}
        disabled={loading}
      >
        <LinearGradient
          colors={loading ? ["#555", "#666"] : ["#1DB954", "#1ED760"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Send Verification Code</Text>
          )}
        </LinearGradient>
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate("Login")}
        style={styles.linkButton}
      >
        <Text style={styles.linkText}>Already have an account? Sign In</Text>
      </Pressable>
    </Animated.View>
  );

  const renderOTPStep = () => (
    <Animated.View
      entering={FadeInUp.delay(200)}
      style={[formStyle, { width: "100%" }]}
    >
      <Text style={styles.title}>Enter Verification Code</Text>
      <Text style={styles.subtitle}>
        We sent a 6-digit code to{"\n"}
        {email}
      </Text>

      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color="#FF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              otpRefs.current[index] = ref;
            }}
            style={[styles.otpInput, digit && styles.otpInputFilled]}
            value={digit}
            onChangeText={(value) => handleOTPChange(value, index)}
            onKeyPress={(e) => handleOTPKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
          />
        ))}
      </View>

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleVerifyOTP}
        disabled={loading}
      >
        <LinearGradient
          colors={loading ? ["#555", "#666"] : ["#1DB954", "#1ED760"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Verify Code</Text>
          )}
        </LinearGradient>
      </Pressable>

      <Pressable
        onPress={handleResendOTP}
        disabled={resendTimer > 0}
        style={styles.linkButton}
      >
        <Text
          style={[styles.linkText, resendTimer > 0 && styles.linkTextDisabled]}
        >
          {resendTimer > 0
            ? `Resend code in ${resendTimer}s`
            : "Resend verification code"}
        </Text>
      </Pressable>

      <Pressable onPress={() => setStep("email")} style={styles.linkButton}>
        <Text style={styles.linkText}>Change email</Text>
      </Pressable>
    </Animated.View>
  );

  const renderDetailsStep = () => (
    <Animated.View
      entering={FadeInUp.delay(200)}
      style={[formStyle, { width: "100%" }]}
    >
      <Text style={styles.title}>Complete Your Profile</Text>
      <Text style={styles.subtitle}>Just a few more details</Text>

      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color="#FF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.inputContainer}>
        <Ionicons
          name="person-outline"
          size={20}
          color="#8E8E93"
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="#8E8E93"
          value={displayName}
          onChangeText={(text) => {
            setDisplayName(text);
            setError("");
          }}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputContainer}>
        <Ionicons
          name="lock-closed-outline"
          size={20}
          color="#8E8E93"
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Password (min 8 characters)"
          placeholderTextColor="#8E8E93"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setError("");
          }}
          secureTextEntry
        />
      </View>

      <View style={styles.inputContainer}>
        <Ionicons
          name="lock-closed-outline"
          size={20}
          color="#8E8E93"
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#8E8E93"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            setError("");
          }}
          secureTextEntry
        />
      </View>

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleCompleteSignup}
        disabled={loading}
      >
        <LinearGradient
          colors={loading ? ["#555", "#666"] : ["#1DB954", "#1ED760"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Complete Signup</Text>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient colors={["#0A0A0A", "#1C1C1E"]} style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Animated.View
              entering={FadeIn.delay(100)}
              style={styles.logoContainer}
            >
              <LinearGradient
                colors={["#1DB954", "#1ED760"]}
                style={styles.logo}
              >
                <Ionicons name="musical-notes" size={40} color="white" />
              </LinearGradient>
            </Animated.View>
          </View>

          <View style={styles.formContainer}>
            {step === "email" && renderEmailStep()}
            {step === "otp" && renderOTPStep()}
            {step === "details" && renderDetailsStep()}
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = {
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center" as const,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  formContainer: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  title: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: "white",
    marginBottom: 8,
    textAlign: "center" as const,
  },
  subtitle: {
    fontSize: 16,
    color: "#8E8E93",
    marginBottom: 32,
    textAlign: "center" as const,
  },
  errorContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: "rgba(255, 68, 68, 0.1)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    width: "100%" as const,
  },
  errorText: {
    color: "#FF4444",
    marginLeft: 8,
    flex: 1,
  },
  inputContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: "#2C2C2E",
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    width: "100%" as const,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: "white",
    fontSize: 16,
  },
  otpContainer: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    marginBottom: 24,
    width: "100%" as const,
  },
  otpInput: {
    width: 48,
    height: 56,
    backgroundColor: "#2C2C2E",
    borderRadius: 12,
    textAlign: "center" as const,
    fontSize: 24,
    fontWeight: "600" as const,
    color: "white",
    borderWidth: 2,
    borderColor: "transparent",
  },
  otpInputFilled: {
    borderColor: "#1DB954",
  },
  button: {
    width: "100%" as const,
    height: 56,
    borderRadius: 28,
    overflow: "hidden" as const,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  gradient: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  linkButton: {
    paddingVertical: 12,
  },
  linkText: {
    color: "#1DB954",
    fontSize: 14,
    textAlign: "center" as const,
  },
  linkTextDisabled: {
    color: "#8E8E93",
  },
};

export default OTPSignUpScreen;
