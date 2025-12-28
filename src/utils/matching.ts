import { UserProfile } from "../types/user";

// ============================================
// COMPATIBILITY CALCULATION
// ============================================

export interface CompatibilityFactors {
  trackScore: number;
  genreScore: number;
  artistScore: number;
  ageScore: number;
  locationScore: number;
  bioScore: number;
}

export interface CompatibilityResult {
  score: number;
  factors: CompatibilityFactors;
  sharedTracks: string[];
  sharedGenres: string[];
  sharedArtists: string[];
  insights: string[];
}

/**
 * Calculate compatibility between two users based on their profiles
 */
export async function calculateCompatibility(
  user1: UserProfile,
  user2: UserProfile
): Promise<CompatibilityResult> {
  const factors: CompatibilityFactors = {
    trackScore: 0,
    genreScore: 0,
    artistScore: 0,
    ageScore: 0,
    locationScore: 0,
    bioScore: 0,
  };

  const sharedTracks: string[] = [];
  const sharedGenres: string[] = [];
  const sharedArtists: string[] = [];
  const insights: string[] = [];

  // 1. Track matching (30% weight)
  if (user1.topTracks && user2.topTracks) {
    const tracks1 = new Set(user1.topTracks.map((t) => t.id));

    for (const track of user2.topTracks) {
      if (tracks1.has(track.id)) {
        sharedTracks.push(track.name);
      }
    }

    factors.trackScore = Math.min(sharedTracks.length * 20, 100);

    if (sharedTracks.length > 0) {
      insights.push(`🎧 You both vibe to ${sharedTracks[0]}!`);
    }
  }

  // 2. Genre matching (25% weight)
  if (user1.topGenres && user2.topGenres) {
    const genres1 = new Set(user1.topGenres.map((g) => g.toLowerCase()));
    const genres2 = user2.topGenres.map((g) => g.toLowerCase());

    for (const genre of genres2) {
      if (genres1.has(genre)) {
        sharedGenres.push(genre);
      }
    }

    factors.genreScore = Math.min(sharedGenres.length * 10, 100);

    if (sharedGenres.length >= 3) {
      insights.push(`🎵 You both love ${sharedGenres.slice(0, 3).join(", ")}!`);
    }
  }

  // 3. Artist matching (25% weight)
  if (user1.topArtists && user2.topArtists) {
    const artists1 = new Set(user1.topArtists.map((a) => a.toLowerCase()));
    const artists2 = user2.topArtists.map((a) => a.toLowerCase());

    for (const artist of artists2) {
      if (artists1.has(artist)) {
        sharedArtists.push(artist);
      }
    }

    factors.artistScore = Math.min(sharedArtists.length * 15, 100);

    if (sharedArtists.length > 0) {
      insights.push(`🎤 You both listen to ${sharedArtists[0]}!`);
    }
  }

  // 4. Age compatibility (10% weight)
  if (user1.age && user2.age) {
    const ageDiff = Math.abs(user1.age - user2.age);
    factors.ageScore = Math.max(0, 100 - ageDiff * 5);

    if (ageDiff <= 3) {
      insights.push("📅 You're close in age!");
    }
  }

  // 5. Location compatibility (5% weight)
  if (user1.city && user2.city) {
    if (user1.city.toLowerCase() === user2.city.toLowerCase()) {
      factors.locationScore = 100;
      insights.push(`📍 Both in ${user1.city}!`);
    } else {
      factors.locationScore = 30;
    }
  }

  // 6. Bio keyword matching (5% weight)
  if (user1.bio && user2.bio) {
    const commonKeywords = findCommonKeywords(user1.bio, user2.bio);
    factors.bioScore = Math.min(commonKeywords.length * 20, 100);

    if (commonKeywords.length > 0) {
      insights.push(`✨ Similar vibes in your bios!`);
    }
  }

  // Calculate weighted total
  const totalScore = Math.round(
    factors.trackScore * 0.3 +
      factors.genreScore * 0.25 +
      factors.artistScore * 0.25 +
      factors.ageScore * 0.1 +
      factors.locationScore * 0.05 +
      factors.bioScore * 0.05
  );

  return {
    score: totalScore,
    factors,
    sharedTracks,
    sharedGenres,
    sharedArtists,
    insights: insights.slice(0, 3),
  };
}

/**
 * Find common meaningful keywords between two bios
 */
function findCommonKeywords(bio1: string, bio2: string): string[] {
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "may",
    "might",
    "must",
    "shall",
    "can",
    "need",
    "to",
    "of",
    "in",
    "for",
    "on",
    "with",
    "at",
    "by",
    "from",
    "up",
    "about",
    "into",
    "over",
    "after",
    "i",
    "me",
    "my",
    "you",
    "your",
    "we",
    "our",
    "they",
    "their",
    "it",
    "its",
  ]);

  const words1 = bio1
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w));

  const words2Set = new Set(
    bio2
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !stopWords.has(w))
  );

  return words1.filter((w) => words2Set.has(w));
}

/**
 * Get matching insights between two users
 */
export function getMatchInsights(
  user1: UserProfile,
  user2: UserProfile
): string[] {
  const insights: string[] = [];

  // Check for shared genres
  if (user1.topGenres && user2.topGenres) {
    const sharedGenres = user1.topGenres.filter((g) =>
      user2.topGenres?.some((g2) => g.toLowerCase() === g2.toLowerCase())
    );
    if (sharedGenres.length > 0) {
      insights.push(`Both into ${sharedGenres[0]}`);
    }
  }

  // Check for shared artists
  if (user1.topArtists && user2.topArtists) {
    const sharedArtists = user1.topArtists.filter((a) =>
      user2.topArtists?.some((a2) => a.toLowerCase() === a2.toLowerCase())
    );
    if (sharedArtists.length > 0) {
      insights.push(`Both fans of ${sharedArtists[0]}`);
    }
  }

  // Location insight
  if (user1.city && user2.city && user1.city === user2.city) {
    insights.push(`Both in ${user1.city}`);
  }

  return insights;
}
