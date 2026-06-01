import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
  Easing,
  Linking,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { DetailsScreenProps } from '../navigation/types';
import GeminiChatModal from '../components/GeminiChatModal';
import { useFavorites } from '../hooks/useFavorites';
import { useAttractions } from '../hooks/useAttractions';
import { useSpeech } from '../hooks/useSpeech';
import { CATEGORY_COLORS } from '../data/attractions';
import { colors, space, radii, type, shadow, hitSlop, font } from '../theme';

const { width } = Dimensions.get('window');

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_MODEL = process.env.EXPO_PUBLIC_GROQ_MODEL;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export default function DetailsScreen({ route, navigation }: DetailsScreenProps) {
  const { id, title, description, location } = route.params;
  const insets = useSafeAreaInsets();

  const { attractions } = useAttractions();
  const attraction = attractions.find(a => a.id === id);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { speak, stop } = useSpeech();

  // Jedno źródło prawdy dla audio: czytany jest albo opis, albo opowieść AI.
  const [activeAudio, setActiveAudio] = useState<'none' | 'opis' | 'story'>(
    'none'
  );
  const [story, setStory] = useState<string | null>(null);
  const [storyLoading, setStoryLoading] = useState(false);

  const [showChat, setShowChat] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const gallery = attraction?.images ?? [];
  const hasGallery = gallery.length > 1;
  const cat = attraction ? CATEGORY_COLORS[attraction.category] : colors.forest;

  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true
      }),
      Animated.timing(rise, {
        toValue: 0,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      })
    ]).start();
  }, [fade, rise]);

  const speechText = [
    title,
    description,
    attraction?.funFacts?.length
      ? 'Ciekawostka. ' + attraction.funFacts[0].replace(/\*\*/g, '')
      : ''
  ]
    .filter(Boolean)
    .join('. ');

  // Czyta dany tekst; ponowne stuknięcie tego samego źródła zatrzymuje lektora.
  const narrate = (key: 'opis' | 'story', text: string) => {
    if (activeAudio === key) {
      stop();
      setActiveAudio('none');
      return;
    }
    setActiveAudio(key);
    speak(text, { onDone: () => setActiveAudio('none') });
  };

  // Gawędziarz AI: generuje barwną, krótką opowieść o miejscu (Groq / model OpenAI).
  const generateStory = async (): Promise<string | null> => {
    if (!GROQ_API_KEY || !GROQ_MODEL) return null;
    const facts2 = (attraction?.funFacts ?? [])
      .map(f => f.replace(/\*\*/g, ''))
      .join(' ');
    const prompt = `Opowiedz wciągającą, krótką opowieść (legendę lub scenkę historyczną) o miejscu "${title}" w Lublinie, dzielnica ${location}.
Kontekst: ${description} ${facts2}
Zasady: 4-6 zdań, obrazowo i nastrojowo, zwracaj się do słuchacza ("wyobraź sobie..."), zacznij od mocnego haka, po polsku, bez myślników.`;
    try {
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
                'Jesteś barwnym gawędziarzem i przewodnikiem po Lublinie. Snujesz krótkie, sugestywne opowieści. Po polsku, bez myślników.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.9,
          max_tokens: 900
        })
      });
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content?.trim();
      return text || null;
    } catch {
      return null;
    }
  };

  const tellStory = async () => {
    if (activeAudio === 'story') {
      stop();
      setActiveAudio('none');
      return;
    }
    let text = story;
    if (!text) {
      setStoryLoading(true);
      text = await generateStory();
      setStoryLoading(false);
      if (!text) return;
      setStory(text);
    }
    narrate('story', text);
  };

  const openExternal = (mode: 'route' | 'pin') => {
    if (!attraction?.coordinate) return;
    const { latitude, longitude } = attraction.coordinate;
    const url =
      mode === 'route'
        ? Platform.select({
            ios: `maps:0,0?daddr=${latitude},${longitude}`,
            android: `google.navigation:q=${latitude},${longitude}`
          })
        : Platform.select({
            ios: `maps:0,0?q=${attraction.title}@${latitude},${longitude}`,
            android: `geo:${latitude},${longitude}?q=${attraction.title}`
          });
    if (url) Linking.openURL(url);
  };

  const facts = attraction?.funFacts ?? [];
  const shownFacts = expanded ? facts : facts.slice(0, 2);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + space['3xl'] }}
      >
        {/* HERO */}
        <View style={styles.hero}>
          {hasGallery ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={e =>
                setGalleryIndex(
                  Math.round(e.nativeEvent.contentOffset.x / width)
                )
              }
            >
              {gallery.map((uri, i) => (
                <Image
                  key={i}
                  source={{ uri }}
                  style={{ width, height: 320 }}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          ) : (
            <Image
              source={
                attraction?.image ??
                (gallery[0] ? { uri: gallery[0] } : undefined)
              }
              style={{ width, height: 320 }}
              resizeMode="cover"
            />
          )}

          <LinearGradient
            colors={['rgba(12,39,28,0.45)', 'transparent', 'rgba(12,39,28,0.55)']}
            locations={[0, 0.4, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          <View style={[styles.heroTop, { top: insets.top + space.sm }]}>
            <TouchableOpacity
              style={styles.roundBtn}
              onPress={() => navigation.goBack()}
              hitSlop={hitSlop}
              activeOpacity={0.85}
            >
              <Ionicons name="chevron-back" size={22} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.roundBtn}
              onPress={() => toggleFavorite(id)}
              hitSlop={hitSlop}
              activeOpacity={0.85}
            >
              <Ionicons
                name={isFavorite(id) ? 'heart' : 'heart-outline'}
                size={20}
                color={isFavorite(id) ? colors.favorite : colors.white}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.heroBottom}>
            <View style={[styles.catChip, { backgroundColor: cat }]}>
              <Text style={styles.catChipText}>{attraction?.category}</Text>
            </View>
            {!!attraction?.yearBuilt && (
              <View style={styles.yearChip}>
                <Ionicons name="time-outline" size={12} color={colors.white} />
                <Text style={styles.yearChipText}>{attraction.yearBuilt}</Text>
              </View>
            )}
          </View>

          {hasGallery && (
            <View style={styles.dots} pointerEvents="none">
              {gallery.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === galleryIndex && styles.dotActive]}
                />
              ))}
            </View>
          )}
        </View>

        {/* SHEET */}
        <Animated.View
          style={[
            styles.sheet,
            { opacity: fade, transform: [{ translateY: rise }] }
          ]}
        >
          <Text style={styles.title}>{title}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={15} color={colors.forest} />
            <Text style={styles.location}>{location}, Lublin</Text>
          </View>

          {/* Akcje */}
          {attraction?.hasAI && (
            <TouchableOpacity
              style={styles.aiBtn}
              onPress={() => setShowChat(true)}
              activeOpacity={0.92}
            >
              <LinearGradient
                colors={[colors.forest, colors.forestSoft]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.aiBtnInner}
              >
                <View style={styles.aiIcon}>
                  <Ionicons name="sparkles" size={20} color={colors.mint} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.aiTitle}>Zapytaj przewodnika AI</Text>
                  <Text style={styles.aiSub}>
                    Dopytaj o historię tego miejsca
                  </Text>
                </View>
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color={colors.mint}
                />
              </LinearGradient>
            </TouchableOpacity>
          )}

          <View style={styles.navRow}>
            <TouchableOpacity
              style={styles.navBtn}
              onPress={() => openExternal('route')}
              activeOpacity={0.85}
            >
              <Ionicons name="navigate" size={18} color={colors.onForest} />
              <Text style={styles.navBtnText}>Trasa</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navBtn, styles.navBtnGhost]}
              onPress={() => openExternal('pin')}
              activeOpacity={0.85}
            >
              <Ionicons name="map-outline" size={18} color={colors.forest} />
              <Text style={[styles.navBtnText, styles.navBtnTextGhost]}>
                Pokaż na mapie
              </Text>
            </TouchableOpacity>
          </View>

          {/* Gawędziarz AI */}
          {attraction?.hasAI && (
            <LinearGradient
              colors={[colors.forest, colors.forestDeep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.storyCard}
            >
              <View style={styles.storyHead}>
                <View style={styles.storyIcon}>
                  <Ionicons name="book" size={18} color={colors.mint} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.storyTitle}>Gawędziarz AI</Text>
                  <Text style={styles.storySub}>
                    Posłuchaj opowieści o tym miejscu
                  </Text>
                </View>
                {activeAudio === 'story' && (
                  <View style={styles.storyLive}>
                    <Ionicons name="volume-high" size={13} color={colors.mint} />
                    <Text style={styles.storyLiveText}>czyta</Text>
                  </View>
                )}
              </View>

              {!!story && <Text style={styles.storyText}>{story}</Text>}

              <TouchableOpacity
                style={styles.storyBtn}
                onPress={tellStory}
                activeOpacity={0.9}
                disabled={storyLoading}
              >
                {storyLoading ? (
                  <ActivityIndicator size="small" color={colors.mintInk} />
                ) : (
                  <Ionicons
                    name={
                      activeAudio === 'story'
                        ? 'stop'
                        : story
                        ? 'refresh'
                        : 'sparkles'
                    }
                    size={18}
                    color={colors.mintInk}
                  />
                )}
                <Text style={styles.storyBtnText}>
                  {storyLoading
                    ? 'Tworzę opowieść...'
                    : activeAudio === 'story'
                    ? 'Zatrzymaj'
                    : story
                    ? 'Posłuchaj ponownie'
                    : 'Opowiedz historię'}
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          )}

          {/* Opis */}
          <View style={styles.sectionHeadRow}>
            <Text style={styles.sectionTitle}>Opis</Text>
            <TouchableOpacity
              style={[
                styles.listenBtn,
                activeAudio === 'opis' && styles.listenBtnActive
              ]}
              onPress={() => narrate('opis', speechText)}
              activeOpacity={0.85}
            >
              <Ionicons
                name={activeAudio === 'opis' ? 'stop' : 'volume-high'}
                size={15}
                color={activeAudio === 'opis' ? colors.onForest : colors.forest}
              />
              <Text
                style={[
                  styles.listenText,
                  activeAudio === 'opis' && styles.listenTextActive
                ]}
              >
                {activeAudio === 'opis' ? 'Zatrzymaj' : 'Słuchaj'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.body}>{description}</Text>

          {/* Ciekawostki */}
          {facts.length > 0 && (
            <View style={{ marginTop: space['2xl'] }}>
              <Text style={styles.sectionTitle}>Ciekawostki</Text>
              <View style={{ gap: space.md, marginTop: space.md }}>
                {shownFacts.map((fact, i) => (
                  <View key={i} style={styles.factRow}>
                    <View style={styles.factNum}>
                      <Text style={styles.factNumText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.factText}>
                      {fact.replace(/\*\*/g, '')}
                    </Text>
                  </View>
                ))}
              </View>
              {facts.length > 2 && (
                <TouchableOpacity
                  style={styles.expandBtn}
                  onPress={() => setExpanded(v => !v)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.expandText}>
                    {expanded
                      ? 'Pokaż mniej'
                      : `Pokaż wszystkie (${facts.length})`}
                  </Text>
                  <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={colors.forest}
                  />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Twórca */}
          {!!attraction?.architect && (
            <View style={{ marginTop: space['2xl'] }}>
              <Text style={styles.sectionTitle}>Twórca</Text>
              <View style={styles.creator}>
                <View style={styles.creatorAvatar}>
                  <Ionicons name="brush-outline" size={22} color={colors.forest} />
                </View>
                <View>
                  <Text style={styles.creatorName}>{attraction.architect}</Text>
                  <Text style={styles.creatorRole}>Architekt / artysta</Text>
                </View>
              </View>
            </View>
          )}

          {/* Informacje (tylko realne) */}
          {(!!attraction?.openingHours || !!attraction?.price) && (
            <View style={{ marginTop: space['2xl'] }}>
              <Text style={styles.sectionTitle}>Informacje</Text>
              <View style={styles.infoCard}>
                {!!attraction?.openingHours && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="time-outline"
                      size={18}
                      color={colors.forest}
                    />
                    <Text style={styles.infoLabel}>Godziny otwarcia</Text>
                    <Text style={styles.infoValue}>
                      {attraction.openingHours}
                    </Text>
                  </View>
                )}
                {!!attraction?.openingHours && !!attraction?.price && (
                  <View style={styles.infoDivider} />
                )}
                {!!attraction?.price && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="pricetag-outline"
                      size={18}
                      color={colors.forest}
                    />
                    <Text style={styles.infoLabel}>Wstęp</Text>
                    <Text style={styles.infoValue}>{attraction.price}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <GeminiChatModal
        visible={showChat}
        attractionTitle={title}
        attractionDescription={description}
        attractionLocation={location}
        onClose={() => setShowChat(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },

  hero: { height: 320, backgroundColor: colors.surfaceAlt },
  heroTop: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  roundBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(12,39,28,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  heroBottom: {
    position: 'absolute',
    left: space.xl,
    bottom: space['2xl'] + space.lg,
    flexDirection: 'row',
    gap: space.sm
  },
  catChip: {
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radii.pill
  },
  catChipText: {
    color: colors.white,
    fontFamily: font.bold,
    fontSize: 11,
    letterSpacing: 0.4
  },
  yearChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(12,39,28,0.55)',
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radii.pill
  },
  yearChipText: { color: colors.white, fontFamily: font.bold, fontSize: 12 },
  dots: {
    position: 'absolute',
    bottom: space.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)'
  },
  dotActive: { width: 18, backgroundColor: colors.white },

  sheet: {
    marginTop: -space['2xl'],
    backgroundColor: colors.bg,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: space.xl,
    paddingTop: space['2xl']
  },
  title: { ...type.display, fontSize: 27, lineHeight: 33 },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: space.sm
  },
  location: { fontFamily: font.bold, fontSize: 14, color: colors.forest },

  aiBtn: {
    marginTop: space.xl,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadow.md
  },
  aiBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg
  },
  aiIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: 'rgba(55,208,138,0.18)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  aiTitle: { fontFamily: font.bold, fontSize: 16, color: colors.onForest },
  aiSub: {
    fontFamily: font.regular,
    fontSize: 13,
    color: colors.onForestSoft,
    marginTop: 2
  },

  storyCard: {
    marginTop: space.md,
    borderRadius: radii.lg,
    padding: space.lg,
    ...shadow.md
  },
  storyHead: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  storyIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: 'rgba(55,208,138,0.18)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  storyTitle: { fontFamily: font.bold, fontSize: 16, color: colors.onForest },
  storySub: {
    fontFamily: font.regular,
    fontSize: 13,
    color: colors.onForestSoft,
    marginTop: 2
  },
  storyLive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(55,208,138,0.16)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill
  },
  storyLiveText: { fontFamily: font.bold, fontSize: 11, color: colors.mint },
  storyText: {
    fontFamily: font.regular,
    fontSize: 14.5,
    lineHeight: 23,
    color: colors.onForest,
    marginTop: space.md
  },
  storyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    backgroundColor: colors.mint,
    paddingVertical: 13,
    borderRadius: radii.md,
    marginTop: space.lg
  },
  storyBtnText: { fontFamily: font.bold, fontSize: 15, color: colors.mintInk },

  navRow: { flexDirection: 'row', gap: space.md, marginTop: space.md },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    backgroundColor: colors.forest,
    paddingVertical: space.lg,
    borderRadius: radii.md
  },
  navBtnGhost: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.forest
  },
  navBtnText: { fontFamily: font.bold, fontSize: 15, color: colors.onForest },
  navBtnTextGhost: { color: colors.forest },

  sectionHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space['3xl']
  },
  sectionTitle: { ...type.title, fontSize: 19 },
  listenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: space.md,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: colors.mintWash,
    borderWidth: 1,
    borderColor: 'rgba(20,61,43,0.18)'
  },
  listenBtnActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  listenText: { fontFamily: font.bold, fontSize: 13, color: colors.forest },
  listenTextActive: { color: colors.onForest },
  body: { ...type.body, marginTop: space.md, color: colors.ink },

  factRow: {
    flexDirection: 'row',
    gap: space.md,
    backgroundColor: colors.surface,
    padding: space.lg,
    borderRadius: radii.md,
    ...shadow.sm
  },
  factNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.mintWash,
    justifyContent: 'center',
    alignItems: 'center'
  },
  factNumText: { fontFamily: font.bold, fontSize: 13, color: colors.forest },
  factText: { flex: 1, ...type.small, color: colors.ink, lineHeight: 21 },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: space.md,
    marginTop: space.xs
  },
  expandText: { fontFamily: font.bold, fontSize: 14, color: colors.forest },

  creator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    padding: space.lg,
    borderRadius: radii.md,
    marginTop: space.md,
    ...shadow.sm
  },
  creatorAvatar: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.mintWash,
    justifyContent: 'center',
    alignItems: 'center'
  },
  creatorName: { fontFamily: font.bold, fontSize: 15, color: colors.ink },
  creatorRole: {
    fontFamily: font.regular,
    fontSize: 13,
    color: colors.inkFaint,
    marginTop: 1
  },

  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: space.lg,
    marginTop: space.md,
    ...shadow.sm
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.lg
  },
  infoLabel: { flex: 1, fontFamily: font.regular, fontSize: 14, color: colors.inkSoft },
  infoValue: { fontFamily: font.bold, fontSize: 14, color: colors.ink },
  infoDivider: { height: 1, backgroundColor: colors.line }
});
