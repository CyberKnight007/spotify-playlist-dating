import { useState, useEffect, useCallback, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { realtimeService } from "../services/realtimeService";
import { messageService, Message } from "../services/messageService";

export interface UseRealtimeMessagingOptions {
  matchId: string;
  userId: string;
  otherUserId: string;
  onNewMessage?: (message: Message) => void;
  onMessageUpdate?: (message: Message) => void;
  onTypingChange?: (isTyping: boolean) => void;
  onOnlineStatusChange?: (isOnline: boolean) => void;
}

export interface UseRealtimeMessagingReturn {
  messages: Message[];
  isOtherUserTyping: boolean;
  isOtherUserOnline: boolean;
  sendMessage: (
    text: string,
    type?: Message["type"],
    options?: {
      songData?: any;
      playlistData?: any;
      imageUrl?: string;
      replyToId?: string;
    }
  ) => Promise<void>;
  sendTypingIndicator: (isTyping: boolean) => void;
  markAsRead: (messageId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook for real-time messaging with typing indicators and online status
 */
export function useRealtimeMessaging(
  options: UseRealtimeMessagingOptions
): UseRealtimeMessagingReturn {
  const {
    matchId,
    userId,
    otherUserId,
    onNewMessage,
    onMessageUpdate,
    onTypingChange,
    onOnlineStatusChange,
  } = options;

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);

  const appState = useRef(AppState.currentState);
  const unsubscribeFunctions = useRef<Array<() => void>>([]);

  // Refs for callbacks to avoid dependency cycles
  const onNewMessageRef = useRef(onNewMessage);
  const onMessageUpdateRef = useRef(onMessageUpdate);
  const onTypingChangeRef = useRef(onTypingChange);
  const onOnlineStatusChangeRef = useRef(onOnlineStatusChange);

  // Update refs when props change
  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
    onMessageUpdateRef.current = onMessageUpdate;
    onTypingChangeRef.current = onTypingChange;
    onOnlineStatusChangeRef.current = onOnlineStatusChange;
  }, [onNewMessage, onMessageUpdate, onTypingChange, onOnlineStatusChange]);

  /**
   * Load initial messages
   */
  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      const loadedMessages = await messageService.getMessages(matchId);
      setMessages(loadedMessages.reverse()); // Reverse to show oldest first
      setError(null);
    } catch (err) {
      console.error("Error loading messages:", err);
      setError("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  /**
   * Send a message
   */
  const sendMessage = useCallback(
    async (
      text: string,
      type: Message["type"] = "text",
      options?: {
        songData?: any;
        playlistData?: any;
        imageUrl?: string;
        replyToId?: string;
      }
    ) => {
      if (!text.trim() && type === "text") return;

      try {
        const newMessage = await messageService.sendMessage({
          matchId,
          senderId: userId,
          receiverId: otherUserId,
          content: text.trim(),
          type,
          ...options,
        });

        // Message will be added via realtime subscription
        // But we can optimistically add it
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });

        // Stop typing indicator
        await realtimeService.sendTypingIndicator(userId, matchId, false);
      } catch (err) {
        console.error("Error sending message:", err);
        setError("Failed to send message");
      }
    },
    [matchId, userId, otherUserId]
  );

  /**
   * Send typing indicator
   */
  const sendTypingIndicator = useCallback(
    (isTyping: boolean) => {
      realtimeService.sendTypingIndicator(userId, matchId, isTyping);
    },
    [userId, matchId]
  );

  /**
   * Mark a message as read
   */
  const markAsRead = useCallback(
    async (messageId: string) => {
      try {
        await realtimeService.markAsRead(messageId, userId);
      } catch (err) {
        console.error("Error marking message as read:", err);
      }
    },
    [userId]
  );

  /**
   * Mark all messages as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      await realtimeService.markAllAsRead(matchId, userId);
    } catch (err) {
      console.error("Error marking all messages as read:", err);
    }
  }, [matchId, userId]);

  /**
   * Setup real-time subscriptions
   */
  useEffect(() => {
    if (!matchId || !userId || !otherUserId) return;

    // Load initial messages
    loadMessages();

    // Subscribe to new messages
    const unsubscribeMessages = realtimeService.subscribeToMessages(
      matchId,
      (event) => {
        if (event.type === "create") {
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === event.message.id)) {
              return prev;
            }
            return [...prev, event.message];
          });

          // Mark as delivered if we're the receiver
          if (event.message.receiverId === userId) {
            realtimeService.markAsDelivered(event.message.id);
            onNewMessageRef.current?.(event.message);
          }
        } else if (event.type === "update") {
          setMessages((prev) =>
            prev.map((m) => (m.id === event.message.id ? event.message : m))
          );
          onMessageUpdateRef.current?.(event.message);
        } else if (event.type === "delete") {
          setMessages((prev) => prev.filter((m) => m.id !== event.message.id));
        }
      }
    );
    unsubscribeFunctions.current.push(unsubscribeMessages);

    // Subscribe to other user's online status
    const unsubscribeOnlineStatus = realtimeService.subscribeToOnlineStatus(
      otherUserId,
      (status) => {
        setIsOtherUserOnline(status.isOnline);
        onOnlineStatusChangeRef.current?.(status.isOnline);
      }
    );
    unsubscribeFunctions.current.push(unsubscribeOnlineStatus);

    // Subscribe to typing indicators (check other user's typing status in their profile)
    const unsubscribeTyping = realtimeService.subscribeToOnlineStatus(
      otherUserId,
      async (status) => {
        // Check if they're typing in this match
        const isTyping = await realtimeService.getTypingStatus(
          matchId,
          otherUserId
        );
        setIsOtherUserTyping(isTyping);
        onTypingChangeRef.current?.(isTyping);
      }
    );
    unsubscribeFunctions.current.push(unsubscribeTyping);

    // Update our online status
    realtimeService.updateOnlineStatus(userId, true);

    // Cleanup function
    return () => {
      unsubscribeFunctions.current.forEach((unsub) => unsub());
      unsubscribeFunctions.current = [];
      realtimeService.updateOnlineStatus(userId, false);
    };
  }, [matchId, userId, otherUserId, loadMessages]);

  /**
   * Handle app state changes (background/foreground)
   */
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          // App came to foreground
          realtimeService.updateOnlineStatus(userId, true);
          loadMessages(); // Refresh messages
        } else if (nextAppState.match(/inactive|background/)) {
          // App went to background
          realtimeService.updateOnlineStatus(userId, false);
        }

        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [userId, loadMessages]);

  /**
   * Mark messages as read when they appear on screen
   */
  useEffect(() => {
    if (messages.length > 0) {
      // Mark all unread messages from other user as read
      const unreadMessages = messages.filter(
        (m) => m.senderId === otherUserId && !m.read
      );

      unreadMessages.forEach((m) => {
        markAsRead(m.id);
      });
    }
  }, [messages, otherUserId, markAsRead]);

  return {
    messages,
    isOtherUserTyping,
    isOtherUserOnline,
    sendMessage,
    sendTypingIndicator,
    markAsRead,
    markAllAsRead,
    loading,
    error,
  };
}
