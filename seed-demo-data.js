const { Client, Databases, ID } = require("node-appwrite");

// Initialize Appwrite Client
const client = new Client()
  .setEndpoint("https://sgp.cloud.appwrite.io/v1")
  .setProject("692c0bae0033b9e34774")
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DATABASE_ID = "6933e7230002691f918d";
const COLLECTIONS = {
  USERS: "users",
  SWIPES: "swipes",
  MATCHES: "matches",
  MESSAGES: "messages",
};

// Demo user data with music preferences
const demoUsers = [
  {
    id: "demo_user_1",
    displayName: "Alex Rivera",
    email: "alex@demo.com",
    bio: "🎸 Indie rock enthusiast. Always hunting for the next great underground band. Arctic Monkeys is my religion.",
    age: 25,
    pronouns: "he/him",
    photoUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    topGenres: [
      "indie rock",
      "alternative",
      "post-punk",
      "shoegaze",
      "brit pop",
    ],
    topArtists: [
      "Arctic Monkeys",
      "The Strokes",
      "Tame Impala",
      "Radiohead",
      "The 1975",
    ],
    profileComplete: true,
    isOnline: true,
  },
  {
    id: "demo_user_2",
    displayName: "Mia Chen",
    email: "mia@demo.com",
    bio: "🎹 Classical pianist by day, EDM lover by night. The duality of woman ✨ Looking for someone to share concert tickets with!",
    age: 23,
    pronouns: "she/her",
    photoUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
    topGenres: ["classical", "electronic", "house", "ambient", "piano"],
    topArtists: ["Chopin", "Deadmau5", "ODESZA", "Ludovico Einaudi", "Flume"],
    profileComplete: true,
    isOnline: false,
  },
  {
    id: "demo_user_3",
    displayName: "Jordan Taylor",
    email: "jordan@demo.com",
    bio: '🎤 Hip-hop head with a soft spot for 90s R&B. If you know all the words to "No Diggity", we\'re already friends.',
    age: 27,
    pronouns: "they/them",
    photoUrl:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop",
    topGenres: ["hip-hop", "r&b", "soul", "neo-soul", "trap"],
    topArtists: [
      "Kendrick Lamar",
      "SZA",
      "Frank Ocean",
      "Tyler, The Creator",
      "Anderson .Paak",
    ],
    profileComplete: true,
    isOnline: true,
  },
  {
    id: "demo_user_4",
    displayName: "Sophia Martinez",
    email: "sophia@demo.com",
    bio: "💃 Latina queen with a playlist for every mood. From reggaeton at parties to boleros when I'm feeling romantic.",
    age: 24,
    pronouns: "she/her",
    photoUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop",
    topGenres: ["reggaeton", "latin pop", "salsa", "bachata", "cumbia"],
    topArtists: ["Bad Bunny", "J Balvin", "Rosalía", "Karol G", "Daddy Yankee"],
    profileComplete: true,
    isOnline: false,
  },
  {
    id: "demo_user_5",
    displayName: "Ethan Brooks",
    email: "ethan@demo.com",
    bio: "🤘 Metalhead with a heart of gold. Yes, I'll recommend you albums. No, they won't all be screaming.",
    age: 28,
    pronouns: "he/him",
    photoUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    topGenres: [
      "metal",
      "progressive metal",
      "hard rock",
      "thrash metal",
      "post-metal",
    ],
    topArtists: ["Metallica", "Tool", "Gojira", "Mastodon", "Deftones"],
    profileComplete: true,
    isOnline: true,
  },
  {
    id: "demo_user_6",
    displayName: "Chloe Williams",
    email: "chloe@demo.com",
    bio: "🎻 Folk music lover and occasional ukulele player. Looking for someone to have a campfire jam session with!",
    age: 22,
    pronouns: "she/her",
    photoUrl:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop",
    topGenres: [
      "folk",
      "indie folk",
      "americana",
      "acoustic",
      "singer-songwriter",
    ],
    topArtists: [
      "Bon Iver",
      "Phoebe Bridgers",
      "Fleet Foxes",
      "Iron & Wine",
      "Hozier",
    ],
    profileComplete: true,
    isOnline: false,
  },
  {
    id: "demo_user_7",
    displayName: "Marcus Johnson",
    email: "marcus@demo.com",
    bio: "🎷 Jazz aficionado and vinyl collector. My apartment smells like coffee and sounds like Blue Note Records.",
    age: 30,
    pronouns: "he/him",
    photoUrl:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop",
    topGenres: ["jazz", "bebop", "cool jazz", "fusion", "soul jazz"],
    topArtists: [
      "Miles Davis",
      "John Coltrane",
      "Herbie Hancock",
      "Kamasi Washington",
      "Robert Glasper",
    ],
    profileComplete: true,
    isOnline: true,
  },
  {
    id: "demo_user_8",
    displayName: "Emma Wilson",
    email: "emma@demo.com",
    bio: "🌸 K-pop stan and proud of it! BTS Army since 2017. Looking for someone to learn choreo with 💜",
    age: 21,
    pronouns: "she/her",
    photoUrl:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop",
    topGenres: ["k-pop", "j-pop", "pop", "dance pop", "electropop"],
    topArtists: ["BTS", "BLACKPINK", "Stray Kids", "aespa", "NewJeans"],
    profileComplete: true,
    isOnline: true,
  },
  {
    id: "demo_user_9",
    displayName: "David Kim",
    email: "david@demo.com",
    bio: "🎧 Producer and bedroom DJ. If my aux cord game doesn't impress you, nothing will. Let's talk synths!",
    age: 26,
    pronouns: "he/him",
    photoUrl:
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=400&fit=crop",
    topGenres: [
      "electronic",
      "techno",
      "deep house",
      "drum and bass",
      "synthwave",
    ],
    topArtists: ["Daft Punk", "Four Tet", "Jamie xx", "Aphex Twin", "Bicep"],
    profileComplete: true,
    isOnline: false,
  },
  {
    id: "demo_user_10",
    displayName: "Olivia Brown",
    email: "olivia@demo.com",
    bio: "🎶 Pop girlie with no shame. Taylor Swift is my emotional support artist. Ready for the Eras Tour pt. 2!",
    age: 24,
    pronouns: "she/her",
    photoUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
    topGenres: ["pop", "indie pop", "synth-pop", "dream pop", "art pop"],
    topArtists: [
      "Taylor Swift",
      "Lorde",
      "Billie Eilish",
      "Dua Lipa",
      "Charli XCX",
    ],
    profileComplete: true,
    isOnline: true,
  },
];

