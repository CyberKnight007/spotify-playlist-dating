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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Types
interface Message {
  id: string;
  senderId: string;
  text?: string;
  type: "text" | "image" | "song" | "voice" | "emoji" | "playlist";
  timestamp: Date;
  status: "sent" | "delivered" | "read";
  replyTo?: string;
  reactions?: { emoji: string; userId: string }[];
  songData?: {
    name: string;
    artist: string;
    albumArt: string;
    previewUrl?: string;
  };
  imageUrl?: string;
  playlistData?: {
    name: string;
    coverUrl: string;
    songCount: number;
  };
}

interface ChatUser {
  id: string;
  displayName: string;
  avatar: string;
  isOnline: boolean;
  lastSeen?: string;
  isTyping?: boolean;
}

// Demo data
const DEMO_USER: ChatUser = {
  id: "luna-chen",
  displayName: "Luna Chen",
  avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
  isOnline: true,
  isTyping: false,
};

const DEMO_MESSAGES: Message[] = [
  {
    id: "1",
    senderId: "luna-chen",
    text: "Hey! I saw we matched on our love for Tame Impala 💜",
    type: "text",
    timestamp: new Date(Date.now() - 3600000 * 2),
    status: "read",
  },
  {
    id: "2",
    senderId: "me",
    text: "Yes! They're amazing! Have you seen them live?",
    type: "text",
    timestamp: new Date(Date.now() - 3600000 * 1.9),
    status: "read",
  },
  {
    id: "3",
    senderId: "luna-chen",
    text: "Twice! The visuals are insane 🌀",
    type: "text",
    timestamp: new Date(Date.now() - 3600000 * 1.8),
    status: "read",
  },
  {
    id: "4",
    senderId: "luna-chen",
    type: "song",
    timestamp: new Date(Date.now() - 3600000 * 1.5),
    status: "read",
    songData: {
      name: "Let It Happen",
      artist: "Tame Impala",
      albumArt:
        "https://i.scdn.co/image/ab67616d0000b273b5b8c7cd64e09c4f76f4c9b4",
      previewUrl: "https://example.com/preview.mp3",
    },
  },
  {
    id: "5",
    senderId: "me",
    text: "This song is a masterpiece! 🎧",
    type: "text",
    timestamp: new Date(Date.now() - 3600000),
    status: "read",
    replyTo: "4",
  },
  {
    id: "6",
    senderId: "luna-chen",
    text: "Right?! I made a playlist with similar vibes",
    type: "text",
    timestamp: new Date(Date.now() - 1800000),
    status: "read",
  },
  {
    id: "7",
    senderId: "luna-chen",
    type: "playlist",
    timestamp: new Date(Date.now() - 1700000),
    status: "read",
    playlistData: {
      name: "Psychedelic Dreams",
      coverUrl:
        "https://images.unsplash.com/photo-1614149162883-504ce4d13909?w=400",
      songCount: 42,
    },
  },
  {
    id: "8",
    senderId: "me",
    text: "Adding this to my library right now! 🔥",
    type: "text",
    timestamp: new Date(Date.now() - 600000),
    status: "delivered",
  },
  {
    id: "9",
    senderId: "luna-chen",
    text: "We should go to a concert together sometime! 🎤",
    type: "text",
    timestamp: new Date(Date.now() - 120000),
    status: "read",
    reactions: [{ emoji: "❤️", userId: "me" }],
  },
];

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
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Render message content based on type
  const renderContent = () => {
    switch (message.type) {
      case "song":
        return (
          <Pressable style={styles.songBubble}>
            <Image
              source={{ uri: message.songData?.albumArt }}
              style={styles.albumArt}
            />
            <View style={styles.songInfo}>
              <Text style={styles.songName} numberOfLines={1}>
                {message.songData?.name}
              </Text>
              <Text style={styles.songArtist} numberOfLines={1}>
                {message.songData?.artist}
              </Text>
            </View>
            <Pressable style={styles.playButton}>
              <Ionicons name="play" size={20} color="#1DB954" />
            </Pressable>
          </Pressable>
        );

      case "playlist":
        return (
          <Pressable style={styles.playlistBubble}>
            <Image
              source={{ uri: message.playlistData?.coverUrl }}
              style={styles.playlistCover}
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.8)"]}
              style={styles.playlistGradient}
            />
            <View style={styles.playlistInfo}>
              <Text style={styles.playlistName}>
                {message.playlistData?.name}
              </Text>
              <Text style={styles.playlistCount}>
                {message.playlistData?.songCount} songs
              </Text>
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
                  {replyMessage.text || "🎵 Shared a song"}
                </Text>
              </View>
            )}
            <Text style={[styles.messageText, isMe && styles.messageTextMe]}>
              {message.text}
            </Text>
          </>
        );
    }
  };

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        entering={FadeInUp.duration(300).springify()}
        style={[
          styles.messageRow,
          isMe ? styles.messageRowMe : styles.messageRowOther,
          animatedStyle,
        ]}
      >
        {/* Reply indicator */}
        {!isMe && (
          <Animated.View
            style={[
              styles.replyIndicator,
              {
                opacity: interpolate(
                  translateX.value,
                  [0, 60],
                  [0, 1],
                  Extrapolation.CLAMP
                ),
              },
            ]}
          >
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
              {formatTime(message.timestamp)}
            </Text>
            {isMe && (
              <Ionicons
                name={
                  message.status === "read"
                    ? "checkmark-done"
                    : message.status === "delivered"
                    ? "checkmark-done"
                    : "checkmark"
                }
                size={14}
                color={message.status === "read" ? "#1DB954" : "#666"}
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
            style={[
              styles.replyIndicatorMe,
              {
                opacity: interpolate(
                  translateX.value,
                  [0, -60],
                  [0, 1],
                  Extrapolation.CLAMP
                ),
              },
            ]}
          >
            <Ionicons name="arrow-undo" size={20} color="#1DB954" />
          </Animated.View>
        )}
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
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>(DEMO_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showReactions, setShowReactions] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Get user from route params or use demo data
  const routeUser = route?.params?.otherUser;
  const otherUser: ChatUser = routeUser
    ? {
        id: routeUser.id || routeUser.userId || "user",
        displayName: routeUser.displayName || routeUser.name || "User",
        avatar: routeUser.avatar || routeUser.photoURL || DEMO_USER.avatar,
        isOnline: routeUser.isOnline ?? true,
        isTyping: false,
      }
    : DEMO_USER;

  // Simulate typing indicator
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 3000);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const sendMessage = useCallback(() => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: "me",
      text: inputText,
      type: "text",
      timestamp: new Date(),
      status: "sent",
      replyTo: replyingTo?.id,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText("");
    setReplyingTo(null);

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Simulate delivery
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === newMessage.id ? { ...m, status: "delivered" } : m
        )
      );
    }, 1000);
  }, [inputText, replyingTo]);

  const handleReaction = (emoji: string) => {
    if (!selectedMessage) return;

    setMessages((prev) =>
      prev.map((m) =>
        m.id === selectedMessage.id
          ? {
              ...m,
              reactions: [...(m.reactions || []), { emoji, userId: "me" }],
            }
          : m
      )
    );
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
    const isMe = item.senderId === "me";
    const prevMessage = messages[index - 1];
    const showAvatar =
      !isMe && (!prevMessage || prevMessage.senderId !== item.senderId);

    const replyMessage = item.replyTo
      ? messages.find((m) => m.id === item.replyTo)
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
            {otherUser.isOnline && <View style={styles.onlineIndicator} />}
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{otherUser.displayName}</Text>
            <Text style={styles.headerStatus}>
              {isTyping
                ? "typing..."
                : otherUser.isOnline
                ? "Active now"
                : otherUser.lastSeen}
            </Text>
          </View>
        </Pressable>

        <View style={styles.headerActions}>
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
          isTyping ? <TypingIndicator user={otherUser} /> : null
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
              {replyingTo.senderId === "me"
                ? "yourself"
                : otherUser.displayName}
            </Text>
            <Text style={styles.replyingText} numberOfLines={1}>
              {replyingTo.text || "🎵 Shared a song"}
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
        keyboardVerticalOffset={0}
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
                onChangeText={setInputText}
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
              <Pressable onPress={sendMessage} style={styles.sendButton}>
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
            <Pressable style={styles.quickAction}>
              <Ionicons name="musical-note" size={18} color="#1DB954" />
              <Text style={styles.quickActionText}>Song</Text>
            </Pressable>
            <Pressable style={styles.quickAction}>
              <Ionicons name="list" size={18} color="#1DB954" />
              <Text style={styles.quickActionText}>Playlist</Text>
            </Pressable>
            <Pressable style={styles.quickAction}>
              <Ionicons name="image" size={18} color="#1DB954" />
              <Text style={styles.quickActionText}>Photo</Text>
            </Pressable>
            <Pressable style={styles.quickAction}>
              <Ionicons name="gift" size={18} color="#1DB954" />
              <Text style={styles.quickActionText}>GIF</Text>
            </Pressable>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>

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
