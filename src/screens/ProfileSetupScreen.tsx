import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeInUp,
  interpolateColor,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import {
  storage,
  databases,
  account,
  ID,
  Permission,
  Role,
} from "../services/appwrite";
import { useAuth } from "../context/AuthContext";
import { BlurView } from "expo-blur";

const { width } = Dimensions.get("window");

interface ProfileSetupScreenProps {
  navigation: any;
}

const InputField = ({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = "default",
  maxLength,
  id,
  focusedInput,
  setFocusedInput,
}: any) => {
  const isFocused = focusedInput === id;

  return (
    <View className="mb-5">
      <View className="flex-row items-center mb-2 ml-1">
        <Ionicons
          name={icon}
          size={14}
          color={isFocused ? "#1DB954" : "#666"}
          style={{ marginRight: 6 }}
        />
        <Text
          className={`text-xs font-semibold uppercase tracking-wider ${
            isFocused ? "text-primary-500" : "text-neutral-500"
          }`}
        >
          {label}
        </Text>
      </View>
      <View
        className={`flex-row items-center bg-neutral-900 rounded-2xl px-4 border-2 ${
          isFocused ? "border-primary-500 bg-neutral-950" : "border-neutral-800"
        } ${multiline ? "h-24 items-start py-3" : "h-14"}`}
      >
        <TextInput
          className={`flex-1 text-white text-base h-full ${
            multiline ? "text-top" : ""
          }`}
          placeholder={placeholder}
          placeholderTextColor="#444"
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          maxLength={maxLength}
          keyboardType={keyboardType}
          onFocus={() => setFocusedInput(id)}
          onBlur={() => setFocusedInput(null)}
          selectionColor="#1DB954"
        />
      </View>
      {maxLength && (
        <Text
          className={`text-xs text-right mt-1.5 mr-1 font-medium ${
            value.length > maxLength * 0.8
              ? "text-orange-500"
              : "text-neutral-600"
          }`}
        >
          {value.length}/{maxLength}
        </Text>
      )}
    </View>
  );
};

