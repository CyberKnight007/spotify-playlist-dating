import React, { useState } from "react";
import { View, Text, Pressable, Image, ScrollView, Switch } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  SlideInRight,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useSpotify } from "../context/SpotifyContext";
import { AnimatedButton } from "../components/ui/AnimatedComponents";

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
  const { userProfile, logout } = useAuth();
  const { selectedPlaylist, playlists } = useSpotify();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  return (
    <View className="flex-1 bg-dark-950">
      <ScrollView showsVerticalScrollIndicator={false}>
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
              <Pressable className="w-10 h-10 rounded-full bg-dark-950/30 items-center justify-center">
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
                        userProfile?.avatar ||
                        selectedPlaylist?.cover?.url ||
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
                </LinearGradient>
                <Pressable className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-primary-500 items-center justify-center border-3 border-dark-950">
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
            Active Playlist
          </Text>
          {selectedPlaylist ? (
            <Pressable className="bg-white/5 rounded-3xl p-5 border border-white/10">
              <View className="flex-row items-center">
                <Image
                  source={{
                    uri:
                      selectedPlaylist.cover?.url ||
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
                    {selectedPlaylist.tracks?.length || 0}
                  </Text>
                  <Text className="text-dark-400 text-xs">Tracks</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-primary-500 text-xl font-bold">
                    {selectedPlaylist.followers?.toLocaleString() || 0}
                  </Text>
                  <Text className="text-dark-400 text-xs">Followers</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-primary-500 text-xl font-bold">
                    {selectedPlaylist.tags?.length || 0}
                  </Text>
                  <Text className="text-dark-400 text-xs">Tags</Text>
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
              index={0}
            />
            <SettingsItem
              icon="notifications-outline"
              title="Notifications"
              subtitle="Match alerts and messages"
              hasToggle
              toggleValue={notifications}
              onToggle={setNotifications}
              index={1}
            />
            <SettingsItem
              icon="moon-outline"
              title="Dark Mode"
              subtitle="Currently enabled"
              hasToggle
              toggleValue={darkMode}
              onToggle={setDarkMode}
              index={2}
            />
            <SettingsItem
              icon="shield-outline"
              title="Privacy"
              subtitle="Control your data"
              index={3}
            />
            <SettingsItem
              icon="help-circle-outline"
              title="Help & Support"
              index={4}
            />
          </View>
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
    </View>
  );
};

export default ProfileScreen;
