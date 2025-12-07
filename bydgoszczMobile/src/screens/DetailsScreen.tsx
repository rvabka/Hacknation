import React, { useEffect, useRef, useState } from 'react';
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
  StatusBar,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { DetailsScreenProps } from '../navigation/types';
import { attractions } from '../data/attractions';
import AudioPlayerModal from '../components/AudioPlayer';
import GeminiChatModal from '../components/GeminiChatModal';
import ARViewModal from '../components/ARViewModal';

const { width, height } = Dimensions.get('window');
const GRADIENT_SIZE = Math.sqrt(width * width + height * height) * 1.5;

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

export default function DetailsScreen({
  route,
  navigation
}: DetailsScreenProps) {
  const { id, title, description, location } = route.params;
  const insets = useSafeAreaInsets();

  const attraction = attractions.find(a => a.id === id);

  const [showAudioModal, setShowAudioModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showARModal, setShowARModal] = useState(false);
  const [expandedFunFacts, setExpandedFunFacts] = useState(false);

  const [fontsLoaded] = useFonts({
    Kollektif: require('../../assets/fonts/Kollektif.ttf'),
    'Kollektif-Bold': require('../../assets/fonts/Kollektif-Bold.ttf')
  });

  const spinValue = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const imageScale = useRef(new Animated.Value(1.1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 15000,
        easing: Easing.linear,
        useNativeDriver: true
      })
    ).start();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.timing(imageScale, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      })
    ]).start();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const openMaps = () => {
    if (attraction?.coordinate) {
      const url = Platform.select({
        ios: `maps:0,0?q=${attraction.title}@${attraction.coordinate.latitude},${attraction.coordinate.longitude}`,
        android: `geo:${attraction.coordinate.latitude},${attraction.coordinate.longitude}?q=${attraction.title}`
      });
      if (url) Linking.openURL(url);
    }
  };

  const openNavigation = () => {
    if (attraction?.coordinate) {
      const url = Platform.select({
        ios: `maps:0,0?daddr=${attraction.coordinate.latitude},${attraction.coordinate.longitude}`,
        android: `google.navigation:q=${attraction.coordinate.latitude},${attraction.coordinate.longitude}`
      });
      if (url) Linking.openURL(url);
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  const bottomPadding = 20 + insets.bottom;

  return (
    <View style={styles.mainWrapper}>
      <StatusBar barStyle="dark-content" />

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
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPadding }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {attraction?.image && (
          <Animated.View
            style={[
              styles.heroImageContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: imageScale }]
              }
            ]}
          >
            <Image
              source={attraction.image}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.6)']}
              style={styles.heroGradient}
            />

            {/* Feature badges on image */}
            <View style={styles.heroBadges}>
              {attraction.hasAR && (
                <View style={[styles.heroBadge, styles.arBadge]}>
                  <Ionicons name="cube-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.heroBadgeText}>AR</Text>
                </View>
              )}
              {attraction.hasAudio && (
                <View style={[styles.heroBadge, styles.audioBadge]}>
                  <Ionicons name="headset-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.heroBadgeText}>Audio</Text>
                </View>
              )}
              {attraction.hasAI && (
                <View style={[styles.heroBadge, styles.aiBadgePill]}>
                  <Ionicons name="sparkles" size={14} color="#FFFFFF" />
                  <Text style={styles.heroBadgeText}>AI</Text>
                </View>
              )}
            </View>

            <View style={styles.categoryBadgeHero}>
              <Text style={styles.categoryBadgeText}>
                {attraction.category}
              </Text>
            </View>

            {attraction.yearBuilt && (
              <View style={styles.yearBadgeHero}>
                <Ionicons name="calendar-outline" size={12} color="#FFFFFF" />
                <Text style={styles.yearBadgeText}>{attraction.yearBuilt}</Text>
              </View>
            )}
          </Animated.View>
        )}

        <Animated.View
          style={[
            styles.contentCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.mainSection}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={18} color="#1B4D3E" />
              <Text style={styles.locationText}>{location}, Bydgoszcz</Text>
            </View>
          </View>

          <View style={styles.primaryActionsSection}>
            {attraction?.hasAI && (
              <TouchableOpacity
                style={styles.aiPrimaryButton}
                onPress={() => setShowChatModal(true)}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#1B4D3E', '#2D6A4F']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.aiPrimaryGradient}
                >
                  <View style={styles.aiPrimaryIcon}>
                    <Ionicons name="sparkles" size={24} color="#4ADE80" />
                  </View>
                  <View style={styles.aiPrimaryTextContainer}>
                    <Text style={styles.aiPrimaryTitle}>
                      Zapytaj Przewodnika AI
                    </Text>
                    <Text style={styles.aiPrimarySubtitle}>
                      Dowiedz się wszystkiego o tym miejscu
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#4ADE80" />
                </LinearGradient>
              </TouchableOpacity>
            )}

            <View style={styles.navigationButtonsRow}>
              <TouchableOpacity
                style={styles.navigationButton}
                onPress={openNavigation}
                activeOpacity={0.8}
              >
                <View style={styles.navigationIconContainer}>
                  <Ionicons name="navigate" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.navigationButtonText}>Nawiguj</Text>
                <Text style={styles.navigationButtonSubtext}>
                  Wyznacz trasę
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.mapButton}
                onPress={openMaps}
                activeOpacity={0.8}
              >
                <View style={styles.mapIconContainer}>
                  <Ionicons name="map" size={24} color="#1B4D3E" />
                </View>
                <Text style={styles.mapButtonText}>Mapa</Text>
                <Text style={styles.mapButtonSubtext}>Pokaż lokalizację</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.quickActionsSection}>
            {attraction?.hasAR && (
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => setShowARModal(true)}
              >
                <View
                  style={[
                    styles.quickActionIcon,
                    { backgroundColor: '#8B5CF6' }
                  ]}
                >
                  <Ionicons name="cube-outline" size={22} color="#FFFFFF" />
                </View>
                <Text style={styles.quickActionLabel}>AR View</Text>
              </TouchableOpacity>
            )}

            {attraction?.hasAudio && (
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => setShowAudioModal(true)}
              >
                <View
                  style={[
                    styles.quickActionIcon,
                    { backgroundColor: '#4ADE80' }
                  ]}
                >
                  <Ionicons name="headset" size={22} color="#FFFFFF" />
                </View>
                <Text style={styles.quickActionLabel}>Audio Guide</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.separator} />

          <View style={styles.descriptionSection}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="document-text-outline"
                size={24}
                color="#1B4D3E"
              />
              <Text style={styles.sectionTitle}>Opis</Text>
            </View>
            <Text style={styles.description}>{description}</Text>
          </View>

          {attraction?.funFacts && attraction.funFacts.length > 0 && (
            <>
              <View style={styles.separator} />
              <View style={styles.funFactsSection}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="bulb-outline" size={24} color="#F59E0B" />
                  <Text style={styles.sectionTitle}>Ciekawostki</Text>
                  <View style={styles.funFactsCount}>
                    <Text style={styles.funFactsCountText}>
                      {attraction.funFacts.length}
                    </Text>
                  </View>
                </View>

                <View style={styles.funFactsList}>
                  {(expandedFunFacts
                    ? attraction.funFacts
                    : attraction.funFacts.slice(0, 2)
                  ).map((fact, index) => (
                    <View key={index} style={styles.funFactItem}>
                      <View style={styles.funFactNumber}>
                        <Text style={styles.funFactNumberText}>
                          {index + 1}
                        </Text>
                      </View>
                      <Text style={styles.funFactText}>{fact}</Text>
                    </View>
                  ))}
                </View>

                {attraction.funFacts.length > 2 && (
                  <TouchableOpacity
                    style={styles.expandButton}
                    onPress={() => setExpandedFunFacts(!expandedFunFacts)}
                  >
                    <Text style={styles.expandButtonText}>
                      {expandedFunFacts
                        ? 'Pokaż mniej'
                        : `Pokaż wszystkie (${attraction.funFacts.length})`}
                    </Text>
                    <Ionicons
                      name={expandedFunFacts ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color="#1B4D3E"
                    />
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}

          <View style={styles.separator} />

          <View style={styles.quickInfoSection}>
            <Text style={styles.sectionTitle}>Informacje</Text>

            <View style={styles.infoGrid}>
              <View style={styles.infoCard}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="time-outline" size={24} color="#1B4D3E" />
                </View>
                <Text style={styles.infoLabel}>Godziny otwarcia</Text>
                <Text style={styles.infoValue}>
                  {attraction?.openingHours || 'Całodobowo'}
                </Text>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="cash-outline" size={24} color="#1B4D3E" />
                </View>
                <Text style={styles.infoLabel}>Wstęp</Text>
                <Text style={styles.infoValue}>
                  {attraction?.price || 'Darmowy'}
                </Text>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="camera-outline" size={24} color="#1B4D3E" />
                </View>
                <Text style={styles.infoLabel}>Zdjęcia</Text>
                <Text style={styles.infoValue}>Dozwolone</Text>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.infoIconContainer}>
                  <Ionicons
                    name="accessibility-outline"
                    size={24}
                    color="#1B4D3E"
                  />
                </View>
                <Text style={styles.infoLabel}>Dostępność</Text>
                <Text style={styles.infoValue}>Pełna</Text>
              </View>
            </View>
          </View>

          {attraction?.architect && (
            <>
              <View style={styles.separator} />
              <View style={styles.architectSection}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="person-outline" size={24} color="#1B4D3E" />
                  <Text style={styles.sectionTitle}>Twórca</Text>
                </View>
                <View style={styles.architectCard}>
                  <View style={styles.architectAvatar}>
                    <Ionicons name="brush-outline" size={24} color="#1B4D3E" />
                  </View>
                  <View style={styles.architectInfo}>
                    <Text style={styles.architectName}>
                      {attraction.architect}
                    </Text>
                    <Text style={styles.architectRole}>
                      Architekt / Artysta
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}

          <View style={styles.tagsSection}>
            <Text style={styles.sectionTitle}>Tagi</Text>
            <View style={styles.tagsRow}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>#{attraction?.category}</Text>
              </View>
              <View style={styles.tagActive}>
                <Text style={styles.tagTextActive}>
                  #{location.split(' ')[0]}
                </Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>#Bydgoszcz</Text>
              </View>
              {attraction?.hasAR && (
                <View style={styles.tagAR}>
                  <Text style={styles.tagTextAR}>#AR</Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {attraction?.hasAudio && attraction.mp3 && (
        <AudioPlayerModal
          visible={showAudioModal}
          audioFile={attraction.mp3}
          title={title}
          onClose={() => setShowAudioModal(false)}
        />
      )}

      <GeminiChatModal
        visible={showChatModal}
        attractionTitle={title}
        attractionDescription={description}
        attractionLocation={location}
        onClose={() => setShowChatModal(false)}
      />

      {attraction && (
        <ARViewModal
          visible={showARModal}
          attraction={attraction}
          onClose={() => setShowARModal(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    position: 'relative',
    overflow: 'hidden',
    paddingTop: 35
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
  scrollView: {
    flex: 1,
    zIndex: 1
  },
  scrollContent: {
    padding: 20
  },
  heroImageContainer: {
    height: 220,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20
      },
      android: {
        elevation: 10
      }
    })
  },
  heroImage: {
    width: '100%',
    height: '100%'
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 100
  },
  heroBadges: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4
  },
  arBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.9)'
  },
  audioBadge: {
    backgroundColor: 'rgba(74, 222, 128, 0.9)'
  },
  aiBadgePill: {
    backgroundColor: 'rgba(251, 191, 36, 0.9)'
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Kollektif-Bold'
  },
  categoryBadgeHero: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(27, 77, 62, 0.95)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10
  },
  categoryBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Kollektif-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  yearBadgeHero: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10
  },
  yearBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Kollektif-Bold'
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
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
  mainSection: {
    marginBottom: 20
  },
  title: {
    fontSize: 26,
    fontFamily: 'Kollektif-Bold',
    color: '#000000',
    marginBottom: 8,
    lineHeight: 32
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  locationText: {
    fontSize: 15,
    color: '#1B4D3E',
    fontFamily: 'Kollektif-Bold'
  },
  primaryActionsSection: {
    marginBottom: 20,
    gap: 12
  },
  aiPrimaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#1B4D3E',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12
      },
      android: {
        elevation: 8
      }
    })
  },
  aiPrimaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14
  },
  aiPrimaryIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  aiPrimaryTextContainer: {
    flex: 1
  },
  aiPrimaryTitle: {
    fontSize: 16,
    fontFamily: 'Kollektif-Bold',
    color: '#FFFFFF',
    marginBottom: 2
  },
  aiPrimarySubtitle: {
    fontSize: 13,
    fontFamily: 'Kollektif',
    color: 'rgba(255, 255, 255, 0.8)'
  },
  navigationButtonsRow: {
    flexDirection: 'row',
    gap: 12
  },
  navigationButton: {
    flex: 1,
    backgroundColor: '#1B4D3E',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#1B4D3E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8
      },
      android: {
        elevation: 6
      }
    })
  },
  navigationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  navigationButtonText: {
    fontSize: 16,
    fontFamily: 'Kollektif-Bold',
    color: '#FFFFFF',
    marginBottom: 2
  },
  navigationButtonSubtext: {
    fontSize: 12,
    fontFamily: 'Kollektif',
    color: 'rgba(255, 255, 255, 0.7)'
  },
  mapButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1B4D3E',
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
  mapIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  mapButtonText: {
    fontSize: 16,
    fontFamily: 'Kollektif-Bold',
    color: '#1B4D3E',
    marginBottom: 2
  },
  mapButtonSubtext: {
    fontSize: 12,
    fontFamily: 'Kollektif',
    color: '#666'
  },
  quickActionsSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 0
  },
  quickActionButton: {
    alignItems: 'center',
    gap: 8
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8
      },
      android: {
        elevation: 4
      }
    })
  },
  quickActionLabel: {
    fontSize: 12,
    fontFamily: 'Kollektif-Bold',
    color: '#333'
  },
  separator: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 20
  },
  descriptionSection: {
    marginBottom: 0
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Kollektif-Bold',
    color: '#000000'
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: '#555555',
    fontFamily: 'Kollektif'
  },
  funFactsSection: {
    marginBottom: 0
  },
  funFactsCount: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8
  },
  funFactsCountText: {
    fontSize: 12,
    fontFamily: 'Kollektif-Bold',
    color: '#92400E'
  },
  funFactsList: {
    gap: 12
  },
  funFactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF9E7',
    padding: 14,
    borderRadius: 14,
    gap: 12
  },
  funFactNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center'
  },
  funFactNumberText: {
    fontSize: 14,
    fontFamily: 'Kollektif-Bold',
    color: '#FFFFFF'
  },
  funFactText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#78350F',
    fontFamily: 'Kollektif'
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 10
  },
  expandButtonText: {
    fontSize: 14,
    fontFamily: 'Kollektif-Bold',
    color: '#1B4D3E'
  },
  quickInfoSection: {
    marginBottom: 20
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12
  },
  infoCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center'
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  infoLabel: {
    fontSize: 11,
    fontFamily: 'Kollektif',
    color: '#666666',
    marginBottom: 4,
    textAlign: 'center'
  },
  infoValue: {
    fontSize: 13,
    fontFamily: 'Kollektif-Bold',
    color: '#000000',
    textAlign: 'center'
  },
  architectSection: {
    marginBottom: 20
  },
  architectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 16,
    gap: 14
  },
  architectAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center'
  },
  architectInfo: {
    flex: 1
  },
  architectName: {
    fontSize: 16,
    fontFamily: 'Kollektif-Bold',
    color: '#000000',
    marginBottom: 2
  },
  architectRole: {
    fontSize: 13,
    fontFamily: 'Kollektif',
    color: '#666666'
  },
  tagsSection: {
    marginBottom: 8
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F5F5F5'
  },
  tagText: {
    color: '#666666',
    fontSize: 13,
    fontFamily: 'Kollektif'
  },
  tagActive: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#E8F5E9'
  },
  tagTextActive: {
    color: '#1B4D3E',
    fontSize: 13,
    fontFamily: 'Kollektif-Bold'
  },
  tagAR: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#EDE9FE'
  },
  tagTextAR: {
    color: '#7C3AED',
    fontSize: 13,
    fontFamily: 'Kollektif-Bold'
  }
});
