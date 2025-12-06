import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Animated,
  Easing
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import ARViewModal from '../components/ARViewModal';
import type { MapTabScreenProps } from '../navigation/types';
import { attractions } from '../data/attractions';

const BYDGOSZCZ_COORDS = {
  latitude: 53.1235,
  longitude: 18.0084,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05
};

export default function MapScreen({ navigation }: MapTabScreenProps) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const [selectedAttraction, setSelectedAttraction] = useState<
    (typeof attractions)[0] | null
  >(null);
  const [showARModal, setShowARModal] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isCardVisible, setIsCardVisible] = useState(false);
  const cardAnim = useRef(new Animated.Value(0)).current;

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

  const handleMarkerPress = (attraction: (typeof attractions)[0]) => {
    if (selectedAttraction?.id === attraction.id) return;

    setSelectedAttraction(attraction);
    setIsCardVisible(true);
    cardAnim.setValue(0);

    Animated.spring(cardAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true
    }).start();
  };

  const handleCloseCard = () => {
    Animated.timing(cardAnim, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true
    }).start(() => {
      setSelectedAttraction(null);
      setIsCardVisible(false);
    });
  };

  const handleViewAR = () => {
    setShowARModal(true);
  };

  const handleCloseAR = () => {
    setShowARModal(false);
  };

  const handleViewDetails = () => {
    if (selectedAttraction) {
      // @ts-expect-error - Details is in parent Stack Navigator
      navigation.navigate('Details', {
        id: selectedAttraction.id,
        title: selectedAttraction.title,
        description: selectedAttraction.description,
        rating: selectedAttraction.rating,
        location: selectedAttraction.location
      });
    }
  };

  const handleCenterOnUser = async () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          ...userLocation,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01
        },
        500
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
          {
            ...coords,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01
          },
          500
        );
      }
    }
  };

  const cardTranslateY = cardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0]
  });

  const cardOpacity = cardAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.8, 1]
  });

  const cardScale = cardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1]
  });

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={BYDGOSZCZ_COORDS}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        showsBuildings
        showsTraffic={false}
        pitchEnabled
        rotateEnabled
        onPress={() => isCardVisible && handleCloseCard()}
        camera={{
          center: BYDGOSZCZ_COORDS,
          pitch: 60,
          heading: 0,
          altitude: 1000,
          zoom: 14
        }}
      >
        {attractions.map(attraction => (
          <Marker
            key={attraction.id}
            coordinate={attraction.coordinate}
            onPress={() => handleMarkerPress(attraction)}
          >
            <View
              style={[
                styles.markerContainer,
                selectedAttraction?.id === attraction.id &&
                  styles.markerSelected
              ]}
            >
              <Ionicons
                name="location"
                size={24}
                color={
                  selectedAttraction?.id === attraction.id
                    ? '#FFFFFF'
                    : '#1B4D3E'
                }
              />
            </View>
          </Marker>
        ))}
      </MapView>

      <View style={[styles.topBar, { top: insets.top - 35 }]}>
        <View style={styles.statsPill}>
          <View style={styles.statItem}>
            <Ionicons name="location" size={14} color="#4ADE80" />
            <Text style={styles.statValue}>{attractions.length}</Text>
            <Text style={styles.statLabel}>miejsc</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="cube-outline" size={14} color="#4ADE80" />
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>modele AR</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.locationButton}
          onPress={handleCenterOnUser}
        >
          <Ionicons name="navigate" size={18} color="#4ADE80" />
        </TouchableOpacity>
      </View>

      {isCardVisible && selectedAttraction && (
        <Animated.View
          style={[
            styles.infoCardContainer,
            {
              bottom: insets.bottom + 60,
              opacity: cardOpacity,
              transform: [{ translateY: cardTranslateY }, { scale: cardScale }]
            }
          ]}
        >
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="business-outline" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.infoTitleContainer}>
                <Text style={styles.infoTitle}>{selectedAttraction.title}</Text>
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={12} color="#4ADE80" />
                  <Text style={styles.infoLocation}>
                    {selectedAttraction.location}
                  </Text>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={10} color="#FBBF24" />
                    <Text style={styles.ratingText}>
                      {selectedAttraction.rating}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={styles.closeCardButton}
                onPress={handleCloseCard}
              >
                <Ionicons
                  name="close"
                  size={18}
                  color="rgba(255,255,255,0.6)"
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.infoDescription}>
              {selectedAttraction.description}
            </Text>

            <View style={styles.buttonsRow}>
              <TouchableOpacity style={styles.arButton} onPress={handleViewAR}>
                <View style={styles.arBadge}>
                  <Text style={styles.arBadgeText}>AR</Text>
                </View>
                <Text style={styles.buttonText}>Zobacz w AR</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.detailsButton}
                onPress={handleViewDetails}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.buttonText}>Szczegóły</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}

      {selectedAttraction && (
        <ARViewModal
          visible={showARModal}
          attraction={selectedAttraction}
          onClose={handleCloseAR}
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
    alignItems: 'center'
  },
  statsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8
      },
      android: {
        elevation: 6
      }
    })
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)'
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  },
  locationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8
      },
      android: {
        elevation: 6
      }
    })
  },
  markerContainer: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#1B4D3E',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8
      },
      android: {
        elevation: 6
      }
    })
  },
  markerSelected: {
    backgroundColor: '#1B4D3E',
    borderColor: '#4ADE80'
  },
  infoCardContainer: {
    position: 'absolute',
    left: 16,
    right: 16
  },
  infoCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20
      },
      android: {
        elevation: 10
      }
    })
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1B4D3E',
    justifyContent: 'center',
    alignItems: 'center'
  },
  infoTitleContainer: {
    flex: 1
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4
  },
  infoLocation: {
    fontSize: 12,
    color: '#4ADE80',
    fontWeight: '500'
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8
  },
  ratingText: {
    fontSize: 11,
    color: '#FBBF24',
    fontWeight: '600'
  },
  closeCardButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  infoDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
    marginBottom: 14
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10
  },
  arButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1B4D3E',
    paddingVertical: 12,
    borderRadius: 12
  },
  detailsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  arBadge: {
    backgroundColor: '#4ADE80',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  arBadgeText: {
    color: '#1B4D3E',
    fontSize: 10,
    fontWeight: '800'
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600'
  }
});
