import { Client, Databases } from 'node-appwrite';

/**
 * Message Delivery Status Function
 * Triggers: databases.*.collections.messages.documents.*.create
 * Automatically updates message status to "delivered" when created
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
    const messageId = eventData.$id;

    if (!messageId) {
      throw new Error('Message ID not found in event data');
    }

    log(`Processing message: ${messageId}`);

    // Wait a brief moment to ensure message is fully created
    await new Promise(resolve => setTimeout(resolve, 100));

    // Update message status to delivered
    await databases.updateDocument(
      DATABASE_ID,
      'messages',
      messageId,
      {
        status: 'delivered',
        deliveredAt: new Date().toISOString(),
      }
    );

    log(`Message marked as delivered: ${messageId}`);

    return res.json({
      success: true,
      messageId: messageId,
      status: 'delivered',
    });

  } catch (err) {
    error('Error updating message delivery status: ' + err.message);
    return res.json({
      success: false,
      error: err.message,
    }, 500);
  }
};
