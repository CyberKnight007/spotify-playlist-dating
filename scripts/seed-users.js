const sdk = require("node-appwrite");
require("dotenv").config();

// Configuration
const PROJECT_ID = "692c0bae0033b9e34774";
const DATABASE_ID = "6933e7230002691f918d";
const COLLECTION_ID = "users";
const ENDPOINT = "https://sgp.cloud.appwrite.io/v1";
const API_KEY = process.env.APPWRITE_API_KEY;

// Initialize Appwrite Client
const client = new sdk.Client();
client.setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);

const databases = new sdk.Databases(client);

// Data Constants
const INDIAN_NAMES = [
  "Aarav",
  "Vihaan",
  "Aditya",
  "Arjun",
  "Sai",
  "Reyansh",
  "Ayaan",
  "Krishna",
  "Ishaan",
  "Shaurya",
  "Diya",
  "Saanvi",
  "Ananya",
  "Aadhya",
  "Pari",
  "Kiara",
  "Myra",
  "Riya",
  "Fatima",
  "Zoya",
  "Rahul",
  "Priya",
  "Amit",
  "Sneha",
  "Rohit",
  "Neha",
  "Vikram",
  "Pooja",
  "Karan",
  "Anjali",
  "Kabir",
  "Meera",
  "Rohan",
  "Nisha",
  "Aryan",
  "Tanvi",
  "Dhruv",
  "Ishita",
  "Veer",
  "Kavya",
  "Siddharth",
  "Isha",
  "Dev",
  "Aditi",
  "Arnav",
  "Shreya",
  "Yash",
  "Avni",
  "Vivaan",
  "Sara",
];

const INDIAN_CITIES = [
  { name: "Mumbai", lat: 19.076, lon: 72.8777 },
  { name: "Delhi", lat: 28.7041, lon: 77.1025 },
  { name: "Bangalore", lat: 12.9716, lon: 77.5946 },
  { name: "Hyderabad", lat: 17.385, lon: 78.4867 },
  { name: "Ahmedabad", lat: 23.0225, lon: 72.5714 },
  { name: "Chennai", lat: 13.0827, lon: 80.2707 },
  { name: "Kolkata", lat: 22.5726, lon: 88.3639 },
  { name: "Pune", lat: 18.5204, lon: 73.8567 },
  { name: "Jaipur", lat: 26.9124, lon: 75.7873 },
  { name: "Surat", lat: 21.1702, lon: 72.8311 },
];

const TOP_ARTISTS = [
  "Arijit Singh",
  "Pritam",
  "A.R. Rahman",
  "Shreya Ghoshal",
  "Badshah",
  "Diljit Dosanjh",
  "Sidhu Moose Wala",
  "Neha Kakkar",
  "Sonu Nigam",
  "Atif Aslam",
  "The Weeknd",
  "Taylor Swift",
  "Drake",
  "BTS",
  "Justin Bieber",
  "Ed Sheeran",
  "Ariana Grande",
  "Eminem",
  "Post Malone",
  "Dua Lipa",
];

const TOP_GENRES = [
  "filmi",
  "desi pop",
  "punjabi pop",
  "bollywood",
  "modern bollywood",
  "indian indie",
  "sufi",
  "ghazal",
  "indian classical",
  "tamil pop",
  "pop",
  "hip hop",
  "r&b",
  "rock",
  "edm",
  "k-pop",
  "rap",
  "indie pop",
];

