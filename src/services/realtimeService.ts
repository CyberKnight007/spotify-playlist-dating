import {
  client,
  databases,
  DATABASE_ID,
  COLLECTIONS,
  ID,
  Query,
} from "./appwrite";
import { RealtimeResponseEvent } from "react-native-appwrite";

export interface TypingIndicator {
  userId: string;
  matchId: string;
  isTyping: boolean;
  timestamp: string;
}

export interface OnlineStatus {
  userId: string;
  isOnline: boolean;
  lastSeen: string;
}

export interface ReadReceipt {
  messageId: string;
  userId: string;
  readAt: string;
}

type MessageCallback = (message: any) => void;
type TypingCallback = (data: TypingIndicator) => void;
type OnlineStatusCallback = (data: OnlineStatus) => void;
type ReadReceiptCallback = (data: ReadReceipt) => void;

class RealtimeService {
  private subscriptions: Map<string, () => void> = new Map();
  private typingTimeouts: Map<string, any> = new Map();

  /**
   * Subscribe to real-time messages for a specific match
   */
  subscribeToMessages(matchId: string, callback: MessageCallback): () => void {
    const channelId = `messages-${matchId}`;

    // Subscribe to the messages collection filtered by matchId
    const unsubscribe = client.subscribe(
      [
        `databases.${DATABASE_ID}.collections.${COLLECTIONS.MESSAGES}.documents`,
      ],
      (response: RealtimeResponseEvent<any>) => {
        // Filter for messages in this match
        if (response.payload.matchId === matchId) {
          const message = {
            id: response.payload.$id,
            matchId: response.payload.matchId,
            senderId: response.payload.senderId,
            receiverId: response.payload.receiverId,
            content: response.payload.content,
            type: response.payload.type,
            createdAt: response.payload.createdAt,
            read: response.payload.read,
            status: response.payload.status,
            replyToId: response.payload.replyToId,
            songData: response.payload.songData
              ? JSON.parse(response.payload.songData)
              : undefined,
            imageUrl: response.payload.imageUrl,
            playlistData: response.payload.playlistData
              ? JSON.parse(response.payload.playlistData)
              : undefined,
          };

          // Handle different event types
          if (
            response.events.includes(
              `databases.${DATABASE_ID}.collections.${COLLECTIONS.MESSAGES}.documents.*.create`
            )
          ) {
            callback({ type: "create", message });
          } else if (
            response.events.includes(
              `databases.${DATABASE_ID}.collections.${COLLECTIONS.MESSAGES}.documents.*.update`
            )
          ) {
            callback({ type: "update", message });
          } else if (
            response.events.includes(
              `databases.${DATABASE_ID}.collections.${COLLECTIONS.MESSAGES}.documents.*.delete`
            )
          ) {
            callback({ type: "delete", message });
          }
        }
      }
    );

    this.subscriptions.set(channelId, unsubscribe);

    return () => {
      unsubscribe();
      this.subscriptions.delete(channelId);
    };
  }

  /**
   * Subscribe to typing indicators for a match
   */
  subscribeToTyping(matchId: string, callback: TypingCallback): () => void {
    const channelId = `typing-${matchId}`;

    // Subscribe to a custom typing collection (needs to be created in Appwrite)
    const unsubscribe = client.subscribe(
      [`databases.${DATABASE_ID}.collections.typing.documents`],
      (response: RealtimeResponseEvent<any>) => {
        if (response.payload.matchId === matchId) {
          callback({
            userId: response.payload.userId,
            matchId: response.payload.matchId,
            isTyping: response.payload.isTyping,
            timestamp: response.payload.timestamp,
          });
        }
      }
    );

    this.subscriptions.set(channelId, unsubscribe);

    return () => {
      unsubscribe();
      this.subscriptions.delete(channelId);
    };
  }

  /**
   * Subscribe to online status updates
   */
  subscribeToOnlineStatus(
    userId: string,
    callback: OnlineStatusCallback
  ): () => void {
    const channelId = `online-${userId}`;

    // Subscribe to user document updates for online status
    const unsubscribe = client.subscribe(
      [
        `databases.${DATABASE_ID}.collections.${COLLECTIONS.USERS}.documents.${userId}`,
      ],
      (response: RealtimeResponseEvent<any>) => {
        callback({
          userId: response.payload.$id,
          isOnline: response.payload.isOnline || false,
          lastSeen: response.payload.lastSeen || new Date().toISOString(),
        });
      }
    );

    this.subscriptions.set(channelId, unsubscribe);

    return () => {
      unsubscribe();
      this.subscriptions.delete(channelId);
    };
  }

