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
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  Region
} from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { useTour } from '../context/TourContext';
import { useSpeech } from '../hooks/useSpeech';
import {
  CATEGORY_ICONS,
  CATEGORY_COLORS
} from '../data/attractions';
import { useAttractions } from '../hooks/useAttractions';
import { colors, radii, font, shadow } from '../theme';

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

// Dyskretyzacja poziomu zoomu na potrzeby klastrowania.
// MapKit zwraca lekko różne latitudeDelta przy samym PRZESUWANIU mapy (projekcja
// Mercatora – ten sam ekran obejmuje inny zakres szerokości na różnych
// szerokościach geograficznych – plus jitter silnika). Gdy siatka klastrów liczona
// jest wprost z latitudeDelta, te mikrozmiany przesuwają granice komórek, markery
// przeskakują między komórkami, zmieniają się id klastrów i markery się
// przemontowują → klastry "znikają"/skaczą podczas panningu.
// Kubełkujemy zoom w stałe poziomy (1/3 oktawy): przesuwanie nie zmienia poziomu,
// więc siatka i klastry są stabilne. Przeliczamy dopiero przy realnej zmianie zoomu.
function zoomBucket(latitudeDelta: number): number {
  return Math.round(Math.log2(latitudeDelta) * 3);
}

function deltaFromBucket(bucket: number): number {
  return Math.pow(2, bucket / 3);
}

interface Cluster {
  id: string;
  coordinate: { latitude: number; longitude: number };
  count: number;
  items: {
    id: string;
    coordinate: { latitude: number; longitude: number };
    category: string;
  }[];
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
      items: [it]
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
        items: []
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
  }

  // Klastrom z count===1 nadajemy id atrakcji – pozwala podpiąć pod istniejące
  // selektory i animacje pojedynczego markera.
  return Array.from(grid.values()).map(c =>
    c.count === 1 ? { ...c, id: c.items[0].id } : c
  );
}

const isAndroid = Platform.OS === 'android';

const IOSMarker = React.memo(
  ({ category }: { category: string }) => {
    const color =
      CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || colors.mint;
    const icon =
      CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] ||
      'location-outline';

    return (
      <View style={iosStyles.markerContainer}>
        <View style={iosStyles.marker}>
          <Ionicons name={icon as any} size={18} color={color} />
        </View>
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
    backgroundColor: colors.forestDeep,
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
    borderColor: colors.mint
  },
  arDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.mint,
    borderWidth: 2,
    borderColor: colors.forestDeep
  },
  clusterMarker: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.mint,
    shadowColor: colors.mint,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15
  },
  clusterText: {
    color: colors.mint,
    fontSize: 22,
    fontWeight: '700'
  },
  clusterLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '500',
    marginTop: -2
  },
  routeMarker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.mint,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4
  },
  routeMarkerText: {
    color: '#0B3D2E',
    fontSize: 15,
    fontWeight: '800'
  }
});

const RouteStopMarkerView = React.memo(
  ({ order }: { order: number }) => (
    <View style={iosStyles.routeMarker}>
      <Text style={iosStyles.routeMarkerText}>{order}</Text>
    </View>
  ),
  () => true
);

