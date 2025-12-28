import React from "react";
import {
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SpotifyPlaylist } from "../services/spotifyDataService";
import { palette } from "../theme/colors";

interface Props {
  playlist: SpotifyPlaylist;
  onPress?: (playlist: SpotifyPlaylist) => void;
  isActive?: boolean;
}

const PlaylistCard: React.FC<Props> = ({ playlist, onPress, isActive }) => {
  const imageUrl =
    playlist.images?.[0]?.url ||
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400";

  return (
    <TouchableOpacity
      onPress={() => onPress?.(playlist)}
      activeOpacity={0.9}
      style={[styles.card, isActive && styles.active]}
    >
      <ImageBackground
        source={{ uri: imageUrl }}
        style={styles.cover}
        imageStyle={{ borderRadius: 24 }}
      >
        <View style={styles.overlay}>
          <Text style={styles.title} numberOfLines={1}>
            {playlist.name}
          </Text>
          {playlist.description && (
            <Text style={styles.subtitle} numberOfLines={2}>
              {playlist.description}
            </Text>
          )}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="musical-notes" size={14} color={palette.muted} />
              <Text style={styles.meta}>{playlist.tracks.total} tracks</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="person" size={14} color={palette.muted} />
              <Text style={styles.meta}>{playlist.owner.display_name}</Text>
            </View>
          </View>
          {playlist.public !== undefined && (
            <View style={styles.tagRow}>
              <View
                style={[
                  styles.tag,
                  {
                    backgroundColor: playlist.public
                      ? "#1DB95422"
                      : "#ffffff22",
                  },
                ]}
              >
                <Ionicons
                  name={
                    playlist.public ? "globe-outline" : "lock-closed-outline"
                  }
                  size={12}
                  color={playlist.public ? "#1DB954" : palette.text}
                />
                <Text
                  style={[
                    styles.tagLabel,
                    { color: playlist.public ? "#1DB954" : palette.text },
                  ]}
                >
                  {playlist.public ? "Public" : "Private"}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
    marginBottom: 16,
  },
  active: {
    borderColor: palette.primary,
  },
  cover: {
    height: 220,
    justifyContent: "flex-end",
  },
  overlay: {
    backgroundColor: "#05070dcc",
    padding: 20,
    gap: 8,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    color: palette.text,
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    color: palette.muted,
    fontSize: 14,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  meta: {
    color: palette.text,
    fontSize: 12,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#ffffff22",
  },
  tagLabel: {
    color: palette.text,
    fontSize: 12,
  },
});

export default PlaylistCard;
