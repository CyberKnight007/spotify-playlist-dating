const sdk = require("node-appwrite");

const client = new sdk.Client();

client
  .setEndpoint("https://sgp.cloud.appwrite.io/v1")
  .setProject("692c0bae0033b9e34774")
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new sdk.Databases(client);
const DATABASE_ID = "6933e7230002691f918d";
const USERS_COLLECTION_ID = "users";

async function updateSchema() {
  try {
    console.log("Checking attributes for users collection...");
    const response = await databases.listAttributes(
      DATABASE_ID,
      USERS_COLLECTION_ID
    );
    const existingAttributes = new Set(
      response.attributes.map((attr) => attr.key)
    );

    // Attribute to add
    const attributeKey = "city";

    if (existingAttributes.has(attributeKey)) {
      console.log(`Attribute '${attributeKey}' already exists.`);
    } else {
      console.log(`Adding attribute '${attributeKey}'...`);
      await databases.createStringAttribute(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        attributeKey,
        100, // size
        false // required
      );
      console.log(`Attribute '${attributeKey}' creation initiated.`);
    }
  } catch (error) {
    console.error("Error updating schema:", error);
  }
}

updateSchema();