export default function MapScreen() {
  const navigation = useAppNavigation();
  const insets = useSafeAreaInsets();
  const { attractions } = useAttractions();
  const { tour, endTour } = useTour();
  const { speak: speakGuide, stop: stopGuide } = useSpeech();
  const mapRef = useRef<MapView>(null);
  const cardAnim = useRef(new Animated.Value(0)).current;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [region, setRegion] = useState<Region>(LUBLIN_COORDS);
  const [isCardVisible, setIsCardVisible] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  // react-native-maps z tracksViewChanges={trackChanges} robi snapshot custom-markera
  // od razu po montażu – jeśli treść nie zdążyła się wyrenderować, marker wychodzi
  // pusty/niewidoczny. Po każdej zmianie zestawu klastrów (np. po kliknięciu klastra
  // i zmianie zoomu) włączamy tracking na chwilę, żeby markery się poprawnie
  // narysowały, a potem wyłączamy dla wydajności.
  const [trackChanges, setTrackChanges] = useState(true);

  // Wirtualny spacer (auto-przewodnik): mapa sama przelatuje po przystankach
  // trasy, lektor czyta opis każdego miejsca, po skończeniu → następny przystanek.
  const [guideActive, setGuideActive] = useState(false);
  const [guideStep, setGuideStep] = useState(0);
  const [guidePaused, setGuidePaused] = useState(false);
  // "Generacja" bieżącej wypowiedzi. Zatrzymanie utterance na iOS potrafi odpalić
  // onDone poprzedniej wypowiedzi – bez tego strażnika onDone z anulowanej mowy
  // przesuwałby krok i powstawała kaskada aż do ostatniego przystanku.
  const speakTokenRef = useRef(0);

  const selectedAttraction = useMemo(
    () => attractions.find(a => a.id === selectedId) || null,
    [selectedId, attractions]
  );

  // Klastrujemy względem zdyskretyzowanego poziomu zoomu, nie surowego
  // latitudeDelta – dzięki temu samo przesuwanie mapy (które delikatnie zmienia
  // latitudeDelta) nie przelicza siatki i klastry zostają stabilne.
  const clusterBucket = zoomBucket(region.latitudeDelta);
  const clusters = useMemo(
    () => buildClusters(attractions, deltaFromBucket(clusterBucket)),
    [attractions, clusterBucket]
  );

  // Gdy zmienia się zestaw klastrów, daj markerom ~700 ms na poprawne
  // narysowanie się (tracking on), po czym zamroź dla wydajności.
  useEffect(() => {
    setTrackChanges(true);
    const t = setTimeout(() => setTrackChanges(false), 700);
    return () => clearTimeout(t);
  }, [clusters, tour]);

  // Współrzędne linii trasy: pozycja startowa (użytkownik) → kolejne przystanki.
  const routeCoords = useMemo(() => {
    if (!tour) return [];
    const coords = tour.stops.map(s => s.coordinate);
    return tour.start ? [tour.start, ...coords] : coords;
  }, [tour]);

  // Po włączeniu trasy dopasuj kadr mapy tak, by zmieściła się cała trasa.
  useEffect(() => {
    if (tour && mapReady && routeCoords.length >= 2) {
      mapRef.current?.fitToCoordinates(routeCoords, {
        edgePadding: { top: 160, right: 60, bottom: 220, left: 60 },
        animated: true
      });
    }
  }, [tour, mapReady, routeCoords]);

  const formatRouteTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  };

  const formatRouteDistance = (meters: number) =>
    meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;

  const getCategoryIcon = useCallback(
    (category: string) =>
      CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] ||
      'location-outline',
    []
  );

  const getCategoryColor = useCallback(
    (category: string) =>
      CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || colors.mint,
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
      // Pojedynczy obiekt schowany pod id klastra – potraktuj jak zwykły marker.
      if (cluster.items.length <= 1) {
        handleMarkerPress(cluster.items[0]?.id ?? cluster.id);
        return;
      }

      const lats = cluster.items.map(it => it.coordinate.latitude);
      const lngs = cluster.items.map(it => it.coordinate.longitude);
      const span = Math.max(
        Math.max(...lats) - Math.min(...lats),
        Math.max(...lngs) - Math.min(...lngs)
      );

      // Obiekty praktycznie w jednym punkcie – fitToCoordinates wbiłoby zoom do
      // oporu, więc zamiast tego przybliżamy na rozsądny poziom ulicy wokół środka.
      if (span < 0.0006) {
        mapRef.current?.animateToRegion(
          {
            latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
            longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
            latitudeDelta: 0.004,
            longitudeDelta: 0.004
          },
          350
        );
        return;
      }

      // Standardowo: dopasuj kadr tak, by WSZYSTKIE obiekty klastra były widoczne.
      mapRef.current?.fitToCoordinates(
        cluster.items.map(it => it.coordinate),
        {
          edgePadding: { top: 150, right: 80, bottom: 200, left: 80 },
          animated: true
        }
      );
    },
    [handleMarkerPress]
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

  // Przyciski +/- : skalujemy bieżący region (factor < 1 = przybliż, > 1 = oddal),
  // z ograniczeniem żeby nie wyjść poza sensowny zakres zoomu.
  const zoomBy = useCallback(
    (factor: number) => {
      const MIN_DELTA = 0.0025;
      const MAX_DELTA = 0.6;
      const clamp = (v: number) =>
        Math.min(Math.max(v, MIN_DELTA), MAX_DELTA);
      mapRef.current?.animateToRegion(
        {
          latitude: region.latitude,
          longitude: region.longitude,
          latitudeDelta: clamp(region.latitudeDelta * factor),
          longitudeDelta: clamp(region.longitudeDelta * factor)
        },
        200
      );
    },
    [region]
  );

  // Tapnięcie banera trasy → wróć do zakładki Planuj (gdzie powstała trasa).
  const goToPlanner = useCallback(() => {
    (navigation as any).navigate('PlannerTab');
  }, [navigation]);

  const startGuide = useCallback(() => {
    if (!tour || tour.stops.length === 0) return;
    setGuidePaused(false);
    setGuideActive(true);
    setGuideStep(0);
  }, [tour]);

  const stopGuideMode = useCallback(() => {
    speakTokenRef.current++;
    stopGuide();
    setGuideActive(false);
    setGuidePaused(false);
  }, [stopGuide]);

  const guideNext = useCallback(() => {
    speakTokenRef.current++; // unieważnij onDone bieżącej wypowiedzi
    stopGuide();
    setGuideStep(s => s + 1);
  }, [stopGuide]);

  const guideTogglePause = useCallback(() => {
    setGuidePaused(p => {
      if (!p) {
        speakTokenRef.current++;
        stopGuide(); // pauza → zatrzymaj lektora
      }
      return !p;
    });
  }, [stopGuide]);

  // Zakończenie trasy ma też zatrzymać spacer i lektora.
  const handleEndTour = useCallback(() => {
    speakTokenRef.current++;
    stopGuide();
    setGuideActive(false);
    setGuidePaused(false);
    endTour();
  }, [stopGuide, endTour]);

  // Sterowanie spacerem: dla bieżącego przystanku przeleć mapą, pokaż kartę i
  // czytaj opis; po skończeniu (onDone) przejdź do następnego. Pauza wstrzymuje.
  useEffect(() => {
    if (!guideActive) return;

    const stop = tour?.stops[guideStep];
    if (!stop) {
      // koniec trasy
      setGuideActive(false);
      setGuidePaused(false);
      return;
    }

    mapRef.current?.animateToRegion(
      {
        latitude: stop.coordinate.latitude,
        longitude: stop.coordinate.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005
      },
      700
    );
    setSelectedId(stop.id);
    animateCard(true);

    if (guidePaused) return;

    const a = attractions.find(x => x.id === stop.id);
    const text = a
      ? `${a.title}. ${a.description}${
          a.funFacts && a.funFacts.length > 0
            ? '. Ciekawostka. ' + a.funFacts[0]
            : ''
        }`
      : stop.title;

    speakTokenRef.current++;
    const myToken = speakTokenRef.current;
    speakGuide(text, {
      onDone: () => {
        // Przesuń krok tylko gdy ta wypowiedź wciąż jest aktualna (nie została
        // anulowana przez następny/pauzę/stop ani przez start kolejnej mowy).
        if (speakTokenRef.current === myToken) {
          setGuideStep(s => s + 1);
        }
      }
    });
  }, [
    guideActive,
    guideStep,
    guidePaused,
    tour,
    attractions,
    animateCard,
    speakGuide
  ]);

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
            tracksViewChanges={trackChanges}
            stopPropagation
          >
            <IOSMarker category={it.category} />
          </Marker>
        );
      }

      return (
        <Marker
          key={`ios-${cluster.id}`}
          coordinate={cluster.coordinate}
          onPress={() => handleClusterPress(cluster)}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={trackChanges}
          stopPropagation
        >
          <IOSClusterMarker count={cluster.count} />
        </Marker>
      );
    });
  }, [clusters, handleMarkerPress, handleClusterPress, trackChanges]);

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
            pinColor={getCategoryColor(it.category)}
            tracksViewChanges={trackChanges}
          />
        );
      }

      return (
        <Marker
          key={`android-${cluster.id}`}
          coordinate={cluster.coordinate}
          onPress={() => handleClusterPress(cluster)}
          pinColor={colors.mint}
          title={`${cluster.count} miejsc`}
          tracksViewChanges={trackChanges}
        />
      );
    });
  }, [
    mapReady,
    clusters,
    handleMarkerPress,
    handleClusterPress,
    getCategoryColor,
    trackChanges
  ]);

  // Tryb trasy: linia łącząca przystanki w kolejności + numerowane piny.
  // Zwracamy płaską tablicę elementów (nie fragment) – react-native-maps
  // czyta dzieci MapView jako listę i tak jest najbezpieczniej.
  const renderTour = useCallback(() => {
    if (!tour) return null;
    const elements: React.ReactNode[] = [];

    if (routeCoords.length >= 2) {
      elements.push(
        <Polyline
          key="tour-line"
          coordinates={routeCoords}
          strokeColor={colors.mint}
          strokeWidth={5}
          lineCap="round"
          lineJoin="round"
        />
      );
    }

    tour.stops.forEach(stop => {
      elements.push(
        <Marker
          key={`tour-${stop.id}`}
          identifier={`tour-${stop.id}`}
          coordinate={stop.coordinate}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={trackChanges}
          onPress={() => handleMarkerPress(stop.id)}
          zIndex={999}
        >
          <RouteStopMarkerView order={stop.order} />
        </Marker>
      );
    });

    return elements;
  }, [tour, routeCoords, handleMarkerPress, trackChanges]);

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
        {tour
          ? renderTour()
          : isAndroid
          ? renderAndroidMarkers()
          : renderIOSMarkers()}
      </MapView>

      <View style={[styles.topBar, { top: insets.top + 8 }]}>
        <View style={styles.statsPill}>
          <Ionicons name="location" size={14} color={colors.mint} />
          <Text style={styles.statText}>{attractions.length} miejsc Lublina</Text>
        </View>
        <TouchableOpacity
          style={styles.locationBtn}
          onPress={handleCenterOnUser}
          activeOpacity={0.7}
        >
          <Ionicons name="navigate" size={18} color={colors.mint} />
        </TouchableOpacity>
      </View>

      {tour && (
        <>
          <View style={[styles.tourBanner, { top: insets.top + 62 }]}>
            <TouchableOpacity
              style={styles.tourBannerMain}
              onPress={goToPlanner}
              activeOpacity={0.7}
            >
              <View style={styles.tourBannerIcon}>
                <Ionicons name="map" size={18} color="#0B3D2E" />
              </View>
              <View style={styles.tourBannerInfo}>
                <Text style={styles.tourBannerTitle}>Trasa zwiedzania</Text>
                <Text style={styles.tourBannerSub}>
                  {tour.stops.length} przystanków ·{' '}
                  {formatRouteTime(tour.totalMinutes)} ·{' '}
                  {formatRouteDistance(tour.totalMeters)}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color="rgba(255,255,255,0.45)"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tourBannerClose}
              onPress={handleEndTour}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={[styles.guideBar, { top: insets.top + 128 }]}>
            {!guideActive ? (
              <TouchableOpacity
                style={styles.guideStartBtn}
                onPress={startGuide}
                activeOpacity={0.85}
              >
                <Ionicons name="play" size={18} color="#0B3D2E" />
                <Text style={styles.guideStartText}>Wirtualny spacer</Text>
              </TouchableOpacity>
            ) : (
              <>
                <Text style={styles.guideProgress}>
                  Przystanek {Math.min(guideStep + 1, tour.stops.length)}/
                  {tour.stops.length}
                </Text>
                <View style={styles.guideControls}>
                  <TouchableOpacity
                    style={styles.guideCtrlBtn}
                    onPress={guideTogglePause}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={guidePaused ? 'play' : 'pause'}
                      size={18}
                      color="#FFF"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.guideCtrlBtn}
                    onPress={guideNext}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="play-skip-forward" size={18} color="#FFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.guideCtrlBtn, styles.guideStopBtn]}
                    onPress={stopGuideMode}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="stop" size={16} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </>
      )}

      {!isCardVisible && (
        <View style={[styles.zoomControl, { bottom: insets.bottom + 110 }]}>
          <TouchableOpacity
            style={styles.zoomButton}
            onPress={() => zoomBy(0.5)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={26} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.zoomDivider} />
          <TouchableOpacity
            style={styles.zoomButton}
            onPress={() => zoomBy(2)}
            activeOpacity={0.7}
          >
            <Ionicons name="remove" size={26} color="#FFF" />
          </TouchableOpacity>
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
                color={colors.white}
              />
            </View>
            <View style={styles.cardTitleWrap}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {selectedAttraction.title}
              </Text>
              <View style={styles.cardMeta}>
                <Ionicons name="location" size={12} color={colors.mint} />
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
              <Ionicons name="close" size={18} color={colors.inkFaint} />
            </TouchableOpacity>
          </View>

          <Text style={styles.cardDesc} numberOfLines={2}>
            {selectedAttraction.description}
          </Text>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.detailsBtn, styles.btnFull]}
              onPress={handleViewDetails}
              activeOpacity={0.9}
            >
              <Text style={styles.detailsBtnText}>Zobacz szczegóły</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.mint} />
            </TouchableOpacity>
          </View>
        </Animated.View>
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
    backgroundColor: colors.forestDeep,
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
    backgroundColor: colors.forestDeep,
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
  zoomControl: {
    position: 'absolute',
    right: 16,
    backgroundColor: colors.forestDeep,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
    zIndex: 100,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6
      },
      android: { elevation: 5 }
    })
  },
  zoomButton: {
    width: 46,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center'
  },
  zoomDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)'
  },
  tourBanner: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.forestDeep,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(55,208,138,0.45)',
    zIndex: 150,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10
      },
      android: { elevation: 8 }
    })
  },
  tourBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.mint,
    justifyContent: 'center',
    alignItems: 'center'
  },
  tourBannerInfo: {
    flex: 1
  },
  tourBannerTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700'
  },
  tourBannerSub: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2
  },
  tourBannerClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  tourBannerMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  guideBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.forestDeep,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    zIndex: 150,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8
      },
      android: { elevation: 7 }
    })
  },
  guideStartBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.mint,
    paddingVertical: 10,
    borderRadius: 12
  },
  guideStartText: {
    color: '#0B3D2E',
    fontSize: 15,
    fontWeight: '700'
  },
  guideProgress: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8
  },
  guideControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  guideCtrlBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  guideStopBtn: {
    backgroundColor: 'rgba(248,113,113,0.85)'
  },
  card: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 16,
    zIndex: 200,
    ...(shadow.lg as object)
  },
  cardBanner: {
    width: '100%',
    height: 132,
    borderRadius: radii.md,
    marginBottom: 14,
    backgroundColor: colors.surfaceAlt
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
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardTitleWrap: {
    flex: 1
  },
  cardTitle: {
    fontFamily: font.bold,
    fontSize: 17,
    color: colors.ink
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3
  },
  cardLocation: {
    fontSize: 13,
    color: colors.forest,
    fontFamily: font.bold
  },
  cardDot: {
    color: colors.inkFaint,
    fontSize: 12
  },
  cardYear: {
    fontSize: 12,
    color: colors.inkFaint,
    fontFamily: font.regular
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardDesc: {
    fontSize: 14,
    color: colors.inkSoft,
    fontFamily: font.regular,
    lineHeight: 21,
    marginBottom: 14
  },
  buttons: {
    flexDirection: 'row',
    gap: 10
  },
  detailsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.forest,
    paddingVertical: 14,
    borderRadius: radii.md
  },
  detailsBtnText: {
    color: colors.onForest,
    fontSize: 15,
    fontFamily: font.bold
  },
  btnFull: {
    flex: 1
  }
});
