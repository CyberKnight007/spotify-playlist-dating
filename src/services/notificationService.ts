import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { databases, DATABASE_ID, COLLECTIONS } from "./appwrite";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface PushNotificationData extends Record<string, unknown> {
  type: "match" | "message" | "like" | "super_like";
  matchId?: string;
  senderId?: string;
  senderName?: string;
  message?: string;
}

class NotificationService {
  private expoPushToken: string | null = null;

  /**
   * Initialize push notifications and get permission
   */
  async initialize(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log("Push notifications only work on physical devices");
      return null;
    }

    try {
      // Check existing permissions
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permission if not granted
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Permission not granted for push notifications");
        return null;
      }

      // Get Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync();
      this.expoPushToken = tokenData.data;

      // Configure Android channel
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });

        await Notifications.setNotificationChannelAsync("messages", {
          name: "Messages",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          sound: "default",
        });

        await Notifications.setNotificationChannelAsync("matches", {
          name: "New Matches",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 500, 250, 500],
          sound: "default",
        });
      }

      console.log("✅ Push notification initialized:", this.expoPushToken);
      return this.expoPushToken;
    } catch (error) {
      console.error("Error initializing push notifications:", error);
      return null;
    }
  }

  /**
   * Save push token to user's profile
   */
  async savePushToken(userId: string): Promise<void> {
    if (!this.expoPushToken) {
      await this.initialize();
    }

    if (!this.expoPushToken) {
      console.log("No push token available");
      return;
    }

    try {
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.USERS, userId, {
        pushToken: this.expoPushToken,
        pushEnabled: true,
      });
      console.log("✅ Push token saved to user profile");
    } catch (error) {
      console.error("Error saving push token:", error);
    }
  }

  /**
   * Remove push token from user's profile (on logout)
   */
  async removePushToken(userId: string): Promise<void> {
    try {
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.USERS, userId, {
        pushToken: null,
        pushEnabled: false,
      });
      this.expoPushToken = null;
      console.log("✅ Push token removed from user profile");
    } catch (error) {
      console.error("Error removing push token:", error);
    }
  }

  /**
   * Schedule a local notification
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: PushNotificationData
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error("Error scheduling local notification:", error);
    }
  }

  /**
   * Show notification for new message
   */
  async notifyNewMessage(
    senderName: string,
    message: string,
    matchId: string,
    senderId: string
  ): Promise<void> {
    await this.scheduleLocalNotification(`💬 ${senderName}`, message, {
      type: "message",
      matchId,
      senderId,
      senderName,
      message,
    });
  }

  /**
   * Show notification for new match
   */
  async notifyNewMatch(matchName: string, matchId: string): Promise<void> {
    await this.scheduleLocalNotification(
      "🎉 It's a Match!",
      `You matched with ${matchName}`,
      {
        type: "match",
        matchId,
        senderName: matchName,
      }
    );
  }

  /**
   * Show notification for new like
   */
  async notifyNewLike(likerName: string): Promise<void> {
    await this.scheduleLocalNotification(
      "❤️ Someone likes you!",
      `${likerName} liked your profile`,
      {
        type: "like",
        senderName: likerName,
      }
    );
  }

  /**
   * Show notification for super like
   */
  async notifyNewSuperLike(likerName: string): Promise<void> {
    await this.scheduleLocalNotification(
      "⭐ Super Like!",
      `${likerName} super liked you!`,
      {
        type: "super_like",
        senderName: likerName,
      }
    );
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    await Notifications.dismissAllNotificationsAsync();
  }

  /**
   * Clear notifications for a specific match
   */
  async clearMatchNotifications(matchId: string): Promise<void> {
    const notifications = await Notifications.getPresentedNotificationsAsync();
    for (const notification of notifications) {
      if (notification.request.content.data?.matchId === matchId) {
        await Notifications.dismissNotificationAsync(
          notification.request.identifier
        );
      }
    }
  }

  /**
   * Set up notification response listener
   */
  setupNotificationListener(
    handler: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(handler);
  }

  /**
   * Set up notification tap response listener
   */
  setupNotificationResponseListener(
    handler: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(handler);
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Get current push token
   */
  getPushToken(): string | null {
    return this.expoPushToken;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
