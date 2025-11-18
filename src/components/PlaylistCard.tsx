import React from 'react';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { SpotifyPlaylist } from '../types/spotify';
import { palette } from '../theme/colors';

interface Props {
  playlist: SpotifyPlaylist;
  onPress?: (playlist: SpotifyPlaylist) => void;
  isActive?: boolean;
}

const PlaylistCard: React.FC<Props> = ({ playlist, onPress, isActive }) => (
  <TouchableOpacity onPress={() => onPress?.(playlist)} activeOpacity={0.9} style={[styles.card, isActive && styles.active]}>
    <ImageBackground source={{ uri: playlist.cover?.url }} style={styles.cover} imageStyle={{ borderRadius: 24 }}>
      <View style={styles.overlay}>
        <Text style={styles.title}>{playlist.name}</Text>
        <Text style={styles.subtitle}>{playlist.description}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{playlist.followers.toLocaleString()} followers</Text>
          <Text style={styles.meta}>{playlist.tracks.length} tracks</Text>
        </View>
        <View style={styles.tagRow}>
          {playlist.tags.map(tag => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagLabel}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </ImageBackground>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent'
  },
  active: {
    borderColor: palette.primary
  },
  cover: {
    height: 260,
    justifyContent: 'flex-end'
  },
  overlay: {
    backgroundColor: '#05070dcc',
    padding: 20,
    gap: 8,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24
  },
  title: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '700'
  },
  subtitle: {
    color: palette.muted
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  meta: {
    color: palette.text,
    fontSize: 12
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#ffffff22'
  },
  tagLabel: {
    color: palette.text,
    fontSize: 12
  }
});

export default PlaylistCard;
