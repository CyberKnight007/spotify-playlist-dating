import { UserProfile } from "../types/user";
import {
  spotifyDataService,
  SpotifyAudioFeatures,
  SpotifyArtist,
  SpotifyTrack,
} from "./spotifyDataService";

// ============================================
// MATCHING ALGORITHM SERVICE
// Phase 3: Advanced Music Compatibility
// ============================================

export interface AudioProfile {
  acousticness: number;
  danceability: number;
  energy: number;
  instrumentalness: number;
  liveness: number;
  speechiness: number;
  valence: number; // Mood/happiness
  tempo: number; // BPM
}

export interface MoodVector {
  happy: number;
  energetic: number;
  chill: number;
  melancholic: number;
  party: number;
}

export interface MatchingFactors {
  genreMatch: number; // 0-100
  artistOverlap: number; // 0-100
  audioFeatureSimilarity: number; // 0-100
  bpmEnergyMatch: number; // 0-100
  moodCompatibility: number; // 0-100
  overallScore: number; // 0-100
}

export interface DetailedMatchResult {
  score: number; // Final 0-100 score
  factors: MatchingFactors;
  sharedGenres: string[];
  sharedArtists: string[];
  audioProfileMatch: {
    similarity: number;
    userProfile: AudioProfile;
    matchProfile: AudioProfile;
  };
  moodMatch: {
    similarity: number;
    userMood: MoodVector;
    matchMood: MoodVector;
  };
  insights: string[];
  recommendations: string[];
}

class MatchingService {
  // ==========================================
  // WEIGHTS FOR COMPATIBILITY CALCULATION
  // ==========================================
  private readonly WEIGHTS = {
    GENRE: 0.3, // 30%
    ARTIST: 0.25, // 25%
    AUDIO_FEATURES: 0.2, // 20%
    BPM_ENERGY: 0.15, // 15%
    MOOD: 0.1, // 10%
  };

  // ==========================================
  // 1. GENRE MATCHING (HIGH PRIORITY)
  // ==========================================

  /**
   * Calculate genre compatibility between two users
   * Returns score 0-100 based on shared genres with weighted importance
   */
  calculateGenreMatch(
    userGenres: string[],
    matchGenres: string[]
  ): { score: number; shared: string[] } {
    if (!userGenres.length || !matchGenres.length) {
      return { score: 0, shared: [] };
    }

    const userSet = new Set(userGenres.map((g) => g.toLowerCase().trim()));
    const matchSet = new Set(matchGenres.map((g) => g.toLowerCase().trim()));

    const shared: string[] = [];
    matchGenres.forEach((genre) => {
      const normalized = genre.toLowerCase().trim();
      if (userSet.has(normalized)) {
        shared.push(genre);
      }
    });

    // Calculate Jaccard similarity
    const union = new Set([...userSet, ...matchSet]);
    const jaccardScore = (shared.length / union.size) * 100;

    // Bonus for exact matches in top genres (first 3)
    const topUserGenres = userGenres.slice(0, 3).map((g) => g.toLowerCase());
    const topMatchGenres = matchGenres.slice(0, 3).map((g) => g.toLowerCase());
    const topMatches = topUserGenres.filter((g) =>
      topMatchGenres.includes(g)
    ).length;
    const topBonus = topMatches * 10;

    const finalScore = Math.min(100, jaccardScore + topBonus);

    return {
      score: Math.round(finalScore),
      shared,
    };
  }

  // ==========================================
  // 2. ARTIST OVERLAP DETECTION (HIGH PRIORITY)
  // ==========================================

  /**
   * Calculate artist overlap with weighted importance
   * Top artists get more weight than others
   */
  calculateArtistOverlap(
    userArtists: string[],
    matchArtists: string[]
  ): { score: number; shared: string[] } {
    if (!userArtists.length || !matchArtists.length) {
      return { score: 0, shared: [] };
    }

    const userMap = new Map(
      userArtists.map((artist, idx) => [
        artist.toLowerCase().trim(),
        { name: artist, position: idx },
      ])
    );

    const shared: string[] = [];
    let weightedScore = 0;
    let maxPossibleScore = 0;

    matchArtists.forEach((artist, matchIdx) => {
      const normalized = artist.toLowerCase().trim();
      const userArtist = userMap.get(normalized);

      if (userArtist) {
        shared.push(artist);

        // Weight by position (earlier = more important)
        const userWeight = Math.max(1, 10 - userArtist.position);
        const matchWeight = Math.max(1, 10 - matchIdx);
        const avgWeight = (userWeight + matchWeight) / 2;

        weightedScore += avgWeight;
      }

      maxPossibleScore += Math.max(1, 10 - matchIdx);
    });

    const score =
      maxPossibleScore > 0 ? (weightedScore / maxPossibleScore) * 100 : 0;

    return {
      score: Math.round(score),
      shared,
    };
  }

