import { UserProfile } from '../types/user';
import { SpotifyPlaylist } from '../types/spotify';

export async function calculateCompatibility(
  user1: UserProfile,
  user2: UserProfile
): Promise<number> {
  let score = 0;
  let factors = 0;

  // Age compatibility (if both have age)
  if (user1.age && user2.age) {
    const ageDiff = Math.abs(user1.age - user2.age);
    const ageScore = Math.max(0, 100 - ageDiff * 2);
    score += ageScore;
    factors++;
  }

  // Location compatibility
  if (user1.city && user2.city) {
    if (user1.city.toLowerCase() === user2.city.toLowerCase()) {
      score += 100;
    } else {
      score += 50; // Same country/region could be added
    }
    factors++;
  }

  // Playlist compatibility (if both have active playlists)
  // This would require fetching playlist data and comparing audio features
  // For now, we'll use a base score
  if (user1.activePlaylistId && user2.activePlaylistId) {
    score += 70; // Base playlist compatibility
    factors++;
  }

  // Bio/keyword matching (simple version)
  if (user1.bio && user2.bio) {
    const bio1Words = user1.bio.toLowerCase().split(/\s+/);
    const bio2Words = user2.bio.toLowerCase().split(/\s+/);
    const commonWords = bio1Words.filter(word => bio2Words.includes(word) && word.length > 3);
    if (commonWords.length > 0) {
      score += Math.min(30, commonWords.length * 10);
      factors++;
    }
  }

  // Calculate average
  return factors > 0 ? Math.round(score / factors) : 50;
}

export function getSharedAttributes(
  playlist1?: SpotifyPlaylist,
  playlist2?: SpotifyPlaylist
): string[] {
  const attributes: string[] = [];

  if (!playlist1 || !playlist2) return attributes;

  // Shared tags
  const sharedTags = playlist1.tags.filter(tag => playlist2.tags.includes(tag));
  attributes.push(...sharedTags.map(tag => `Both love ${tag}`));

  // Similar energy levels
  const energy1 = playlist1.moodVector.energy;
  const energy2 = playlist2.moodVector.energy;
  if (Math.abs(energy1 - energy2) < 0.2) {
    attributes.push('Similar energy vibes');
  }

  // Similar danceability
  const dance1 = playlist1.moodVector.danceability;
  const dance2 = playlist2.moodVector.danceability;
  if (Math.abs(dance1 - dance2) < 0.2) {
    attributes.push('Matching dance vibes');
  }

  return attributes;
}

