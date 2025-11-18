import React, { useEffect, useState, useRef } from 'react';
import { Animated, Dimensions, ImageBackground, PanResponder, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { SwipeCard } from '../types/user';
import { palette } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;

const SwipeScreen = () => {
  const { user } = useAuth();
  const [cards, setCards] = useState<SwipeCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const position = useRef(new Animated.ValueXY()).current;
  const rotateCard = position.x.interpolate({
    inputRange: [-200, 0, 200],
    outputRange: ['-30deg', '0deg', '30deg']
  });

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    if (!user) return;
    const newCards = await userService.getSwipeCards(user.uid, 20);
    setCards(newCards);
    setCurrentIndex(0);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          handleSwipe('like');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          handleSwipe('pass');
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false
          }).start();
        }
      }
    })
  ).current;

  const handleSwipe = async (action: 'like' | 'pass') => {
    if (!user || currentIndex >= cards.length) return;

    const card = cards[currentIndex];
    await userService.recordSwipe(user.uid, card.userId, action);

    Animated.timing(position, {
      toValue: { x: action === 'like' ? SCREEN_WIDTH + 100 : -SCREEN_WIDTH - 100, y: 0 },
      duration: 300,
      useNativeDriver: false
    }).start(() => {
      position.setValue({ x: 0, y: 0 });
      setCurrentIndex(prev => prev + 1);
      if (currentIndex + 1 >= cards.length - 3) {
        loadCards();
      }
    });
  };

  if (currentIndex >= cards.length) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No more profiles</Text>
          <Text style={styles.emptySubtext}>Check back later for new matches!</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentCard = cards[currentIndex];
  const nextCard = cards[currentIndex + 1];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        <Text style={styles.subtitle}>Swipe to find your vibe match</Text>
      </View>

      <View style={styles.cardContainer}>
        {nextCard && (
          <View style={[styles.card, styles.nextCard]}>
            <ImageBackground source={{ uri: nextCard.avatar || nextCard.activePlaylist?.cover?.url }} style={styles.cardImage}>
              <View style={styles.cardOverlay}>
                <Text style={styles.cardName}>{nextCard.displayName}</Text>
              </View>
            </ImageBackground>
          </View>
        )}

        {currentCard && (
          <Animated.View
            style={[
              styles.card,
              {
                transform: [
                  { translateX: position.x },
                  { translateY: position.y },
                  { rotate: rotateCard }
                ]
              }
            ]}
            {...panResponder.panHandlers}
          >
            <ImageBackground
              source={{ uri: currentCard.avatar || currentCard.activePlaylist?.cover?.url }}
              style={styles.cardImage}
            >
              <View style={styles.cardOverlay}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardName}>{currentCard.displayName}</Text>
                    {currentCard.age && <Text style={styles.cardAge}>{currentCard.age} years old</Text>}
                    {currentCard.pronouns && <Text style={styles.cardPronouns}>{currentCard.pronouns}</Text>}
                  </View>
                  {currentCard.compatibility && (
                    <View style={styles.compatibilityBadge}>
                      <Text style={styles.compatibilityText}>{currentCard.compatibility}%</Text>
                    </View>
                  )}
                </View>
                {currentCard.bio && <Text style={styles.cardBio}>{currentCard.bio}</Text>}
                {currentCard.activePlaylist && (
                  <View style={styles.playlistInfo}>
                    <Text style={styles.playlistName}>Active Playlist: {currentCard.activePlaylist.name}</Text>
                  </View>
                )}
              </View>
            </ImageBackground>
          </Animated.View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionButton, styles.passButton]} onPress={() => handleSwipe('pass')}>
          <Ionicons name="close" size={32} color={palette.danger} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.likeButton]} onPress={() => handleSwipe('like')}>
          <Ionicons name="heart" size={32} color={palette.primary} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// Fix: Add TouchableOpacity import
import { TouchableOpacity } from 'react-native';

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
    fontSize: 32,
    fontWeight: '700',
    color: palette.text,
    marginBottom: 4
  },
  subtitle: {
    color: palette.muted
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20
  },
  card: {
    width: SCREEN_WIDTH - 40,
    height: 600,
    borderRadius: 24,
    position: 'absolute',
    overflow: 'hidden'
  },
  nextCard: {
    transform: [{ scale: 0.95 }],
    opacity: 0.7
  },
  cardImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end'
  },
  cardOverlay: {
    backgroundColor: '#05070dcc',
    padding: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  cardName: {
    fontSize: 28,
    fontWeight: '700',
    color: palette.text
  },
  cardAge: {
    fontSize: 16,
    color: palette.muted,
    marginTop: 4
  },
  cardPronouns: {
    fontSize: 14,
    color: palette.muted
  },
  compatibilityBadge: {
    backgroundColor: palette.primary + '22',
    borderWidth: 1,
    borderColor: palette.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  compatibilityText: {
    color: palette.primary,
    fontWeight: '700'
  },
  cardBio: {
    fontSize: 16,
    color: palette.text,
    marginBottom: 12
  },
  playlistInfo: {
    marginTop: 8
  },
  playlistName: {
    fontSize: 14,
    color: palette.primary,
    fontWeight: '600'
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    padding: 24,
    paddingBottom: 40
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: palette.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2
  },
  passButton: {
    borderColor: palette.danger
  },
  likeButton: {
    borderColor: palette.primary
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  emptyText: {
    fontSize: 24,
    fontWeight: '600',
    color: palette.text,
    marginBottom: 8
  },
  emptySubtext: {
    fontSize: 16,
    color: palette.muted,
    textAlign: 'center'
  }
});

export default SwipeScreen;

