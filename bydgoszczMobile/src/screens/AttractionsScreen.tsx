import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Image,
  Animated,
  Dimensions,
  Easing,
  Share,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AttractionsScreenProps } from '../navigation/types';

const { width, height } = Dimensions.get('window');
const GRADIENT_SIZE = Math.sqrt(width * width + height * height) * 1.5;

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

import { attractions, Attraction } from '../data/attractions';

export default function AttractionsScreen({
  navigation
}: AttractionsScreenProps) {
  const insets = useSafeAreaInsets();

  const [fontsLoaded] = useFonts({
    Kollektif: require('../../assets/fonts/Kollektif.ttf'),
    'Kollektif-Bold': require('../../assets/fonts/Kollektif-Bold.ttf')
  });

  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 15000,
        easing: Easing.linear,
        useNativeDriver: true
      })
    ).start();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const handleShare = async (attraction: Attraction) => {
    try {
      const features = [];
      if (attraction.hasAR) features.push('🎯 Widok AR');
      if (attraction.hasAudio) features.push('🎧 Audio przewodnik');
      if (attraction.hasAI) features.push('🤖 Asystent AI');

      const message = `🏛️ ${attraction.title}

📍 ${attraction.location}, Bydgoszcz
${attraction.yearBuilt ? `📅 Rok: ${attraction.yearBuilt}\n` : ''}
${attraction.description}

${features.length > 0 ? `\n✨ Dostępne funkcje:\n${features.join('\n')}` : ''}

🔗 Odkryj więcej atrakcji Bydgoszczy w aplikacji BydgoszczExplorer!`;

      const result = await Share.share({
        message,
        title: `Odkryj: ${attraction.title}`
      });

      if (result.action === Share.sharedAction) {
      }
    } catch (error: any) {
      Alert.alert('Błąd', 'Nie udało się udostępnić atrakcji');
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  const bottomPadding = 60 + insets.bottom + 20;

  return (
    <View style={styles.mainWrapper}>
      <View style={styles.shimmerContainer}>
        <AnimatedGradient
          colors={[
            '#efe8bd',
            '#1B4D3E',
            '#1B4D3E',
            '#1B4D3E',
            '#1B4D3E',
            '#1B4D3E',
            '#1B4D3E'
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.rotatingGradient, { transform: [{ rotate: spin }] }]}
          pointerEvents="none"
        />
      </View>

      <ScrollView
        style={styles.scrollViewContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPadding }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{attractions.length}</Text>
            <Text style={styles.statLabel}>Atrakcji</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {attractions.filter(a => a.hasAR).length}
            </Text>
            <Text style={styles.statLabel}>Z AR</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {attractions.filter(a => a.hasAudio).length}
            </Text>
            <Text style={styles.statLabel}>Audio</Text>
          </View>
        </View>

        {attractions.map((attraction, index) => (
          <TouchableOpacity
            key={attraction.id}
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => {
              navigation.navigate('Details', {
                id: attraction.id,
                title: attraction.title,
                description: attraction.description,
                location: attraction.location
              });
            }}
          >
            <View style={styles.imageContainer}>
              <Image
                source={attraction.image}
                style={styles.image}
                resizeMode="cover"
              />

              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                style={styles.imageGradient}
              />

              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{attraction.category}</Text>
              </View>

              <TouchableOpacity
                style={styles.shareButton}
                onPress={e => {
                  e.stopPropagation();
                  handleShare(attraction);
                }}
                activeOpacity={0.8}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="share-outline" size={18} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={styles.featuresBadges}>
                {attraction.hasAR && (
                  <View style={[styles.featureBadge, styles.arBadge]}>
                    <Ionicons name="cube-outline" size={14} color="#FFFFFF" />
                    <Text style={styles.featureBadgeText}>AR</Text>
                  </View>
                )}
                {attraction.hasAudio && (
                  <View style={[styles.featureBadge, styles.audioBadge]}>
                    <Ionicons
                      name="headset-outline"
                      size={14}
                      color="#FFFFFF"
                    />
                    <Text style={styles.featureBadgeText}>Audio</Text>
                  </View>
                )}
                {attraction.hasAI && (
                  <View style={[styles.featureBadge, styles.aiBadge]}>
                    <Ionicons name="sparkles" size={14} color="#FFFFFF" />
                    <Text style={styles.featureBadgeText}>AI</Text>
                  </View>
                )}
              </View>

              {attraction.yearBuilt && (
                <View style={styles.yearBadge}>
                  <Ionicons
                    name="calendar-outline"
                    size={12}
                    color="#FFFFFF"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.yearText}>{attraction.yearBuilt}</Text>
                </View>
              )}
            </View>

            <View style={styles.content}>
              <View style={styles.headerRow}>
                <View style={styles.titleWrapper}>
                  <Text style={styles.title}>{attraction.title}</Text>
                  <View style={styles.locationRow}>
                    <Ionicons
                      name="location-sharp"
                      size={16}
                      color="#1B4D3E"
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.locationText}>
                      {attraction.location}, Bydgoszcz
                    </Text>
                  </View>
                </View>

                <View style={styles.arrowButton}>
                  <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
                </View>
              </View>

              <View style={styles.separator} />

              <Text style={styles.description} numberOfLines={2}>
                {attraction.description}
              </Text>

              {attraction.openingHours && (
                <View style={styles.hoursContainer}>
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color="#666"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.hoursText}>
                    {attraction.openingHours}
                  </Text>
                </View>
              )}

              <View style={styles.footer}>
                <View style={styles.tagsRow}>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>#{attraction.category}</Text>
                  </View>
                  <View style={styles.tagActive}>
                    <Text style={styles.tagTextActive}>
                      #{attraction.location.split(' ')[0]}
                    </Text>
                  </View>
                </View>

                <View style={styles.quickInfo}>
                  <Text style={styles.funFactsCount}>
                    {attraction.funFacts?.length || 0} ciekawostek
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.footerInfo}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color="rgba(255,255,255,0.6)"
          />
          <Text style={styles.footerInfoText}>
            Kliknij w atrakcję, aby zobaczyć szczegóły, AR i audio guide
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    position: 'relative',
    overflow: 'hidden'
  },
  shimmerContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0
  },
  rotatingGradient: {
    width: GRADIENT_SIZE,
    height: GRADIENT_SIZE,
    position: 'absolute'
  },
  scrollViewContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    zIndex: 1
  },
  scrollContent: {
    padding: 20,
    paddingTop: 16
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'space-around',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8
      },
      android: {
        elevation: 4
      }
    })
  },
  statItem: {
    alignItems: 'center',
    flex: 1
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Kollektif-Bold',
    color: '#1B4D3E'
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Kollektif',
    color: '#666',
    marginTop: 2
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E0E0E0'
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginBottom: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20
      },
      android: {
        elevation: 8
      }
    })
  },
  imageContainer: {
    height: 200,
    width: '100%',
    position: 'relative',
    backgroundColor: '#E0E7FF'
  },
  image: {
    width: '100%',
    height: '100%'
  },
  imageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80
  },
  categoryBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(27, 77, 62, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Kollektif-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  shareButton: {
    position: 'absolute',
    top: 56,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  featuresBadges: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4
  },
  arBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.9)'
  },
  audioBadge: {
    backgroundColor: 'rgba(74, 222, 128, 0.9)'
  },
  aiBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.9)'
  },
  featureBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Kollektif-Bold'
  },
  yearBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center'
  },
  yearText: {
    color: '#FFFFFF',
    fontFamily: 'Kollektif',
    fontSize: 12
  },
  content: {
    padding: 20
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  titleWrapper: {
    flex: 1,
    paddingRight: 10
  },
  title: {
    fontSize: 20,
    fontFamily: 'Kollektif-Bold',
    color: '#000000',
    marginBottom: 6,
    lineHeight: 24
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  locationText: {
    fontSize: 13,
    color: '#1B4D3E',
    fontFamily: 'Kollektif-Bold'
  },
  arrowButton: {
    backgroundColor: '#1B4D3E',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#1B4D3E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8
      },
      android: {
        elevation: 4
      }
    })
  },
  separator: {
    height: 1,
    backgroundColor: '#EEEEEE',
    width: '100%',
    marginBottom: 12
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: '#555555',
    marginBottom: 12,
    fontFamily: 'Kollektif'
  },
  funFactContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 10
  },
  funFactIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center'
  },
  funFactText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#92400E',
    fontFamily: 'Kollektif'
  },
  hoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  hoursText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Kollektif'
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F5F5F5'
  },
  tagText: {
    color: '#666666',
    fontSize: 12,
    fontFamily: 'Kollektif'
  },
  tagActive: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#E8F5E9'
  },
  tagTextActive: {
    color: '#1B4D3E',
    fontSize: 12,
    fontFamily: 'Kollektif-Bold'
  },
  quickInfo: {
    alignItems: 'flex-end'
  },
  funFactsCount: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'Kollektif'
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
    paddingHorizontal: 20
  },
  footerInfoText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Kollektif',
    textAlign: 'center'
  }
});