const TOP_TRACKS = [
  {
    id: "track_1",
    name: "Kesariya",
    artist: "Pritam, Arijit Singh",
    albumArt:
      "https://i.scdn.co/image/ab67616d0000b273c08202c50371e234d20caf62",
  },
  {
    id: "track_2",
    name: "Apna Bana Le",
    artist: "Arijit Singh, Sachin-Jigar",
    albumArt:
      "https://i.scdn.co/image/ab67616d0000b27372a77d038887cdc425f5ee55",
  },
  {
    id: "track_3",
    name: "Chaleya",
    artist: "Anirudh Ravichander, Arijit Singh",
    albumArt:
      "https://i.scdn.co/image/ab67616d0000b2730f17f041844d60ed8cf9f6e5",
  },
  {
    id: "track_4",
    name: "Heeriye",
    artist: "Jasleen Royal, Arijit Singh",
    albumArt:
      "https://i.scdn.co/image/ab67616d0000b273a2a0b9e3447c1e3683474675",
  },
  {
    id: "track_5",
    name: "Jhoome Jo Pathaan",
    artist: "Vishal-Shekhar, Arijit Singh",
    albumArt:
      "https://i.scdn.co/image/ab67616d0000b273e1f81b4e3e947d37269ce704",
  },
  {
    id: "track_6",
    name: "Maan Meri Jaan",
    artist: "King",
    albumArt:
      "https://i.scdn.co/image/ab67616d0000b2730f17f041844d60ed8cf9f6e5",
  },
  {
    id: "track_7",
    name: "Peaches",
    artist: "Justin Bieber",
    albumArt:
      "https://i.scdn.co/image/ab67616d0000b273e6f407c7f3a0ec98845e4431",
  },
  {
    id: "track_8",
    name: "As It Was",
    artist: "Harry Styles",
    albumArt:
      "https://i.scdn.co/image/ab67616d0000b273b46f74097655d7f353caab14",
  },
  {
    id: "track_9",
    name: "Starboy",
    artist: "The Weeknd",
    albumArt:
      "https://i.scdn.co/image/ab67616d0000b2734718e28d24527d9700b8acc2",
  },
  {
    id: "track_10",
    name: "Cruel Summer",
    artist: "Taylor Swift",
    albumArt:
      "https://i.scdn.co/image/ab67616d0000b273e787cffec20aa2a396a61647",
  },
  {
    id: "track_11",
    name: "Ve Kamleya",
    artist: "Arijit Singh, Shreya Ghoshal",
    albumArt:
      "https://i.scdn.co/image/ab67616d0000b2733e3f0b8c6d44f3b9f6e3f8a1",
  },
  {
    id: "track_12",
    name: "Tere Vaaste",
    artist: "Varun Jain, Sachin-Jigar",
    albumArt:
      "https://i.scdn.co/image/ab67616d0000b273f2b4c8e3f7e9a4e1f0d2c8a1",
  },
];

const BIOS = [
  "Music is life 🎵",
  "Looking for my concert buddy",
  "Vibes only ✨",
  "Coffee and Bollywood songs ☕",
  "Diljit fan forever 🦅",
  "Swiftie ❤️",
  "Here for the playlist exchange",
  "Musician looking for inspiration 🎸",
  "Let's jam! 🎶",
  "Searching for the perfect duet partner",
  "Live music enthusiast 🎤",
  "Bollywood > Hollywood",
  "AR Rahman is my religion 🙏",
  "Indie music lover",
  "Road trips + good music = heaven",
  "Always humming something",
  "Playlist curator by passion",
  "Music festival junkie 🎪",
  "Late night drives with good songs",
  "Looking for someone who gets my Spotify wrapped",
];

function getRandomSubarray(arr, size) {
  const shuffled = arr.slice(0);
  let i = arr.length;
  let temp;
  let index;
  while (i--) {
    index = Math.floor(Math.random() * (i + 1));
    temp = shuffled[index];
    shuffled[index] = shuffled[i];
    shuffled[i] = temp;
  }
  return shuffled.slice(0, size);
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seedUsers() {
  console.log("🚀 Starting seed of 100 Indian users...\n");
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < 100; i++) {
    const name = INDIAN_NAMES[Math.floor(Math.random() * INDIAN_NAMES.length)];
    const city =
      INDIAN_CITIES[Math.floor(Math.random() * INDIAN_CITIES.length)];
    const bio = BIOS[Math.floor(Math.random() * BIOS.length)];

    // Randomize location slightly around the city center (within ~5-10km)
    const latOffset = (Math.random() - 0.5) * 0.1;
    const lonOffset = (Math.random() - 0.5) * 0.1;

    // Select random music preferences
    const topArtists = getRandomSubarray(TOP_ARTISTS, 5);
    const topGenres = getRandomSubarray(TOP_GENRES, 5);

    const userProfile = {
      displayName: name,
      age: getRandomInt(18, 35),
      bio: bio,
      city: city.name,
      latitude: city.lat + latOffset,
      longitude: city.lon + lonOffset,
      topArtists: topArtists,
      topGenres: topGenres,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
        name
      )}&background=random&size=400`,
      profileComplete: true,
      isOnline: Math.random() > 0.7,
      isPremium: Math.random() > 0.8, // 20% premium users
      darkModeEnabled: Math.random() > 0.5,
      pushEnabled: true,
      unreadCount: 0,
      matchCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };

    try {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        sdk.ID.unique(),
        userProfile
      );

      successCount++;
      process.stdout.write(
        `\r✅ Created: ${successCount} | ❌ Failed: ${failCount} | Progress: ${
          i + 1
        }/100`
      );
    } catch (error) {
      failCount++;
      process.stdout.write(
        `\r✅ Created: ${successCount} | ❌ Failed: ${failCount} | Progress: ${
          i + 1
        }/100`
      );

      // Log first error for debugging
      if (failCount === 1) {
        console.error("\n\n⚠️ First error details:", error.message);
      }
    }
  }

  console.log("\n\n🎉 Seeding complete!");
  console.log(`✅ Successfully created: ${successCount} users`);
  console.log(`❌ Failed: ${failCount} users`);
}

// Run the seeder
seedUsers().catch(console.error);
