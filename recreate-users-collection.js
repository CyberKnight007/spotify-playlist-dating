const sdk = require("node-appwrite");

const client = new sdk.Client();

client
  .setEndpoint("https://sgp.cloud.appwrite.io/v1")
  .setProject("692c0bae0033b9e34774")
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new sdk.Databases(client);
const DATABASE_ID = "6933e7230002691f918d";
const USERS_COLLECTION_ID = "users";

async function recreateCollection() {
  try {
    console.log("🗑️  Deleting existing users collection...");
    try {
      await databases.deleteCollection(DATABASE_ID, USERS_COLLECTION_ID);
      console.log("✅ Collection deleted.");
    } catch (error) {
      console.log(
        "⚠️  Collection might not exist or already deleted:",
        error.message
      );
    }

    console.log("✨ Creating new users collection...");
    await databases.createCollection(DATABASE_ID, USERS_COLLECTION_ID, "Users");
    console.log("✅ Collection created.");

    console.log("📝 Adding attributes...");

    // String attributes
    await databases.createStringAttribute(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "displayName",
      100,
      true
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "email",
      100,
      false
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "bio",
      500,
      false
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "pronouns",
      50,
      false
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "city",
      100,
      false
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "avatar",
      1000,
      false
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "photoUrl",
      1000,
      false
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "spotifyUserId",
      100,
      false
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "spotifyAccessToken",
      1000,
      false
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "spotifyRefreshToken",
      1000,
      false
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "typingInMatch",
      100,
      false
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "pushToken",
      255,
      false
    );

    // Integer attributes
    await databases.createIntegerAttribute(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "age",
      false
    );
    await databases.createIntegerAttribute(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "unreadCount",
      false
    );
    await databases.createIntegerAttribute(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "matchCount",
      false
    );

    // Boolean attributes
    await databases.createBooleanAttribute(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "profileComplete",
      false
    );
    await databases.createBooleanAttribute(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "isOnline",
      false
    );
    await databases.createBooleanAttribute(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "isTyping",
      false
    );
    await databases.createBooleanAttribute(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "pushEnabled",
      false
    );

    // Datetime attributes
    await databases.createDatetimeAttribute(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "createdAt",
      false
    );
    await databases.createDatetimeAttribute(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "updatedAt",
      false
    );
    await databases.createDatetimeAttribute(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "lastActive",
      false
    );
    await databases.createDatetimeAttribute(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "lastSeen",
      false
    );
    await databases.createDatetimeAttribute(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "lastTyping",
      false
    );

    // Array attributes
    await databases.createStringAttribute(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "topGenres",
      100,
      false,
      undefined,
      true
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "topArtists",
      100,
      false,
      undefined,
      true
    );

    console.log("✅ All attributes added successfully!");
    console.log("⏳ Waiting for attributes to be available...");
  } catch (error) {
    console.error("❌ Error recreating collection:", error);
  }
}

recreateCollection();
