const sdk = require("node-appwrite");

const client = new sdk.Client();

client
  .setEndpoint("https://sgp.cloud.appwrite.io/v1")
  .setProject("692c0bae0033b9e34774")
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new sdk.Databases(client);
const DATABASE_ID = "6933e7230002691f918d";
const USERS_COLLECTION_ID = "users";

async function fixPermissions() {
  try {
    console.log("🔧 Updating collection permissions...");

    // Enable Document Security so users can only manage their own documents
    // But allow 'users' (authenticated) to create documents
    // And 'any' to read documents (public profiles)

    await databases.updateCollection(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "Users",
      [
        sdk.Permission.create(sdk.Role.users()), // Authenticated users can create
        sdk.Permission.read(sdk.Role.any()), // Anyone can read profiles
        sdk.Permission.update(sdk.Role.users()), // Authenticated users can update
        sdk.Permission.delete(sdk.Role.users()), // Authenticated users can delete
      ],
      true // documentSecurity enabled
    );

    console.log("✅ Permissions updated successfully!");
    console.log("  - Create: users (authenticated)");
    console.log("  - Read: any");
    console.log("  - Update: users");
    console.log("  - Delete: users");
    console.log("  - Document Security: Enabled");
  } catch (error) {
    console.error("❌ Error updating permissions:", error);
  }
}

fixPermissions();
