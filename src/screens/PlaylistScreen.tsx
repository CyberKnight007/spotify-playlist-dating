import React, { useState, useEffect } from "react";
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
  Image,
  Dimensions,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  SlideInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";

import {
  useSpotify,
  SpotifyPlaylist,
  SpotifyTrack,
} from "../context/SpotifyContext";
import { spotifyDataService } from "../services/spotifyDataService";
import { palette } from "../theme/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ============================================
// TRACK ITEM COMPONENT
// ============================================

interface TrackItemProps {
  track: SpotifyTrack;
  index: number;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
}

const TrackItem: React.FC<TrackItemProps> = ({
  track,
  index,
  isPlaying,
  onPlay,
  onStop,
}) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isPlaying) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 3000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      rotation.value = withTiming(0, { duration: 300 });
    }
  }, [isPlaying, rotation]);

  const albumStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const hasPreview = !!track.preview_url;

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <Pressable
        style={[styles.trackItem, isPlaying && styles.trackItemPlaying]}
        onPress={hasPreview ? (isPlaying ? onStop : onPlay) : undefined}
        disabled={!hasPreview}
      >
        <Text style={styles.trackNumber}>{index + 1}</Text>

        <Animated.View style={[styles.trackAlbumArt, isPlaying && albumStyle]}>
          <Image
            source={{
              uri:
                track.album?.images?.[0]?.url ||
                "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100",
            }}
            style={styles.trackAlbumImage}
          />
          {isPlaying && (
            <View style={styles.playingOverlay}>
              <Ionicons name="pause" size={16} color="#fff" />
            </View>
          )}
        </Animated.View>

        <View style={styles.trackInfo}>
          <Text style={styles.trackName} numberOfLines={1}>
            {track.name}
          </Text>
          <Text style={styles.trackArtist} numberOfLines={1}>
            {track.artists?.map((a) => a.name).join(", ")}
          </Text>
        </View>

        <View style={styles.trackRight}>
          {track.explicit && (
            <View style={styles.explicitBadge}>
              <Text style={styles.explicitText}>E</Text>
            </View>
          )}
          {hasPreview ? (
            <Pressable
              style={[styles.playButton, isPlaying && styles.playButtonActive]}
              onPress={isPlaying ? onStop : onPlay}
            >
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={18}
                color={isPlaying ? "#1DB954" : palette.text}
              />
            </Pressable>
          ) : (
            <View style={styles.noPreviewBadge}>
              <Ionicons name="lock-closed" size={14} color="#64748b" />
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

// ============================================
// PLAYLIST DETAIL MODAL
// ============================================

interface PlaylistDetailProps {
  playlist: SpotifyPlaylist;
  visible: boolean;
  onClose: () => void;
}

const PlaylistDetail: React.FC<PlaylistDetailProps> = ({
  playlist,
  visible,
  onClose,
}) => {
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (visible && playlist) {
      loadTracks();
    }
    return () => {
      // Stop any playing track when closing
      spotifyDataService.stopPreview();
      setCurrentlyPlayingId(null);
    };
  }, [visible, playlist]);

  const loadTracks = async () => {
    setLoading(true);
    try {
      const playlistTracks = await spotifyDataService.getPlaylistTracks(
        playlist.id
      );
      setTracks(playlistTracks);
    } catch (error) {
      console.error("Failed to load tracks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayTrack = async (track: SpotifyTrack) => {
    try {
      // Stop current track if playing
      if (currentlyPlayingId) {
        await spotifyDataService.stopPreview();
      }

      if (track.preview_url) {
        await spotifyDataService.playPreview(track.preview_url);
        setCurrentlyPlayingId(track.id);
      }
    } catch (error) {
      console.error("Error playing track:", error);
    }
  };

  const handleStopTrack = async () => {
    try {
      await spotifyDataService.stopPreview();
      setCurrentlyPlayingId(null);
    } catch (error) {
      console.error("Error stopping track:", error);
    }
  };

  const imageUrl =
    playlist.images?.[0]?.url ||
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Header with gradient */}
        <LinearGradient
          colors={["#1DB954", "#0a0a0a"]}
          style={styles.modalHeader}
        >
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Ionicons name="chevron-down" size={28} color="#fff" />
          </Pressable>

          <Image source={{ uri: imageUrl }} style={styles.modalCover} />

          <Text style={styles.modalTitle} numberOfLines={2}>
            {playlist.name}
          </Text>

          {playlist.description && (
            <Text style={styles.modalDescription} numberOfLines={2}>
              {playlist.description}
            </Text>
          )}

          <View style={styles.modalMeta}>
            <Text style={styles.modalMetaText}>
              {playlist.owner?.display_name}
            </Text>
            <Text style={styles.modalMetaDot}>•</Text>
            <Text style={styles.modalMetaText}>
              {playlist.tracks?.total || tracks.length} tracks
            </Text>
          </View>
        </LinearGradient>

        {/* Track list */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1DB954" />
            <Text style={styles.loadingText}>Loading tracks...</Text>
          </View>
        ) : (
          <FlatList
            data={tracks}
            keyExtractor={(item, index) => `${item?.id || index}`}
            renderItem={({ item, index }) => (
              <TrackItem
                track={item}
                index={index}
                isPlaying={currentlyPlayingId === item.id}
                onPlay={() => handlePlayTrack(item)}
                onStop={handleStopTrack}
              />
            )}
            contentContainerStyle={styles.trackList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyTracks}>
                <Ionicons
                  name="musical-notes-outline"
                  size={48}
                  color="#64748b"
                />
                <Text style={styles.emptyTracksText}>
                  No tracks in this playlist
                </Text>
              </View>
            }
          />
        )}
      </View>
    </Modal>
  );
};

