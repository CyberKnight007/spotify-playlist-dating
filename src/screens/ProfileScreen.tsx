import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  SlideInRight,
  SlideInUp,
  SlideOutDown,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { useSpotify } from "../context/SpotifyContext";
import { AnimatedButton } from "../components/ui/AnimatedComponents";
import { userService } from "../services/userService";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Stat Card Component
const StatCard = ({
  icon,
  value,
  label,
  color,
  delay,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  color: string;
  delay: number;
}) => (
  <Animated.View
    entering={FadeInUp.delay(delay).duration(500)}
    className="flex-1 bg-white/5 rounded-2xl p-4 border border-white/10"
  >
    <View className="flex-row items-center mb-2">
      <View
        className="w-10 h-10 rounded-xl items-center justify-center"
        style={{ backgroundColor: `${color}20` }}
      >
        <Ionicons name={icon} size={20} color={color} />
      </View>
    </View>
    <Text className="text-white text-2xl font-bold">{value}</Text>
    <Text className="text-dark-400 text-sm">{label}</Text>
  </Animated.View>
);

// Settings Item Component
const SettingsItem = ({
  icon,
  title,
  subtitle,
  hasToggle,
  toggleValue,
  onToggle,
  onPress,
  index,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  hasToggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
  index: number;
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={SlideInRight.delay(index * 50).duration(400)}>
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.98);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        style={animatedStyle}
        className="flex-row items-center py-4 border-b border-white/5"
      >
        <View className="w-10 h-10 rounded-xl bg-white/5 items-center justify-center mr-4">
          <Ionicons name={icon} size={20} color="#64748b" />
        </View>
        <View className="flex-1">
          <Text className="text-white font-medium">{title}</Text>
          {subtitle && (
            <Text className="text-dark-400 text-sm">{subtitle}</Text>
          )}
        </View>
        {hasToggle ? (
          <Switch
            value={toggleValue}
            onValueChange={onToggle}
            trackColor={{ false: "#334155", true: "#1DB95444" }}
            thumbColor={toggleValue ? "#1DB954" : "#64748b"}
          />
        ) : (
          <Ionicons name="chevron-forward" size={20} color="#64748b" />
        )}
      </AnimatedPressable>
    </Animated.View>
  );
};

