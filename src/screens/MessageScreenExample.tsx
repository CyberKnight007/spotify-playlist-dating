import React, { useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useRealtimeMessaging } from "../hooks/useRealtimeMessaging";
import { usePushNotifications } from "../hooks/usePushNotifications";

/**
 * Example MessageScreen with Real-time Features
 *
 * Features implemented:
 * ✅ Real-time messaging
 * ✅ Typing indicators
 * ✅ Online status
 * ✅ Read receipts
 * ✅ Push notifications
 */

interface MessageScreenProps {
  route: {
    params: {
      matchId: string;
      otherUser: {
        id: string;
        displayName: string;
        avatar: string;
      };
    };
  };
  navigation: any;
}

export default function MessageScreenExample({
  route,
  navigation,
}: MessageScreenProps) {
  const { user } = useAuth();
  const { matchId, otherUser } = route.params;

  // Real-time messaging hook
  const {
    messages,
    isOtherUserTyping,
    isOtherUserOnline,
    sendMessage,
    sendTypingIndicator,
    markAllAsRead,
    loading,
    error,
  } = useRealtimeMessaging({
    matchId,
    userId: user!.$id,
    otherUserId: otherUser.id,
    onNewMessage: (message) => {
      console.log("📩 New message received:", message);
      // Play sound or vibrate
    },
    onTypingChange: (isTyping) => {
      console.log("⌨️ Other user typing:", isTyping);
    },
    onOnlineStatusChange: (isOnline) => {
      console.log("🟢 Online status changed:", isOnline);
    },
  });

  // Push notifications hook
  const { clearMatchNotifications } = usePushNotifications();

  // State
  const [inputText, setInputText] = React.useState("");
  const typingTimeoutRef = React.useRef<any>(null);

  // Clear notifications when entering chat
  useEffect(() => {
    clearMatchNotifications(matchId);
    markAllAsRead();
  }, [matchId]);

  // Handle text input change with typing indicator
  const handleTextChange = (text: string) => {
    setInputText(text);

    // Send typing indicator
    if (text.length > 0) {
      sendTypingIndicator(true);

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingIndicator(false);
      }, 2000);
    } else {
      sendTypingIndicator(false);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (inputText.trim().length === 0) return;

    const messageText = inputText.trim();
    setInputText("");
    sendTypingIndicator(false);

    try {
      await sendMessage(messageText);
      console.log("✅ Message sent");
    } catch (err) {
      console.error("❌ Failed to send message:", err);
      // Show error toast
    }
  };

  // Render message item
  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.senderId === user!.$id;

    return (
      <View
        style={{
          alignSelf: isMe ? "flex-end" : "flex-start",
          backgroundColor: isMe ? "#1DB954" : "#2C2C2E",
          padding: 12,
          borderRadius: 16,
          marginVertical: 4,
          marginHorizontal: 16,
          maxWidth: "75%",
        }}
      >
        <Text style={{ color: "white" }}>{item.text}</Text>

        {/* Message status indicators */}
        {isMe && (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              marginTop: 4,
            }}
          >
            <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>
              {new Date(item.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
            {item.status === "sent" && <Text style={{ marginLeft: 4 }}>✓</Text>}
            {item.status === "delivered" && (
              <Text style={{ marginLeft: 4 }}>✓✓</Text>
            )}
            {item.status === "read" && (
              <Text style={{ marginLeft: 4, color: "#1DB954" }}>✓✓</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  // Render typing indicator
  const renderTypingIndicator = () => {
    if (!isOtherUserTyping) return null;

    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 16,
          backgroundColor: "#1C1C1E",
        }}
      >
        <Text style={{ color: "#8E8E93", marginRight: 8 }}>
          {otherUser.displayName} is typing
        </Text>
        <View style={{ flexDirection: "row" }}>
          <Text style={{ color: "#8E8E93" }}>.</Text>
          <Text style={{ color: "#8E8E93" }}>.</Text>
          <Text style={{ color: "#8E8E93" }}>.</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#000",
        }}
      >
        <ActivityIndicator size="large" color="#1DB954" />
        <Text style={{ color: "white", marginTop: 16 }}>
          Loading messages...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#000",
        }}
      >
        <Text style={{ color: "red", fontSize: 16 }}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {/* Header with online status */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 16,
          backgroundColor: "#1C1C1E",
          borderBottomWidth: 1,
          borderBottomColor: "#2C2C2E",
        }}
      >
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={{ color: "#1DB954", fontSize: 16 }}>← Back</Text>
        </Pressable>

        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={{ color: "white", fontSize: 18, fontWeight: "600" }}>
            {otherUser.displayName}
          </Text>
          <View
            style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: isOtherUserOnline ? "#1DB954" : "#8E8E93",
                marginRight: 6,
              }}
            />
            <Text style={{ color: "#8E8E93", fontSize: 12 }}>
              {isOtherUserOnline ? "Online" : "Offline"}
            </Text>
          </View>
        </View>
      </View>

      {/* Messages list */}
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        inverted={false}
        contentContainerStyle={{ paddingVertical: 16 }}
        ListFooterComponent={renderTypingIndicator}
      />

      {/* Input area */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 16,
          backgroundColor: "#1C1C1E",
          borderTopWidth: 1,
          borderTopColor: "#2C2C2E",
        }}
      >
        <TextInput
          value={inputText}
          onChangeText={handleTextChange}
          placeholder="Type a message..."
          placeholderTextColor="#8E8E93"
          style={{
            flex: 1,
            backgroundColor: "#2C2C2E",
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 10,
            color: "white",
            marginRight: 12,
          }}
          multiline
          maxLength={500}
        />

        <Pressable
          onPress={handleSendMessage}
          disabled={inputText.trim().length === 0}
          style={{
            backgroundColor:
              inputText.trim().length > 0 ? "#1DB954" : "#2C2C2E",
            borderRadius: 20,
            width: 40,
            height: 40,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 20 }}>➤</Text>
        </Pressable>
      </View>
    </View>
  );
}