// ============================================
// PLAYLIST CARD (IMPROVED)
// ============================================

interface PlaylistCardProps {
  playlist: SpotifyPlaylist;
  onPress: () => void;
  index: number;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({
  playlist,
  onPress,
  index,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const imageUrl =
    playlist.images?.[0]?.url ||
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400";

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).springify()}
      style={animatedStyle}
    >
      <Pressable
        style={styles.playlistCard}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Image source={{ uri: imageUrl }} style={styles.playlistImage} />

        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.9)"]}
          style={styles.playlistGradient}
        >
          <View style={styles.playlistInfo}>
            <Text style={styles.playlistName} numberOfLines={1}>
              {playlist.name}
            </Text>
            <View style={styles.playlistMeta}>
              <Ionicons name="musical-notes" size={12} color="#1DB954" />
              <Text style={styles.playlistTrackCount}>
                {playlist.tracks?.total || 0} tracks
              </Text>
            </View>
          </View>

          <View style={styles.playlistPlayButton}>
            <Ionicons name="play" size={20} color="#000" />
          </View>
        </LinearGradient>

        {!playlist.public && (
          <View style={styles.privateBadge}>
            <Ionicons name="lock-closed" size={10} color="#fff" />
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

// ============================================
// MAIN PLAYLIST SCREEN
// ============================================

const PlaylistScreen = () => {
  const {
    playlists,
    connected,
    connecting,
    syncing,
    topTracks,
    connectSpotify,
    syncData,
    isPlaying,
    currentPreviewTrack,
    playTrackPreview,
    stopTrackPreview,
  } = useSpotify();

  const [selectedPlaylist, setSelectedPlaylist] =
    useState<SpotifyPlaylist | null>(null);
  const [showTopTracks, setShowTopTracks] = useState(false);

  // Not connected state
  if (!connected) {
    return (
      <SafeAreaView style={styles.container}>
        <Animated.View entering={FadeIn} style={styles.emptyContainer}>
          <LinearGradient
            colors={["#1DB954", "#191414"]}
            style={styles.iconGradient}
          >
            <Ionicons name="musical-notes" size={48} color="#fff" />
          </LinearGradient>
          <Text style={styles.emptyTitle}>Connect to Spotify</Text>
          <Text style={styles.emptyText}>
            Link your Spotify account to see your playlists and discover matches
            based on your music taste.
          </Text>
          <Pressable
            style={styles.connectButton}
            onPress={connectSpotify}
            disabled={connecting}
          >
            {connecting ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <>
                <Ionicons name="musical-notes" size={22} color="#000" />
                <Text style={styles.connectButtonText}>
                  Connect with Spotify
                </Text>
              </>
            )}
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    );
  }

  const allTopTracks = [
    ...(topTracks?.shortTerm || []),
    ...(topTracks?.mediumTerm || []),
  ].slice(0, 50);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Your Music</Text>
          <Text style={styles.subtitle}>
            {playlists.length} playlists • {allTopTracks.length} top tracks
          </Text>
        </View>
        <Pressable
          onPress={syncData}
          disabled={syncing}
          style={styles.syncButton}
        >
          {syncing ? (
            <ActivityIndicator color="#1DB954" size="small" />
          ) : (
            <Ionicons name="refresh" size={22} color="#1DB954" />
          )}
        </Pressable>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tab, !showTopTracks && styles.tabActive]}
          onPress={() => setShowTopTracks(false)}
        >
          <Ionicons
            name="albums"
            size={18}
            color={!showTopTracks ? "#1DB954" : "#64748b"}
          />
          <Text
            style={[styles.tabText, !showTopTracks && styles.tabTextActive]}
          >
            Playlists
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, showTopTracks && styles.tabActive]}
          onPress={() => setShowTopTracks(true)}
        >
          <Ionicons
            name="trending-up"
            size={18}
            color={showTopTracks ? "#1DB954" : "#64748b"}
          />
          <Text style={[styles.tabText, showTopTracks && styles.tabTextActive]}>
            Top Tracks
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      {showTopTracks ? (
        <FlatList
          key="tracks-list"
          data={allTopTracks}
          keyExtractor={(item, index) => `${item?.id || index}-${index}`}
          renderItem={({ item, index }) => (
            <TrackItem
              track={item}
              index={index}
              isPlaying={currentPreviewTrack?.id === item.id && isPlaying}
              onPlay={() => playTrackPreview(item)}
              onStop={stopTrackPreview}
            />
          )}
          contentContainerStyle={styles.trackList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyTracks}>
              <Ionicons name="trending-up-outline" size={48} color="#64748b" />
              <Text style={styles.emptyTracksText}>
                Sync your data to see top tracks
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          key="playlists-grid"
          data={playlists}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.playlistRow}
          renderItem={({ item, index }) => (
            <PlaylistCard
              playlist={item}
              index={index}
              onPress={() => setSelectedPlaylist(item)}
            />
          )}
          contentContainerStyle={styles.playlistGrid}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyTracks}>
              <Ionicons name="albums-outline" size={48} color="#64748b" />
              <Text style={styles.emptyTracksText}>
                No playlists found. Sync to refresh.
              </Text>
            </View>
          }
        />
      )}

      {/* Playlist Detail Modal */}
      {selectedPlaylist && (
        <PlaylistDetail
          playlist={selectedPlaylist}
          visible={!!selectedPlaylist}
          onClose={() => setSelectedPlaylist(null)}
        />
      )}
    </SafeAreaView>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
  },
  title: {
    color: palette.text,
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    color: palette.muted,
    fontSize: 14,
    marginTop: 4,
  },
  syncButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(29, 185, 84, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Tabs
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  tabActive: {
    backgroundColor: "rgba(29, 185, 84, 0.15)",
  },
  tabText: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#1DB954",
  },

  // Playlist Grid
  playlistGrid: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  playlistRow: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  playlistCard: {
    width: (SCREEN_WIDTH - 48) / 2,
    height: (SCREEN_WIDTH - 48) / 2,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#1a1a1a",
  },
  playlistImage: {
    width: "100%",
    height: "100%",
  },
  playlistGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
    justifyContent: "flex-end",
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  playlistMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  playlistTrackCount: {
    color: "#94a3b8",
    fontSize: 12,
  },
  playlistPlayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1DB954",
    justifyContent: "center",
    alignItems: "center",
  },
  privateBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Track List
  trackList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  trackItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  trackItemPlaying: {
    backgroundColor: "rgba(29, 185, 84, 0.1)",
  },
  trackNumber: {
    width: 24,
    color: "#64748b",
    fontSize: 14,
    fontWeight: "500",
  },
  trackAlbumArt: {
    width: 48,
    height: 48,
    borderRadius: 6,
    overflow: "hidden",
    marginRight: 12,
  },
  trackAlbumImage: {
    width: "100%",
    height: "100%",
  },
  playingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  trackInfo: {
    flex: 1,
    marginRight: 8,
  },
  trackName: {
    color: palette.text,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  trackArtist: {
    color: palette.muted,
    fontSize: 13,
  },
  trackRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  explicitBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  explicitText: {
    color: palette.text,
    fontSize: 9,
    fontWeight: "700",
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  playButtonActive: {
    backgroundColor: "rgba(29, 185, 84, 0.2)",
  },
  noPreviewBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  // Empty States
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    color: palette.text,
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  emptyText: {
    color: palette.muted,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 8,
  },
  connectButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#1DB954",
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 24,
  },
  connectButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "700",
  },
  emptyTracks: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyTracksText: {
    color: "#64748b",
    fontSize: 15,
    marginTop: 16,
    textAlign: "center",
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  modalHeader: {
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  closeButton: {
    alignSelf: "flex-start",
    padding: 8,
    marginBottom: 16,
  },
  modalCover: {
    width: SCREEN_WIDTH * 0.5,
    height: SCREEN_WIDTH * 0.5,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  modalDescription: {
    color: "#94a3b8",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  modalMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalMetaText: {
    color: "#94a3b8",
    fontSize: 13,
  },
  modalMetaDot: {
    color: "#64748b",
    fontSize: 13,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#64748b",
    marginTop: 16,
    fontSize: 14,
  },
});

export default PlaylistScreen;
