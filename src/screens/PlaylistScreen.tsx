import React from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import PlaylistCard from '../components/PlaylistCard';
import { useSpotify } from '../context/SpotifyContext';
import { palette } from '../theme/colors';

const PlaylistScreen = () => {
  const { playlists, selectedPlaylist, selectPlaylist } = useSpotify();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Playlists</Text>
        <Text style={styles.subtitle}>Select one to represent your vibe</Text>
      </View>
      <FlatList
        data={playlists}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <PlaylistCard playlist={item} onPress={selectPlaylist} isActive={selectedPlaylist?.id === item.id} />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background
  },
  header: {
    padding: 24,
    paddingBottom: 16
  },
  title: {
    color: palette.text,
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4
  },
  subtitle: {
    color: palette.muted
  },
  list: {
    padding: 16,
    paddingTop: 0
  }
});

export default PlaylistScreen;