  // ==========================================
  // 3. AUDIO FEATURE ANALYSIS (MEDIUM PRIORITY)
  // ==========================================

  /**
   * Calculate similarity between two audio profiles
   * Uses Euclidean distance in normalized feature space
   */
  calculateAudioFeatureSimilarity(
    profile1: AudioProfile,
    profile2: AudioProfile
  ): number {
    const features = [
      "acousticness",
      "danceability",
      "energy",
      "instrumentalness",
      "liveness",
      "speechiness",
      "valence",
    ] as const;

    let sumSquaredDiff = 0;
    features.forEach((feature) => {
      const diff = profile1[feature] - profile2[feature];
      sumSquaredDiff += diff * diff;
    });

    // Normalize tempo (typically 40-200 BPM)
    const tempoDiff = (profile1.tempo - profile2.tempo) / 160;
    sumSquaredDiff += tempoDiff * tempoDiff;

    const euclideanDistance = Math.sqrt(sumSquaredDiff);
    const maxDistance = Math.sqrt(features.length + 1); // +1 for tempo

    // Convert distance to similarity (0-100)
    const similarity = (1 - euclideanDistance / maxDistance) * 100;

    return Math.round(Math.max(0, similarity));
  }

  /**
   * Calculate average audio profile from tracks
   */
  calculateAudioProfile(audioFeatures: SpotifyAudioFeatures[]): AudioProfile {
    if (!audioFeatures.length) {
      return {
        acousticness: 0.5,
        danceability: 0.5,
        energy: 0.5,
        instrumentalness: 0.5,
        liveness: 0.5,
        speechiness: 0.5,
        valence: 0.5,
        tempo: 120,
      };
    }

    const sum = audioFeatures.reduce(
      (acc, features) => ({
        acousticness: acc.acousticness + features.acousticness,
        danceability: acc.danceability + features.danceability,
        energy: acc.energy + features.energy,
        instrumentalness: acc.instrumentalness + features.instrumentalness,
        liveness: acc.liveness + features.liveness,
        speechiness: acc.speechiness + features.speechiness,
        valence: acc.valence + features.valence,
        tempo: acc.tempo + features.tempo,
      }),
      {
        acousticness: 0,
        danceability: 0,
        energy: 0,
        instrumentalness: 0,
        liveness: 0,
        speechiness: 0,
        valence: 0,
        tempo: 0,
      }
    );

    const count = audioFeatures.length;
    return {
      acousticness: sum.acousticness / count,
      danceability: sum.danceability / count,
      energy: sum.energy / count,
      instrumentalness: sum.instrumentalness / count,
      liveness: sum.liveness / count,
      speechiness: sum.speechiness / count,
      valence: sum.valence / count,
      tempo: sum.tempo / count,
    };
  }

  // ==========================================
  // 4. BPM/ENERGY MATCHING (MEDIUM PRIORITY)
  // ==========================================

  /**
   * Calculate BPM and energy compatibility
   * People with similar energy preferences tend to vibe better
   */
  calculateBpmEnergyMatch(
    profile1: AudioProfile,
    profile2: AudioProfile
  ): { score: number; insight: string } {
    // Energy match (0-1 range)
    const energyDiff = Math.abs(profile1.energy - profile2.energy);
    const energyScore = (1 - energyDiff) * 100;

    // BPM match (normalize to percentage)
    const bpmDiff = Math.abs(profile1.tempo - profile2.tempo);
    const maxBpmDiff = 80; // Typical range: 80-160 BPM
    const bpmScore = Math.max(0, 1 - bpmDiff / maxBpmDiff) * 100;

    // Danceability correlation
    const danceabilityDiff = Math.abs(
      profile1.danceability - profile2.danceability
    );
    const danceScore = (1 - danceabilityDiff) * 100;

    // Combined score
    const combinedScore = energyScore * 0.4 + bpmScore * 0.3 + danceScore * 0.3;

    // Generate insight
    let insight = "";
    if (combinedScore > 80) {
      insight = "Perfect energy match! You'd sync on the dance floor 💃";
    } else if (combinedScore > 60) {
      insight = "Similar vibes - one likes it a bit more energetic 🎵";
    } else if (combinedScore > 40) {
      insight = "Complementary energy levels - balance is key ⚖️";
    } else {
      insight = "Different energy styles - variety is the spice! 🌶️";
    }

    return {
      score: Math.round(combinedScore),
      insight,
    };
  }

