import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeInRight,
  FadeOut,
  SlideInRight,
  SlideOutRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { userService } from "../services/userService";
import { useRealtimeMessaging } from "../hooks/useRealtimeMessaging";
import { Message } from "../services/messageService";
import { Alert } from "react-native";
import { SongPickerModal } from "../components/SongPickerModal";
import { PlaylistPickerModal } from "../components/PlaylistPickerModal";
import { SpotifyTrack, SpotifyPlaylist } from "../types/spotify";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ChatUser {
  id: string;
  displayName: string;
  avatar: string;
  isOnline: boolean;
  lastSeen?: string;
  isTyping?: boolean;
}

// Quick reactions
const QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "🔥", "👏"];

// Message Bubble Component
const MessageBubble = ({
  message,
  isMe,
  showAvatar,
  otherUser,
  onLongPress,
  onReply,
  replyMessage,
}: {
  message: Message;
  isMe: boolean;
  showAvatar: boolean;
  otherUser: ChatUser;
  onLongPress: (message: Message) => void;
  onReply: (message: Message) => void;
  replyMessage?: Message;
}) => {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: translateX.value }],
  }));

  const replyIndicatorStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, 60],
      [0, 1],
      Extrapolation.CLAMP
    ),
  }));

  const replyIndicatorMeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, -60],
      [0, 1],
      Extrapolation.CLAMP
    ),
  }));

  // Swipe to reply gesture
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      const clampedX = isMe
        ? Math.max(-80, Math.min(0, e.translationX))
        : Math.min(80, Math.max(0, e.translationX));
      translateX.value = clampedX;
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > 60) {
        runOnJS(onReply)(message);
      }
      translateX.value = withSpring(0);
    });

  const handlePressIn = () => {
    scale.value = withSpring(0.97);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const formatTime = (date: Date) => {
    if (isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Render message content based on type
  const renderContent = () => {
    switch (message.type) {
      case "song":
        // Handle both legacy simple format and full SpotifyTrack format
        const songName = message.songData?.name;
        const artistName =
          message.songData?.artist ||
          message.songData?.artists?.map((a: any) => a.name).join(", ");
        const albumArt =
          message.songData?.albumArt ||
          message.songData?.album?.images?.[0]?.url;

        return (
          <Pressable style={styles.songBubble}>
            <Image source={{ uri: albumArt }} style={styles.albumArt} />
            <View style={styles.songInfo}>
              <Text style={styles.songName} numberOfLines={1}>
                {songName}
              </Text>
              <Text style={styles.songArtist} numberOfLines={1}>
                {artistName}
              </Text>
            </View>
            <Pressable style={styles.playButton}>
              <Ionicons name="play" size={20} color="#1DB954" />
            </Pressable>
          </Pressable>
        );

      case "playlist":
        const playlistName = message.playlistData?.name;
        const playlistCover =
          message.playlistData?.coverUrl ||
          message.playlistData?.images?.[0]?.url;
        const songCount =
          message.playlistData?.songCount ||
          message.playlistData?.tracks?.total ||
          0;

        return (
          <Pressable style={styles.playlistBubble}>
            <Image
              source={{ uri: playlistCover }}
              style={styles.playlistCover}
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.8)"]}
              style={styles.playlistGradient}
            />
            <View style={styles.playlistInfo}>
              <Text style={styles.playlistName}>{playlistName}</Text>
              <Text style={styles.playlistCount}>{songCount} songs</Text>
            </View>
            <View style={styles.spotifyBadge}>
              <Ionicons name="musical-notes" size={14} color="#1DB954" />
            </View>
          </Pressable>
        );

      default:
        return (
          <>
            {/* Reply preview */}
            {replyMessage && (
              <View style={styles.replyPreview}>
                <View style={styles.replyBar} />
                <Text style={styles.replyText} numberOfLines={1}>
                  {replyMessage.content || "🎵 Shared a song"}
                </Text>
              </View>
            )}
            <Text style={[styles.messageText, isMe && styles.messageTextMe]}>
              {message.content}
            </Text>
          </>
        );
    }
  };

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View entering={FadeInUp.duration(300).springify()}>
        <Animated.View
          style={[
            styles.messageRow,
            isMe ? styles.messageRowMe : styles.messageRowOther,
            animatedStyle,
          ]}
        >
          {/* Reply indicator */}
          {!isMe && (
            <Animated.View style={[styles.replyIndicator, replyIndicatorStyle]}>
              <Ionicons name="arrow-undo" size={20} color="#1DB954" />
            </Animated.View>
          )}

          {/* Avatar */}
          {!isMe && showAvatar && (
            <Image source={{ uri: otherUser.avatar }} style={styles.avatar} />
          )}
          {!isMe && !showAvatar && <View style={styles.avatarPlaceholder} />}

          {/* Bubble */}
          <AnimatedPressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onLongPress={() => onLongPress(message)}
            delayLongPress={300}
            style={[
              styles.bubble,
              isMe ? styles.bubbleMe : styles.bubbleOther,
              message.type === "song" && styles.bubbleSong,
              message.type === "playlist" && styles.bubblePlaylist,
            ]}
          >
            {renderContent()}

            {/* Timestamp & Status */}
            <View style={styles.messageFooter}>
              <Text style={[styles.timestamp, isMe && styles.timestampMe]}>
                {formatTime(new Date(message.createdAt))}
              </Text>
              {isMe && (
                <Ionicons
                  name={
                    message.read
                      ? "checkmark-done"
                      : message.status === "delivered"
                      ? "checkmark-done"
                      : "checkmark"
                  }
                  size={14}
                  color={message.read ? "#1DB954" : "#666"}
                  style={styles.statusIcon}
                />
              )}
            </View>

            {/* Reactions */}
            {message.reactions && message.reactions.length > 0 && (
              <View
                style={[
                  styles.reactionsContainer,
                  isMe ? styles.reactionsMe : styles.reactionsOther,
                ]}
              >
                {message.reactions.map((r, i) => (
                  <Text key={i} style={styles.reaction}>
                    {r.emoji}
                  </Text>
                ))}
              </View>
            )}
          </AnimatedPressable>

          {/* Reply indicator for own messages */}
          {isMe && (
            <Animated.View
              style={[styles.replyIndicatorMe, replyIndicatorMeStyle]}
            >
              <Ionicons name="arrow-undo" size={20} color="#1DB954" />
            </Animated.View>
          )}
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
};

// Typing Indicator
const TypingIndicator = ({ user }: { user: ChatUser }) => {
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
      style={styles.typingContainer}
    >
      <Image source={{ uri: user.avatar }} style={styles.typingAvatar} />
      <View style={styles.typingBubble}>
        <View style={styles.typingDots}>
          {[0, 1, 2].map((i) => (
            <Animated.View
              key={i}
              entering={FadeIn.delay(i * 150).duration(300)}
              style={[styles.typingDot]}
            />
          ))}
        </View>
      </View>
    </Animated.View>
  );
};

