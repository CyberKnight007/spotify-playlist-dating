import { databases, DATABASE_ID, COLLECTIONS, ID, Query } from "./appwrite";

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: "text" | "image" | "song" | "voice" | "emoji" | "playlist";
  createdAt: string;
  read: boolean;
  status?: "sent" | "delivered" | "read";
  replyToId?: string;
  songData?: any;
  imageUrl?: string;
  playlistData?: any;
  reactions?: { emoji: string; userId: string }[];
}

export interface MessageInput {
  matchId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: "text" | "image" | "song" | "voice" | "emoji" | "playlist";
  replyToId?: string;
  songData?: any;
  imageUrl?: string;
  playlistData?: any;
}

export const messageService = {
  // Send a new message
  async sendMessage(input: MessageInput): Promise<Message> {
    console.log(
      "messageService.sendMessage called with:",
      JSON.stringify(input, null, 2)
    );

    if (input.content === undefined || input.content === null) {
      console.error("CRITICAL ERROR: Content is missing in sendMessage input!");
      throw new Error("Message content is required");
    }

    try {
      const messageId = ID.unique();
      const message = {
        matchId: input.matchId,
        senderId: input.senderId,
        receiverId: input.receiverId,
        content: input.content,
        type: input.type,
        createdAt: new Date().toISOString(),
        read: false,
        replyToId: input.replyToId,
        songData: input.songData
          ? JSON.stringify({
              id: input.songData.id,
              name: input.songData.name,
              artist: input.songData.artists?.[0]?.name || "Unknown Artist",
              albumArt: input.songData.album?.images?.[0]?.url,
              previewUrl: input.songData.preview_url,
              uri: input.songData.uri,
            })
          : null,
        playlistData: input.playlistData
          ? JSON.stringify({
              id: input.playlistData.id,
              name: input.playlistData.name,
              coverUrl: input.playlistData.images?.[0]?.url,
              songCount: input.playlistData.tracks?.total,
              uri: input.playlistData.uri,
            })
          : null,
        imageUrl: input.imageUrl,
      };

      console.log(
        "Creating Appwrite document with payload:",
        JSON.stringify(message, null, 2)
      );

      // Remove null values to avoid "Cannot convert null value to object" error
      const payload = Object.fromEntries(
        Object.entries(message).filter(([_, v]) => v != null)
      );

      const doc = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.MESSAGES,
        messageId,
        payload
      );

      return {
        ...message,
        id: doc.$id,
        songData: input.songData,
        playlistData: input.playlistData,
      } as Message;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  },

  // Get messages for a match/conversation
  async getMessages(matchId: string, limit: number = 50): Promise<Message[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.MESSAGES,
        [
          Query.equal("matchId", matchId),
          Query.orderDesc("createdAt"),
          Query.limit(limit),
        ]
      );

      return response.documents.map((doc: any) => ({
        id: doc.$id,
        matchId: doc.matchId,
        senderId: doc.senderId,
        receiverId: doc.receiverId,
        content: doc.content,
        type: doc.type,
        createdAt: doc.createdAt,
        read: doc.read,
        replyToId: doc.replyToId,
        songData: doc.songData ? JSON.parse(doc.songData) : undefined,
        imageUrl: doc.imageUrl,
        playlistData: doc.playlistData
          ? JSON.parse(doc.playlistData)
          : undefined,
      })) as Message[];
    } catch (error) {
      console.error("Error getting messages:", error);
      return [];
    }
  },

  // Mark messages as read
  async markAsRead(messageIds: string[]): Promise<void> {
    try {
      await Promise.all(
        messageIds.map((id) =>
          databases.updateDocument(DATABASE_ID, COLLECTIONS.MESSAGES, id, {
            read: true,
          })
        )
      );
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  },

  // Update message status
  async updateMessageStatus(
    messageId: string,
    status: "sent" | "delivered" | "read"
  ): Promise<void> {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.MESSAGES,
        messageId,
        { status }
      );
    } catch (error) {
      console.error("Error updating message status:", error);
    }
  },

  // Delete a message
  async deleteMessage(messageId: string): Promise<void> {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.MESSAGES,
        messageId
      );
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  },

  // Get unread message count for a user
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.MESSAGES,
        [Query.equal("receiverId", userId), Query.equal("status", "sent")]
      );
      return response.total;
    } catch (error) {
      console.error("Error getting unread count:", error);
      return 0;
    }
  },
};
