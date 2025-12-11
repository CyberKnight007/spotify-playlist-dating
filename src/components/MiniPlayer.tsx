import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  Easing,
  runOnJS,
  interpolate,
  Extrapolation,
  useAnimatedProps,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Svg, { Circle } from "react-native-svg";
import { useSpotify } from "../context/SpotifyContext";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const BUTTON_SIZE = 60;
const EXPANDED_WIDTH = SCREEN_WIDTH - 32;
const EXPANDED_HEIGHT = 180;

type PlayerMode = "preview" | "spotify" | null;

const MiniPlayer: React.FC = () => {
  const {
    isPlaying: isPreviewPlaying,
    currentPreviewTrack,
    playbackProgress: previewProgress,
    playbackDuration: previewDuration,
    togglePlayback: togglePreviewPlayback,
    stopTrackPreview,
    spotifyPlayback,
    isSpotifyPlaying,
    toggleSpotifyPlayback,
    skipToNext,
    skipToPrevious,
    connected,
  } = useSpotify();

  const [playerMode, setPlayerMode] = useState<PlayerMode>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Animation values
  const translateX = useSharedValue(SCREEN_WIDTH - BUTTON_SIZE - 20);
  const translateY = useSharedValue(SCREEN_HEIGHT - 200);
  const expandProgress = useSharedValue(0);
  const rotation = useSharedValue(0);
  const buttonScale = useSharedValue(1);
  const progressWidth = useSharedValue(0);

  // Context for drag gesture
  const contextX = useSharedValue(0);
  const contextY = useSharedValue(0);

  // Determine which mode to show
  useEffect(() => {
    if (currentPreviewTrack) {
      setPlayerMode("preview");
    } else if (spotifyPlayback?.item) {
      setPlayerMode("spotify");
    } else {
      setPlayerMode(null);
    }
  }, [currentPreviewTrack, spotifyPlayback]);

  const currentTrack =
    playerMode === "preview" ? currentPreviewTrack : spotifyPlayback?.item;

  const isPlaying =
    playerMode === "preview" ? isPreviewPlaying : isSpotifyPlaying;

  const progress =
    playerMode === "preview"
      ? previewProgress
      : spotifyPlayback?.progress_ms || 0;

  const duration =
    playerMode === "preview"
      ? previewDuration
      : spotifyPlayback?.item?.duration_ms || 0;

  // Rotate album art when playing
  useEffect(() => {
    if (isPlaying) {
      rotation.value = withRepeat(
        withTiming(rotation.value + 360, {
          duration: 8000,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    }
  }, [isPlaying, rotation]);

  // Update progress bar
  useEffect(() => {
    const progressPercent = duration > 0 ? progress / duration : 0;
    progressWidth.value = withTiming(progressPercent, { duration: 100 });
  }, [progress, duration, progressWidth]);

  // Expand/Collapse animation
  const toggleExpand = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    expandProgress.value = withSpring(newExpanded ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });

    if (newExpanded) {
      // Center when expanded
      translateX.value = withSpring(16);
      translateY.value = withSpring(SCREEN_HEIGHT - EXPANDED_HEIGHT - 120);
    }
  };

  // Drag gesture
  const dragGesture = Gesture.Pan()
    .onStart(() => {
      contextX.value = translateX.value;
      contextY.value = translateY.value;
    })
    .onUpdate((event) => {
      if (!isExpanded) {
        translateX.value = Math.max(
          10,
          Math.min(
            contextX.value + event.translationX,
            SCREEN_WIDTH - BUTTON_SIZE - 10
          )
        );
        translateY.value = Math.max(
          100,
          Math.min(
            contextY.value + event.translationY,
            SCREEN_HEIGHT - BUTTON_SIZE - 100
          )
        );
      }
    })
    .onEnd(() => {
      // Snap to edges
      if (!isExpanded) {
        const snapToRight =
          translateX.value > SCREEN_WIDTH / 2 - BUTTON_SIZE / 2;
        translateX.value = withSpring(
          snapToRight ? SCREEN_WIDTH - BUTTON_SIZE - 16 : 16,
          { damping: 15 }
        );
      }
    });

  // Tap gesture - only triggers expand when collapsed
  const tapGesture = Gesture.Tap()
    .onStart(() => {
      if (!isExpanded) {
        buttonScale.value = withSpring(0.9);
      }
    })
    .onEnd(() => {
      if (!isExpanded) {
        buttonScale.value = withSpring(1);
        runOnJS(toggleExpand)();
      }
    });

  const combinedGesture = Gesture.Race(
    Gesture.Exclusive(
      Gesture.LongPress()
        .minDuration(200)
        .onEnd(() => {
          // Long press starts drag
        }),
      tapGesture
    ),
    dragGesture
  );

  // Animated styles
  const containerStyle = useAnimatedStyle(() => {
    const width = interpolate(
      expandProgress.value,
      [0, 1],
      [BUTTON_SIZE, EXPANDED_WIDTH],
      Extrapolation.CLAMP
    );
    const height = interpolate(
      expandProgress.value,
      [0, 1],
      [BUTTON_SIZE, EXPANDED_HEIGHT],
      Extrapolation.CLAMP
    );
    const borderRadius = interpolate(
      expandProgress.value,
      [0, 1],
      [BUTTON_SIZE / 2, 20],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: buttonScale.value },
      ],
      width,
      height,
      borderRadius,
    };
  });

  const albumStyle = useAnimatedStyle(() => {
    const size = interpolate(
      expandProgress.value,
      [0, 1],
      [BUTTON_SIZE - 12, 100],
      Extrapolation.CLAMP
    );
    return {
      width: size,
      height: size,
      borderRadius: size / 2,
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const contentOpacity = useAnimatedStyle(() => ({
    opacity: expandProgress.value,
  }));

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  // Circular progress bar for collapsed state
  const CIRCLE_SIZE = BUTTON_SIZE;
  const STROKE_WIDTH = 3;
  const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  const circleProgressProps = useAnimatedProps(() => {
    const strokeDashoffset = CIRCUMFERENCE * (1 - progressWidth.value);
    return {
      strokeDashoffset,
    };
  });

  // Don't render if no track
  if (!currentTrack) {
    return null;
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const albumImageUrl =
    currentTrack?.album?.images?.[0]?.url ||
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100";

  const handlePlayPause = async () => {
    if (playerMode === "preview") {
      togglePreviewPlayback();
    } else if (playerMode === "spotify") {
      await toggleSpotifyPlayback();
    }
  };

  const handleClose = () => {
    if (playerMode === "preview") {
      stopTrackPreview();
    }
    setIsExpanded(false);
    expandProgress.value = withSpring(0);
  };

  return (
    <GestureDetector gesture={Gesture.Simultaneous(dragGesture, tapGesture)}>
      <Animated.View style={[styles.container, containerStyle]}>
        <BlurView intensity={95} tint="dark" style={styles.blurContainer}>
          {/* Collapsed State - Album Art with Circular Progress */}
          {!isExpanded && (
            <View style={styles.collapsedContent}>
              {/* Circular Progress Ring */}
              <View style={styles.circularProgressContainer}>
                <Svg
                  width={CIRCLE_SIZE}
                  height={CIRCLE_SIZE}
                  viewBox={`0 0 ${CIRCLE_SIZE} ${CIRCLE_SIZE}`}
                  style={{ transform: [{ rotate: "-90deg" }] }}
                >
                  {/* Background Circle */}
                  <Circle
                    cx={CIRCLE_SIZE / 2}
                    cy={CIRCLE_SIZE / 2}
                    r={RADIUS}
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth={STROKE_WIDTH}
                    fill="transparent"
                  />
                  {/* Progress Circle */}
                  <AnimatedCircle
                    cx={CIRCLE_SIZE / 2}
                    cy={CIRCLE_SIZE / 2}
                    r={RADIUS}
                    stroke="#1DB954"
                    strokeWidth={STROKE_WIDTH}
                    fill="transparent"
                    strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                    animatedProps={circleProgressProps}
                    strokeLinecap="round"
                  />
                </Svg>
                {/* Album Art inside the ring */}
                <Animated.Image
                  source={{ uri: albumImageUrl }}
                  style={[styles.collapsedAlbum, albumStyle]}
                />
              </View>
            </View>
          )}

          {/* Expanded State */}
          {isExpanded && (
            <Animated.View style={[styles.expandedContent, contentOpacity]}>
              {/* Header with close button */}
              <View style={styles.expandedHeader}>
                <View style={styles.modeBadge}>
                  <Ionicons
                    name={
                      playerMode === "spotify"
                        ? "musical-notes"
                        : "musical-note"
                    }
                    size={12}
                    color="#1DB954"
                  />
                  <Text style={styles.modeText}>
                    {playerMode === "spotify" ? "Spotify" : "Preview"}
                  </Text>
                </View>
                <Pressable onPress={handleClose} style={styles.closeButton}>
                  <Ionicons name="chevron-down" size={20} color="#94a3b8" />
                </Pressable>
              </View>

              {/* Main Content */}
              <View style={styles.mainContent}>
                {/* Album Art */}
                <Animated.View style={styles.albumContainer}>
                  <Animated.Image
                    source={{ uri: albumImageUrl }}
                    style={[styles.expandedAlbum, albumStyle]}
                  />
                  {isPlaying && <View style={styles.expandedPlayingRing} />}
                </Animated.View>

                {/* Track Info & Controls */}
                <View style={styles.infoContainer}>
                  <Text style={styles.trackName} numberOfLines={1}>
                    {currentTrack?.name}
                  </Text>
                  <Text style={styles.artistName} numberOfLines={1}>
                    {currentTrack?.artists?.map((a) => a.name).join(", ")}
                  </Text>

                  {/* Progress Bar */}
                  <View style={styles.progressContainer}>
                    <Animated.View
                      style={[styles.progressBar, progressBarStyle]}
                    />
                  </View>
                  <View style={styles.timeRow}>
                    <Text style={styles.timeText}>{formatTime(progress)}</Text>
                    <Text style={styles.timeText}>{formatTime(duration)}</Text>
                  </View>

                  {/* Controls */}
                  <View style={styles.controls}>
                    {playerMode === "spotify" && (
                      <Pressable
                        style={styles.skipButton}
                        onPress={skipToPrevious}
                      >
                        <Ionicons
                          name="play-skip-back"
                          size={22}
                          color="#fff"
                        />
                      </Pressable>
                    )}
                    <Pressable
                      style={styles.playButton}
                      onPress={handlePlayPause}
                    >
                      <Ionicons
                        name={isPlaying ? "pause" : "play"}
                        size={28}
                        color="#000"
                      />
                    </Pressable>
                    {playerMode === "spotify" && (
                      <Pressable style={styles.skipButton} onPress={skipToNext}>
                        <Ionicons
                          name="play-skip-forward"
                          size={22}
                          color="#fff"
                        />
                      </Pressable>
                    )}
                  </View>
                </View>
              </View>
            </Animated.View>
          )}
        </BlurView>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 9999,
    elevation: 10,
    shadowColor: "#1DB954",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  blurContainer: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 30,
    backgroundColor: "rgba(15, 15, 15, 0.95)",
    borderWidth: 2,
    borderColor: "rgba(29, 185, 84, 0.4)",
  },
  // Collapsed State
  collapsedContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  circularProgressContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
  },
  collapsedAlbum: {
    borderRadius: 26,
    position: "absolute",
  },
  // Expanded State
  expandedContent: {
    flex: 1,
    padding: 12,
  },
  expandedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(29, 185, 84, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modeText: {
    color: "#1DB954",
    fontSize: 11,
    fontWeight: "600",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  mainContent: {
    flexDirection: "row",
    flex: 1,
    gap: 12,
  },
  albumContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  expandedAlbum: {
    borderRadius: 50,
  },
  expandedPlayingRing: {
    position: "absolute",
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 2,
    borderColor: "#1DB954",
  },
  infoContainer: {
    flex: 1,
    justifyContent: "center",
  },
  trackName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  artistName: {
    color: "#94a3b8",
    fontSize: 13,
    marginBottom: 8,
  },
  progressContainer: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#1DB954",
    borderRadius: 2,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 8,
  },
  timeText: {
    color: "#64748b",
    fontSize: 10,
    fontFamily: "monospace",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  skipButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  playButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#1DB954",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default MiniPlayer;
