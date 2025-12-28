import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { spotifyDataService } from "../services/spotifyDataService";
import { SpotifyTrack } from "../types/spotify";

interface SongPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (track: SpotifyTrack) => void;
}

export const SongPickerModal: React.FC<SongPickerModalProps> = ({
  visible,
  onClose,
  onSelect,
}) => {
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadTracks();
    }
  }, [visible]);

  const loadTracks = async () => {
    setLoading(true);
    try {
      // Fetch top tracks (short term = recent favorites)
      const topTracks = await spotifyDataService.getTopTracks("short_term", 20);
      setTracks(topTracks);
    } catch (error) {
      console.error("Error loading tracks:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderTrackItem = ({ item }: { item: SpotifyTrack }) => (
    <TouchableOpacity
      style={styles.trackItem}
      onPress={() => {
        onSelect(item);
        onClose();
      }}
    >
      <Image
        source={{ uri: item.album.images[0]?.url }}
        style={styles.albumArt}
      />
      <View style={styles.trackInfo}>
        <Text style={styles.trackName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.artistName} numberOfLines={1}>
          {item.artists.map((a) => a.name).join(", ")}
        </Text>
      </View>
      <Ionicons name="send" size={20} color="#1DB954" />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Share a Song</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1DB954" />
              </View>
            ) : (
              <FlatList
                data={tracks}
                renderItem={renderTrackItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </BlurView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  blurContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  content: {
    backgroundColor: "#121212",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "70%",
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    paddingBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  closeButton: {
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  trackItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 10,
    borderRadius: 12,
  },
  albumArt: {
    width: 50,
    height: 50,
    borderRadius: 4,
    marginRight: 12,
  },
  trackInfo: {
    flex: 1,
    marginRight: 10,
  },
  trackName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  artistName: {
    fontSize: 14,
    color: "#b3b3b3",
  },
});
