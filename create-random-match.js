const { Client, Databases, ID, Query } = require("node-appwrite");

// Configuration
const ENDPOINT = "https://sgp.cloud.appwrite.io/v1";
const PROJECT_ID = "692c0bae0033b9e34774";
const DATABASE_ID = "6933e7230002691f918d";
const COLLECTIONS = {
  USERS: "users",
  MATCHES: "matches",
  MESSAGES: "messages",
};

// Get API Key and optional User ID from arguments
const API_KEY = process.env.APPWRITE_API_KEY || process.argv[2];
const TARGET_USER_ID = process.argv[3];

if (!API_KEY) {
  console.error("❌ Error: Please provide your Appwrite API Key.");
  console.error(
    "Usage: node create-random-match.js <YOUR_API_KEY> [YOUR_USER_ID]"
  );
  process.exit(1);
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);

async function createRandomMatch() {
  try {
    console.log("🔍 Fetching users...");
    // Fetch users from the database collection
    const usersList = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.USERS,
      [Query.limit(100)]
    );

    const users = usersList.documents;

    if (users.length < 2) {
      console.error("❌ Not enough users to create a match. Need at least 2.");
      return;
    }

    console.log(`✅ Found ${users.length} users.`);

    let user1, user2;

    if (TARGET_USER_ID) {
      // Find the target user
      user1 = users.find((u) => u.$id === TARGET_USER_ID);
      if (!user1) {
        console.error(
          `❌ User with ID ${TARGET_USER_ID} not found in the first 100 users.`
        );
        return;
      }

      // Pick a random user2 that is not user1
      const otherUsers = users.filter((u) => u.$id !== TARGET_USER_ID);
      if (otherUsers.length === 0) {
        console.error("❌ No other users found to match with.");
        return;
      }
      user2 = otherUsers[Math.floor(Math.random() * otherUsers.length)];
    } else {
      // Pick two random distinct users
      const user1Index = Math.floor(Math.random() * users.length);
      let user2Index = Math.floor(Math.random() * users.length);
      while (user2Index === user1Index) {
        user2Index = Math.floor(Math.random() * users.length);
      }
      user1 = users[user1Index];
      user2 = users[user2Index];
    }

    console.log(
      `🤝 Matching: ${user1.displayName} (${user1.$id}) <-> ${user2.displayName} (${user2.$id})`
    );

    // Check if match already exists
    const existingMatches = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.MATCHES,
      [
        Query.equal("user1Id", [user1.$id, user2.$id]),
        Query.equal("user2Id", [user1.$id, user2.$id]),
      ]
    );

    // Filter for exact pair match
    const alreadyMatched = existingMatches.documents.some(
      (m) =>
        (m.user1Id === user1.$id && m.user2Id === user2.$id) ||
        (m.user1Id === user2.$id && m.user2Id === user1.$id)
    );

    if (alreadyMatched) {
      console.log("⚠️ These users are already matched. Skipping creation.");
      // We can still send a message if we want, but let's just return for now or try again
      return;
    }

    // Create Match
    const matchId = ID.unique();
    const now = new Date().toISOString();
    const compatibilityScore = Math.floor(Math.random() * 40) + 60; // 60-100

    await databases.createDocument(DATABASE_ID, COLLECTIONS.MATCHES, matchId, {
      user1Id: user1.$id,
      user2Id: user2.$id,
      compatibilityScore: compatibilityScore,
      sharedGenres: ["pop", "rock"], // Placeholder
      sharedArtists: [],
      createdAt: now,
      lastMessageAt: now,
    });

    console.log(
      `✅ Match created! ID: ${matchId} (Score: ${compatibilityScore}%)`
    );

    // Send a welcome message
    const messageContent = [
      "Hey! We matched! 🎵",
      "Hi there! Nice music taste.",
      "Hello! What are you listening to?",
      "Hey! 👋",
    ][Math.floor(Math.random() * 4)];

    await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.MESSAGES,
      ID.unique(),
      {
        matchId: matchId,
        senderId: user1.$id,
        receiverId: user2.$id,
        content: messageContent,
        type: "text",
        status: "unread",
        createdAt: now,
      }
    );

    console.log(
      `✅ Message sent from ${user1.displayName}: "${messageContent}"`
    );
    console.log("\n🎉 Test Complete! Check your app to see the new match.");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

createRandomMatch();
