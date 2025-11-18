import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useSpotify } from '../context/SpotifyContext';
import { gradients, palette } from '../theme/colors';

const sellingPoints = [
  {
    title: 'Match via playlists',
    subtitle: 'We fingerprint BPM, energy, and vibe to find musical chemistry'
  },
  {
    title: 'Share your anthem',
    subtitle: 'Lead with a track that describes your current era'
  },
  {
    title: 'Safe intros',
    subtitle: 'AI-drafted openers seeded with your shared sonic overlap'
  }
];

const OnboardingScreen = () => {
  const { connect, loading, error } = useSpotify();

  return (
    <LinearGradient colors={gradients.dusk} style={styles.root}>
      <ScrollView contentContainerStyle={styles.container}>
        <Image source={{ uri: 'https://images.unsplash.com/photo-1507878866276-a947ef722fee' }} style={styles.hero} />
        <Text style={styles.kicker}>For people who lead with playlists</Text>
        <Text style={styles.title}>Your Spotify era, now dating.</Text>
        <View style={styles.card}>
          {sellingPoints.map(point => (
            <View key={point.title} style={styles.point}>
              <View style={styles.bullet} />
              <View style={{ flex: 1 }}>
                <Text style={styles.pointTitle}>{point.title}</Text>
                <Text style={styles.pointSubtitle}>{point.subtitle}</Text>
              </View>
            </View>
          ))}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity style={styles.cta} onPress={connect} disabled={loading}>
            {loading ? <ActivityIndicator color={palette.background} /> : <Text style={styles.ctaLabel}>Connect Spotify</Text>}
          </TouchableOpacity>
          <Text style={styles.caption}>We never post without permission. Your top tracks seed your dating energy.</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  container: {
    padding: 24,
    paddingBottom: 48
  },
  hero: {
    width: '100%',
    height: 200,
    borderRadius: 24,
    marginBottom: 24
  },
  kicker: {
    color: palette.accent,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8
  },
  title: {
    color: palette.text,
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 24
  },
  card: {
    backgroundColor: '#0b0f1b99',
    borderRadius: 24,
    padding: 20,
    gap: 16
  },
  point: {
    flexDirection: 'row',
    gap: 12
  },
  bullet: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: palette.primary,
    marginTop: 6
  },
  pointTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '600'
  },
  pointSubtitle: {
    color: palette.muted
  },
  cta: {
    backgroundColor: palette.text,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center'
  },
  ctaLabel: {
    color: palette.background,
    fontSize: 18,
    fontWeight: '600'
  },
  error: {
    color: palette.danger,
    textAlign: 'center'
  },
  caption: {
    color: palette.muted,
    textAlign: 'center',
    fontSize: 12
  }
});

export default OnboardingScreen;
