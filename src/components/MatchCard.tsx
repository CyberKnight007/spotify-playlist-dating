import React from "react";
import {
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { MatchProfile } from "../types/spotify";
import { palette } from "../theme/colors";

interface Props {
  match: MatchProfile;
  onPress?: (match: MatchProfile) => void;
}

const MatchCard: React.FC<Props> = ({ match, onPress }) => {
  const avatarUrl =
    match.avatar ||
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400";

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => onPress?.(match)}
    >
      <ImageBackground
        source={{ uri: avatarUrl }}
        style={styles.cover}
        imageStyle={{ borderRadius: 24 }}
      >
        <View style={styles.overlay}>
          <View style={styles.row}>
            <View>
              <Text style={styles.name}>{match.displayName}</Text>
              {match.pronouns && (
                <Text style={styles.subtitle}>{match.pronouns}</Text>
              )}
            </View>
            <View style={styles.badge}>
              <Ionicons name="musical-notes" size={14} color="#1DB954" />
              <Text style={styles.badgeLabel}>{match.compatibility}%</Text>
            </View>
          </View>

          {/* Audio Profile Info */}
          {match.audioProfile && (
            <View style={styles.moodRow}>
              <Ionicons name="sparkles" size={14} color={palette.muted} />
              <Text style={styles.moodText}>
                {match.audioProfile.dominantMood}
              </Text>
            </View>
          )}

          {/* Shared Genres */}
          {match.sharedGenres && match.sharedGenres.length > 0 && (
            <View style={styles.tagRow}>
              {match.sharedGenres.slice(0, 3).map((genre: string) => (
                <View key={genre} style={styles.tag}>
                  <Text style={styles.tagLabel}>{genre}</Text>
                </View>
              ))}
              {match.sharedGenres.length > 3 && (
                <View style={styles.moreTag}>
                  <Text style={styles.moreTagLabel}>
                    +{match.sharedGenres.length - 3}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Shared Artists */}
          {match.sharedArtists && match.sharedArtists.length > 0 && (
            <View style={styles.artistsRow}>
              <Ionicons name="people" size={12} color="#1DB954" />
              <Text style={styles.artistsText}>
                {match.sharedArtists.slice(0, 2).join(", ")}
                {match.sharedArtists.length > 2 &&
                  ` +${match.sharedArtists.length - 2} more`}
              </Text>
            </View>
          )}

          <Text style={styles.meta}>{match.lastActive}</Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 16,
  },
  cover: {
    height: 260,
    justifyContent: "flex-end",
  },
  overlay: {
    backgroundColor: "#05070dcc",
    padding: 20,
    gap: 10,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    color: palette.text,
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    color: palette.muted,
    fontSize: 14,
    marginTop: 2,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#1DB95420",
  },
  badgeLabel: {
    color: "#1DB954",
    fontWeight: "700",
    fontSize: 14,
  },
  moodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  moodText: {
    color: palette.muted,
    fontSize: 13,
    textTransform: "capitalize",
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#ffffff22",
  },
  tagLabel: {
    color: palette.text,
    fontSize: 12,
    textTransform: "capitalize",
  },
  moreTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#1DB95430",
  },
  moreTagLabel: {
    color: "#1DB954",
    fontSize: 12,
    fontWeight: "600",
  },
  artistsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  artistsText: {
    color: palette.text,
    fontSize: 12,
  },
  meta: {
    color: palette.muted,
    fontSize: 12,
    marginTop: 4,
  },
});

export default MatchCard;
