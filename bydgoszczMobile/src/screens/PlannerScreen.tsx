import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import {
  Attraction,
  CATEGORY_COLORS,
  CategoryType
} from '../data/attractions';
import { useAttractions } from '../hooks/useAttractions';
import { useTour } from '../context/TourContext';
import { colors, space, radii, type, shadow, font } from '../theme';

// Wskazówki AI lecą przez Groq (model OpenAI gpt-oss) – ten sam, co czat.
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_MODEL = process.env.EXPO_PUBLIC_GROQ_MODEL;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

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
] as const;

const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3;
  const f1 = (lat1 * Math.PI) / 180;
  const f2 = (lat2 * Math.PI) / 180;
  const df = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(df / 2) * Math.sin(df / 2) +
    Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const estimateVisitTime = (a: Attraction): number => {
  switch (a.category) {
    case 'Muzeum':
      return 45;
    case 'Zabytek techniki':
      return 30;
    case 'Sakralny':
      return 25;
    case 'Architektura':
      return 20;
    case 'Rzeźba':
      return 10;
    default:
      return 15;
  }
};

const calculateWalkingTime = (meters: number): number =>
  Math.ceil(meters / (5000 / 60));

export default function PlannerScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { attractions } = useAttractions();
  const { startTour } = useTour();

  const [selectedTime, setSelectedTime] = useState(120);
  const [selectedPace, setSelectedPace] = useState<string>('normal');
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [plannedRoute, setPlannedRoute] = useState<PlannedAttraction[] | null>(
    null
  );
  const [aiTips, setAiTips] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const slide = useRef(new Animated.Value(0)).current;
  const categories = [...new Set(attractions.map(a => a.category))];

  const getLocation = async () => {
    setGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setUserLocation({ latitude: 51.2465, longitude: 22.5684 });
      } else {
        const loc = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude
        });
      }
    } catch {
      setUserLocation({ latitude: 51.2465, longitude: 22.5684 });
    }
    setGettingLocation(false);
  };

  useEffect(() => {
    getLocation();
  }, []);

  const toggleCategory = (c: string) =>
    setSelectedCategories(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    );

  const planRoute = async () => {
    if (!userLocation) {
      Alert.alert('Chwila', 'Poczekaj na pobranie lokalizacji.');
      return;
    }
    setIsLoading(true);
    setPlannedRoute(null);
    setAiTips(null);

    try {
      const paceMultiplier =
        PACE_OPTIONS.find(p => p.value === selectedPace)?.multiplier || 1;
      const availableTime = selectedTime;

      const pool = (
        selectedCategories.length > 0
          ? attractions.filter(a => selectedCategories.includes(a.category))
          : attractions
      ).map(a => ({
        ...a,
        distance: 0,
        estimatedTime: Math.round(estimateVisitTime(a) * paceMultiplier),
        walkingTime: 0,
        order: 0
      }));

      const planned: PlannedAttraction[] = [];
      let current = userLocation;
      let totalTime = 0;
      let remaining = [...pool];

      while (remaining.length > 0 && totalTime < availableTime) {
        remaining = remaining
          .map(a => ({
            ...a,
            distance: calculateDistance(
              current.latitude,
              current.longitude,
              a.coordinate.latitude,
              a.coordinate.longitude
            )
          }))
          .sort((a, b) => a.distance - b.distance);

        const nearest = remaining[0];
        const walkingTime = calculateWalkingTime(nearest.distance);
        if (totalTime + walkingTime + nearest.estimatedTime > availableTime) {
          break;
        }
        planned.push({ ...nearest, walkingTime, order: planned.length + 1 });
        totalTime += walkingTime + nearest.estimatedTime;
        current = {
          latitude: nearest.coordinate.latitude,
          longitude: nearest.coordinate.longitude
        };
        remaining = remaining.slice(1);
      }

      setPlannedRoute(planned);
      slide.setValue(0);
      Animated.spring(slide, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true
      }).start();

      if (GROQ_API_KEY && GROQ_MODEL && planned.length > 0) {
        getAITips(planned, availableTime, selectedPace);
      }
    } catch {
      Alert.alert('Błąd', 'Nie udało się zaplanować trasy.');
    }
    setIsLoading(false);
  };

  const getAITips = async (
    route: PlannedAttraction[],
    time: number,
    pace: string
  ) => {
    try {
      const desc = route
        .map((a, i) => `${i + 1}. ${a.title} (${a.category})`)
        .join('\n');
      const prompt = `Turysta ma ${time} minut, tempo "${pace}". Zaplanowana trasa:\n${desc}\n\nPodaj 2-3 krótkie, praktyczne wskazówki do TEJ trasy (gdzie zjeść po drodze, najlepsze punkty na zdjęcia, co dodatkowo zobaczyć w okolicy). Maks. 110 słów.`;
      const res = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          reasoning_effort: 'low',
          messages: [
            {
              role: 'system',
              content:
                'Jesteś lokalnym przewodnikiem po Lublinie. Odpowiadasz po polsku, zwięźle i konkretnie, bez myślników.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 700
        })
      });
      const data = await res.json();
      const tips = data.choices?.[0]?.message?.content;
      if (tips && tips.trim()) setAiTips(tips.trim());
    } catch {
      /* ciche pominięcie wskazówek */
    }
  };

  const totalMinutes = plannedRoute
    ? plannedRoute.reduce((s, a) => s + a.estimatedTime + a.walkingTime, 0)
    : 0;
  const totalMeters = plannedRoute
    ? plannedRoute.reduce((s, a) => s + a.distance, 0)
    : 0;

  const fmtTime = (m: number) =>
    m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60 ? (m % 60) + 'm' : ''}`.trim();
  const fmtDist = (m: number) =>
    m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;

  const showRouteOnMap = () => {
    if (!plannedRoute || plannedRoute.length === 0) return;
    startTour({
      stops: plannedRoute.map(a => ({
        id: a.id,
        title: a.title,
        category: a.category,
        coordinate: a.coordinate,
        order: a.order
      })),
      start: userLocation,
      totalMinutes,
      totalMeters
    });
    navigation.navigate('MapTab');
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.xl,
          paddingTop: insets.top + space.sm,
          paddingBottom: insets.bottom + 96
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.h1}>Zaplanuj zwiedzanie</Text>
        <Text style={styles.sub}>
          Trasa AI dopasowana do Twojego czasu i tempa
        </Text>

        {/* Lokalizacja */}
        <View style={styles.locRow}>
          <Ionicons
            name={userLocation ? 'location' : 'location-outline'}
            size={18}
            color={userLocation ? colors.forest : colors.inkFaint}
          />
          <Text style={styles.locText}>
            {gettingLocation
              ? 'Pobieranie lokalizacji...'
              : userLocation
              ? 'Lokalizacja gotowa'
              : 'Brak lokalizacji'}
          </Text>
          {!userLocation && !gettingLocation && (
            <TouchableOpacity onPress={getLocation} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="refresh" size={18} color={colors.forest} />
            </TouchableOpacity>
          )}
        </View>

        {/* Czas */}
        <Text style={styles.label}>Ile masz czasu?</Text>
        <View style={styles.wrapRow}>
          {TIME_OPTIONS.map(o => {
            const active = selectedTime === o.value;
            return (
              <TouchableOpacity
                key={o.value}
                style={[styles.timeChip, active && styles.timeChipActive]}
                onPress={() => setSelectedTime(o.value)}
                activeOpacity={0.85}
              >
                <Text
                  style={[styles.timeText, active && styles.timeTextActive]}
                >
                  {o.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tempo */}
        <Text style={styles.label}>Tempo zwiedzania</Text>
        <View style={styles.paceRow}>
          {PACE_OPTIONS.map(o => {
            const active = selectedPace === o.value;
            return (
              <TouchableOpacity
                key={o.value}
                style={[styles.paceBtn, active && styles.paceBtnActive]}
                onPress={() => setSelectedPace(o.value)}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={o.icon}
                  size={22}
                  color={active ? colors.forest : colors.inkFaint}
                />
                <Text style={[styles.paceText, active && styles.paceTextActive]}>
                  {o.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Kategorie */}
        <Text style={styles.label}>Kategorie (opcjonalnie)</Text>
        <View style={styles.wrapRow}>
          {categories.map(c => {
            const active = selectedCategories.includes(c);
            const cat = CATEGORY_COLORS[c as CategoryType] ?? colors.forest;
            return (
              <TouchableOpacity
                key={c}
                style={[
                  styles.catChip,
                  active && { backgroundColor: cat, borderColor: cat }
                ]}
                onPress={() => toggleCategory(c)}
                activeOpacity={0.85}
              >
                <Text
                  style={[styles.catText, active && styles.catTextActive]}
                >
                  {c}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.planBtn, isLoading && { opacity: 0.7 }]}
          onPress={planRoute}
          disabled={isLoading || !userLocation}
          activeOpacity={0.9}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.onForest} />
          ) : (
            <Ionicons name="sparkles" size={20} color={colors.mint} />
          )}
          <Text style={styles.planBtnText}>
            {isLoading ? 'Planuję trasę...' : 'Zaplanuj trasę z AI'}
          </Text>
        </TouchableOpacity>

        {/* WYNIK */}
        {plannedRoute && plannedRoute.length > 0 && (
          <Animated.View
            style={{
              opacity: slide,
              transform: [
                {
                  translateY: slide.interpolate({
                    inputRange: [0, 1],
                    outputRange: [40, 0]
                  })
                }
              ]
            }}
          >
            {/* Podsumowanie */}
            <View style={styles.summary}>
              <Stat value={String(plannedRoute.length)} label="miejsc" />
              <View style={styles.summaryDivider} />
              <Stat value={fmtTime(totalMinutes)} label="łącznie" />
              <View style={styles.summaryDivider} />
              <Stat value={fmtDist(totalMeters)} label="spacer" />
            </View>

            {/* Wskazówki AI */}
            {aiTips && (
              <View style={styles.tips}>
                <View style={styles.tipsHead}>
                  <Ionicons name="sparkles" size={16} color={colors.forest} />
                  <Text style={styles.tipsTitle}>Wskazówki przewodnika</Text>
                </View>
                <Text style={styles.tipsText}>{aiTips}</Text>
              </View>
            )}

            {/* Oś trasy */}
            <View style={styles.timeline}>
              {plannedRoute.map((a, i) => {
                const cat = CATEGORY_COLORS[a.category] ?? colors.forest;
                const last = i === plannedRoute.length - 1;
                return (
                  <TouchableOpacity
                    key={a.id}
                    style={styles.stop}
                    activeOpacity={0.7}
                    onPress={() =>
                      navigation.navigate('Details', {
                        id: a.id,
                        title: a.title,
                        description: a.description,
                        location: a.location
                      })
                    }
                  >
                    {!last && <View style={styles.stopLine} />}
                    <View style={[styles.stopBadge, { backgroundColor: cat }]}>
                      <Text style={styles.stopBadgeText}>{a.order}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.stopTitle} numberOfLines={1}>
                        {a.title}
                      </Text>
                      <View style={styles.stopMeta}>
                        <Ionicons
                          name="walk-outline"
                          size={12}
                          color={colors.inkFaint}
                        />
                        <Text style={styles.stopMetaText}>
                          {a.walkingTime} min
                        </Text>
                        <Text style={styles.stopDot}>·</Text>
                        <Ionicons
                          name="time-outline"
                          size={12}
                          color={colors.inkFaint}
                        />
                        <Text style={styles.stopMetaText}>
                          {a.estimatedTime} min zwiedzania
                        </Text>
                      </View>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={colors.inkFaint}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.mapBtn}
              onPress={showRouteOnMap}
              activeOpacity={0.9}
            >
              <Ionicons name="map" size={20} color={colors.onForest} />
              <Text style={styles.mapBtnText}>Pokaż trasę na mapie</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {plannedRoute && plannedRoute.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="time-outline" size={40} color={colors.inkFaint} />
            <Text style={styles.emptyText}>
              Za mało czasu na pełny przystanek. Zwiększ czas lub zmień filtry.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  h1: { ...type.display },
  sub: { ...type.body, marginTop: space.xs, marginBottom: space.xl },

  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radii.md,
    ...shadow.sm
  },
  locText: { flex: 1, fontFamily: font.bold, fontSize: 14, color: colors.ink },

  label: {
    ...type.heading,
    fontSize: 16,
    marginTop: space['2xl'],
    marginBottom: space.md
  },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },

  timeChip: {
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line
  },
  timeChipActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  timeText: { fontFamily: font.bold, fontSize: 14, color: colors.inkSoft },
  timeTextActive: { color: colors.onForest },

  paceRow: { flexDirection: 'row', gap: space.md },
  paceBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: space.lg,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line
  },
  paceBtnActive: { backgroundColor: colors.mintWash, borderColor: colors.forest },
  paceText: { fontFamily: font.regular, fontSize: 13, color: colors.inkFaint },
  paceTextActive: { fontFamily: font.bold, color: colors.forest },

  catChip: {
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line
  },
  catText: { fontFamily: font.bold, fontSize: 13, color: colors.inkSoft },
  catTextActive: { color: colors.white },

  planBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    backgroundColor: colors.forest,
    paddingVertical: space.lg + 2,
    borderRadius: radii.md,
    marginTop: space['2xl'],
    ...shadow.md
  },
  planBtnText: { fontFamily: font.bold, fontSize: 16, color: colors.onForest },

  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.forest,
    borderRadius: radii.lg,
    paddingVertical: space.xl,
    marginTop: space['2xl']
  },
  stat: { alignItems: 'center', gap: 2 },
  statValue: { fontFamily: font.bold, fontSize: 19, color: colors.mint },
  statLabel: { fontFamily: font.regular, fontSize: 12, color: colors.onForestSoft },
  summaryDivider: { width: 1, height: 36, backgroundColor: colors.lineOnForest },

  tips: {
    backgroundColor: colors.mintWash,
    borderRadius: radii.md,
    padding: space.lg,
    marginTop: space.lg
  },
  tipsHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: space.sm },
  tipsTitle: { fontFamily: font.bold, fontSize: 14, color: colors.forest },
  tipsText: { fontFamily: font.regular, fontSize: 14, lineHeight: 21, color: colors.ink },

  timeline: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: space.lg,
    marginTop: space.lg,
    ...shadow.sm
  },
  stop: { flexDirection: 'row', alignItems: 'center', paddingVertical: space.md },
  stopLine: {
    position: 'absolute',
    left: 17,
    top: 42,
    bottom: -space.md,
    width: 2,
    backgroundColor: colors.line
  },
  stopBadge: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: space.md
  },
  stopBadgeText: { fontFamily: font.bold, fontSize: 15, color: colors.white },
  stopTitle: { fontFamily: font.bold, fontSize: 15, color: colors.ink },
  stopMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  stopMetaText: { fontFamily: font.regular, fontSize: 11.5, color: colors.inkFaint },
  stopDot: { color: colors.inkFaint, marginHorizontal: 2 },

  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    backgroundColor: colors.forest,
    paddingVertical: space.lg + 2,
    borderRadius: radii.md,
    marginTop: space.lg,
    ...shadow.md
  },
  mapBtnText: { fontFamily: font.bold, fontSize: 16, color: colors.onForest },

  empty: { alignItems: 'center', gap: space.md, paddingVertical: space['3xl'] },
  emptyText: { ...type.body, textAlign: 'center', maxWidth: 280 }
});
