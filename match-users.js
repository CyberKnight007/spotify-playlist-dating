const { Client, Databases, ID, Query } = require("node-appwrite");

const ENDPOINT = "https://sgp.cloud.appwrite.io/v1";
const PROJECT_ID = "692c0bae0033b9e34774";
const DATABASE_ID = "6933e7230002691f918d";
const COLLECTIONS = {
  MATCHES: "matches",
  MESSAGES: "messages",
};

// Get args
const API_KEY = process.env.APPWRITE_API_KEY || process.argv[2];
const USER_1_ID = process.argv[3];
const USER_2_ID = process.argv[4];

if (!API_KEY || !USER_1_ID || !USER_2_ID) {
  console.error("\n❌ Error: Missing arguments.");
  console.error("Usage: node match-users.js <API_KEY> <USER_1_ID> <USER_2_ID>");
  console.error("Example: node match-users.js eyJ... 693696... 6933fc...");
  process.exit(1);
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);

async function matchUsers() {
  try {
    console.log(
      `\n🤝 Attempting to match:\n   User 1: ${USER_1_ID}\n   User 2: ${USER_2_ID}`
    );

    // Check for existing match
    const existingMatches = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.MATCHES,
      [
        Query.equal("user1Id", [USER_1_ID, USER_2_ID]),
        Query.equal("user2Id", [USER_1_ID, USER_2_ID]),
      ]
    );

    const alreadyMatched = existingMatches.documents.some(
      (m) =>
        (m.user1Id === USER_1_ID && m.user2Id === USER_2_ID) ||
        (m.user1Id === USER_2_ID && m.user2Id === USER_1_ID)
    );

    if (alreadyMatched) {
      console.log("⚠️  Match already exists between these users!");
      return;
    }

    // Create Match
    const matchId = ID.unique();
    const now = new Date().toISOString();

    await databases.createDocument(DATABASE_ID, COLLECTIONS.MATCHES, matchId, {
      user1Id: USER_1_ID,
      user2Id: USER_2_ID,
      compatibilityScore: 95,
      sharedGenres: ["pop", "rock", "indie"],
      sharedArtists: [],
      createdAt: now,
      lastMessageAt: now,
    });

    console.log(`✅ Match created! ID: ${matchId}`);

    // Send welcome message
    await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.MESSAGES,
      ID.unique(),
      {
        matchId: matchId,
        senderId: USER_1_ID,
        receiverId: USER_2_ID,
        content: "Hey! We matched manually! 👋",
        type: "text",
        status: "unread",
        createdAt: now,
      }
    );

    console.log("✅ Initial message sent.");
    console.log("🎉 Done! Refresh your app to see the match.");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

matchUsers();