// Quick Reactions Modal
const ReactionsModal = ({
  visible,
  message,
  onReact,
  onClose,
}: {
  visible: boolean;
  message: Message | null;
  onReact: (emoji: string) => void;
  onClose: () => void;
}) => {
  if (!visible || !message) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={styles.reactionsModal}
    >
      <Pressable style={styles.reactionsBackdrop} onPress={onClose} />
      <Animated.View
        entering={SlideInRight.springify()}
        style={styles.reactionsBar}
      >
        <BlurView intensity={80} tint="dark" style={styles.reactionsBlur}>
          {QUICK_REACTIONS.map((emoji, i) => (
            <Pressable
              key={emoji}
              onPress={() => onReact(emoji)}
              style={styles.reactionButton}
            >
              <Animated.Text
                entering={FadeIn.delay(i * 50)}
                style={styles.reactionEmoji}
              >
                {emoji}
              </Animated.Text>
            </Pressable>
          ))}
        </BlurView>
      </Animated.View>
    </Animated.View>
  );
};

// Main Message Screen Component
const MessageScreen = ({ route, navigation }: any) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showReactions, setShowReactions] = useState(false);
  const [showSongPicker, setShowSongPicker] = useState(false);
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Get match and user from route params
  const matchId = route?.params?.matchId;
  const routeUser = route?.params?.otherUser;
  const otherUser: ChatUser = routeUser
    ? {
        id: routeUser.id || routeUser.userId || "user",
        displayName: routeUser.displayName || routeUser.name || "User",
        avatar:
          routeUser.avatar ||
          routeUser.photoURL ||
          "https://via.placeholder.com/72",
        isOnline: routeUser.isOnline ?? false,
        isTyping: false,
      }
    : {
        id: "unknown",
        displayName: "User",
        avatar: "https://via.placeholder.com/72",
        isOnline: false,
      };

  // Real-time messaging hook
  const {
    messages,
    isOtherUserTyping,
    isOtherUserOnline,
    sendMessage: sendRealtimeMessage,
    sendTypingIndicator,
    markAllAsRead,
    loading,
  } = useRealtimeMessaging({
    matchId,
    userId: user!.$id,
    otherUserId: otherUser.id,
    onNewMessage: () => {
      // Scroll to bottom on new message
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
  });

  // Update typing status when input changes
  const handleInputChange = (text: string) => {
    setInputText(text);
    sendTypingIndicator(text.length > 0);
  };

  const handleSendSong = async (track: SpotifyTrack) => {
    try {
      await sendRealtimeMessage(`Shared a song: ${track.name}`, "song", {
        songData: track,
      });
      setShowSongPicker(false);
    } catch (error) {
      console.error("Error sending song:", error);
      Alert.alert("Error", "Failed to send song");
    }
  };

  const handleSendPlaylist = async (playlist: SpotifyPlaylist) => {
    try {
      await sendRealtimeMessage(
        `Shared a playlist: ${playlist.name}`,
        "playlist",
        {
          playlistData: playlist,
        }
      );
      setShowPlaylistPicker(false);
    } catch (error) {
      console.error("Error sending playlist:", error);
      Alert.alert("Error", "Failed to send playlist");
    }
  };

  const handleSafetyOptions = () => {
    Alert.alert("Safety Options", "Choose an action", [
      {
        text: "Unmatch",
        style: "destructive",
        onPress: () => {
          Alert.alert(
            "Unmatch",
            "Are you sure? You won't be able to message this person again.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Unmatch",
                style: "destructive",
                onPress: async () => {
                  try {
                    if (matchId) {
                      await userService.unmatch(matchId);
                      navigation.goBack();
                    }
                  } catch (error) {
                    Alert.alert("Error", "Failed to unmatch");
                  }
                },
              },
            ]
          );
        },
      },
      {
        text: "Report",
        style: "destructive",
        onPress: () => {
          Alert.alert(
            "Report User",
            "Report this user for inappropriate behavior?",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Report",
                style: "destructive",
                onPress: async () => {
                  try {
                    if (user && otherUser) {
                      await userService.reportUser(
                        user.$id,
                        otherUser.id,
                        "Inappropriate behavior"
                      );
                      Alert.alert(
                        "Reported",
                        "User has been reported and blocked."
                      );
                      navigation.goBack();
                    }
                  } catch (error) {
                    Alert.alert("Error", "Failed to report user");
                  }
                },
              },
            ]
          );
        },
      },
      {
        text: "Block",
        style: "destructive",
        onPress: () => {
          Alert.alert("Block User", "Are you sure? You won't see them again.", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Block",
              style: "destructive",
              onPress: async () => {
                try {
                  if (user && otherUser) {
                    await userService.blockUser(user.$id, otherUser.id);
                    navigation.goBack();
                  }
                } catch (error) {
                  Alert.alert("Error", "Failed to block user");
                }
              },
            },
          ]);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    try {
      await sendRealtimeMessage(inputText);
      setInputText("");
      setReplyingTo(null);
      sendTypingIndicator(false);
    } catch (error) {
      console.error("Failed to send message:", error);
      Alert.alert("Error", "Failed to send message");
    }
  };

  const handleReaction = (emoji: string) => {
    // TODO: Implement reaction logic in service
    setShowReactions(false);
    setSelectedMessage(null);
  };

  const handleLongPress = (message: Message) => {
    setSelectedMessage(message);
    setShowReactions(true);
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMe = user ? item.senderId === user.$id : false;
    const prevMessage = messages[index - 1];
    const showAvatar =
      !isMe && (!prevMessage || prevMessage.senderId !== item.senderId);

    const replyMessage = item.replyToId
      ? messages.find((m) => m.id === item.replyToId)
      : undefined;

    return (
      <MessageBubble
        message={item}
        isMe={isMe}
        showAvatar={showAvatar}
        otherUser={otherUser}
        onLongPress={handleLongPress}
        onReply={handleReply}
        replyMessage={replyMessage}
      />
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Pressable
          onPress={() => navigation?.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </Pressable>

        <Pressable style={styles.headerProfile}>
          <View style={styles.headerAvatarContainer}>
            <Image
              source={{ uri: otherUser.avatar }}
              style={styles.headerAvatar}
            />
            {isOtherUserOnline && <View style={styles.onlineIndicator} />}
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{otherUser.displayName}</Text>
            <Text style={styles.headerStatus}>
              {isOtherUserTyping
                ? "typing..."
                : isOtherUserOnline
                ? "Active now"
                : otherUser.lastSeen}
            </Text>
          </View>
        </Pressable>

        <View style={styles.headerActions}>
          <Pressable style={styles.headerAction} onPress={handleSafetyOptions}>
            <Ionicons name="shield-checkmark" size={22} color="#fff" />
          </Pressable>
          <Pressable style={styles.headerAction}>
            <Ionicons name="call" size={22} color="#1DB954" />
          </Pressable>
          <Pressable style={styles.headerAction}>
            <Ionicons name="videocam" size={24} color="#1DB954" />
          </Pressable>
        </View>
      </Animated.View>

      {/* Match Info Banner */}
      <Animated.View
        entering={FadeIn.delay(200).duration(400)}
        style={styles.matchBanner}
      >
        <LinearGradient
          colors={["rgba(29, 185, 84, 0.15)", "rgba(29, 185, 84, 0.05)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.matchBannerGradient}
        >
          <Ionicons name="musical-notes" size={18} color="#1DB954" />
          <Text style={styles.matchBannerText}>
            You both love Tame Impala, Beach House & more
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#1DB954" />
        </LinearGradient>
      </Animated.View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        ListFooterComponent={
          isOtherUserTyping ? <TypingIndicator user={otherUser} /> : null
        }
      />

      {/* Reply Preview */}
      {replyingTo && (
        <Animated.View
          entering={SlideInRight.duration(200)}
          exiting={SlideOutRight.duration(200)}
          style={styles.replyingContainer}
        >
          <View style={styles.replyingBar} />
          <View style={styles.replyingContent}>
            <Text style={styles.replyingLabel}>
              Replying to{" "}
              {user && replyingTo.senderId === user.$id
                ? "yourself"
                : otherUser.displayName}
            </Text>
            <Text style={styles.replyingText} numberOfLines={1}>
              {replyingTo.content || "🎵 Shared a song"}
            </Text>
          </View>
          <Pressable onPress={() => setReplyingTo(null)}>
            <Ionicons name="close" size={20} color="#888" />
          </Pressable>
        </Animated.View>
      )}

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <Animated.View
          entering={FadeInUp.duration(400)}
          style={[styles.inputContainer, { paddingBottom: insets.bottom + 8 }]}
        >
          <View style={styles.inputRow}>
            {/* Attachment Button */}
            <Pressable style={styles.attachButton}>
              <LinearGradient
                colors={["#1DB954", "#1ed760"]}
                style={styles.attachGradient}
              >
                <Ionicons name="add" size={24} color="#fff" />
              </LinearGradient>
            </Pressable>

            {/* Text Input */}
            <View style={styles.inputWrapper}>
              <TextInput
                value={inputText}
                onChangeText={handleInputChange}
                placeholder="Message..."
                placeholderTextColor="#666"
                style={styles.input}
                multiline
                maxLength={1000}
              />
              <Pressable style={styles.emojiButton}>
                <Ionicons name="happy-outline" size={24} color="#888" />
              </Pressable>
            </View>

            {/* Send / Voice Button */}
            {inputText.trim() ? (
              <Pressable onPress={handleSendMessage} style={styles.sendButton}>
                <LinearGradient
                  colors={["#1DB954", "#1ed760"]}
                  style={styles.sendGradient}
                >
                  <Ionicons name="send" size={20} color="#fff" />
                </LinearGradient>
              </Pressable>
            ) : (
              <Pressable style={styles.voiceButton}>
                <Ionicons name="mic" size={24} color="#1DB954" />
              </Pressable>
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Pressable
              style={styles.quickAction}
              onPress={() => setShowSongPicker(true)}
            >
              <Ionicons name="musical-note" size={18} color="#1DB954" />
              <Text style={styles.quickActionText}>Song</Text>
            </Pressable>
            <Pressable
              style={styles.quickAction}
              onPress={() => setShowPlaylistPicker(true)}
            >
              <Ionicons name="list" size={18} color="#1DB954" />
              <Text style={styles.quickActionText}>Playlist</Text>
            </Pressable>
            <Pressable
              style={styles.quickAction}
              onPress={() =>
                Alert.alert(
                  "Coming Soon",
                  "Photo sharing will be available soon!"
                )
              }
            >
              <Ionicons name="image" size={18} color="#1DB954" />
              <Text style={styles.quickActionText}>Photo</Text>
            </Pressable>
            <Pressable
              style={styles.quickAction}
              onPress={() =>
                Alert.alert(
                  "Coming Soon",
                  "GIF sharing will be available soon!"
                )
              }
            >
              <Ionicons name="gift" size={18} color="#1DB954" />
              <Text style={styles.quickActionText}>GIF</Text>
            </Pressable>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>

      {/* Song Picker Modal */}
      <SongPickerModal
        visible={showSongPicker}
        onClose={() => setShowSongPicker(false)}
        onSelect={handleSendSong}
      />

      {/* Playlist Picker Modal */}
      <PlaylistPickerModal
        visible={showPlaylistPicker}
        onClose={() => setShowPlaylistPicker(false)}
        onSelect={handleSendPlaylist}
      />

      {/* Reactions Modal */}
      <ReactionsModal
        visible={showReactions}
        message={selectedMessage}
        onReact={handleReaction}
        onClose={() => {
          setShowReactions(false);
          setSelectedMessage(null);
        }}
      />
    </View>
  );
};

// Styles
const styles = {
  container: {
    flex: 1,
    backgroundColor: "#05070d",
  },

  // Header
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerProfile: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
  },
  headerAvatarContainer: {
    position: "relative" as const,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  onlineIndicator: {
    position: "absolute" as const,
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#1DB954",
    borderWidth: 2,
    borderColor: "#05070d",
  },
  headerInfo: {
    marginLeft: 12,
  },
  headerName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  headerStatus: {
    color: "#1DB954",
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row" as const,
    gap: 16,
  },
  headerAction: {
    padding: 8,
  },

  // Match Banner
  matchBanner: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: "hidden" as const,
  },
  matchBannerGradient: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 8,
  },
  matchBannerText: {
    flex: 1,
    color: "#fff",
    fontSize: 13,
  },

  // Messages List
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  // Message Row
  messageRow: {
    flexDirection: "row" as const,
    alignItems: "flex-end" as const,
    marginBottom: 4,
  },
  messageRowMe: {
    justifyContent: "flex-end" as const,
  },
  messageRowOther: {
    justifyContent: "flex-start" as const,
  },

  // Avatar
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  avatarPlaceholder: {
    width: 28,
    marginRight: 8,
  },

  // Bubble
  bubble: {
    maxWidth: "75%" as any,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  bubbleMe: {
    backgroundColor: "#1DB954",
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: "#1a1d2e",
    borderBottomLeftRadius: 4,
  },
  bubbleSong: {
    padding: 8,
    backgroundColor: "#1a1d2e",
  },
  bubblePlaylist: {
    padding: 0,
    overflow: "hidden" as const,
    width: 200,
  },

  // Message Text
  messageText: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextMe: {
    color: "#000",
  },

  // Song Bubble
  songBubble: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
  },
  albumArt: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  songInfo: {
    flex: 1,
  },
  songName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  songArtist: {
    color: "#888",
    fontSize: 12,
    marginTop: 2,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(29, 185, 84, 0.2)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },

  // Playlist Bubble
  playlistBubble: {
    width: 200,
    height: 120,
    borderRadius: 12,
    overflow: "hidden" as const,
    position: "relative" as const,
  },
  playlistCover: {
    width: 200,
    height: 120,
  },
  playlistGradient: {
    position: "absolute" as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  playlistInfo: {
    position: "absolute" as const,
    bottom: 10,
    left: 12,
  },
  playlistName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  playlistCount: {
    color: "#aaa",
    fontSize: 11,
    marginTop: 2,
  },
  spotifyBadge: {
    position: "absolute" as const,
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 6,
    borderRadius: 12,
  },

  // Reply
  replyPreview: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginBottom: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  replyBar: {
    width: 3,
    height: 16,
    backgroundColor: "#1DB954",
    borderRadius: 2,
    marginRight: 8,
  },
  replyText: {
    color: "#888",
    fontSize: 12,
    flex: 1,
  },

  // Message Footer
  messageFooter: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "flex-end" as const,
    marginTop: 4,
    gap: 4,
  },
  timestamp: {
    color: "#666",
    fontSize: 10,
  },
  timestampMe: {
    color: "rgba(0,0,0,0.5)",
  },
  statusIcon: {
    marginLeft: 2,
  },

  // Reactions
  reactionsContainer: {
    position: "absolute" as const,
    bottom: -10,
    flexDirection: "row" as const,
    backgroundColor: "#1a1d2e",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  reactionsMe: {
    right: 8,
  },
  reactionsOther: {
    left: 8,
  },
  reaction: {
    fontSize: 14,
  },

  // Reply Indicator
  replyIndicator: {
    position: "absolute" as const,
    left: -30,
    alignSelf: "center" as const,
  },
  replyIndicatorMe: {
    position: "absolute" as const,
    right: -30,
    alignSelf: "center" as const,
  },

  // Typing Indicator
  typingContainer: {
    flexDirection: "row" as const,
    alignItems: "flex-end" as const,
    marginTop: 8,
  },
  typingAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  typingBubble: {
    backgroundColor: "#1a1d2e",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  typingDots: {
    flexDirection: "row" as const,
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#666",
  },

  // Reactions Modal
  reactionsModal: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  reactionsBackdrop: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  reactionsBar: {
    borderRadius: 28,
    overflow: "hidden" as const,
  },
  reactionsBlur: {
    flexDirection: "row" as const,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  reactionButton: {
    padding: 8,
  },
  reactionEmoji: {
    fontSize: 28,
  },

  // Replying Container
  replyingContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#111424",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  replyingBar: {
    width: 3,
    height: 32,
    backgroundColor: "#1DB954",
    borderRadius: 2,
    marginRight: 12,
  },
  replyingContent: {
    flex: 1,
  },
  replyingLabel: {
    color: "#1DB954",
    fontSize: 12,
    fontWeight: "600" as const,
  },
  replyingText: {
    color: "#888",
    fontSize: 14,
    marginTop: 2,
  },

  // Input Container
  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: "#0a0d14",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  inputRow: {
    flexDirection: "row" as const,
    alignItems: "flex-end" as const,
    gap: 10,
  },
  attachButton: {
    marginBottom: 4,
  },
  attachGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "flex-end" as const,
    backgroundColor: "#1a1d2e",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 44,
    maxHeight: 120,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    paddingVertical: 4,
    maxHeight: 100,
  },
  emojiButton: {
    padding: 4,
    marginLeft: 8,
  },
  sendButton: {
    marginBottom: 4,
  },
  sendGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  voiceButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 4,
  },

  // Quick Actions
  quickActions: {
    flexDirection: "row" as const,
    justifyContent: "space-around" as const,
    paddingTop: 12,
    paddingBottom: 4,
  },
  quickAction: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(29, 185, 84, 0.1)",
    borderRadius: 16,
  },
  quickActionText: {
    color: "#1DB954",
    fontSize: 12,
    fontWeight: "500" as const,
  },
};

export default MessageScreen;