  // ==========================================
  // 5. MOOD VECTOR CALCULATION (LOW PRIORITY)
  // ==========================================

  /**
   * Calculate mood vector from audio profile
   * Maps audio features to emotional dimensions
   */
  calculateMoodVector(profile: AudioProfile): MoodVector {
    return {
      // Happy: high valence + moderate energy
      happy: profile.valence * 0.7 + profile.energy * 0.3,

      // Energetic: high energy + high tempo + high danceability
      energetic:
        profile.energy * 0.4 +
        Math.min(1, profile.tempo / 140) * 0.3 +
        profile.danceability * 0.3,

      // Chill: low energy + high acousticness + low tempo
      chill:
        (1 - profile.energy) * 0.4 +
        profile.acousticness * 0.3 +
        (1 - Math.min(1, profile.tempo / 140)) * 0.3,

      // Melancholic: low valence + low energy
      melancholic: (1 - profile.valence) * 0.6 + (1 - profile.energy) * 0.4,

      // Party: high danceability + high energy + low acousticness
      party:
        profile.danceability * 0.4 +
        profile.energy * 0.4 +
        (1 - profile.acousticness) * 0.2,
    };
  }

  /**
   * Calculate mood compatibility between two mood vectors
   */
  calculateMoodCompatibility(
    mood1: MoodVector,
    mood2: MoodVector
  ): {
    score: number;
    dominantMood: string;
    insight: string;
  } {
    const moods = [
      "happy",
      "energetic",
      "chill",
      "melancholic",
      "party",
    ] as const;

    let sumSquaredDiff = 0;
    moods.forEach((mood) => {
      const diff = mood1[mood] - mood2[mood];
      sumSquaredDiff += diff * diff;
    });

    const distance = Math.sqrt(sumSquaredDiff);
    const maxDistance = Math.sqrt(moods.length);
    const similarity = (1 - distance / maxDistance) * 100;

    // Find dominant mood
    const mood1Dominant = moods.reduce((a, b) => (mood1[a] > mood1[b] ? a : b));
    const mood2Dominant = moods.reduce((a, b) => (mood2[a] > mood2[b] ? a : b));

    let insight = "";
    if (mood1Dominant === mood2Dominant) {
      insight = `Both love ${mood1Dominant} music! 🎵`;
    } else {
      insight = `You're ${mood1Dominant}, they're ${mood2Dominant} - perfect balance! ✨`;
    }

    return {
      score: Math.round(similarity),
      dominantMood: mood1Dominant,
      insight,
    };
  }

  // ==========================================
  // 6. MAIN COMPATIBILITY CALCULATION
  // ==========================================

