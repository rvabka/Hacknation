import React, { useEffect, useState, useRef } from 'react';
import AudioPlayer from './AudioPlayer';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Modal,
  PanResponder,
  Animated,
  Easing,
  LogBox
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import { Asset } from 'expo-asset';
import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';
import * as Device from 'expo-device';
import { Gyroscope } from 'expo-sensors';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

LogBox.ignoreLogs(["THREE.GLTFLoader: Couldn't load texture"]);

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
  const [showTutorial, setShowTutorial] = useState(true);

  const gyroSubscription = useRef<any>(null);
  const cameraRotation = useRef({ x: 0, y: 0, z: 0 });

  const modelRef = useRef<THREE.Group | null>(null);
  const panRotationRef = useRef(0);
  const lastPanX = useRef(0);

  const tutorialOpacity = useRef(new Animated.Value(1)).current;
  const phoneSwing = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(100)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setIsPlaced(false);
      setShowTutorial(true);
      cameraRotation.current = { x: 0, y: 0, z: 0 };
      panRotationRef.current = 0;

      tutorialOpacity.setValue(1);
      phoneSwing.setValue(0);
      cardSlide.setValue(100);
      cardOpacity.setValue(0);

      Animated.loop(
        Animated.sequence([
          Animated.timing(phoneSwing, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          }),
          Animated.timing(phoneSwing, {
            toValue: -1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          }),
          Animated.timing(phoneSwing, {
            toValue: 0,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          })
        ])
      ).start();

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

  useEffect(() => {
    if (isPlaced) {
      setTimeout(() => {
        Animated.timing(tutorialOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true
        }).start(() => setShowTutorial(false));

        Animated.parallel([
          Animated.timing(cardSlide, {
            toValue: 0,
            duration: 600,
            easing: Easing.out(Easing.back(1.2)),
            useNativeDriver: true
          }),
          Animated.timing(cardOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true
          })
        ]).start();
      }, 1500);
    }
  }, [isPlaced]);

  const startSensors = () => {
    Gyroscope.setUpdateInterval(50);
    const GYRO_SENSITIVITY = 0.05;

    gyroSubscription.current = Gyroscope.addListener(gyroscopeData => {
      cameraRotation.current.x -= gyroscopeData.x * GYRO_SENSITIVITY;
      cameraRotation.current.y -= gyroscopeData.y * GYRO_SENSITIVITY;

      cameraRotation.current.x = Math.max(
        -Math.PI / 3,
        Math.min(Math.PI / 3, cameraRotation.current.x)
      );
    });
  };

  const stopSensors = () => {
    if (gyroSubscription.current) {
      gyroSubscription.current.remove();
      gyroSubscription.current = null;
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        lastPanX.current = 0;
      },

      onPanResponderMove: (_, gestureState) => {
        const deltaX = gestureState.dx - lastPanX.current;
        const rotationFactor = 0.005;

        panRotationRef.current += deltaX * rotationFactor;

        if (panRotationRef.current > Math.PI * 3) {
          panRotationRef.current -= Math.PI * 3;
        } else if (panRotationRef.current < -Math.PI * 3) {
          panRotationRef.current += Math.PI * 3;
        }

        lastPanX.current = gestureState.dx;
      },

      onPanResponderRelease: () => {
        lastPanX.current = 0;
      }
    })
  ).current;

  const onContextCreate = async (gl: any) => {
    try {
      const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

      const renderer = new Renderer({ gl });
      renderer.setSize(width, height);
      renderer.setClearColor(0x000000, 0);

      const scene = new THREE.Scene();

      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.set(0, 1.6, 0);

      const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
      directionalLight.position.set(10, 20, 10);
      scene.add(directionalLight);

      try {
        const asset = Asset.fromModule(require('../../assets/lucznik2.glb'));
        await asset.downloadAsync();

        const response = await fetch(asset.localUri || asset.uri);
        const fileContent = await response.arrayBuffer();

        const loader = new GLTFLoader(new THREE.LoadingManager());

        const finalPosition = new THREE.Vector3(0, 0, -5);

        loader.parse(
          fileContent,
          asset.uri.substring(0, asset.uri.lastIndexOf('/') + 1),
          gltf => {
            const model = gltf.scene;
            modelRef.current = model;

            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            const maxDim = Math.max(size.x, size.y, size.z);
            const targetSize = 5;
            const scale = targetSize / maxDim;

            model.position.sub(center);
            model.position.y += size.y / 2;

            const targetY = model.position.y;
            model.position.add(finalPosition);
            model.scale.setScalar(scale);

            model.traverse((child: any) => {
              if (child.isMesh) {
                if (
                  !child.material ||
                  child.material.type === 'MeshBasicMaterial'
                ) {
                  child.material = new THREE.MeshStandardMaterial({
                    color: 0xcccccc,
                    metalness: 0.3,
                    roughness: 0.8,
                    side: THREE.DoubleSide
                  });
                }
              }
            });

            const targetScale = scale;
            model.position.y = 10;
            model.scale.setScalar(0.1);
            scene.add(model);

            let animationProgress = 0;
            const placementDuration = 1.0;
            const dampingFactor = 0.2;

            const animate = () => {
              requestAnimationFrame(animate);

              if (animationProgress < placementDuration) {
                animationProgress += 0.016;
                const progress = Math.min(
                  animationProgress / placementDuration,
                  1
                );

                const easeProgress = 1 - Math.pow(1 - progress, 2);

                model.position.y = 10 - (10 - targetY) * easeProgress;
                model.scale.setScalar(0.1 + (targetScale - 0.1) * easeProgress);
                model.rotation.y += Math.PI / 10;

                if (progress >= 1) {
                  setIsLoading(false);
                  setIsPlaced(true);
                  model.rotation.y = 0;
                  model.position.set(finalPosition.x, targetY, finalPosition.z);
                }
              } else if (modelRef.current) {
                modelRef.current.rotation.y += 0.001;
                modelRef.current.rotation.y += panRotationRef.current;
                panRotationRef.current = 0;
              }

              if (!isSimulator) {
                camera.rotation.y +=
                  (cameraRotation.current.y - camera.rotation.y) *
                  dampingFactor;
                camera.rotation.x +=
                  (cameraRotation.current.x - camera.rotation.x) *
                  dampingFactor;
              } else {
                const time = Date.now() * 0.0001;
                camera.position.x = Math.sin(time) * 6;
                camera.position.z = Math.cos(time) * 6 - 5;
                camera.lookAt(finalPosition);
              }

              renderer.render(scene, camera);
              gl.endFrameEXP();
            };

            animate();
          },
          () => {
            setError('Nie udało się sparsować modelu 3D');
            setIsLoading(false);
          }
        );
      } catch {
        setError('Błąd ładowania pliku modelu');
        setIsLoading(false);
      }
    } catch {
      setError('Błąd inicjalizacji 3D');
      setIsLoading(false);
    }
  };

  const phoneRotation = phoneSwing.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-15deg', '0deg', '15deg']
  });

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
            <ActivityIndicator size="large" color="#1B4D3E" />
            <Text style={styles.initText}>Inicjalizacja AR...</Text>
          </View>
        ) : hasPermission === false ? (
          <View style={styles.centerContainer}>
            <View style={styles.errorCard}>
              <Ionicons name="camera-outline" size={48} color="#1B4D3E" />
              <Text style={styles.errorTitle}>Brak dostępu do kamery</Text>
              <Text style={styles.errorSubtitle}>
                Włącz dostęp do kamery w ustawieniach, aby korzystać z AR
              </Text>
              <TouchableOpacity style={styles.primaryButton} onPress={onClose}>
                <Text style={styles.primaryButtonText}>Powrót</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <View style={styles.errorCard}>
              <Ionicons name="alert-circle-outline" size={48} color="#DC2626" />
              <Text style={styles.errorTitle}>{error}</Text>
              <TouchableOpacity style={styles.primaryButton} onPress={onClose}>
                <Text style={styles.primaryButtonText}>Powrót</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {!isSimulator && <CameraView style={styles.camera} facing="back" />}

            <GLView
              style={styles.glView}
              onContextCreate={onContextCreate}
              {...panResponder.panHandlers}
            />

            <View style={styles.header}>
              <BlurView intensity={80} tint="dark" style={styles.headerBlur}>
                <View style={styles.headerContent}>
  <View style={styles.headerLeft}>
    <View style={styles.arBadge}>
      <Text style={styles.arBadgeText}>AR</Text>
    </View>
    <View>
      <Text style={styles.headerTitle}>{attraction.title}</Text>
      <Text style={styles.headerSubtitle}>
        {isPlaced ? 'Widok aktywny' : 'Ładowanie...'}
      </Text>
    </View>
  </View>
  <View style={styles.headerRight}>
    <AudioPlayer 
      audioFile={require('../../assets/audio/wiezacisnien.mp3')}
    />
    <TouchableOpacity
      style={styles.closeButton}
      onPress={onClose}
    >
      <Ionicons name="close" size={24} color="#FFFFFF" />
    </TouchableOpacity>
  </View>
</View>
              </BlurView>
            </View>

            {isLoading && (
              <View style={styles.loadingOverlay}>
                <View style={styles.loadingCard}>
                  <ActivityIndicator size="large" color="#1B4D3E" />
                  <Text style={styles.loadingTitle}>Umieszczanie modelu</Text>
                  <Text style={styles.loadingSubtitle}>
                    Przygotowywanie widoku AR...
                  </Text>
                </View>
              </View>
            )}

            {showTutorial && isPlaced && (
              <Animated.View
                style={[styles.tutorialOverlay, { opacity: tutorialOpacity }]}
              >
                <View style={styles.tutorialCard}>
                  <Animated.View
                    style={[
                      styles.phoneIcon,
                      { transform: [{ rotate: phoneRotation }] }
                    ]}
                  >
                    <Ionicons
                      name="phone-portrait-outline"
                      size={64}
                      color="#1B4D3E"
                    />
                  </Animated.View>
                  <Text style={styles.tutorialTitle}>Porusz telefonem</Text>
                  <Text style={styles.tutorialSubtitle}>
                    Rozejrzyj się dookoła, aby zobaczyć model z różnych stron
                  </Text>
                </View>
              </Animated.View>
            )}

            {isPlaced && !showTutorial && (
              <Animated.View
                style={[
                  styles.infoCardContainer,
                  {
                    opacity: cardOpacity,
                    transform: [{ translateY: cardSlide }]
                  }
                ]}
              >
                <View style={styles.infoCard}>
                  <View style={styles.infoHeader}>
                    <View style={styles.infoIconContainer}>
                      <Ionicons name="cube-outline" size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.infoTitleContainer}>
                      <Text style={styles.infoTitle}>{attraction.title}</Text>
                      <View style={styles.locationRow}>
                        <Ionicons name="location" size={12} color="#4ADE80" />
                        <Text style={styles.infoLocation}>
                          {attraction.location}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.controlsRow}>
                    <View style={styles.controlItem}>
                      <Ionicons
                        name="phone-portrait-outline"
                        size={16}
                        color="#FFFFFF"
                      />
                      <Text style={styles.controlText}>Obróć telefon</Text>
                    </View>
                    <View style={styles.controlDivider} />
                    <View style={styles.controlItem}>
                      <Ionicons
                        name="hand-left-outline"
                        size={16}
                        color="#FFFFFF"
                      />
                      <Text style={styles.controlText}>Przesuń palcem</Text>
                    </View>
                  </View>
                </View>
              </Animated.View>
            )}
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
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
    backgroundColor: '#F5F5F5',
    padding: 20
  },
  initText: {
    marginTop: 16,
    fontSize: 16,
    color: '#1B4D3E',
    fontWeight: '500'
  },
  errorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '90%',
    maxWidth: 340,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20
      },
      android: {
        elevation: 8
      }
    })
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 16,
    textAlign: 'center'
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20
  },
  primaryButton: {
    backgroundColor: '#1B4D3E',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 24
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10
  },
  headerBlur: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 16,
    paddingHorizontal: 20,
    overflow: 'hidden'
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  arBadge: {
    backgroundColor: '#4ADE80',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  arBadgeText: {
    color: '#1B4D3E',
    fontSize: 12,
    fontWeight: '800'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)'
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '80%',
    maxWidth: 280
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 16
  },
  loadingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4
  },
  tutorialOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  tutorialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    width: '80%',
    maxWidth: 300
  },
  phoneIcon: {
    marginBottom: 20
  },
  tutorialTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8
  },
  tutorialSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20
  },
  infoCardContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16
  },
  infoCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1B4D3E',
    justifyContent: 'center',
    alignItems: 'center'
  },
  infoTitleContainer: {
    flex: 1
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2
  },
  infoLocation: {
    fontSize: 12,
    color: '#4ADE80',
    fontWeight: '500'
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)'
  },
  controlItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  controlText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500'
  },
  controlDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  }
});
