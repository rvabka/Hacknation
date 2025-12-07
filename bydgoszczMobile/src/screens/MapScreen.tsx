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
  Easing
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import ARViewModal from '../components/ARViewModal';
import type { MapScreenProps } from '../navigation/types';
import {
  attractions,
  CATEGORY_ICONS,
  CATEGORY_COLORS,
  getARCount
} from '../data/attractions';

const BYDGOSZCZ_COORDS: Region = {
  latitude: 53.1235,
  longitude: 18.0084,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05
};

const CLUSTER_ZOOM_THRESHOLD = 0.025;
const SELECTED_ZOOM = 0.008;

// Statyczny marker - NIGDY się nie zmienia
const StaticMarker = React.memo(
  ({ category, hasModel }: { category: string; hasModel: boolean }) => {
    const color =
      CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || '#4ADE80';
    const icon =
      CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] ||
      'location-outline';

    return (
      <View style={styles.markerContainer}>
        <View style={[styles.marker, hasModel && styles.markerAR]}>
          <Ionicons name={icon as any} size={18} color={color} />
        </View>
        {hasModel && <View style={styles.arDot} />}
      </View>
    );
  },
  () => true // NIGDY nie re-renderuj
);

export default function MapScreen({ navigation }: MapScreenProps) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const cardAnim = useRef(new Animated.Value(0)).current;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showARModal, setShowARModal] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [region, setRegion] = useState<Region>(BYDGOSZCZ_COORDS);
  const [isCardVisible, setIsCardVisible] = useState(false);

  const selectedAttraction = useMemo(
    () => attractions.find(a => a.id === selectedId) || null,
    [selectedId]
  );

  const showIndividualMarkers = region.latitudeDelta < CLUSTER_ZOOM_THRESHOLD;

  const clusterCenter = useMemo(
    () => ({
      latitude:
        attractions.reduce((sum, a) => sum + a.coordinate.latitude, 0) /
        attractions.length,
      longitude:
        attractions.reduce((sum, a) => sum + a.coordinate.longitude, 0) /
        attractions.length
    }),
    []
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

      // Jeśli kliknięto ten sam marker - zamknij
      if (selectedId === id) {
        animateCard(false, () => setSelectedId(null));
        return;
      }

      // Centruj mapę
      mapRef.current?.animateToRegion(
        {
          latitude: attraction.coordinate.latitude,
          longitude: attraction.coordinate.longitude,
          latitudeDelta: SELECTED_ZOOM,
          longitudeDelta: SELECTED_ZOOM
        },
        300
      );

      setSelectedId(id);
      animateCard(true);
    },
    [selectedId, animateCard]
  );

  const handleClusterPress = useCallback(() => {
    mapRef.current?.animateToRegion(
      {
        latitude: clusterCenter.latitude,
        longitude: clusterCenter.longitude,
        latitudeDelta: CLUSTER_ZOOM_THRESHOLD - 0.008,
        longitudeDelta: CLUSTER_ZOOM_THRESHOLD - 0.008
      },
      350
    );
  }, [clusterCenter]);

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

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={BYDGOSZCZ_COORDS}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        onPress={handleMapPress}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        {showIndividualMarkers ? (
          attractions.map(attraction => (
            <Marker
              key={attraction.id}
              identifier={attraction.id}
              coordinate={attraction.coordinate}
              onPress={() => handleMarkerPress(attraction.id)}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
              stopPropagation
            >
              <StaticMarker
                category={attraction.category}
                hasModel={!!attraction.model}
              />
            </Marker>
          ))
        ) : (
          <Marker
            coordinate={clusterCenter}
            onPress={handleClusterPress}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
            stopPropagation
          >
            <View style={styles.clusterMarker}>
              <Text style={styles.clusterText}>{attractions.length}</Text>
              <Text style={styles.clusterLabel}>miejsc</Text>
            </View>
          </Marker>
        )}
      </MapView>

      {/* Top Bar */}
      <View style={[styles.topBar, { top: insets.top - 35 }]}>
        <View style={styles.statsPill}>
          <Ionicons name="location" size={14} color="#4ADE80" />
          <Text style={styles.statText}>{attractions.length} miejsc</Text>
          <View style={styles.divider} />
          <Ionicons name="cube-outline" size={14} color="#4ADE80" />
          <Text style={styles.statText}>{getARCount()} AR</Text>
        </View>
        <TouchableOpacity
          style={styles.locationBtn}
          onPress={handleCenterOnUser}
        >
          <Ionicons name="navigate" size={18} color="#4ADE80" />
        </TouchableOpacity>
      </View>

      {/* Zoom hint */}
      {!showIndividualMarkers && !selectedId && (
        <View style={[styles.zoomHint, { bottom: insets.bottom + 100 }]}>
          <Ionicons
            name="expand-outline"
            size={16}
            color="rgba(255,255,255,0.8)"
          />
          <Text style={styles.zoomHintText}>
            Przybliż mapę lub kliknij klaster
          </Text>
        </View>
      )}

      {/* Info Card */}
      {isCardVisible && selectedAttraction && (
        <Animated.View
          style={[styles.card, { bottom: insets.bottom + 100 }, cardStyle]}
        >
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
            <TouchableOpacity style={styles.closeBtn} onPress={handleCloseCard}>
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
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8
      },
      android: { elevation: 6 }
    })
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
    ...Platform.select({
      ios: {
        shadowColor: '#4ADE80',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 15
      },
      android: { elevation: 10 }
    })
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
  },
  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
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
    borderColor: 'rgba(255,255,255,0.15)'
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
    borderColor: 'rgba(255,255,255,0.15)'
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
    borderColor: 'rgba(255,255,255,0.1)'
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