  /**
   * Calculate complete compatibility score (0-100)
   * Combines all factors with weighted importance
   */
  async calculateDetailedCompatibility(
    user1: UserProfile,
    user2: UserProfile,
    user1Tracks?: SpotifyTrack[],
    user2Tracks?: SpotifyTrack[]
  ): Promise<DetailedMatchResult> {
    const factors: MatchingFactors = {
      genreMatch: 0,
      artistOverlap: 0,
      audioFeatureSimilarity: 0,
      bpmEnergyMatch: 0,
      moodCompatibility: 0,
      overallScore: 0,
    };

    const insights: string[] = [];
    const recommendations: string[] = [];
    let sharedGenres: string[] = [];
    let sharedArtists: string[] = [];

    // 1. Genre Matching
    if (user1.topGenres && user2.topGenres) {
      const genreResult = this.calculateGenreMatch(
        user1.topGenres,
        user2.topGenres
      );
      factors.genreMatch = genreResult.score;
      sharedGenres = genreResult.shared;

      if (genreResult.score > 70) {
        insights.push(
          `🎵 ${genreResult.shared.length} shared genres - music soulmates!`
        );
      } else if (genreResult.score > 40) {
        insights.push(`🎸 Some genre overlap - complementary tastes`);
      }
    }

    // 2. Artist Overlap
    if (user1.topArtists && user2.topArtists) {
      const artistResult = this.calculateArtistOverlap(
        user1.topArtists,
        user2.topArtists
      );
      factors.artistOverlap = artistResult.score;
      sharedArtists = artistResult.shared;

      if (artistResult.shared.length > 0) {
        insights.push(`🎤 Both fans of ${artistResult.shared[0]}!`);
      }
    }

    // 3-5. Audio Features, BPM/Energy, and Mood (requires track data)
    let user1Profile: AudioProfile | null = null;
    let user2Profile: AudioProfile | null = null;

    if (
      user1Tracks &&
      user2Tracks &&
      user1Tracks.length &&
      user2Tracks.length
    ) {
      try {
        const user1TrackIds = user1Tracks.slice(0, 50).map((t) => t.id);
        const user2TrackIds = user2Tracks.slice(0, 50).map((t) => t.id);

        const [user1Features, user2Features] = await Promise.all([
          spotifyDataService.getAudioFeatures(user1TrackIds),
          spotifyDataService.getAudioFeatures(user2TrackIds),
        ]);

        user1Profile = this.calculateAudioProfile(user1Features);
        user2Profile = this.calculateAudioProfile(user2Features);

        // 3. Audio Feature Similarity
        factors.audioFeatureSimilarity = this.calculateAudioFeatureSimilarity(
          user1Profile,
          user2Profile
        );

        // 4. BPM/Energy Match
        const bpmEnergyResult = this.calculateBpmEnergyMatch(
          user1Profile,
          user2Profile
        );
        factors.bpmEnergyMatch = bpmEnergyResult.score;
        insights.push(bpmEnergyResult.insight);

        // 5. Mood Compatibility
        const user1Mood = this.calculateMoodVector(user1Profile);
        const user2Mood = this.calculateMoodVector(user2Profile);
        const moodResult = this.calculateMoodCompatibility(
          user1Mood,
          user2Mood
        );
        factors.moodCompatibility = moodResult.score;
        insights.push(moodResult.insight);
      } catch (error) {
        console.error("Error calculating audio features:", error);
      }
    }

    // Calculate weighted overall score
    factors.overallScore = Math.round(
      factors.genreMatch * this.WEIGHTS.GENRE +
        factors.artistOverlap * this.WEIGHTS.ARTIST +
        factors.audioFeatureSimilarity * this.WEIGHTS.AUDIO_FEATURES +
        factors.bpmEnergyMatch * this.WEIGHTS.BPM_ENERGY +
        factors.moodCompatibility * this.WEIGHTS.MOOD
    );

    // Generate recommendations
    if (factors.overallScore > 80) {
      recommendations.push("Plan a concert date together!");
      recommendations.push("Create a collaborative playlist");
    } else if (factors.overallScore > 60) {
      recommendations.push("Share your favorite playlists");
      recommendations.push("Discover new music together");
    } else {
      recommendations.push("Explore each other's music tastes");
      recommendations.push("Find common ground in live performances");
    }

    return {
      score: factors.overallScore,
      factors,
      sharedGenres,
      sharedArtists,
      audioProfileMatch: {
        similarity: factors.audioFeatureSimilarity,
        userProfile: user1Profile || this.getDefaultAudioProfile(),
        matchProfile: user2Profile || this.getDefaultAudioProfile(),
      },
      moodMatch: {
        similarity: factors.moodCompatibility,
        userMood: user1Profile
          ? this.calculateMoodVector(user1Profile)
          : this.getDefaultMoodVector(),
        matchMood: user2Profile
          ? this.calculateMoodVector(user2Profile)
          : this.getDefaultMoodVector(),
      },
      insights: insights.slice(0, 5),
      recommendations: recommendations.slice(0, 3),
    };
  }

  /**
   * Quick compatibility calculation without audio features
   * Used for initial swiping
   */
  calculateQuickCompatibility(user1: UserProfile, user2: UserProfile): number {
    const genreResult =
      user1.topGenres && user2.topGenres
        ? this.calculateGenreMatch(user1.topGenres, user2.topGenres)
        : { score: 0 };

    const artistResult =
      user1.topArtists && user2.topArtists
        ? this.calculateArtistOverlap(user1.topArtists, user2.topArtists)
        : { score: 0 };

    // Weighted quick score (genre + artist only)
    const quickScore = Math.round(
      genreResult.score * 0.55 + artistResult.score * 0.45
    );

    return quickScore;
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  private getDefaultAudioProfile(): AudioProfile {
    return {
      acousticness: 0.5,
      danceability: 0.5,
      energy: 0.5,
      instrumentalness: 0.5,
      liveness: 0.5,
      speechiness: 0.5,
      valence: 0.5,
      tempo: 120,
    };
  }

  private getDefaultMoodVector(): MoodVector {
    return {
      happy: 0.5,
      energetic: 0.5,
      chill: 0.5,
      melancholic: 0.5,
      party: 0.5,
    };
  }
}

export const matchingService = new MatchingService();
export default matchingService;
