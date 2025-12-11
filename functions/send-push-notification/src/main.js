import { Client, Databases } from 'node-appwrite';

/**
 * Send Push Notification Function
 * Triggers: databases.*.collections.messages.documents.*.create (new message)
 * Sends push notifications for messages, matches, and likes
 */
export default async ({ req, res, log, error }) => {
  try {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1')
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(req.headers['x-appwrite-key'] ?? '');

    const databases = new Databases(client);
    const DATABASE_ID = process.env.DATABASE_ID || '6933e7230002691f918d';

    // Parse event data
    const eventData = JSON.parse(req.body || '{}');

    log('Event received: ' + JSON.stringify(eventData));

    // Determine notification type
    let notificationType = eventData.type || 'message';
    let recipientId, senderId, message, matchId;

    // Handle message notification
    if (eventData.$collectionId === 'messages' || notificationType === 'message') {
      recipientId = eventData.receiverId || eventData.userId;
      senderId = eventData.senderId;
      message = eventData.content || eventData.text || eventData.message || 'New message';
      matchId = eventData.matchId;

      // Fetch sender's profile
      const sender = await databases.getDocument(
        DATABASE_ID,
        'users',
        senderId
      );

      // Fetch recipient's push token
      const recipient = await databases.getDocument(
        DATABASE_ID,
        'users',
        recipientId
      );

      if (!recipient.pushToken || !recipient.pushEnabled) {
        log('Recipient does not have push notifications enabled');
        return res.json({ success: false, message: 'Push not enabled' });
      }

      // Send Expo push notification
      const pushMessage = {
        to: recipient.pushToken,
        sound: 'default',
        title: `💬 ${sender.displayName || 'Someone'}`,
        body: message.substring(0, 100),
        data: {
          type: 'message',
          matchId: matchId,
          senderId: senderId,
          senderName: sender.displayName,
        },
        badge: (recipient.unreadCount || 0) + 1,
        channelId: 'messages',
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify(pushMessage),
      });

      const result = await response.json();
      log('Push notification sent: ' + JSON.stringify(result));

      // Update unread count
      await databases.updateDocument(
        DATABASE_ID,
        'users',
        recipientId,
        {
          unreadCount: (recipient.unreadCount || 0) + 1,
        }
      );

      return res.json({
        success: true,
        pushResult: result,
      });
    }

    return res.json({ success: false, message: 'Unknown notification type' });

  } catch (err) {
    error('Error sending push notification: ' + err.message);
    return res.json({
      success: false,
      error: err.message,
    }, 500);
  }
};