  /**
   * Send typing indicator
   */
  async sendTypingIndicator(
    userId: string,
    matchId: string,
    isTyping: boolean
  ): Promise<void> {
    try {
      const key = `${userId}-${matchId}`;

      // Clear existing timeout
      if (this.typingTimeouts.has(key)) {
        clearTimeout(this.typingTimeouts.get(key)!);
      }

      // Update user's typing status in their user document
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.USERS, userId, {
        isTyping: isTyping,
        lastTyping: new Date().toISOString(),
      });

      // Auto-clear typing indicator after 3 seconds
      if (isTyping) {
        const timeout = setTimeout(() => {
          this.sendTypingIndicator(userId, matchId, false);
        }, 3000);
        this.typingTimeouts.set(key, timeout);
      }
    } catch (error) {
      console.error("Error sending typing indicator:", error);
    }
  }

  private lastOnlineUpdate: number = 0;

  /**
   * Update online status
   */
  async updateOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    const now = Date.now();
    // Rate limit updates to once every 5 seconds, unless going offline (immediate)
    if (isOnline && now - this.lastOnlineUpdate < 5000) {
      return;
    }

    try {
      this.lastOnlineUpdate = now;
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.USERS, userId, {
        isOnline,
        lastSeen: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error updating online status:", error);
    }
  }

  /**
   * Mark message as delivered (when received)
   */
  async markAsDelivered(messageId: string): Promise<void> {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.MESSAGES,
        messageId,
        {
          status: "delivered",
          deliveredAt: new Date().toISOString(),
        }
      );
    } catch (error) {
      console.error("Error marking message as delivered:", error);
    }
  }

  /**
   * Mark message as read (with read receipt)
   */
  async markAsRead(messageId: string, userId: string): Promise<void> {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.MESSAGES,
        messageId,
        {
          status: "read",
          readAt: new Date().toISOString(),
          readBy: userId,
        }
      );
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  }

  /**
   * Mark all messages in a conversation as read
   */
  async markAllAsRead(matchId: string, userId: string): Promise<void> {
    try {
      // Get all unread messages for this user in this match
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.MESSAGES,
        [
          Query.equal("matchId", matchId),
          Query.equal("receiverId", userId),
          Query.notEqual("status", "read"),
        ]
      );

      // Update all messages
      await Promise.all(
        response.documents.map((doc) =>
          databases.updateDocument(DATABASE_ID, COLLECTIONS.MESSAGES, doc.$id, {
            status: "read",
            readAt: new Date().toISOString(),
            readBy: userId,
          })
        )
      );
    } catch (error) {
      console.error("Error marking all messages as read:", error);
    }
  }

  /**
   * Subscribe to read receipts for messages
   */
  subscribeToReadReceipts(
    messageIds: string[],
    callback: ReadReceiptCallback
  ): () => void {
    const channelId = `receipts-${messageIds.join("-")}`;

    const unsubscribe = client.subscribe(
      [
        `databases.${DATABASE_ID}.collections.${COLLECTIONS.MESSAGES}.documents`,
      ],
      (response: RealtimeResponseEvent<any>) => {
        // Check if this is one of our messages and status changed to read
        if (
          messageIds.includes(response.payload.$id) &&
          response.payload.status === "read"
        ) {
          callback({
            messageId: response.payload.$id,
            userId: response.payload.readBy,
            readAt: response.payload.readAt,
          });
        }
      }
    );

    this.subscriptions.set(channelId, unsubscribe);

    return () => {
      unsubscribe();
      this.subscriptions.delete(channelId);
    };
  }

  /**
   * Unsubscribe from all active subscriptions
   */
  unsubscribeAll(): void {
    this.subscriptions.forEach((unsubscribe) => unsubscribe());
    this.subscriptions.clear();

    // Clear all typing timeouts
    this.typingTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.typingTimeouts.clear();
  }

  /**
   * Get typing status for a specific match
   */
  async getTypingStatus(matchId: string, userId: string): Promise<boolean> {
    try {
      const response = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.USERS,
        userId
      );

      // Since we removed typingInMatch from schema, we can only check isTyping
      // This is a limitation - we won't know WHICH match they are typing in
      // But it prevents the app from crashing
      return response.isTyping === true;
    } catch (error) {
      console.error("Error getting typing status:", error);
      return false;
    }
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();
