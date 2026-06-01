import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Animated,
  Easing,
  Image
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import ARViewModal from '../components/ARViewModal';
import { useAppNavigation } from '../hooks/useAppNavigation';
import {
  CATEGORY_ICONS,
  CATEGORY_COLORS
} from '../data/attractions';
import { useAttractions } from '../hooks/useAttractions';

const LUBLIN_COORDS: Region = {
  latitude: 51.2465,
  longitude: 22.5684,
  latitudeDelta: 0.03,
  longitudeDelta: 0.03
};

const SELECTED_ZOOM = 0.008;

// Poniżej tej wartości latitudeDelta nie klastrowymy – każdy marker indywidualnie.
// 0.012° ≈ ~1.3km widoku. Klastrowanie tylko gdy widać duży obszar Lublina;
// po jednym przybliżeniu od domyślnego widoku (0.03) wpadamy poniżej progu
// i wszystkie markery są widoczne pojedynczo.
const INDIVIDUAL_ZOOM_THRESHOLD = 0.012;

interface Cluster {
  id: string;
  coordinate: { latitude: number; longitude: number };
  count: number;
  items: { id: string; coordinate: { latitude: number; longitude: number }; category: string; model?: any }[];
  hasAR: boolean;
}

// Klastrowanie siatkowe: dzielimy widoczny obszar mapy na komórki proporcjonalne
// do aktualnego poziomu zoomu. Każdy marker trafia do swojej komórki; komórki
// z >1 markerem renderowane są jako klaster z liczbą.
function buildClusters(
  items: Cluster['items'],
  latitudeDelta: number
): Cluster[] {
  if (latitudeDelta < INDIVIDUAL_ZOOM_THRESHOLD) {
    return items.map(it => ({
      id: it.id,
      coordinate: it.coordinate,
      count: 1,
      items: [it],
      hasAR: !!it.model
    }));
  }

  const cellSize = latitudeDelta / 5;
  const grid = new Map<string, Cluster>();

  for (const it of items) {
    const cellLat = Math.floor(it.coordinate.latitude / cellSize);
    const cellLng = Math.floor(it.coordinate.longitude / cellSize);
    const key = `${cellLat}_${cellLng}`;

    let c = grid.get(key);
    if (!c) {
      c = {
        id: `cluster_${key}`,
        coordinate: { latitude: 0, longitude: 0 },
        count: 0,
        items: [],
        hasAR: false
      };
      grid.set(key, c);
    }

    // Średnia ważona (krocząca) położenia – cluster pin pokazuje się w środku
    // ciężkości grupy.
    c.coordinate = {
      latitude:
        (c.coordinate.latitude * c.count + it.coordinate.latitude) /
        (c.count + 1),
      longitude:
        (c.coordinate.longitude * c.count + it.coordinate.longitude) /
        (c.count + 1)
    };
    c.count++;
    c.items.push(it);
    if (it.model) c.hasAR = true;
  }

  // Klastrom z count===1 nadajemy id atrakcji – pozwala podpiąć pod istniejące
  // selektory i animacje pojedynczego markera.
  return Array.from(grid.values()).map(c =>
    c.count === 1 ? { ...c, id: c.items[0].id } : c
  );
}

const isAndroid = Platform.OS === 'android';

const IOSMarker = React.memo(
  ({ category, hasModel }: { category: string; hasModel: boolean }) => {
    const color =
      CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || '#4ADE80';
    const icon =
      CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] ||
      'location-outline';

    return (
      <View style={iosStyles.markerContainer}>
        <View style={[iosStyles.marker, hasModel && iosStyles.markerAR]}>
          <Ionicons name={icon as any} size={18} color={color} />
        </View>
        {hasModel && <View style={iosStyles.arDot} />}
      </View>
    );
  },
  () => true
);

const IOSClusterMarker = React.memo(
  ({ count }: { count: number }) => (
    <View style={iosStyles.clusterMarker}>
      <Text style={iosStyles.clusterText}>{count}</Text>
      <Text style={iosStyles.clusterLabel}>miejsc</Text>
    </View>
  ),
  () => true
);

const iosStyles = StyleSheet.create({
  markerContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center'
  },
  marker: {
    backgroundColor: 'rgba(0,0,0,0.9)',
    padding: 10,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8
  },
  markerAR: {
    borderColor: '#4ADE80'
  },
  arDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4ADE80',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.9)'
  },
  clusterMarker: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#4ADE80',
    shadowColor: '#4ADE80',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15
  },
  clusterText: {
    color: '#4ADE80',
    fontSize: 22,
    fontWeight: '700'
  },
  clusterLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '500',
    marginTop: -2
  }
});