const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({
  navigation,
}) => {
  const { user, userProfile, checkProfileCompletion } = useAuth();
  const insets = useSafeAreaInsets();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<any>(null);
  const [bio, setBio] = useState("");
  const [age, setAge] = useState("");
  const [city, setCity] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Load existing profile data
  React.useEffect(() => {
    if (userProfile) {
      setBio(userProfile.bio || "");
      setAge(userProfile.age?.toString() || "");
      setCity(userProfile.city || "");
      setPronouns(userProfile.pronouns || "");
      setProfileImage(userProfile.photoUrl || userProfile.avatar || null);
      if (userProfile.location) {
        setLocation(userProfile.location);
      }
    }
  }, [userProfile]);

  const scale = useSharedValue(1);

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "We need camera roll permissions to upload your profile picture."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        scale.value = withSpring(0.95, {}, () => {
          scale.value = withSpring(1);
        });

        console.log(
          "Selected image from library:",
          JSON.stringify(result.assets[0], null, 2)
        );
        setProfileImage(result.assets[0].uri);
        setImageFile(result.assets[0]);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "We need camera permissions to take your profile picture."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        scale.value = withSpring(0.95, {}, () => {
          scale.value = withSpring(1);
        });

        console.log("Photo taken:", JSON.stringify(result.assets[0], null, 2));
        setProfileImage(result.assets[0].uri);
        setImageFile(result.assets[0]);
      }
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      "Profile Picture",
      "Choose an option",
      [
        { text: "Take Photo", onPress: takePhoto },
        { text: "Choose from Library", onPress: pickImage },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Permission to access location was denied. We use location to find matches near you."
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Reverse geocode to get city name
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const cityStr = address.city || address.region || "";
        if (cityStr) setCity(cityStr);
      }
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("Error", "Failed to get current location");
    }
  };

  const uploadProfilePicture = async (): Promise<string | null> => {
    if (!imageFile) return null;

    try {
      setUploadProgress(10);

      // Verify user is authenticated
      const currentUser = await account.get();
      console.log("Current user:", currentUser.$id);

      setUploadProgress(20);

      // For React Native, we need to create a file object from the URI
      const fileName = `profile_${currentUser.$id}_${Date.now()}.jpg`;

      // Get file size - ImagePicker provides fileSize on some platforms
      const fileSize =
        imageFile.fileSize || imageFile.filesize || imageFile.size || 1;

      // Keep the file:// prefix - react-native-appwrite needs it
      const fileUri = imageFile.uri;

      // Create file object compatible with React Native Appwrite
      const file = {
        name: fileName,
        type: "image/jpeg",
        size: fileSize,
        uri: fileUri,
      };

      setUploadProgress(40);

      console.log("Uploading file with URI:", fileUri);
      console.log("File size:", fileSize);

      // Upload to Appwrite Storage (avatars bucket)
      const uploadedFile = await storage.createFile(
        "avatars", // bucket ID
        ID.unique(),
        file,
        ['read("any")'] // Allow anyone to view the profile picture
      );

      setUploadProgress(80);

      console.log("File uploaded successfully:", uploadedFile.$id);

      // Get file URL
      const fileUrl = storage.getFileView("avatars", uploadedFile.$id);

      setUploadProgress(100);
      return fileUrl.toString();
    } catch (error: any) {
      console.error("Upload error:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));

      // Provide more helpful error message
      if (error.message?.includes("Bucket with the requested ID")) {
        throw new Error(
          "Storage bucket not found. Please run setup-otp-auth.sh first."
        );
      }

      if (
        error.code === 0 ||
        error.message?.includes("Network request failed")
      ) {
        throw new Error(
          "Network error. Please check your internet connection and that the file exists."
        );
      }

      throw error;
    }
  };

  const handleCompleteSetup = async () => {
    if (!profileImage) {
      Alert.alert(
        "Profile Picture Required",
        "Please add a profile picture to continue."
      );
      return;
    }

    if (!bio.trim()) {
      Alert.alert("Bio Required", "Please add a short bio about yourself.");
      return;
    }

    if (!age || parseInt(age) < 18 || parseInt(age) > 100) {
      Alert.alert("Valid Age Required", "Please enter your age (18-100).");
      return;
    }

    setLoading(true);

    try {
      // Upload profile picture if a new one was selected
      let photoUrl = profileImage;
      if (imageFile) {
        const uploadedUrl = await uploadProfilePicture();
        if (uploadedUrl) {
          photoUrl = uploadedUrl;
        }
      }

      if (!photoUrl) {
        throw new Error("Failed to upload profile picture");
      }

      // Update user profile in database
      const currentUser = await account.get();
      console.log("Updating profile for user:", currentUser.$id);

      try {
        // Try to update existing document
        // Note: Skipping city and pronouns due to schema sync issues
        console.log("=== USING UPDATED CODE V2 ===");
        const updateData: any = {
          photoUrl,
          bio: bio.trim(),
          age: parseInt(age),
          profileComplete: true,
          updatedAt: new Date().toISOString(),
          displayName: currentUser.name || "User", // Ensure displayName is present
        };

        if (city) updateData.city = city;
        if (pronouns) updateData.pronouns = pronouns;
        if (location) {
          updateData.latitude = location.latitude;
          updateData.longitude = location.longitude;
        }

        console.log("Update data:", JSON.stringify(updateData, null, 2));

        await databases.updateDocument(
          "6933e7230002691f918d", // database ID
          "users", // collection ID
          currentUser.$id,
          updateData
        );
        console.log("Profile updated successfully");
      } catch (updateError: any) {
        console.log(
          "Update failed, attempting to create document:",
          updateError.message
        );

        // If document doesn't exist, create it
        if (
          updateError.message?.includes(
            "Document with the requested ID could not be found"
          )
        ) {
          // Create document with only required and guaranteed fields first
          const docData: any = {
            email: currentUser.email,
            displayName: currentUser.name || "User",
            photoUrl,
            bio: bio.trim(),
            age: parseInt(age),
            profileComplete: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          if (city) docData.city = city;
          if (pronouns) docData.pronouns = pronouns;
          if (location) {
            docData.latitude = location.latitude;
            docData.longitude = location.longitude;
          }

          console.log(
            "Creating document with data:",
            JSON.stringify(docData, null, 2)
          );

          await databases.createDocument(
            "6933e7230002691f918d", // database ID
            "users", // collection ID
            currentUser.$id, // use user ID as document ID
            docData,
            [
              Permission.read(Role.any()), // Anyone can view profile
              Permission.update(Role.user(currentUser.$id)), // Only user can update
              Permission.delete(Role.user(currentUser.$id)), // Only user can delete
            ]
          );
          console.log("Profile created successfully");
        } else {
          throw updateError;
        }
      }

      // Update local state to reflect profile completion
      await checkProfileCompletion();

      Alert.alert(
        "Profile Complete! 🎉",
        "Your profile is all set. Start swiping!",
        [
          {
            text: "Get Started",
            onPress: async () => {
              // Navigation handled by AuthContext
              await checkProfileCompletion();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error("Profile setup error:", error);
      Alert.alert("Error", error.message || "Failed to complete profile setup");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      "Skip Profile Setup?",
      "You can complete your profile later from settings, but a complete profile gets more matches!",
      [
        { text: "Go Back", style: "cancel" },
        {
          text: "Skip for Now",
          style: "destructive",
          onPress: () => {
            // Mark as skipped
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.container}>
        {/* Background Gradient */}
        <LinearGradient
          colors={["#0a0a0a", "#000000", "#050505"]}
          locations={[0, 0.5, 1]}
          style={styles.background}
        />

        {/* Decorative Elements */}
        <View style={styles.decorativeCircle1} pointerEvents="none" />
        <View style={styles.decorativeCircle2} pointerEvents="none" />
        <View style={styles.decorativeCircle3} pointerEvents="none" />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 20 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.header}>
            {navigation.canGoBack() && (
              <Pressable
                onPress={() => navigation.goBack()}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  zIndex: 10,
                  padding: 8,
                }}
              >
                <Ionicons name="chevron-back" size={28} color="#fff" />
              </Pressable>
            )}
            <View style={styles.titleRow}>
              <Ionicons
                name="musical-notes"
                size={28}
                color="#1DB954"
                style={{ marginRight: 10 }}
              />
              <Text style={styles.title}>Create Your Vibe</Text>
            </View>
            <Text style={styles.subtitle}>
              Let your music taste speak for you ✨
            </Text>
          </View>

          <View style={styles.formContainer}>
            {/* Profile Picture */}
            <View style={styles.imageSection}>
              <Pressable onPress={showImageOptions} style={styles.imageButton}>
                <Animated.View style={[imageStyle, styles.imageWrapper]}>
                  {profileImage ? (
                    <View style={styles.imageContainer}>
                      <Image
                        source={{ uri: profileImage }}
                        style={styles.profileImage}
                      />
                      <View style={styles.imageOverlay}>
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color="#1DB954"
                        />
                      </View>
                    </View>
                  ) : (
                    <LinearGradient
                      colors={["#1a1a1a", "#0d0d0d"]}
                      style={styles.imagePlaceholder}
                    >
                      <Ionicons name="camera" size={36} color="#1DB954" />
                    </LinearGradient>
                  )}
                </Animated.View>
                <View style={styles.cameraIconBadge}>
                  <Ionicons name="add" size={20} color="white" />
                </View>
              </Pressable>
              <Text style={styles.addPhotoLabel}>
                {profileImage ? "Tap to change" : "Add your photo"}
              </Text>
            </View>

            {/* Upload Progress */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <Animated.View
                entering={FadeInUp}
                style={styles.progressContainer}
              >
                <View style={styles.progressBar}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      { width: `${uploadProgress}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  Uploading... {uploadProgress}%
                </Text>
              </Animated.View>
            )}

            <InputField
              id="bio"
              label="Bio *"
              icon="text-outline"
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself and your music taste..."
              multiline
              maxLength={300}
              focusedInput={focusedInput}
              setFocusedInput={setFocusedInput}
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <InputField
                  id="age"
                  label="Age *"
                  icon="calendar-outline"
                  value={age}
                  onChangeText={setAge}
                  placeholder="Age"
                  keyboardType="number-pad"
                  maxLength={3}
                  focusedInput={focusedInput}
                  setFocusedInput={setFocusedInput}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <InputField
                  id="pronouns"
                  label="Pronouns"
                  icon="person-outline"
                  value={pronouns}
                  onChangeText={setPronouns}
                  placeholder="He/Him"
                  focusedInput={focusedInput}
                  setFocusedInput={setFocusedInput}
                />
              </View>
            </View>

            <InputField
              id="city"
              label="City"
              icon="location-outline"
              value={city}
              onChangeText={setCity}
              placeholder="Where do you live?"
              focusedInput={focusedInput}
              setFocusedInput={setFocusedInput}
            />
            <Pressable
              onPress={getCurrentLocation}
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: -10,
                marginBottom: 20,
                marginLeft: 4,
              }}
            >
              <Ionicons name="navigate-circle" size={20} color="#1DB954" />
              <Text
                style={{
                  color: "#1DB954",
                  marginLeft: 6,
                  fontWeight: "600",
                  fontSize: 13,
                }}
              >
                Use Current Location
              </Text>
            </Pressable>

            {/* Complete Button */}
            <View className="mt-8 pb-4">
              <Pressable
                className={`h-14 rounded-full overflow-hidden mb-4 shadow-lg shadow-primary-500/40 active:scale-95 active:opacity-90 ${
                  loading ? "opacity-50" : ""
                }`}
                onPress={handleCompleteSetup}
                disabled={loading}
              >
                <LinearGradient
                  colors={loading ? ["#222", "#333"] : ["#1DB954", "#1aa34a"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="flex-1 justify-center items-center"
                >
                  {loading ? (
                    <View className="flex-row items-center">
                      <ActivityIndicator color="white" size="small" />
                      <Text className="text-white text-lg font-bold ml-3 tracking-wide">
                        Setting up...
                      </Text>
                    </View>
                  ) : (
                    <View className="flex-row items-center">
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color="white"
                        style={{ marginRight: 8 }}
                      />
                      <Text className="text-white text-lg font-bold tracking-wide">
                        Complete Profile
                      </Text>
                    </View>
                  )}
                </LinearGradient>
              </Pressable>

              <Pressable onPress={handleSkip} className="items-center p-4">
                <Text className="text-neutral-500 text-sm font-medium">
                  I'll do this later
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  background: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  decorativeCircle1: {
    position: "absolute",
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: "#1DB954",
    opacity: 0.04,
    top: -width * 0.25,
    right: -width * 0.2,
  },
  decorativeCircle2: {
    position: "absolute",
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
    backgroundColor: "#1DB954",
    opacity: 0.025,
    bottom: -width * 0.15,
    left: -width * 0.15,
  },
  decorativeCircle3: {
    position: "absolute",
    width: width * 0.3,
    height: width * 0.3,
    borderRadius: width * 0.15,
    backgroundColor: "#1DB954",
    opacity: 0.02,
    top: "40%",
    left: -width * 0.1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  header: {
    marginBottom: 24,
    alignItems: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "white",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "#888",
    textAlign: "center",
    lineHeight: 22,
  },
  formContainer: {
    flex: 1,
  },
  imageSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  imageButton: {
    position: "relative",
  },
  imageWrapper: {
    shadowColor: "#1DB954",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  imageContainer: {
    position: "relative",
  },
  profileImage: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3,
    borderColor: "#1DB954",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "#000",
    borderRadius: 14,
    padding: 2,
  },
  imagePlaceholder: {
    width: 130,
    height: 130,
    borderRadius: 65,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#333",
    borderStyle: "dashed",
  },
  addPhotoLabel: {
    color: "#888",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 12,
    textAlign: "center",
  },
  cameraIconBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "#1DB954",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#000",
  },
  progressContainer: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  progressBar: {
    height: 3,
    backgroundColor: "#222",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: 3,
    backgroundColor: "#1DB954",
    borderRadius: 2,
  },
  progressText: {
    color: "#888",
    fontSize: 12,
    textAlign: "center",
    fontWeight: "500",
  },
  inputGroup: {
    marginBottom: 18,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    marginLeft: 2,
  },
  label: {
    color: "#888",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  labelFocused: {
    color: "#1DB954",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1.5,
    borderColor: "#222",
  },
  inputContainerFocused: {
    borderColor: "#1DB954",
    backgroundColor: "#0a0a0a",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: "white",
    fontSize: 16,
    height: "100%",
  },
  textAreaContainer: {
    height: 90,
    alignItems: "flex-start",
    paddingTop: 14,
    paddingBottom: 14,
  },
  textArea: {
    height: "100%",
    textAlignVertical: "top",
  },
  charCount: {
    color: "#444",
    fontSize: 11,
    textAlign: "right",
    marginTop: 6,
    marginRight: 4,
    fontWeight: "500",
  },
  charCountWarning: {
    color: "#ff9500",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  buttonContainer: {
    marginTop: 28,
    paddingBottom: 10,
  },
  button: {
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    marginBottom: 14,
    shadowColor: "#1DB954",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  buttonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  gradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  skipButton: {
    alignItems: "center",
    padding: 14,
  },
  skipText: {
    color: "#555",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default ProfileSetupScreen;
