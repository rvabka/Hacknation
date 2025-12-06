import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import { Asset } from 'expo-asset';
import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';
import type { ARViewScreenProps } from '../navigation/types';

export default function ARViewScreen({ route, navigation }: ARViewScreenProps) {
  const { attraction } = route.params;
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const onContextCreate = async (gl: any) => {
    try {
      const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

      // Renderer
      const renderer = new Renderer({ gl });
      renderer.setSize(width, height);
      renderer.setClearColor(0x000000, 0); // Przezroczyste tło

      // Scene
      const scene = new THREE.Scene();

      // Camera
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.z = 3;
      camera.position.y = 1;

      // Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(5, 10, 7.5);
      scene.add(directionalLight);

      const pointLight = new THREE.PointLight(0xffffff, 0.5);
      pointLight.position.set(0, 5, 0);
      scene.add(pointLight);

      // Load 3D Model (.glb)
      try {
        const asset = Asset.fromModule(
          require('../../assets/models/lucznik.glb') // ← Zmień na swoją nazwę pliku
        );
        await asset.downloadAsync();

        const loader = new GLTFLoader();

        loader.load(
          asset.localUri || asset.uri,
          gltf => {
            const model = gltf.scene;

            // Centruj model
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            model.position.sub(center);

            // Skalowanie
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 2 / maxDim;
            model.scale.setScalar(scale);

            scene.add(model);
            setIsLoading(false);

            // Animacja obrotu modelu
            let rotation = 0;
            const animate = () => {
              requestAnimationFrame(animate);

              rotation += 0.01;
              model.rotation.y = rotation;

              renderer.render(scene, camera);
              gl.endFrameEXP();
            };

            animate();
          },
          progress => {
            const percentComplete = (progress.loaded / progress.total) * 100;
            console.log(`Loading: ${percentComplete.toFixed(0)}%`);
          },
          error => {
            console.error('Error loading model:', error);
            setError('Nie udało się załadować modelu 3D');
            setIsLoading(false);
          }
        );
      } catch (err) {
        console.error('Error loading asset:', err);
        setError('Nie znaleziono pliku modelu 3D');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error in onContextCreate:', error);
      setError('Błąd inicjalizacji 3D');
      setIsLoading(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Proszę czekać...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>❌ Brak dostępu do kamery</Text>
        <Text style={styles.errorSubtext}>
          Włącz dostęp do kamery w ustawieniach telefonu
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Powrót</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>⚠️ {error}</Text>
        <Text style={styles.errorSubtext}>
          Upewnij się, że plik castle.glb znajduje się w assets/models/
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Powrót</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Kamera w tle */}
      <CameraView style={styles.camera} facing="back" />

      {/* 3D Model overlay */}
      <GLView style={styles.glView} onContextCreate={onContextCreate} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{attraction.title}</Text>
          <Text style={styles.subtitle}>Widok AR 📱</Text>
        </View>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Ładowanie modelu 3D...</Text>
          <Text style={styles.loadingSubtext}>Może to potrwać chwilę</Text>
        </View>
      )}

      {/* Instructions */}
      {!isLoading && (
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            🔄 Model obraca się automatycznie
          </Text>
          <Text style={styles.instructionText}>
            📱 Poruszaj telefonem, aby zobaczyć z różnych stron
          </Text>
        </View>
      )}

      {/* Bottom controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          // onPress={() =>
          //   navigation.navigate('Details', {
          //     id: attraction.id,
          //     title: attraction.title,
          //     description: attraction.description,
          //     rating: attraction.rating,
          //     location: attraction.location
          //   })
          // }
        >
          <Text style={styles.controlButtonText}>ℹ️ Szczegóły</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  camera: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  glView: {
    flex: 1,
    backgroundColor: 'transparent'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: 'rgba(0,0,0,0.6)'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 16,
    color: '#d1d5db'
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold'
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold'
  },
  loadingSubtext: {
    marginTop: 5,
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center'
  },
  instructions: {
    position: 'absolute',
    top: '50%',
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 16,
    borderRadius: 12
  },
  instructionText: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center'
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'center'
  },
  controlButton: {
    backgroundColor: 'rgba(59,130,246,0.9)',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
    minWidth: 150
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  errorText: {
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10
  },
  errorSubtext: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20
  },
  backButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
