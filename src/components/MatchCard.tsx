import React from 'react';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { MatchProfile } from '../types/spotify';
import { palette } from '../theme/colors';

interface Props {
  match: MatchProfile;
  onPress?: (match: MatchProfile) => void;
}

const MatchCard: React.FC<Props> = ({ match, onPress }) => (
  <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={() => onPress?.(match)}>
    <ImageBackground source={{ uri: match.playlist.cover?.url }} style={styles.cover} imageStyle={{ borderRadius: 24 }}>
      <View style={styles.overlay}>
        <View style={styles.row}>
          <View>
            <Text style={styles.name}>{match.displayName}</Text>
            <Text style={styles.subtitle}>{match.pronouns}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeLabel}>{match.compatibility}% vibe</Text>
          </View>
        </View>
        <Text style={styles.anthem}>Anthem · {match.anthem?.name}</Text>
        <View style={styles.tagRow}>
          {match.sharedAttributes.map(attr => (
            <View key={attr} style={styles.tag}>
              <Text style={styles.tagLabel}>{attr}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.meta}>{match.lastActive} · {match.playlist.tracks.length} shared sonics</Text>
      </View>
    </ImageBackground>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16
  },
  cover: {
    height: 240,
    justifyContent: 'flex-end'
  },
  overlay: {
    backgroundColor: '#05070db3',
    padding: 20,
    gap: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  name: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '700'
  },
  subtitle: {
    color: palette.muted
  },
  anthem: {
    color: palette.text,
    fontWeight: '600'
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  tag: {
    backgroundColor: '#ffffff22',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  tagLabel: {
    color: palette.text,
    fontSize: 12
  },
  badge: {
    backgroundColor: '#05070dcc',
    borderWidth: 1,
    borderColor: palette.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  badgeLabel: {
    color: palette.primary,
    fontWeight: '700'
  },
  meta: {
    color: palette.muted,
    fontSize: 12
  }
});

export default MatchCard;
