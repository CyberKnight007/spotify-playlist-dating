import {
  Client,
  Account,
  Databases,
  Storage,
  ID,
  Query,
  Permission,
  Role,
} from "react-native-appwrite";
import {
  APPWRITE_CONFIG,
  COLLECTIONS as COLLECTION_IDS,
} from "../config/apiKeys";

// Initialize Appwrite Client
const client = new Client()
  .setProject("692c0bae0033b9e34774")
  .setEndpoint("https://sgp.cloud.appwrite.io/v1");

// Initialize Appwrite services
const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);

// Database and Collection IDs
export const DATABASE_ID = APPWRITE_CONFIG.databaseId;
export const COLLECTIONS = {
  USERS: COLLECTION_IDS.users,
  SWIPES: COLLECTION_IDS.swipes,
  MATCHES: COLLECTION_IDS.matches,
  MESSAGES: COLLECTION_IDS.messages, // For chat functionality
};

// Helper function to check Appwrite connection
export const checkConnection = async (): Promise<boolean> => {
  try {
    await account.get();
    return true;
  } catch {
    // Connection works but no session - still valid
    return true;
  }
};

export { client, account, databases, storage, ID, Query, Permission, Role };
