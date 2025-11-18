import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useSpotify } from '../context/SpotifyContext';
import { gradients, palette } from '../theme/colors';

const ProfileScreen = () => {
  const { selectedPlaylist, playlists } = useSpotify();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <LinearGradient colors={gradients.glow} style={styles.header}>
        <Image
          source={{ uri: selectedPlaylist?.cover?.url ?? 'https://images.unsplash.com/photo-1504593811423-6dd665756598' }}
          style={styles.avatar}
        />
        <Text style={styles.name}>River Hart</Text>
        <Text style={styles.pronouns}>they/them</Text>
        <Text style={styles.bio}>Brooklyn-based art director mixing ambient and alt R&B</Text>
      </LinearGradient>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Playlist</Text>
        {selectedPlaylist ? (
          <View style={styles.playlistInfo}>
            <Text style={styles.playlistName}>{selectedPlaylist.name}</Text>
            <Text style={styles.playlistDesc}>{selectedPlaylist.description}</Text>
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{selectedPlaylist.tracks.length}</Text>
                <Text style={styles.statLabel}>Tracks</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{selectedPlaylist.followers.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
            </View>
          </View>
        ) : (
          <Text style={styles.empty}>No playlist selected</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Playlists</Text>
        <Text style={styles.count}>{playlists.length} playlists connected</Text>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.buttonSecondary]}>
          <Text style={styles.buttonTextSecondary}>Settings</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background
  },
  content: {
    paddingBottom: 32
  },
  header: {
    padding: 32,
    paddingTop: 48,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    borderWidth: 4,
    borderColor: palette.background
  },
  name: {
    color: palette.text,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4
  },
  pronouns: {
    color: palette.text,
    opacity: 0.8,
    marginBottom: 8
  },
  bio: {
    color: palette.text,
    textAlign: 'center',
    opacity: 0.9
  },
  section: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: palette.border
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12
  },
  playlistInfo: {
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 16
  },
  playlistName: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4
  },
  playlistDesc: {
    color: palette.muted,
    marginBottom: 16
  },
  stats: {
    flexDirection: 'row',
    gap: 24
  },
  stat: {
    flex: 1
  },
  statValue: {
    color: palette.primary,
    fontSize: 24,
    fontWeight: '700'
  },
  statLabel: {
    color: palette.muted,
    fontSize: 12
  },
  empty: {
    color: palette.muted
  },
  count: {
    color: palette.muted
  },
  button: {
    backgroundColor: palette.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12
  },
  buttonText: {
    color: palette.background,
    fontSize: 16,
    fontWeight: '600'
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: palette.border
  },
  buttonTextSecondary: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '600'
  }
});

export default ProfileScreen;

