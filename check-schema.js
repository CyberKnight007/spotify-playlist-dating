const sdk = require("node-appwrite");

const client = new sdk.Client();

client
  .setEndpoint("https://sgp.cloud.appwrite.io/v1")
  .setProject("692c0bae0033b9e34774")
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new sdk.Databases(client);
const DATABASE_ID = "6933e7230002691f918d";
const USERS_COLLECTION_ID = "users";

async function checkSchema() {
  try {
    console.log("Fetching attributes for users collection...");
    const response = await databases.listAttributes(
      DATABASE_ID,
      USERS_COLLECTION_ID
    );

    console.log("Existing attributes:");
    response.attributes.forEach((attr) => {
      console.log(
        `- ${attr.key}: ${attr.type} (size: ${attr.size}, required: ${attr.required})`
      );
    });
  } catch (error) {
    console.error("Error checking schema:", error);
  }
}

checkSchema();