async function seedDemoData() {
  console.log("🌱 Starting demo data seeding...\n");

  const now = new Date().toISOString();
  let createdUsers = [];

  // Create demo users
  console.log("👤 Creating demo users...");
  for (const user of demoUsers) {
    try {
      await databases.createDocument(DATABASE_ID, COLLECTIONS.USERS, user.id, {
        displayName: user.displayName,
        email: user.email,
        bio: user.bio,
        age: user.age,
        pronouns: user.pronouns,
        photoUrl: user.photoUrl,
        topGenres: user.topGenres,
        topArtists: user.topArtists,
        profileComplete: user.profileComplete,
        isOnline: user.isOnline,
        createdAt: now,
        updatedAt: now,
        lastActive: now,
        pushEnabled: true,
        unreadCount: 0,
        matchCount: 0,
      });
      console.log(`  ✅ Created: ${user.displayName}`);
      createdUsers.push(user);
    } catch (error) {
      if (error.code === 409) {
        console.log(`  ⚠️  Skipped (already exists): ${user.displayName}`);
        createdUsers.push(user);
      } else {
        console.log(`  ❌ Failed: ${user.displayName} - ${error.message}`);
      }
    }
  }

  // Create some demo matches
  console.log("\n💕 Creating demo matches...");
  const matchPairs = [
    { user1: "demo_user_1", user2: "demo_user_6", score: 78 }, // Alex & Chloe - indie/folk
    { user1: "demo_user_2", user2: "demo_user_9", score: 85 }, // Mia & David - electronic
    { user1: "demo_user_3", user2: "demo_user_7", score: 72 }, // Jordan & Marcus - hip-hop/jazz
    { user1: "demo_user_8", user2: "demo_user_10", score: 91 }, // Emma & Olivia - pop
  ];

  for (const match of matchPairs) {
    try {
      const matchId = ID.unique();
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.MATCHES,
        matchId,
        {
          oddsUserId: match.user1,
          evenUserId: match.user2,
          oddsCompatibility: match.score,
          evenCompatibility: match.score,
          createdAt: now,
          lastMessageAt: now,
        }
      );
      console.log(
        `  ✅ Match: ${match.user1} <-> ${match.user2} (${match.score}% compatibility)`
      );
    } catch (error) {
      console.log(`  ❌ Failed match: ${error.message}`);
    }
  }

  // Create some demo messages
  console.log("\n💬 Creating demo messages...");
  const demoMessages = [
    {
      matchId: null,
      sender: "demo_user_1",
      receiver: "demo_user_6",
      content:
        "Hey! I noticed you love Bon Iver too. Have you heard their new album?",
    },
    {
      matchId: null,
      sender: "demo_user_6",
      receiver: "demo_user_1",
      content: "Yes!! It's incredible. The harmonies are so beautiful 🎶",
    },
    {
      matchId: null,
      sender: "demo_user_8",
      receiver: "demo_user_10",
      content: "OMG your playlist is amazing! A fellow Swiftie! 💜",
    },
    {
      matchId: null,
      sender: "demo_user_10",
      receiver: "demo_user_8",
      content:
        "Yesss! What's your favorite era? I'm Folklore/Evermore obsessed",
    },
  ];

  // Get match IDs first
  try {
    const matches = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.MATCHES
    );
    if (matches.documents.length > 0) {
      demoMessages[0].matchId = matches.documents[0].$id;
      demoMessages[1].matchId = matches.documents[0].$id;
      if (matches.documents.length > 3) {
        demoMessages[2].matchId = matches.documents[3].$id;
        demoMessages[3].matchId = matches.documents[3].$id;
      }
    }
  } catch (e) {
    console.log("  ⚠️  Could not fetch matches for messages");
  }

  for (const msg of demoMessages) {
    if (!msg.matchId) continue;
    try {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.MESSAGES,
        ID.unique(),
        {
          matchId: msg.matchId,
          senderId: msg.sender,
          receiverId: msg.receiver,
          content: msg.content,
          type: "text",
          status: "read",
          createdAt: now,
        }
      );
      console.log(`  ✅ Message from ${msg.sender}`);
    } catch (error) {
      console.log(`  ❌ Failed message: ${error.message}`);
    }
  }

  console.log("\n✨ Demo data seeding complete!");
  console.log(
    `   Created ${createdUsers.length} users, matches, and messages.`
  );
  console.log("\n📱 You can now test the app with demo profiles!");
}

seedDemoData().catch(console.error);
