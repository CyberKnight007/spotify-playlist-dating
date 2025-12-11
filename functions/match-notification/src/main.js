import { Client, Databases } from 'node-appwrite';

/**
 * Match Notification Function
 * Triggers: databases.*.collections.matches.documents.*.create
 * Sends push notifications to both users when they match
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
    
    const matchId = eventData.$id;
    const user1Id = eventData.user1Id;
    const user2Id = eventData.user2Id;
    const compatibilityScore = eventData.compatibilityScore || 0;

    if (!matchId || !user1Id || !user2Id) {
      throw new Error('Invalid match data');
    }

    log(`Processing match: ${matchId} between ${user1Id} and ${user2Id}`);

    // Fetch both user profiles
    const [user1, user2] = await Promise.all([
      databases.getDocument(DATABASE_ID, 'users', user1Id),
      databases.getDocument(DATABASE_ID, 'users', user2Id),
    ]);

    const notifications = [];

    // Send notification to user1
    if (user1.pushToken && user1.pushEnabled) {
      const notification1 = fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: user1.pushToken,
          sound: 'default',
          title: '🎉 It\'s a Match!',
          body: `You and ${user2.displayName || 'someone'} have ${compatibilityScore}% compatibility!`,
          data: {
            type: 'match',
            matchId: matchId,
            userId: user2Id,
            userName: user2.displayName,
            compatibility: compatibilityScore,
          },
          badge: (user1.matchCount || 0) + 1,
          channelId: 'matches',
          priority: 'high',
        }),
      });
      notifications.push(notification1);
    }

    // Send notification to user2
    if (user2.pushToken && user2.pushEnabled) {
      const notification2 = fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: user2.pushToken,
          sound: 'default',
          title: '🎉 It\'s a Match!',
          body: `You and ${user1.displayName || 'someone'} have ${compatibilityScore}% compatibility!`,
          data: {
            type: 'match',
            matchId: matchId,
            userId: user1Id,
            userName: user1.displayName,
            compatibility: compatibilityScore,
          },
          badge: (user2.matchCount || 0) + 1,
          channelId: 'matches',
          priority: 'high',
        }),
      });
      notifications.push(notification2);
    }

    // Wait for all notifications to be sent
    await Promise.all(notifications);
    log(`Notifications sent: ${notifications.length}`);

    // Update match count for both users
    await Promise.all([
      databases.updateDocument(DATABASE_ID, 'users', user1Id, {
        matchCount: (user1.matchCount || 0) + 1,
      }),
      databases.updateDocument(DATABASE_ID, 'users', user2Id, {
        matchCount: (user2.matchCount || 0) + 1,
      }),
    ]);

    return res.json({
      success: true,
      matchId: matchId,
      notificationsSent: notifications.length,
    });

  } catch (err) {
    error('Error sending match notifications: ' + err.message);
    return res.json({
      success: false,
      error: err.message,
    }, 500);
  }
};
