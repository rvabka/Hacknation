import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Animated,
  Easing,
  Dimensions,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useFonts } from 'expo-font';
import {
  attractions,
  Attraction,
  CATEGORY_COLORS,
  CATEGORY_ICONS
} from '../data/attractions';

const { width, height } = Dimensions.get('window');
const GRADIENT_SIZE = Math.sqrt(width * width + height * height) * 1.5;

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent';

interface PlannedAttraction extends Attraction {
  estimatedTime: number;
  walkingTime: number;
  order: number;
  distance: number;
}

interface UserLocation {
  latitude: number;
  longitude: number;
}

const TIME_OPTIONS = [
  { label: '1h', value: 60 },
  { label: '2h', value: 120 },
  { label: '3h', value: 180 },
  { label: '4h', value: 240 },
  { label: 'Cały dzień', value: 480 }
];

const PACE_OPTIONS = [
  { label: 'Szybkie', value: 'fast', icon: 'flash-outline', multiplier: 0.7 },
  { label: 'Normalne', value: 'normal', icon: 'walk-outline', multiplier: 1 },
  { label: 'Spokojne', value: 'slow', icon: 'cafe-outline', multiplier: 1.3 }
];

const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const estimateVisitTime = (attraction: Attraction): number => {
  let baseTime = 15;

  switch (attraction.category) {
    case 'Muzeum':
      baseTime = 45;
      break;
    case 'Sakralny':
      baseTime = 25;
      break;
    case 'Architektura':
      baseTime = 20;
      break;
    case 'Rzeźba':
      baseTime = 10;
      break;
    case 'Zabytek techniki':
      baseTime = 30;
      break;
  }

  if (attraction.hasAR) baseTime += 10;
  if (attraction.hasAudio) baseTime += 15;

  return baseTime;
};

const calculateWalkingTime = (distanceMeters: number): number => {
  const walkingSpeedMps = 5000 / 60;
  return Math.ceil(distanceMeters / walkingSpeedMps);
};

