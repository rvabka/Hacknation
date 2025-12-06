import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Modal
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import { Asset } from 'expo-asset';
import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';
import * as Device from 'expo-device';
import { Gyroscope } from 'expo-sensors';

// --- INTERFEJSY ---
interface Attraction {
  id: string;
  title: string;
  description: string;
  rating: number;
  location: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
}

interface ARViewModalProps {
  visible: boolean;
  attraction: Attraction;
  onClose: () => void;
}

export default function ARViewModal({
  visible,
  attraction,
  onClose
}: ARViewModalProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSimulator, setIsSimulator] = useState(false);
  const [isPlaced, setIsPlaced] = useState(false);

  // Refs dla sensorów i rotacji
  const gyroSubscription = useRef<any>(null);
  // Początkowa rotacja kamery w 3D, którą modyfikuje żyroskop
  const cameraRotation = useRef({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    if (visible) {
      setIsPlaced(false);
      // Reset rotacji przy otwarciu, kamera patrzy prosto
      cameraRotation.current = { x: 0, y: 0, z: 0 };

      (async () => {
        const isDeviceSimulator = !Device.isDevice;
        setIsSimulator(isDeviceSimulator);

        if (isDeviceSimulator) {
          setHasPermission(true);
        } else {
          const { status } = await Camera.requestCameraPermissionsAsync();
          setHasPermission(status === 'granted');

          setTimeout(() => {
            if (status === 'granted') {
              startSensors();
            }
          }, 500);
        }
      })();
    } else {
      stopSensors();
    }

    return () => {
      stopSensors();
    };
  }, [visible]);

  // --- OBSŁUGA SENSORÓW ---
  const startSensors = () => {
    // Szybki interwał dla płynności
    Gyroscope.setUpdateInterval(50); // 20 FPS

    // Zmniejszona czułość, aby zminimalizować dryf
    const GYRO_SENSITIVITY = 0.05;

    gyroSubscription.current = Gyroscope.addListener(gyroscopeData => {
      // Znak ujemny dla X i Y, aby dopasować do konwencji Three.js/kamery
      cameraRotation.current.x -= gyroscopeData.x * GYRO_SENSITIVITY;
      cameraRotation.current.y -= gyroscopeData.y * GYRO_SENSITIVITY;

      // Ograniczenie rotacji X (góra/dół), aby uniknąć błędów
      cameraRotation.current.x = Math.max(
        -Math.PI / 3, // ~-60 stopni
        Math.min(Math.PI / 3, cameraRotation.current.x) // ~60 stopni
      );
      // Nie ograniczamy Y, aby umożliwić obrót o 360 stopni
    });

    console.log('📡 Gyroscope uruchomiony i zminimalizowany');
  };

  const stopSensors = () => {
    if (gyroSubscription.current) {
      gyroSubscription.current.remove();
      gyroSubscription.current = null;
    }
    console.log('📡 Sensory zatrzymane');
  };
  // --- KONIEC OBSŁUGI SENSORÓW ---

  // --- GLVIEW/THREE.JS INICJALIZACJA ---
  const onContextCreate = async (gl: any) => {
    try {
      const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

      // 1. Renderer
      const renderer = new Renderer({ gl });
      renderer.setSize(width, height);
      renderer.setClearColor(0x000000, 0); // KLUCZOWE: Przezroczyste tło

      // 2. Scene
      const scene = new THREE.Scene();

      // 3. Camera (Pozycja jest stała, zmieniamy tylko rotację)
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.set(0, 1.6, 0); // Wysokość oczu

      // 4. Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
      directionalLight.position.set(10, 20, 10);
      scene.add(directionalLight);

      // 5. Load 3D Model
      try {
        const asset = Asset.fromModule(require('../../assets/lucznik.glb'));
        await asset.downloadAsync();
        const loader = new GLTFLoader();
        const finalPosition = new THREE.Vector3(0, 0, -5); // 5m przed kamerą

        loader.load(
          asset.localUri || asset.uri,
          gltf => {
            const model = gltf.scene;
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            // Skalowanie modelu (np. do 3m wysokości/szerokości)
            const maxDim = Math.max(size.x, size.y, size.z);
            const targetSize = 3;
            const scale = targetSize / maxDim;

            // Centruj model, aby jego podstawa była na Y=0 (dla modelu stojącego)
            model.position.sub(center);
            model.position.y += size.y / 2;

            // Ustaw STAŁĄ pozycję w świecie
            const targetY = model.position.y;
            model.position.add(finalPosition);
            model.scale.setScalar(scale);

            // Materiały
            model.traverse((child: any) => {
              if (child.isMesh) {
                child.material = new THREE.MeshStandardMaterial({
                  color: 0xcccccc,
                  metalness: 0.3,
                  roughness: 0.8,
                  side: THREE.DoubleSide
                });
              }
            });

            // Animacja spadania
            const targetScale = scale;
            model.position.y = 15;
            model.scale.setScalar(0);
            scene.add(model);

            let animationProgress = 0;
            const placementDuration = 1.2;
            const dampingFactor = 0.2; // Wygładzanie ruchu kamery

            // --- PĘTLA ANIMACJI ---
            const animate = () => {
              requestAnimationFrame(animate);

              // Animacja umieszczania
              if (animationProgress < placementDuration) {
                animationProgress += 0.016;
                const progress = Math.min(
                  animationProgress / placementDuration,
                  1
                );
                const easeProgress = 1 - Math.pow(1 - progress, 3);

                model.position.y = 15 - 15 * easeProgress + targetY;
                model.scale.setScalar(targetScale * easeProgress);
                model.rotation.y = easeProgress * Math.PI * 2;

                if (progress >= 1) {
                  setIsLoading(false);
                  setIsPlaced(true);
                  model.rotation.y = 0;
                  // ZABLOKOWANIE na finalnej pozycji
                  model.position.set(finalPosition.x, targetY, finalPosition.z);
                }
              } else {
                // Opcjonalne: Delikatny obrót modelu, gdy jest już umieszczony
                model.rotation.y += 0.001;
              }

              // KAMERA - Rotacja sterowana przez żyroskop (KLUCZ AR)
              if (!isSimulator) {
                // Wygładzanie rotacji Y (poziome)
                camera.rotation.y +=
                  (cameraRotation.current.y - camera.rotation.y) *
                  dampingFactor;
                // Wygładzanie rotacji X (pionowe)
                camera.rotation.x +=
                  (cameraRotation.current.x - camera.rotation.x) *
                  dampingFactor;
              } else {
                // Tryb Symulatora
                const time = Date.now() * 0.0001;
                camera.position.x = Math.sin(time) * 6;
                camera.position.z = Math.cos(time) * 6 - 5;
                camera.lookAt(finalPosition);
              }

              renderer.render(scene, camera);
              gl.endFrameEXP();
            };
            // --- KONIEC PĘTLI ANIMACJI ---

            animate();
          },
          undefined,
          error => {
            console.error('❌ Błąd ładowania:', error);
            setError('Nie udało się załadować modelu 3D');
            setIsLoading(false);
          }
        );
      } catch (err) {
        console.error('❌ Błąd ładowania/modelu:', err);
        setError('Nie znaleziono pliku modelu');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('❌ Błąd GLView:', error);
      setError('Błąd inicjalizacji 3D');
      setIsLoading(false);
    }
  };
  // --- KONIEC INICJALIZACJI ---

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {hasPermission === null ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Inicjalizacja...</Text>
          </View>
        ) : hasPermission === false ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>❌ Brak dostępu do kamery</Text>
            <Text style={styles.errorSubtext}>
              Włącz dostęp do kamery w ustawieniach
            </Text>
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
              <Text style={styles.backButtonText}>← Powrót</Text>
            </TouchableOpacity>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
              <Text style={styles.backButtonText}>← Powrót</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Kamera - Tło AR */}
            {!isSimulator && <CameraView style={styles.camera} facing="back" />}
            {/* GLView - Przezroczysty render 3D */}
            <GLView style={styles.glView} onContextCreate={onContextCreate} />

            <View style={styles.header}>
              <View>
                <Text style={styles.title}>{attraction.title}</Text>
                <Text style={styles.subtitle}>
                  {isPlaced ? '✅ AR Aktywny' : '📱 Umieszczanie...'}
                </Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {isLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#ffffff" />
                <Text style={styles.loadingText}>Umieszczanie pomnika...</Text>
              </View>
            )}

            {isPlaced && (
              <View style={styles.instructions}>
                <Text style={styles.instructionText}>
                  ✅ Model zakotwiczony 5m przed Tobą!
                </Text>
                <Text style={styles.instructionText}>
                  📱 Obróć telefon, aby rozejrzeć się dookoła (Pan/Tilt).
                </Text>
                <Text style={styles.instructionText}>
                  ⚠️ Model może delikatnie dryfować w czasie (Ograniczenie
                  Sensor AR).
                </Text>
              </View>
            )}
          </>
        )}
      </View>
    </Modal>
  );
}

// --- STYLE ---
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
  instructions: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 16,
    borderRadius: 12
  },
  instructionText: {
    fontSize: 13,
    color: '#fff',
    marginBottom: 6,
    textAlign: 'center'
  },
  errorText: {
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20
  },
  errorSubtext: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 30
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
