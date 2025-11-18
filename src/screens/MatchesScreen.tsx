import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import MatchCard from '../components/MatchCard';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { Match } from '../types/user';
import { MatchProfile } from '../types/spotify';
import { palette } from '../theme/colors';

const MatchesScreen = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatches();
  }, [user]);

  const loadMatches = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userMatches = await userService.getMatches(user.uid);
      setMatches(userMatches);
    } catch (error) {
      console.error('Failed to load matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMatchPress = (match: Match) => {
    // In a real app, navigate to match detail/chat screen
    console.log('Match pressed:', match.user1Profile.id === user?.uid ? match.user2Profile.displayName : match.user1Profile.displayName);
  };

  const convertMatchToProfile = (match: Match, currentUserId: string): MatchProfile => {
    const otherUser = match.user1Profile.id === currentUserId ? match.user2Profile : match.user1Profile;
    return {
      id: match.id,
      displayName: otherUser.displayName,
      pronouns: otherUser.pronouns,
      compatibility: match.compatibility,
      sharedAttributes: match.sharedAttributes,
      playlist: {
        id: otherUser.activePlaylistId || '',
        name: 'Active Playlist',
        owner: {
          id: otherUser.id,
          displayName: otherUser.displayName
        },
        tracks: [],
        followers: 0,
        tags: [],
        moodVector: {
          acousticness: 0,
          danceability: 0,
          energy: 0,
          instrumentalness: 0,
          liveness: 0,
          speechiness: 0,
          valence: 0
        }
      },
      anthem: undefined,
      lastActive: new Date(match.createdAt).toLocaleDateString()
    };
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Matches</Text>
        <Text style={styles.subtitle}>People who vibe with your playlists</Text>
      </View>
      {loading && matches.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      ) : matches.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No matches yet</Text>
          <Text style={styles.emptySubtext}>Start swiping to find your vibe match!</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            const matchProfile = convertMatchToProfile(item, user?.uid || '');
            return <MatchCard match={matchProfile} onPress={() => handleMatchPress(item)} />;
          }}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadMatches} tintColor={palette.primary} />}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  emptyText: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8
  },
  emptySubtext: {
    color: palette.muted,
    textAlign: 'center'
  }
});

export default MatchesScreen;

