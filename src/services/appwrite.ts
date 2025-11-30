import {
  Client,
  Account,
  Databases,
  Storage,
  ID,
  Query,
} from "react-native-appwrite";
import {
  APPWRITE_CONFIG,
  COLLECTIONS as COLLECTION_IDS,
} from "../config/apiKeys";

// Initialize Appwrite Client
const client = new Client();

client
  .setEndpoint(APPWRITE_CONFIG.endpoint)
  .setProject(APPWRITE_CONFIG.projectId);

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
};

export { client, account, databases, storage, ID, Query };