export default function PlannerScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({
    Kollektif: require('../../assets/fonts/Kollektif.ttf'),
    'Kollektif-Bold': require('../../assets/fonts/Kollektif-Bold.ttf')
  });

  const [selectedTime, setSelectedTime] = useState<number>(120);
  const [selectedPace, setSelectedPace] = useState<string>('normal');
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [plannedRoute, setPlannedRoute] = useState<PlannedAttraction[] | null>(
    null
  );
  const [aiTips, setAiTips] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const spinValue = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const categories = [...new Set(attractions.map(a => a.category))];

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 15000,
        easing: Easing.linear,
        useNativeDriver: true
      })
    ).start();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const getLocation = async () => {
    setIsGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Brak dostępu',
          'Włącz dostęp do lokalizacji, aby zaplanować trasę od Twojego miejsca'
        );
        setUserLocation({ latitude: 51.2465, longitude: 22.5684 });
      } else {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
      }
    } catch (error) {
      setUserLocation({ latitude: 51.2465, longitude: 22.5684 });
    }
    setIsGettingLocation(false);
  };

  useEffect(() => {
    getLocation();
  }, []);

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const planRoute = async () => {
    if (!userLocation) {
      Alert.alert('Błąd', 'Poczekaj na pobranie lokalizacji');
      return;
    }

    setIsLoading(true);
    setPlannedRoute(null);
    setAiTips(null);

    try {
      const paceMultiplier =
        PACE_OPTIONS.find(p => p.value === selectedPace)?.multiplier || 1;
      const availableTime = selectedTime;


      let filteredAttractions =
        selectedCategories.length > 0
          ? attractions.filter(a => selectedCategories.includes(a.category))
          : attractions;

      let attractionsWithDistance = filteredAttractions.map(attraction => ({
        ...attraction,
        distance: calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          attraction.coordinate.latitude,
          attraction.coordinate.longitude
        ),
        estimatedTime: Math.round(
          estimateVisitTime(attraction) * paceMultiplier
        ),
        walkingTime: 0,
        order: 0
      }));

      const planned: PlannedAttraction[] = [];
      let currentLocation = userLocation;
      let totalTime = 0;
      let remainingAttractions = [...attractionsWithDistance];

      while (remainingAttractions.length > 0 && totalTime < availableTime) {
        remainingAttractions = remainingAttractions.map(a => ({
          ...a,
          distance: calculateDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            a.coordinate.latitude,
            a.coordinate.longitude
          )
        }));

        remainingAttractions.sort((a, b) => a.distance - b.distance);

        const nearest = remainingAttractions[0];
        const walkingTime = calculateWalkingTime(nearest.distance);
        const totalTimeForThis = walkingTime + nearest.estimatedTime;

        if (totalTime + totalTimeForThis <= availableTime) {
          planned.push({
            ...nearest,
            walkingTime,
            order: planned.length + 1
          });

          totalTime += totalTimeForThis;
          currentLocation = {
            latitude: nearest.coordinate.latitude,
            longitude: nearest.coordinate.longitude
          };
          remainingAttractions = remainingAttractions.slice(1);
        } else {
          break;
        }
      }

      setPlannedRoute(planned);

      Animated.spring(slideAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true
      }).start();

      if (GEMINI_API_KEY && planned.length > 0) {
        await getAITips(planned, availableTime, selectedPace);
      }
    } catch (error) {
      console.error('Planning error:', error);
      Alert.alert('Błąd', 'Nie udało się zaplanować trasy');
    }

    setIsLoading(false);
  };

  const getAITips = async (
    route: PlannedAttraction[],
    time: number,
    pace: string
  ) => {
    try {
      const routeDescription = route
        .map(
          (a, i) =>
            `${i + 1}. ${a.title} (${a.category}) - ok. ${a.estimatedTime} min`
        )
        .join('\n');

      const prompt = `Jesteś lokalnym przewodnikiem po Lublinie. Turysta ma ${time} minut na zwiedzanie w tempie "${pace}".
Zaplanowana trasa:
${routeDescription}

Podaj 2-3 krótkie, praktyczne wskazówki dotyczące tej konkretnej trasy (np. gdzie zjeść po drodze, co dodatkowo zobaczyć w okolicy, najlepsze punkty na zdjęcia). Bądź konkretny i pomocny. Odpowiedz po polsku, maksymalnie 150 słów.`;

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 300
          }
        })
      });

      const data = await response.json();
      const tips = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (tips) {
        setAiTips(tips);
      }
    } catch (error) {
      console.log('AI tips error:', error);
    }
  };

  const getTotalTime = () => {
    if (!plannedRoute) return 0;
    return plannedRoute.reduce(
      (sum, a) => sum + a.estimatedTime + a.walkingTime,
      0
    );
  };

  const getTotalDistance = () => {
    if (!plannedRoute) return 0;
    return plannedRoute.reduce((sum, a) => sum + a.distance, 0);
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  if (!fontsLoaded) return null;

  const bottomPadding = 70 + insets.bottom + 20;

  return (
    <View style={styles.container}>
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
        <View style={styles.headerCard}>
          <View style={styles.headerIcon}>
            <Ionicons name="map-outline" size={28} color="#1B4D3E" />
          </View>
          <Text style={styles.headerTitle}>Zaplanuj zwiedzanie</Text>
          <Text style={styles.headerSubtitle}>
            Stwórz optymalną trasę dopasowaną do Twojego czasu
          </Text>
        </View>

        <View style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <Ionicons
              name={userLocation ? 'location' : 'location-outline'}
              size={20}
              color={userLocation ? '#4ADE80' : '#666'}
            />
            <Text style={styles.locationText}>
              {isGettingLocation
                ? 'Pobieranie lokalizacji...'
                : userLocation
                ? 'Lokalizacja pobrana'
                : 'Brak lokalizacji'}
            </Text>
          </View>
          {!userLocation && !isGettingLocation && (
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={getLocation}
            >
              <Ionicons name="refresh" size={18} color="#1B4D3E" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="time-outline" size={18} color="#1B4D3E" /> Ile masz
            czasu?
          </Text>
          <View style={styles.optionsRow}>
            {TIME_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  selectedTime === option.value && styles.optionButtonActive
                ]}
                onPress={() => setSelectedTime(option.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedTime === option.value && styles.optionTextActive
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="speedometer-outline" size={18} color="#1B4D3E" />{' '}
            Tempo zwiedzania
          </Text>
          <View style={styles.paceRow}>
            {PACE_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.paceButton,
                  selectedPace === option.value && styles.paceButtonActive
                ]}
                onPress={() => setSelectedPace(option.value)}
              >
                <Ionicons
                  name={option.icon as any}
                  size={24}
                  color={selectedPace === option.value ? '#1B4D3E' : '#666'}
                />
                <Text
                  style={[
                    styles.paceText,
                    selectedPace === option.value && styles.paceTextActive
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="filter-outline" size={18} color="#1B4D3E" />{' '}
            Kategorie (opcjonalnie)
          </Text>
          <View style={styles.categoriesRow}>
            {categories.map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  selectedCategories.includes(category) && {
                    backgroundColor:
                      CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS],
                    borderColor:
                      CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]
                  }
                ]}
                onPress={() => toggleCategory(category)}
              >
                <Ionicons
                  name={
                    CATEGORY_ICONS[
                      category as keyof typeof CATEGORY_ICONS
                    ] as any
                  }
                  size={14}
                  color={
                    selectedCategories.includes(category) ? '#FFF' : '#666'
                  }
                />
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategories.includes(category) &&
                      styles.categoryChipTextActive
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.planButton, isLoading && styles.planButtonDisabled]}
          onPress={planRoute}
          disabled={isLoading || !userLocation}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <>
              <ActivityIndicator size="small" color="#1B4D3E" />
              <Text style={styles.planButtonText}>Planuję trasę...</Text>
            </>
          ) : (
            <>
              <Ionicons name="sparkles" size={22} color="#1B4D3E" />
              <Text style={styles.planButtonText}>Zaplanuj trasę z AI</Text>
            </>
          )}
        </TouchableOpacity>

        {plannedRoute && plannedRoute.length > 0 && (
          <Animated.View
            style={[
              styles.resultsContainer,
              {
                opacity: slideAnim,
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0]
                    })
                  }
                ]
              }
            ]}
          >
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Twoja trasa</Text>
              <View style={styles.summaryStats}>
                <View style={styles.summaryStat}>
                  <Ionicons name="location" size={20} color="#4ADE80" />
                  <Text style={styles.summaryValue}>{plannedRoute.length}</Text>
                  <Text style={styles.summaryLabel}>miejsc</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryStat}>
                  <Ionicons name="time" size={20} color="#4ADE80" />
                  <Text style={styles.summaryValue}>
                    {formatTime(getTotalTime())}
                  </Text>
                  <Text style={styles.summaryLabel}>łącznie</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryStat}>
                  <Ionicons name="walk" size={20} color="#4ADE80" />
                  <Text style={styles.summaryValue}>
                    {formatDistance(getTotalDistance())}
                  </Text>
                  <Text style={styles.summaryLabel}>spacer</Text>
                </View>
              </View>
            </View>

            {aiTips && (
              <View style={styles.tipsCard}>
                <View style={styles.tipsHeader}>
                  <Ionicons name="bulb" size={20} color="#FBBF24" />
                  <Text style={styles.tipsTitle}>Wskazówki od AI</Text>
                </View>
                <Text style={styles.tipsText}>{aiTips}</Text>
              </View>
            )}

            <View style={styles.timelineCard}>
              <Text style={styles.timelineTitle}>Plan trasy</Text>
              {plannedRoute.map((attraction, index) => (
                <TouchableOpacity
                  key={attraction.id}
                  style={styles.timelineItem}
                  onPress={() =>
                    navigation.navigate('Details', {
                      id: attraction.id,
                      title: attraction.title,
                      description: attraction.description,
                      location: attraction.location
                    })
                  }
                  activeOpacity={0.7}
                >
                  {index < plannedRoute.length - 1 && (
                    <View style={styles.timelineLine} />
                  )}

                  <View
                    style={[
                      styles.orderBadge,
                      {
                        backgroundColor:
                          CATEGORY_COLORS[
                            attraction.category as keyof typeof CATEGORY_COLORS
                          ]
                      }
                    ]}
                  >
                    <Text style={styles.orderNumber}>{attraction.order}</Text>
                  </View>

                  <View style={styles.timelineContent}>
                    <View style={styles.timelineHeader}>
                      <Text
                        style={styles.timelineAttractionTitle}
                        numberOfLines={1}
                      >
                        {attraction.title}
                      </Text>
                      <View style={styles.timelineFeatures}>
                        {attraction.hasAR && (
                          <View style={styles.miniFeature}>
                            <Ionicons name="cube" size={10} color="#8B5CF6" />
                          </View>
                        )}
                        {attraction.hasAudio && (
                          <View style={styles.miniFeature}>
                            <Ionicons
                              name="headset"
                              size={10}
                              color="#4ADE80"
                            />
                          </View>
                        )}
                      </View>
                    </View>

                    <View style={styles.timelineDetails}>
                      <View style={styles.timelineDetail}>
                        <Ionicons name="walk-outline" size={12} color="#666" />
                        <Text style={styles.timelineDetailText}>
                          {attraction.walkingTime} min (
                          {formatDistance(attraction.distance)})
                        </Text>
                      </View>
                      <View style={styles.timelineDetail}>
                        <Ionicons name="time-outline" size={12} color="#666" />
                        <Text style={styles.timelineDetailText}>
                          ~{attraction.estimatedTime} min zwiedzania
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.timelineCategory}>
                      {attraction.category}
                    </Text>
                  </View>

                  <Ionicons name="chevron-forward" size={20} color="#CCC" />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.startButton}
              onPress={() => {
                if (plannedRoute.length > 0) {
                  navigation.navigate('Details', {
                    id: plannedRoute[0].id,
                    title: plannedRoute[0].title,
                    description: plannedRoute[0].description,
                    location: plannedRoute[0].location
                  });
                }
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="navigate" size={22} color="#FFF" />
              <Text style={styles.startButtonText}>Rozpocznij zwiedzanie</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Empty state */}
        {plannedRoute && plannedRoute.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="sad-outline" size={48} color="#CCC" />
            <Text style={styles.emptyTitle}>Brak atrakcji do pokazania</Text>
            <Text style={styles.emptySubtitle}>
              Spróbuj zwiększyć czas lub zmienić filtry kategorii
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
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
  headerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8
      },
      android: { elevation: 4 }
    })
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Kollektif-Bold',
    color: '#1B4D3E',
    marginBottom: 8
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Kollektif',
    color: '#666',
    textAlign: 'center'
  },
  locationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4
      },
      android: { elevation: 2 }
    })
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  locationText: {
    fontSize: 14,
    fontFamily: 'Kollektif',
    color: '#333'
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center'
  },
  sectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4
      },
      android: { elevation: 2 }
    })
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Kollektif-Bold',
    color: '#1B4D3E',
    marginBottom: 14
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: 'transparent'
  },
  optionButtonActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#1B4D3E'
  },
  optionText: {
    fontSize: 14,
    fontFamily: 'Kollektif',
    color: '#666'
  },
  optionTextActive: {
    fontFamily: 'Kollektif-Bold',
    color: '#1B4D3E'
  },
  paceRow: {
    flexDirection: 'row',
    gap: 12
  },
  paceButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  paceButtonActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#1B4D3E'
  },
  paceText: {
    fontSize: 12,
    fontFamily: 'Kollektif',
    color: '#666'
  },
  paceTextActive: {
    fontFamily: 'Kollektif-Bold',
    color: '#1B4D3E'
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  categoryChipText: {
    fontSize: 12,
    fontFamily: 'Kollektif',
    color: '#666'
  },
  categoryChipTextActive: {
    color: '#FFF',
    fontFamily: 'Kollektif-Bold'
  },
  planButton: {
    backgroundColor: '#4ADE80',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#4ADE80',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8
      },
      android: { elevation: 4 }
    })
  },
  planButtonDisabled: {
    backgroundColor: '#A5D6A7'
  },
  planButtonText: {
    fontSize: 16,
    fontFamily: 'Kollektif-Bold',
    color: '#1B4D3E'
  },
  resultsContainer: {
    marginTop: 8
  },
  summaryCard: {
    backgroundColor: '#1B4D3E',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16
  },
  summaryTitle: {
    fontSize: 18,
    fontFamily: 'Kollektif-Bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 16
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  summaryStat: {
    alignItems: 'center',
    gap: 4
  },
  summaryValue: {
    fontSize: 20,
    fontFamily: 'Kollektif-Bold',
    color: '#FFF'
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: 'Kollektif',
    color: 'rgba(255,255,255,0.7)'
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)'
  },
  tipsCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10
  },
  tipsTitle: {
    fontSize: 14,
    fontFamily: 'Kollektif-Bold',
    color: '#92400E'
  },
  tipsText: {
    fontSize: 13,
    fontFamily: 'Kollektif',
    color: '#78350F',
    lineHeight: 20
  },
  timelineCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8
      },
      android: { elevation: 4 }
    })
  },
  timelineTitle: {
    fontSize: 16,
    fontFamily: 'Kollektif-Bold',
    color: '#1B4D3E',
    marginBottom: 16
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative'
  },
  timelineLine: {
    position: 'absolute',
    left: 18,
    top: 48,
    bottom: -12,
    width: 2,
    backgroundColor: '#E0E0E0'
  },
  orderBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14
  },
  orderNumber: {
    fontSize: 16,
    fontFamily: 'Kollektif-Bold',
    color: '#FFF'
  },
  timelineContent: {
    flex: 1
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  timelineAttractionTitle: {
    fontSize: 15,
    fontFamily: 'Kollektif-Bold',
    color: '#333',
    flex: 1,
    marginRight: 8
  },
  timelineFeatures: {
    flexDirection: 'row',
    gap: 6
  },
  miniFeature: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center'
  },
  timelineDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 4
  },
  timelineDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  timelineDetailText: {
    fontSize: 11,
    fontFamily: 'Kollektif',
    color: '#666'
  },
  timelineCategory: {
    fontSize: 11,
    fontFamily: 'Kollektif',
    color: '#999'
  },
  startButton: {
    backgroundColor: '#1B4D3E',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#1B4D3E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8
      },
      android: { elevation: 4 }
    })
  },
  startButtonText: {
    fontSize: 16,
    fontFamily: 'Kollektif-Bold',
    color: '#FFF'
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Kollektif-Bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Kollektif',
    color: '#999',
    textAlign: 'center'
  }
});
