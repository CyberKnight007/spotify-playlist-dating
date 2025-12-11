const { Client, Databases, ID } = require("node-appwrite");

const client = new Client()
  .setEndpoint("https://sgp.cloud.appwrite.io/v1")
  .setProject("692c0bae0033b9e34774")
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = "6933e7230002691f918d";

async function createMatchesAndMessages() {
  const now = new Date().toISOString();

  console.log("💕 Creating demo matches...");
  const matchPairs = [
    {
      user1: "demo_user_1",
      user2: "demo_user_6",
      score: 78,
      genres: ["indie", "folk"],
    },
    {
      user1: "demo_user_2",
      user2: "demo_user_9",
      score: 85,
      genres: ["electronic", "house"],
    },
    {
      user1: "demo_user_3",
      user2: "demo_user_7",
      score: 72,
      genres: ["jazz", "soul"],
    },
    {
      user1: "demo_user_8",
      user2: "demo_user_10",
      score: 91,
      genres: ["pop", "k-pop"],
    },
  ];

  const createdMatches = [];

  for (const match of matchPairs) {
    try {
      const matchId = ID.unique();
      const doc = await databases.createDocument(
        DATABASE_ID,
        "matches",
        matchId,
        {
          user1Id: match.user1,
          user2Id: match.user2,
          compatibilityScore: match.score,
          sharedGenres: match.genres,
          sharedArtists: [],
          createdAt: now,
          lastMessageAt: now,
        }
      );
      console.log(
        `  ✅ Match: ${match.user1} <-> ${match.user2} (${match.score}%)`
      );
      createdMatches.push({ id: doc.$id, ...match });
    } catch (error) {
      console.log(`  ❌ Failed: ${error.message}`);
    }
  }

  console.log("\n💬 Creating demo messages...");
  const messages = [
    {
      matchIdx: 0,
      sender: "demo_user_1",
      receiver: "demo_user_6",
      content:
        "Hey! I noticed you love Bon Iver too. Have you heard their new album?",
    },
    {
      matchIdx: 0,
      sender: "demo_user_6",
      receiver: "demo_user_1",
      content: "Yes!! Its incredible. The harmonies are so beautiful 🎶",
    },
    {
      matchIdx: 1,
      sender: "demo_user_2",
      receiver: "demo_user_9",
      content: "Your taste in electronic music is immaculate! ODESZA fan?",
    },
    {
      matchIdx: 1,
      sender: "demo_user_9",
      receiver: "demo_user_2",
      content:
        "Absolutely! Saw them live last year - life changing experience ✨",
    },
    {
      matchIdx: 2,
      sender: "demo_user_3",
      receiver: "demo_user_7",
      content: "A jazz lover! Please tell me you have vinyl recommendations 🎷",
    },
    {
      matchIdx: 2,
      sender: "demo_user_7",
      receiver: "demo_user_3",
      content:
        "Oh I have SO many. Start with Kind of Blue if you havent already!",
    },
    {
      matchIdx: 3,
      sender: "demo_user_8",
      receiver: "demo_user_10",
      content: "OMG your playlist is amazing! A fellow Swiftie! 💜",
    },
    {
      matchIdx: 3,
      sender: "demo_user_10",
      receiver: "demo_user_8",
      content: "Yesss! Whats your favorite era? Im Folklore/Evermore obsessed",
    },
  ];

  for (const msg of messages) {
    if (!createdMatches[msg.matchIdx]) continue;
    try {
      await databases.createDocument(DATABASE_ID, "messages", ID.unique(), {
        matchId: createdMatches[msg.matchIdx].id,
        senderId: msg.sender,
        receiverId: msg.receiver,
        content: msg.content,
        type: "text",
        status: "read",
        createdAt: now,
      });
      console.log(`  ✅ Message from user ${msg.sender.split("_")[2]}`);
    } catch (error) {
      console.log(`  ❌ Failed: ${error.message}`);
    }
  }

  console.log("\n✨ Matches and messages created!");
}

createMatchesAndMessages().catch(console.error);
