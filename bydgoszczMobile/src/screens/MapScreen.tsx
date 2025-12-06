import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Modal
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import ARViewModal from '../components/ARViewModal';
import type { MapTabScreenProps } from '../navigation/types';

// Współrzędne Bydgoszczy
const BYDGOSZCZ_COORDS = {
  latitude: 53.1235,
  longitude: 18.0084,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05
};

// Atrakcje z poprzedniego ekranu
const attractions = [
  {
    id: '1',
    title: 'Stare Miasto',
    description: 'Zabytkowe centrum Bydgoszczy z pięknymi kamienicami',
    rating: 4.8,
    location: 'Centrum',
    coordinate: {
      latitude: 53.1235,
      longitude: 18.0084
    }
  },
  {
    id: '2',
    title: 'Wyspa Młyńska',
    description: 'Malownicza wyspa nad Brdą',
    rating: 4.7,
    location: 'Śródmieście',
    coordinate: {
      latitude: 53.1225,
      longitude: 18.0054
    }
  },
  {
    id: '3',
    title: 'Opera Nova',
    description: 'Nowoczesna opera nad rzeką',
    rating: 4.9,
    location: 'Wyspa Młyńska',
    coordinate: {
      latitude: 53.1245,
      longitude: 18.0094
    }
  }
];

export default function MapScreen({ navigation }: MapTabScreenProps) {
  const [selectedAttraction, setSelectedAttraction] = useState<
    (typeof attractions)[0] | null
  >(null);
  const [showARModal, setShowARModal] = useState(false);

  const handleMarkerPress = (attraction: (typeof attractions)[0]) => {
    setSelectedAttraction(attraction);
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

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={BYDGOSZCZ_COORDS}
        showsUserLocation
        showsMyLocationButton
        showsCompass
        showsScale
        showsBuildings
        showsTraffic={false}
        pitchEnabled
        rotateEnabled
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
            title={attraction.title}
            description={`⭐ ${attraction.rating} - ${attraction.location}`}
            onPress={() => handleMarkerPress(attraction)}
          >
            <View style={styles.markerContainer}>
              <Text style={styles.markerEmoji}>🏰</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {selectedAttraction && (
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>{selectedAttraction.title}</Text>
          <Text style={styles.infoDescription}>
            {selectedAttraction.description}
          </Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoRating}>
              ⭐ {selectedAttraction.rating}
            </Text>
            <Text style={styles.infoLocation}>
              📍 {selectedAttraction.location}
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.arButton]}
              onPress={handleViewAR}
            >
              <Text style={styles.buttonText}>📱 Zobacz w AR</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.detailsButton]}
              onPress={handleViewDetails}
            >
              <Text style={styles.buttonText}>ℹ️ Szczegóły</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* AR Modal */}
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
    flex: 1
  },
  map: {
    flex: 1
  },
  markerContainer: {
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#3b82f6',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  markerEmoji: {
    fontSize: 24
  },
  infoBox: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8
  },
  infoDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  infoRating: {
    fontSize: 16,
    color: '#f59e0b'
  },
  infoLocation: {
    fontSize: 16,
    color: '#6b7280'
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  arButton: {
    backgroundColor: '#10b981'
  },
  detailsButton: {
    backgroundColor: '#3b82f6'
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold'
  }
});
