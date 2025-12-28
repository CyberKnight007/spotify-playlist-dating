import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { useAuth } from "../context/AuthContext";
import { userService } from "../services/userService";
import { UserProfile } from "../types/user";

const { width } = Dimensions.get("window");
const COLUMN_COUNT = 2;
const ITEM_WIDTH = (width - 48 - (COLUMN_COUNT - 1) * 12) / COLUMN_COUNT;

const LikesScreen = () => {
  const navigation = useNavigation();
  const { user, userProfile } = useAuth();
  const [likes, setLikes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLikes();
  }, [user]);

  const loadLikes = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const receivedLikes = await userService.getReceivedLikes(user.$id);
      setLikes(receivedLikes);
    } catch (error) {
      console.error("Failed to load likes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMatch = async (otherUser: any) => {
    if (!user) return;
    try {
      // Record a right swipe to create the match
      await userService.recordSwipe({
        swiperId: user.$id,
        swipedId: otherUser.userId,
        direction: "right",
      });

      // Check for match (should be guaranteed since they liked us)
      const isMatch = await userService.checkForMatch(
        user.$id,
        otherUser.userId
      );

      if (isMatch) {
        // Create match document
        const matchId = await userService.createMatch(
          user.$id,
          otherUser.userId,
          otherUser.compatibility || 0 // Use compatibility from the like if available, or calculate
        );

        Alert.alert(
          "It's a Match!",
          `You and ${otherUser.displayName} liked each other!`
        );

        // Remove from list
        setLikes((prev) => prev.filter((l) => l.userId !== otherUser.userId));
      }
    } catch (error) {
      console.error("Error matching:", error);
      Alert.alert("Error", "Failed to match. Please try again.");
    }
  };

  const handlePass = async (otherUser: any) => {
    if (!user) return;
    try {
      await userService.recordSwipe({
        swiperId: user.$id,
        swipedId: otherUser.userId,
        direction: "left",
      });
      // Remove from list
      setLikes((prev) => prev.filter((l) => l.userId !== otherUser.userId));
    } catch (error) {
      console.error("Error passing:", error);
    }
  };

  return (
    <View className="flex-1 bg-dark-950">
      {/* Header */}
      <View className="pt-16 pb-4 px-6 bg-dark-950 z-10">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-white/5 items-center justify-center mr-4"
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </Pressable>
          <View>
            <Text className="text-white text-2xl font-bold">Likes You</Text>
            <Text className="text-dark-400 text-sm">
              {likes.length} people want to match
            </Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1DB954" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row flex-wrap gap-3">
            {likes.map((profile, index) => (
              <Animated.View
                key={profile.userId}
                entering={FadeInUp.delay(index * 100).duration(500)}
                style={{ width: ITEM_WIDTH }}
                className="mb-3"
              >
                <View className="bg-dark-800 rounded-2xl overflow-hidden border border-white/5">
                  {/* Image */}
                  <View className="relative">
                    <Image
                      source={{
                        uri:
                          profile.avatar || "https://via.placeholder.com/300",
                      }}
                      style={{ width: "100%", height: ITEM_WIDTH * 1.2 }}
                      resizeMode="cover"
                    />
                    {/* Compatibility Badge */}
                    {profile.compatibility && (
                      <View className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded-full flex-row items-center">
                        <Ionicons
                          name="musical-notes"
                          size={10}
                          color="#1DB954"
                        />
                        <Text className="text-white text-xs font-bold ml-1">
                          {profile.compatibility}%
                        </Text>
                      </View>
                    )}

                    {/* Actions Overlay */}
                    <LinearGradient
                      colors={["transparent", "rgba(0,0,0,0.8)"]}
                      className="absolute bottom-0 left-0 right-0 p-3 pt-12"
                    >
                      <Text
                        className="text-white font-bold text-lg"
                        numberOfLines={1}
                      >
                        {profile.displayName}, {profile.age}
                      </Text>
                      <Text
                        className="text-white/70 text-xs mb-3"
                        numberOfLines={1}
                      >
                        {profile.city || "Unknown Location"}
                      </Text>

                      <View className="flex-row gap-2 justify-between">
                        <Pressable
                          onPress={() => handlePass(profile)}
                          className="flex-1 bg-dark-900/80 py-2 rounded-xl items-center border border-white/10"
                        >
                          <Ionicons name="close" size={20} color="#ef4444" />
                        </Pressable>
                        <Pressable
                          onPress={() => handleMatch(profile)}
                          className="flex-1 bg-primary-500 py-2 rounded-xl items-center"
                        >
                          <Ionicons name="heart" size={20} color="#000" />
                        </Pressable>
                      </View>
                    </LinearGradient>
                  </View>
                </View>
              </Animated.View>
            ))}
          </View>

          {likes.length === 0 && (
            <View className="items-center justify-center py-20">
              <View className="w-20 h-20 rounded-full bg-dark-800 items-center justify-center mb-4">
                <Ionicons
                  name="heart-dislike-outline"
                  size={40}
                  color="#64748b"
                />
              </View>
              <Text className="text-white text-lg font-bold text-center">
                No likes yet
              </Text>
              <Text className="text-dark-400 text-center mt-2 px-8">
                Keep your profile updated and swipe more to get noticed!
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

export default LikesScreen;
