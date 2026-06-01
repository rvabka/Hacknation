import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  Share,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AttractionsScreenProps } from '../navigation/types';
import {
  Attraction,
  CATEGORY_COLORS,
  CategoryType
} from '../data/attractions';
import { useAttractions } from '../hooks/useAttractions';
import { useFavorites } from '../hooks/useFavorites';
import { colors, space, radii, type, shadow, hitSlop, font } from '../theme';

type Filter = 'Wszystkie' | 'Ulubione' | CategoryType;

const FILTERS: Filter[] = [
  'Wszystkie',
  'Ulubione',
  'Architektura',
  'Sakralny',
  'Muzeum',
  'Rzeźba',
  'Zabytek techniki'
];

export default function AttractionsScreen({
  navigation
}: AttractionsScreenProps) {
  const insets = useSafeAreaInsets();
  const { attractions, loading } = useAttractions();
  const { isFavorite, toggleFavorite, favoriteIds } = useFavorites();
  const [filter, setFilter] = useState<Filter>('Wszystkie');

  const visible = useMemo(() => {
    if (filter === 'Wszystkie') return attractions;
    if (filter === 'Ulubione') return attractions.filter(a => isFavorite(a.id));
    return attractions.filter(a => a.category === filter);
    // favoriteIds w zależnościach: przełączenie serca odświeża widok „Ulubione".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attractions, filter, favoriteIds]);

  const handleShare = async (a: Attraction) => {
    try {
      await Share.share({
        title: a.title,
        message: `${a.title}\n${a.location}, Lublin\n\n${a.description}\n\nOdkryj więcej w aplikacji Lublin Explorer.`
      });
    } catch {
      Alert.alert('Błąd', 'Nie udało się udostępnić atrakcji');
    }
  };

  if (loading && attractions.length === 0) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color={colors.forest} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + 96,
          paddingTop: insets.top + space.sm
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Nagłówek */}
        <View style={styles.header}>
          <Text style={styles.h1}>Odkrywaj Lublin</Text>
          <Text style={styles.sub}>
            {attractions.length} historycznych miejsc na mapie miasta
          </Text>
        </View>

        {/* Filtr kategorii (sticky) */}
        <View style={styles.filterBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {FILTERS.map(f => {
              const active = filter === f;
              const isFav = f === 'Ulubione';
              return (
                <TouchableOpacity
                  key={f}
                  style={[
                    styles.chip,
                    isFav && styles.chipFav,
                    active && styles.chipActive
                  ]}
                  onPress={() => setFilter(f)}
                  activeOpacity={0.8}
                >
                  {isFav && (
                    <Ionicons
                      name={active ? 'heart' : 'heart-outline'}
                      size={14}
                      color={active ? colors.white : colors.favorite}
                    />
                  )}
                  <Text
                    style={[styles.chipText, active && styles.chipTextActive]}
                  >
                    {f}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Lista */}
        <View style={styles.list}>
          {visible.map(a => {
            const cat = CATEGORY_COLORS[a.category] ?? colors.forest;
            const fav = isFavorite(a.id);
            return (
              <TouchableOpacity
                key={a.id}
                style={styles.card}
                activeOpacity={0.92}
                onPress={() =>
                  navigation.navigate('Details', {
                    id: a.id,
                    title: a.title,
                    description: a.description,
                    location: a.location
                  })
                }
              >
                <View style={styles.imageWrap}>
                  <Image
                    source={a.image}
                    style={styles.image}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={['rgba(12,39,28,0.35)', 'transparent', 'transparent']}
                    style={StyleSheet.absoluteFill}
                    pointerEvents="none"
                  />

                  <View style={[styles.catChip, { backgroundColor: cat }]}>
                    <Text style={styles.catChipText}>{a.category}</Text>
                  </View>

                  <View style={styles.imageActions}>
                    <TouchableOpacity
                      style={styles.roundBtn}
                      onPress={e => {
                        e.stopPropagation();
                        handleShare(a);
                      }}
                      hitSlop={hitSlop}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="share-outline"
                        size={17}
                        color={colors.white}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.roundBtn}
                      onPress={e => {
                        e.stopPropagation();
                        toggleFavorite(a.id);
                      }}
                      hitSlop={hitSlop}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={fav ? 'heart' : 'heart-outline'}
                        size={17}
                        color={fav ? colors.favorite : colors.white}
                      />
                    </TouchableOpacity>
                  </View>

                  {a.yearBuilt && (
                    <View style={styles.yearChip}>
                      <Text style={styles.yearChipText}>{a.yearBuilt}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.body}>
                  <Text style={styles.title} numberOfLines={1}>
                    {a.title}
                  </Text>
                  <View style={styles.locationRow}>
                    <Ionicons name="location" size={13} color={colors.forest} />
                    <Text style={styles.location} numberOfLines={1}>
                      {a.location}
                    </Text>
                  </View>
                  <Text style={styles.desc} numberOfLines={2}>
                    {a.description}
                  </Text>

                  <View style={styles.metaRow}>
                    <View style={styles.metaLeft}>
                      {!!a.openingHours && (
                        <View style={styles.metaItem}>
                          <Ionicons
                            name="time-outline"
                            size={13}
                            color={colors.inkFaint}
                          />
                          <Text style={styles.metaText} numberOfLines={1}>
                            {a.openingHours}
                          </Text>
                        </View>
                      )}
                      {!a.openingHours && a.funFacts?.length > 0 && (
                        <View style={styles.metaItem}>
                          <Ionicons
                            name="bulb-outline"
                            size={13}
                            color={colors.inkFaint}
                          />
                          <Text style={styles.metaText}>
                            {a.funFacts.length} ciekawostek
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.openRow}>
                      <Text style={styles.openText}>Szczegóły</Text>
                      <Ionicons
                        name="arrow-forward"
                        size={15}
                        color={colors.forest}
                      />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {visible.length === 0 && (
            <View style={styles.empty}>
              <Ionicons
                name={filter === 'Ulubione' ? 'heart-outline' : 'search-outline'}
                size={40}
                color={colors.inkFaint}
              />
              <Text style={styles.emptyText}>
                {filter === 'Ulubione'
                  ? 'Nie masz jeszcze ulubionych miejsc. Stuknij serce na atrakcji, aby je zapisać.'
                  : 'Brak atrakcji w tej kategorii'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { justifyContent: 'center', alignItems: 'center' },

  header: {
    paddingHorizontal: space.xl,
    paddingBottom: space.lg
  },
  h1: { ...type.display },
  sub: { ...type.body, marginTop: space.xs, maxWidth: 300 },

  filterBar: {
    backgroundColor: colors.bg,
    paddingBottom: space.md
  },
  filterRow: {
    paddingHorizontal: space.xl,
    gap: space.sm
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line
  },
  chipFav: { borderColor: 'rgba(242,84,107,0.4)' },
  chipActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest
  },
  chipText: { fontFamily: font.bold, fontSize: 13, color: colors.inkSoft },
  chipTextActive: { color: colors.onForest },

  list: { paddingHorizontal: space.xl, gap: space.xl },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadow.md
  },
  imageWrap: {
    height: 188,
    backgroundColor: colors.surfaceAlt
  },
  image: { width: '100%', height: '100%' },
  catChip: {
    position: 'absolute',
    top: space.md,
    left: space.md,
    paddingHorizontal: space.md,
    paddingVertical: 5,
    borderRadius: radii.pill
  },
  catChipText: {
    color: colors.white,
    fontFamily: font.bold,
    fontSize: 11,
    letterSpacing: 0.4
  },
  imageActions: {
    position: 'absolute',
    top: space.md,
    right: space.md,
    flexDirection: 'row',
    gap: space.sm
  },
  roundBtn: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(12,39,28,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  yearChip: {
    position: 'absolute',
    bottom: space.md,
    right: space.md,
    backgroundColor: 'rgba(12,39,28,0.62)',
    paddingHorizontal: space.md,
    paddingVertical: 5,
    borderRadius: radii.pill
  },
  yearChipText: {
    color: colors.white,
    fontFamily: font.bold,
    fontSize: 12
  },

  body: { padding: space.lg },
  title: { ...type.heading, fontSize: 19, lineHeight: 24 },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: space.xs
  },
  location: { fontFamily: font.bold, fontSize: 13, color: colors.forest },
  desc: { ...type.small, marginTop: space.sm },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.md,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.line
  },
  metaLeft: { flex: 1 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { ...type.caption },
  openRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  openText: { fontFamily: font.bold, fontSize: 13, color: colors.forest },

  empty: { alignItems: 'center', paddingVertical: space['4xl'], gap: space.md },
  emptyText: { ...type.body }
});