export default function MapScreen() {
  const navigation = useAppNavigation();
  const insets = useSafeAreaInsets();
  const { attractions } = useAttractions();
  const arCount = useMemo(
    () => attractions.filter(a => a.model || a.hasAR).length,
    [attractions]
  );
  const mapRef = useRef<MapView>(null);
  const cardAnim = useRef(new Animated.Value(0)).current;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showARModal, setShowARModal] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [region, setRegion] = useState<Region>(LUBLIN_COORDS);
  const [isCardVisible, setIsCardVisible] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const selectedAttraction = useMemo(
    () => attractions.find(a => a.id === selectedId) || null,
    [selectedId, attractions]
  );

  const clusters = useMemo(
    () => buildClusters(attractions, region.latitudeDelta),
    [attractions, region.latitudeDelta]
  );

  const getCategoryIcon = useCallback(
    (category: string) =>
      CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] ||
      'location-outline',
    []
  );

  const getCategoryColor = useCallback(
    (category: string) =>
      CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || '#4ADE80',
    []
  );

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
      }
    })();
  }, []);

  const animateCard = useCallback(
    (show: boolean, callback?: () => void) => {
      if (show) {
        setIsCardVisible(true);
      }
      Animated.timing(cardAnim, {
        toValue: show ? 1 : 0,
        duration: show ? 280 : 180,
        easing: show ? Easing.out(Easing.back(1.1)) : Easing.in(Easing.ease),
        useNativeDriver: true
      }).start(() => {
        if (!show) {
          setIsCardVisible(false);
        }
        callback?.();
      });
    },
    [cardAnim]
  );

  const handleMarkerPress = useCallback(
    (id: string) => {
      const attraction = attractions.find(a => a.id === id);
      if (!attraction) return;

      if (selectedId === id) {
        animateCard(false, () => setSelectedId(null));
        return;
      }

      // Nie wymuszaj zmiany zoomu jeśli użytkownik jest już blisko –
      // jedynie pan na marker (z lekkim zoom-in jeśli za daleko).
      const targetDelta = Math.min(region.latitudeDelta, SELECTED_ZOOM);

      mapRef.current?.animateToRegion(
        {
          latitude: attraction.coordinate.latitude,
          longitude: attraction.coordinate.longitude,
          latitudeDelta: targetDelta,
          longitudeDelta: targetDelta
        },
        300
      );

      setSelectedId(id);
      animateCard(true);
    },
    [selectedId, animateCard, attractions, region.latitudeDelta]
  );

  const handleClusterPress = useCallback(
    (cluster: Cluster) => {
      // Zoom DO BBOX zawartości klastra – nie do stałego "kolejnego poziomu".
      // Dzięki temu 1 klik dramatycznie przybliża obszar klastra zamiast
      // wymagać 3-4 kliknięć żeby dojść do pojedynczych markerów.
      const lats = cluster.items.map(it => it.coordinate.latitude);
      const lngs = cluster.items.map(it => it.coordinate.longitude);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);

      // Rozmiar bbox + 40% paddingu na widoczność markerów przy krawędziach.
      const rawSpan = Math.max(maxLat - minLat, maxLng - minLng);
      const fitDelta = Math.max(rawSpan * 1.4, INDIVIDUAL_ZOOM_THRESHOLD / 2);
      // Zabezpieczenie: zawsze co najmniej 1.8× zoom-in (żeby było widać efekt).
      const maxAllowed = region.latitudeDelta / 1.8;
      const finalDelta = Math.min(fitDelta, maxAllowed);

      mapRef.current?.animateToRegion(
        {
          latitude: (minLat + maxLat) / 2,
          longitude: (minLng + maxLng) / 2,
          latitudeDelta: finalDelta,
          longitudeDelta: finalDelta
        },
        350
      );
    },
    [region.latitudeDelta]
  );

  const handleCloseCard = useCallback(() => {
    animateCard(false, () => setSelectedId(null));
  }, [animateCard]);

  const handleViewDetails = useCallback(() => {
    if (!selectedAttraction) return;
    navigation.navigate('Details', {
      id: selectedAttraction.id,
      title: selectedAttraction.title,
      description: selectedAttraction.description,
      location: selectedAttraction.location
    });
  }, [selectedAttraction, navigation]);

  const handleCenterOnUser = useCallback(async () => {
    if (userLocation) {
      mapRef.current?.animateToRegion(
        { ...userLocation, latitudeDelta: 0.01, longitudeDelta: 0.01 },
        400
      );
    } else {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        };
        setUserLocation(coords);
        mapRef.current?.animateToRegion(
          { ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 },
          400
        );
      }
    }
  }, [userLocation]);

  const handleMapPress = useCallback(() => {
    if (selectedId) {
      handleCloseCard();
    }
  }, [selectedId, handleCloseCard]);

  const cardStyle = {
    opacity: cardAnim,
    transform: [
      {
        translateY: cardAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [80, 0]
        })
      },
      {
        scale: cardAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.96, 1]
        })
      }
    ]
  };

  const renderIOSMarkers = useCallback(() => {
    return clusters.map(cluster => {
      if (cluster.count === 1) {
        const it = cluster.items[0];
        return (
          <Marker
            key={`ios-${cluster.id}`}
            identifier={cluster.id}
            coordinate={cluster.coordinate}
            onPress={() => handleMarkerPress(cluster.id)}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
            stopPropagation
          >
            <IOSMarker category={it.category} hasModel={!!it.model} />
          </Marker>
        );
      }

      return (
        <Marker
          key={`ios-${cluster.id}`}
          coordinate={cluster.coordinate}
          onPress={() => handleClusterPress(cluster)}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
          stopPropagation
        >
          <IOSClusterMarker count={cluster.count} />
        </Marker>
      );
    });
  }, [clusters, handleMarkerPress, handleClusterPress]);

  const renderAndroidMarkers = useCallback(() => {
    if (!mapReady) return null;

    return clusters.map(cluster => {
      if (cluster.count === 1) {
        const it = cluster.items[0];
        return (
          <Marker
            key={`android-${cluster.id}`}
            identifier={cluster.id}
            coordinate={cluster.coordinate}
            onPress={() => handleMarkerPress(cluster.id)}
            pinColor={it.model ? '#4ADE80' : getCategoryColor(it.category)}
            tracksViewChanges={false}
          />
        );
      }

      return (
        <Marker
          key={`android-${cluster.id}`}
          coordinate={cluster.coordinate}
          onPress={() => handleClusterPress(cluster)}
          pinColor="#4ADE80"
          title={`${cluster.count} miejsc`}
          tracksViewChanges={false}
        />
      );
    });
  }, [
    mapReady,
    clusters,
    handleMarkerPress,
    handleClusterPress,
    getCategoryColor
  ]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={isAndroid ? PROVIDER_GOOGLE : undefined}
        initialRegion={LUBLIN_COORDS}
        onRegionChangeComplete={setRegion}
        onMapReady={() => setMapReady(true)}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        onPress={handleMapPress}
        rotateEnabled={false}
        pitchEnabled={false}
        moveOnMarkerPress={false}
        toolbarEnabled={false}
      >
        {isAndroid ? renderAndroidMarkers() : renderIOSMarkers()}
      </MapView>

      <View style={[styles.topBar, { top: insets.top - 25}]}>
        <View style={styles.statsPill}>
          <Ionicons name="location" size={14} color="#4ADE80" />
          <Text style={styles.statText}>{attractions.length} miejsc</Text>
          <View style={styles.divider} />
          <Ionicons name="cube-outline" size={14} color="#4ADE80" />
          <Text style={styles.statText}>{arCount} AR</Text>
        </View>
        <TouchableOpacity
          style={styles.locationBtn}
          onPress={handleCenterOnUser}
          activeOpacity={0.7}
        >
          <Ionicons name="navigate" size={18} color="#4ADE80" />
        </TouchableOpacity>
      </View>

      {clusters.some(c => c.count > 1) && !selectedId && (
        <View style={[styles.zoomHint, { bottom: insets.bottom + 100 }]}>
          <Ionicons
            name="expand-outline"
            size={16}
            color="rgba(255,255,255,0.8)"
          />
          <Text style={styles.zoomHintText}>
            Kliknij w klaster aby zobaczyć więcej
          </Text>
        </View>
      )}

      {isCardVisible && selectedAttraction && (
        <Animated.View
          style={[styles.card, { bottom: insets.bottom + 100 }, cardStyle]}
        >
          {selectedAttraction.image ? (
            <Image
              source={selectedAttraction.image}
              style={styles.cardBanner}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.cardBanner,
                styles.cardBannerPlaceholder,
                { backgroundColor: getCategoryColor(selectedAttraction.category) + '33' }
              ]}
            >
              <Ionicons
                name={getCategoryIcon(selectedAttraction.category) as any}
                size={40}
                color={getCategoryColor(selectedAttraction.category)}
              />
            </View>
          )}

          <View style={styles.cardHeader}>
            <View
              style={[
                styles.cardIcon,
                {
                  backgroundColor: getCategoryColor(selectedAttraction.category)
                }
              ]}
            >
              <Ionicons
                name={getCategoryIcon(selectedAttraction.category) as any}
                size={20}
                color="#000"
              />
            </View>
            <View style={styles.cardTitleWrap}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {selectedAttraction.title}
              </Text>
              <View style={styles.cardMeta}>
                <Ionicons name="location" size={12} color="#4ADE80" />
                <Text style={styles.cardLocation}>
                  {selectedAttraction.location}
                </Text>
                {selectedAttraction.yearBuilt && (
                  <>
                    <Text style={styles.cardDot}>•</Text>
                    <Text style={styles.cardYear}>
                      {selectedAttraction.yearBuilt}
                    </Text>
                  </>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleCloseCard}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={18} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </View>

          <Text style={styles.cardDesc} numberOfLines={2}>
            {selectedAttraction.description}
          </Text>

          <View style={styles.features}>
            {selectedAttraction.hasAR && (
              <View style={[styles.featurePill, styles.arPill]}>
                <Ionicons name="cube" size={12} color="#A78BFA" />
                <Text style={[styles.featureText, { color: '#A78BFA' }]}>
                  AR
                </Text>
              </View>
            )}
            {selectedAttraction.hasAudio && (
              <View style={[styles.featurePill, styles.audioPill]}>
                <Ionicons name="headset" size={12} color="#4ADE80" />
                <Text style={[styles.featureText, { color: '#4ADE80' }]}>
                  Audio
                </Text>
              </View>
            )}
            {selectedAttraction.hasAI && (
              <View style={[styles.featurePill, styles.aiPill]}>
                <Ionicons name="sparkles" size={12} color="#FBBF24" />
                <Text style={[styles.featureText, { color: '#FBBF24' }]}>
                  AI
                </Text>
              </View>
            )}
          </View>

          <View style={styles.buttons}>
            {selectedAttraction.model && (
              <TouchableOpacity
                style={styles.arBtn}
                onPress={() => setShowARModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="cube" size={18} color="#000" />
                <Text style={styles.arBtnText}>Zobacz w AR</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.detailsBtn,
                !selectedAttraction.model && styles.btnFull
              ]}
              onPress={handleViewDetails}
              activeOpacity={0.8}
            >
              <Text style={styles.detailsBtnText}>Szczegóły</Text>
              <Ionicons name="arrow-forward" size={18} color="#4ADE80" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {selectedAttraction?.model && (
        <ARViewModal
          visible={showARModal}
          attraction={selectedAttraction}
          onClose={() => setShowARModal(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  map: {
    flex: 1
  },
  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 100
  },
  statsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.9)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4
      },
      android: { elevation: 4 }
    })
  },
  statText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600'
  },
  divider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.2)'
  },
  locationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4
      },
      android: { elevation: 4 }
    })
  },
  zoomHint: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    zIndex: 100,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4
      },
      android: { elevation: 4 }
    })
  },
  zoomHintText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '500'
  },
  card: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.95)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    zIndex: 200,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20
      },
      android: { elevation: 12 }
    })
  },
  cardBanner: {
    width: '100%',
    height: 130,
    borderRadius: 14,
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.05)'
  },
  cardBannerPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10
  },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardTitleWrap: {
    flex: 1
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF'
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3
  },
  cardLocation: {
    fontSize: 12,
    color: '#4ADE80',
    fontWeight: '500'
  },
  cardDot: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12
  },
  cardYear: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)'
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 19,
    marginBottom: 12
  },
  features: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  arPill: {
    backgroundColor: 'rgba(139,92,246,0.2)'
  },
  audioPill: {
    backgroundColor: 'rgba(74,222,128,0.2)'
  },
  aiPill: {
    backgroundColor: 'rgba(251,191,36,0.2)'
  },
  featureText: {
    fontSize: 11,
    fontWeight: '600'
  },
  buttons: {
    flexDirection: 'row',
    gap: 10
  },
  arBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4ADE80',
    paddingVertical: 13,
    borderRadius: 12
  },
  arBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700'
  },
  detailsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.3)'
  },
  detailsBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600'
  },
  btnFull: {
    flex: 1
  }
});