// Main ProfileScreen Component
const ProfileScreen = () => {
  const navigation = useNavigation();
  const scrollViewRef = React.useRef<ScrollView>(null);
  const { userProfile, logout, updateProfile } = useAuth();
  const {
    connected,
    connecting,
    profile: spotifyProfile,
    playlists,
    topGenres,
    topArtists,
    syncing,
    lastSynced,
    connectSpotify,
    disconnectSpotify,
    syncData,
  } = useSpotify();
  const [notifications, setNotifications] = useState(
    userProfile?.pushEnabled ?? true
  );
  const [darkMode, setDarkMode] = useState(
    userProfile?.darkModeEnabled ?? true
  );
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);

  // Get first playlist as selected for display
  const selectedPlaylist = playlists[0] || null;

  const handleNotificationsToggle = async (value: boolean) => {
    setNotifications(value);
    if (userProfile?.id) {
      try {
        await updateProfile({ pushEnabled: value });
      } catch (error) {
        console.error("Failed to update notifications setting:", error);
        setNotifications(!value); // Revert on error
      }
    }
  };

  const handleDarkModeToggle = async (value: boolean) => {
    setDarkMode(value);
    if (userProfile?.id) {
      try {
        await updateProfile({ darkModeEnabled: value });
      } catch (error) {
        console.error("Failed to update dark mode setting:", error);
        setDarkMode(!value); // Revert on error
      }
    }
  };

  const handleEditProfile = () => {
    // @ts-ignore
    navigation.navigate("ProfileSetup");
  };

  const handlePrivacy = () => {
    Alert.alert(
      "Privacy Policy",
      "Your privacy is important to us.\n\nWe use your Spotify data solely to match you with others based on music taste. We do not share your personal data with third parties."
    );
  };

  const handleHelp = () => {
    Alert.alert(
      "Help & Support",
      "Need help?\n\nContact our support team at support@spotifydating.com or visit our website for FAQs."
    );
  };

  // Image picker function
  const pickImage = async () => {
    try {
      // Request permission
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photo library to upload a profile picture."
        );
        return;
      }

      // Show custom themed modal
      setShowImagePickerModal(true);
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to access photos. Please try again.");
    }
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please allow camera access to take a photo."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await handleImageUpload(result.assets[0].uri);
    }
  };

  const openLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await handleImageUpload(result.assets[0].uri);
    }
  };

  const handleImageUpload = async (imageUri: string) => {
    if (!userProfile?.id) {
      Alert.alert("Error", "Please sign in to upload a profile picture.");
      return;
    }

    setUploadingImage(true);
    try {
      console.log("[ProfileScreen] Starting image upload...");

      // Upload to Appwrite Storage
      const avatarUrl = await userService.uploadAvatar(
        userProfile.id,
        imageUri
      );

      console.log("[ProfileScreen] Upload successful, URL:", avatarUrl);

      // Update local profile state
      await updateProfile({ avatar: avatarUrl });

      Alert.alert("Success", "Profile picture updated!");
    } catch (error: any) {
      console.error("[ProfileScreen] Error uploading image:", error);

      // Check for specific Appwrite errors
      if (error?.code === 401 || error?.message?.includes("unauthorized")) {
        Alert.alert(
          "Storage Not Configured",
          "Please create an 'avatars' bucket in your Appwrite Console with the following settings:\n\n" +
            "1. Go to Storage in Appwrite Console\n" +
            "2. Create a bucket named 'avatars'\n" +
            "3. Enable file security\n" +
            "4. Add permissions for authenticated users"
        );
      } else if (error?.code === 404) {
        Alert.alert(
          "Bucket Not Found",
          "The 'avatars' storage bucket doesn't exist. Please create it in your Appwrite Console."
        );
      } else {
        Alert.alert("Error", "Failed to upload image. Please try again.");
      }
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <View className="flex-1 bg-dark-950">
      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false}>
        {/* Header with Gradient */}
        <Animated.View entering={FadeIn.duration(600)}>
          <LinearGradient
            colors={["#1DB954", "#1DB95400"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            className="pt-20 pb-8 px-6"
            style={{ paddingTop: 80, paddingBottom: 32, paddingHorizontal: 24 }}
          >
            {/* Settings Button */}
            <View className="absolute top-16 right-6 flex-row gap-3">
              <Pressable
                onPress={() =>
                  scrollViewRef.current?.scrollToEnd({ animated: true })
                }
                className="w-10 h-10 rounded-full bg-dark-950/30 items-center justify-center"
              >
                <Ionicons name="settings-outline" size={20} color="#fff" />
              </Pressable>
            </View>

            {/* Avatar */}
            <Animated.View
              entering={FadeInDown.delay(200).duration(500)}
              className="items-center"
            >
              <View className="relative mb-4">
                <LinearGradient
                  colors={["#1DB954", "#A855F7"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="p-1 rounded-full"
                  style={{ padding: 3, borderRadius: 999 }}
                >
                  <Image
                    source={{
                      uri:
                        userProfile?.photoUrl ||
                        userProfile?.avatar ||
                        selectedPlaylist?.images?.[0]?.url ||
                        "https://images.unsplash.com/photo-1494232410401-ad00d5433cfa?w=400",
                    }}
                    className="w-28 h-28 rounded-full border-4 border-dark-950"
                    style={{
                      width: 112,
                      height: 112,
                      borderRadius: 999,
                      borderWidth: 4,
                      borderColor: "#0a0a0a",
                    }}
                  />
                  {uploadingImage && (
                    <View
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0,0,0,0.6)",
                        borderRadius: 999,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <ActivityIndicator size="large" color="#1DB954" />
                    </View>
                  )}
                </LinearGradient>
                <Pressable
                  onPress={pickImage}
                  disabled={uploadingImage}
                  className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-primary-500 items-center justify-center border-3 border-dark-950"
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: "#1DB954",
                    justifyContent: "center",
                    alignItems: "center",
                    borderWidth: 3,
                    borderColor: "#0a0a0a",
                  }}
                >
                  <Ionicons name="camera" size={16} color="#0a0a0a" />
                </Pressable>
              </View>

              <Text className="text-white text-2xl font-bold">
                {userProfile?.displayName || "Your Name"}
              </Text>
              {userProfile?.pronouns && (
                <Text className="text-white/60 text-base mt-1">
                  {userProfile.pronouns}
                </Text>
              )}
              {userProfile?.bio && (
                <Text
                  className="text-white/80 text-center mt-3 px-8"
                  numberOfLines={2}
                >
                  {userProfile.bio}
                </Text>
              )}
              {userProfile?.city && (
                <View className="flex-row items-center mt-2">
                  <Ionicons
                    name="location-outline"
                    size={14}
                    color="rgba(255,255,255,0.6)"
                  />
                  <Text className="text-white/60 text-sm ml-1">
                    {userProfile.city}
                  </Text>
                </View>
              )}
            </Animated.View>
          </LinearGradient>
        </Animated.View>

        {/* Stats */}
        <View className="px-6 -mt-4">
          <View className="flex-row gap-3">
            <StatCard
              icon="heart"
              value="128"
              label="Matches"
              color="#1DB954"
              delay={300}
            />
            <StatCard
              icon="musical-notes"
              value={playlists.length || 0}
              label="Playlists"
              color="#A855F7"
              delay={400}
            />
            <StatCard
              icon="eye"
              value="2.4k"
              label="Views"
              color="#3B82F6"
              delay={500}
            />
          </View>
        </View>

        {/* Active Playlist Section */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(500)}
          className="px-6 mt-8"
        >
          <Text className="text-white text-lg font-semibold mb-4">
            Spotify Connection
          </Text>

          {/* Spotify Status Card */}
          <View className="bg-white/5 rounded-3xl p-5 border border-white/10 mb-4">
            <View className="flex-row items-center">
              <View
                className="w-14 h-14 rounded-2xl items-center justify-center"
                style={{
                  backgroundColor: connected ? "#1DB95420" : "#64748b20",
                }}
              >
                <Ionicons
                  name="musical-notes"
                  size={28}
                  color={connected ? "#1DB954" : "#64748b"}
                />
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-white font-bold text-lg">
                  {connected ? "Connected" : "Not Connected"}
                </Text>
                <Text className="text-dark-400 text-sm mt-1">
                  {connected
                    ? spotifyProfile?.display_name || "Synced with Spotify"
                    : "Connect to sync your music taste"}
                </Text>
              </View>
              {connected ? (
                <Pressable
                  onPress={disconnectSpotify}
                  className="px-4 py-2 rounded-xl bg-red-500/20"
                >
                  <Text className="text-red-400 font-medium text-sm">
                    Disconnect
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={connectSpotify}
                  disabled={connecting}
                  className="px-4 py-2 rounded-xl bg-primary-500"
                  style={{ opacity: connecting ? 0.7 : 1 }}
                >
                  <Text className="text-dark-950 font-medium text-sm">
                    {connecting ? "..." : "Connect"}
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Sync Status */}
            {connected && (
              <View className="flex-row items-center justify-between mt-4 pt-4 border-t border-white/10">
                <Text className="text-dark-400 text-xs">
                  {lastSynced
                    ? `Last synced: ${new Date(
                        lastSynced
                      ).toLocaleDateString()}`
                    : "Never synced"}
                </Text>
                <Pressable
                  onPress={syncData}
                  disabled={syncing}
                  className="flex-row items-center"
                >
                  <Ionicons
                    name="refresh"
                    size={16}
                    color={syncing ? "#64748b" : "#1DB954"}
                  />
                  <Text
                    className={`ml-1 text-sm ${
                      syncing ? "text-dark-400" : "text-primary-500"
                    }`}
                  >
                    {syncing ? "Syncing..." : "Sync Now"}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Top Genres */}
          {connected && topGenres.length > 0 && (
            <Animated.View
              entering={FadeInDown.delay(100).duration(400)}
              className="mb-4"
            >
              <Text className="text-white/60 text-sm mb-2">
                Your Top Genres
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {topGenres.slice(0, 8).map((genre, index) => (
                  <View
                    key={genre}
                    className="px-3 py-2 rounded-full bg-primary-500/20 border border-primary-500/30"
                  >
                    <Text className="text-primary-500 text-sm capitalize">
                      {genre}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </Animated.View>
          )}

          {/* Top Artists */}
          {connected && topArtists.mediumTerm.length > 0 && (
            <Animated.View
              entering={FadeInDown.delay(200).duration(400)}
              className="mb-4"
            >
              <Text className="text-white/60 text-sm mb-2">
                Your Top Artists
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12 }}
              >
                {topArtists.mediumTerm.slice(0, 6).map((artist) => (
                  <View key={artist.id} className="items-center">
                    <Image
                      source={{
                        uri:
                          artist.images?.[0]?.url ||
                          "https://via.placeholder.com/60",
                      }}
                      style={{ width: 60, height: 60, borderRadius: 30 }}
                    />
                    <Text
                      className="text-white text-xs mt-2 text-center"
                      numberOfLines={1}
                      style={{ width: 70 }}
                    >
                      {artist.name}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </Animated.View>
          )}
        </Animated.View>

        {/* Active Playlist */}
        <Animated.View
          entering={FadeInDown.delay(450).duration(500)}
          className="px-6 mt-4"
        >
          <Text className="text-white text-lg font-semibold mb-4">
            Active Playlist
          </Text>
          {selectedPlaylist ? (
            <Pressable className="bg-white/5 rounded-3xl p-5 border border-white/10">
              <View className="flex-row items-center">
                <Image
                  source={{
                    uri:
                      selectedPlaylist.images?.[0]?.url ||
                      "https://images.unsplash.com/photo-1494232410401-ad00d5433cfa?w=200",
                  }}
                  className="w-16 h-16 rounded-2xl"
                  style={{ width: 64, height: 64, borderRadius: 16 }}
                />
                <View className="flex-1 ml-4">
                  <Text className="text-white font-bold text-lg">
                    {selectedPlaylist.name}
                  </Text>
                  <Text
                    className="text-dark-400 text-sm mt-1"
                    numberOfLines={1}
                  >
                    {selectedPlaylist.description || "No description"}
                  </Text>
                </View>
                <View className="w-10 h-10 rounded-full bg-primary-500 items-center justify-center">
                  <Ionicons name="play" size={20} color="#0a0a0a" />
                </View>
              </View>
              <View className="flex-row gap-4 mt-4 pt-4 border-t border-white/10">
                <View className="flex-1">
                  <Text className="text-primary-500 text-xl font-bold">
                    {selectedPlaylist.tracks?.total || 0}
                  </Text>
                  <Text className="text-dark-400 text-xs">Tracks</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-primary-500 text-xl font-bold">
                    {selectedPlaylist.owner?.display_name || "Unknown"}
                  </Text>
                  <Text className="text-dark-400 text-xs">Owner</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-primary-500 text-xl font-bold">
                    {selectedPlaylist.public ? "Public" : "Private"}
                  </Text>
                  <Text className="text-dark-400 text-xs">Visibility</Text>
                </View>
              </View>
            </Pressable>
          ) : (
            <View className="bg-white/5 rounded-3xl p-8 items-center border border-white/10">
              <View className="w-16 h-16 rounded-full bg-primary-500/20 items-center justify-center mb-4">
                <Ionicons name="musical-notes" size={32} color="#1DB954" />
              </View>
              <Text className="text-white font-medium mb-2">
                No playlist selected
              </Text>
              <Text className="text-dark-400 text-sm text-center">
                Connect Spotify and select a playlist to showcase
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Settings Section */}
        <Animated.View
          entering={FadeInDown.delay(500).duration(500)}
          className="px-6 mt-8"
        >
          <Text className="text-white text-lg font-semibold mb-4">
            Settings
          </Text>
          <View className="bg-white/5 rounded-3xl px-4 border border-white/10">
            <SettingsItem
              icon="person-outline"
              title="Edit Profile"
              subtitle="Update your info and photos"
              onPress={handleEditProfile}
              index={0}
            />
            <SettingsItem
              icon="notifications-outline"
              title="Notifications"
              subtitle="Match alerts and messages"
              hasToggle
              toggleValue={notifications}
              onToggle={handleNotificationsToggle}
              index={1}
            />
            <SettingsItem
              icon="moon-outline"
              title="Dark Mode"
              subtitle="Currently enabled"
              hasToggle
              toggleValue={darkMode}
              onToggle={handleDarkModeToggle}
              index={2}
            />
            <SettingsItem
              icon="shield-outline"
              title="Privacy"
              subtitle="Control your data"
              onPress={handlePrivacy}
              index={3}
            />
            <SettingsItem
              icon="help-circle-outline"
              title="Help & Support"
              onPress={handleHelp}
              index={4}
            />
          </View>
        </Animated.View>

        {/* Seed Users Button (Dev) */}
        <Animated.View
          entering={FadeInDown.delay(550).duration(500)}
          className="px-6 mt-4"
        >
          <Pressable
            onPress={async () => {
              Alert.alert(
                "Seed Test Users",
                "This will create 100 fake Indian users in the database. Continue?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Seed",
                    onPress: async () => {
                      try {
                        Alert.alert("Success", "Created 100 test users!");
                      } catch (e) {
                        console.error(e);
                        Alert.alert("Error", "Failed to seed users");
                      }
                    },
                  },
                ]
              );
            }}
            className="bg-dark-800 rounded-2xl p-4 border border-dark-700 items-center"
          >
            <Text className="text-primary-500 font-bold">
              ⚡ Seed 100 Test Users (Dev)
            </Text>
          </Pressable>
        </Animated.View>

        {/* Logout Button */}
        <Animated.View
          entering={FadeInDown.delay(600).duration(500)}
          className="px-6 mt-8 mb-32"
        >
          <AnimatedButton
            onPress={logout}
            title="Log Out"
            variant="outline"
            size="lg"
            icon={<Ionicons name="log-out-outline" size={20} color="#1DB954" />}
          />
        </Animated.View>
      </ScrollView>

      {/* Custom Themed Image Picker Modal */}
      <Modal
        visible={showImagePickerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImagePickerModal(false)}
      >
        <Pressable
          style={{ flex: 1 }}
          onPress={() => setShowImagePickerModal(false)}
        >
          <BlurView
            intensity={40}
            tint="dark"
            style={{
              flex: 1,
              justifyContent: "flex-end",
              paddingBottom: 40,
            }}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <Animated.View
                entering={SlideInUp.duration(300)}
                className="mx-4"
              >
                {/* Modal Content */}
                <View className="bg-dark-900 rounded-3xl overflow-hidden border border-dark-700">
                  {/* Header */}
                  <LinearGradient
                    colors={["#1DB954", "#158a3d"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="px-6 py-4"
                  >
                    <Text className="text-white text-lg font-bold text-center">
                      Update Profile Photo
                    </Text>
                    <Text className="text-white/80 text-sm text-center mt-1">
                      Choose how you want to add a photo
                    </Text>
                  </LinearGradient>

                  {/* Options */}
                  <View className="py-2">
                    {/* Take Photo Option */}
                    <Pressable
                      onPress={() => {
                        setShowImagePickerModal(false);
                        setTimeout(() => openCamera(), 300);
                      }}
                      className="flex-row items-center px-6 py-4 active:bg-dark-800"
                    >
                      <View className="w-12 h-12 rounded-full bg-spotify/20 items-center justify-center mr-4">
                        <Ionicons name="camera" size={24} color="#1DB954" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-white font-semibold text-base">
                          Take Photo
                        </Text>
                        <Text className="text-dark-400 text-sm">
                          Use your camera to capture a new photo
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#64748b"
                      />
                    </Pressable>

                    {/* Divider */}
                    <View className="h-px bg-dark-700 mx-6" />

                    {/* Choose from Library Option */}
                    <Pressable
                      onPress={() => {
                        setShowImagePickerModal(false);
                        setTimeout(() => openLibrary(), 300);
                      }}
                      className="flex-row items-center px-6 py-4 active:bg-dark-800"
                    >
                      <View className="w-12 h-12 rounded-full bg-spotify/20 items-center justify-center mr-4">
                        <Ionicons name="images" size={24} color="#1DB954" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-white font-semibold text-base">
                          Choose from Library
                        </Text>
                        <Text className="text-dark-400 text-sm">
                          Select a photo from your gallery
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#64748b"
                      />
                    </Pressable>
                  </View>
                </View>

                {/* Cancel Button */}
                <Pressable
                  onPress={() => setShowImagePickerModal(false)}
                  className="mt-3 bg-dark-900 rounded-2xl py-4 border border-dark-700 active:bg-dark-800"
                >
                  <Text className="text-spotify text-center font-bold text-base">
                    Cancel
                  </Text>
                </Pressable>
              </Animated.View>
            </Pressable>
          </BlurView>
        </Pressable>
      </Modal>
    </View>
  );
};

export default ProfileScreen;
