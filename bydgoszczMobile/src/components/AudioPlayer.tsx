import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Easing,
  Platform,
  Dimensions
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Slider from '@react-native-community/slider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AudioPlayerModalProps {
  visible: boolean;
  audioFile: any;
  title: string;
  onClose: () => void;
}

// Przechowuj sound globalnie, żeby pamiętał pozycję
let globalSound: Audio.Sound | null = null;
let globalAudioFile: any = null;

// Funkcja do zatrzymania i wyczyszczenia audio (eksportowana)
export async function stopAndUnloadAudio() {
  if (globalSound) {
    try {
      await globalSound.stopAsync();
      await globalSound.unloadAsync();
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
    globalSound = null;
    globalAudioFile = null;
  }
}

export default function AudioPlayerModal({
  visible,
  audioFile,
  title,
  onClose
}: AudioPlayerModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const slideAnim = useRef(new Animated.Value(300)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      loadOrResumeAudio();
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.back(1.1)),
          useNativeDriver: true
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [visible]);

  useEffect(() => {
    return () => {
      // Nie usuwaj dźwięku przy unmount - zachowaj pozycję
    };
  }, []);

  const loadOrResumeAudio = async () => {
    try {
      // Jeśli plik audio się zmienił, załaduj nowy
      if (globalAudioFile !== audioFile) {
        if (globalSound) {
          await globalSound.unloadAsync();
          globalSound = null;
        }
        globalAudioFile = audioFile;
      }

      // Jeśli dźwięk już istnieje, użyj go
      if (globalSound) {
        const status = await globalSound.getStatusAsync();
        if (status.isLoaded) {
          setPosition(status.positionMillis);
          setDuration(status.durationMillis || 0);
          setIsPlaying(status.isPlaying);
          setIsLoaded(true);

          // Ustaw callback dla aktualizacji statusu
          globalSound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
          return;
        }
      }

      // Załaduj nowy dźwięk
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
        audioFile,
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );

      globalSound = newSound;
      setIsLoaded(true);
    } catch (error) {
      console.error('Error loading audio:', error);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded && !isSeeking) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);

      if (status.didJustFinish) {
        setIsPlaying(false);
      }
    }
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      })
    ]).start(() => {
      // Nie wyłączaj dźwięku - tylko zamknij modal
      onClose();
    });
  };

  const togglePlayPause = async () => {
    if (!globalSound) return;

    if (isPlaying) {
      await globalSound.pauseAsync();
    } else {
      await globalSound.playAsync();
    }
  };

  const skipForward = async () => {
    if (!globalSound) return;
    const newPosition = Math.min(position + 10000, duration);
    await globalSound.setPositionAsync(newPosition);
    setPosition(newPosition);
  };

  const skipBackward = async () => {
    if (!globalSound) return;
    const newPosition = Math.max(position - 10000, 0);
    await globalSound.setPositionAsync(newPosition);
    setPosition(newPosition);
  };

  const handleSliderStart = () => {
    setIsSeeking(true);
  };

  const handleSliderChange = (value: number) => {
    setPosition(value);
  };

  const handleSliderComplete = async (value: number) => {
    setIsSeeking(false);
    if (globalSound) {
      await globalSound.setPositionAsync(value);
    }
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={handleClose}
        />

        <Animated.View
          style={[
            styles.modalContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <BlurView intensity={90} tint="dark" style={styles.blurContainer}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <View style={styles.headerInfo}>
                <View style={styles.audioBadge}>
                  <Ionicons name="musical-notes" size={14} color="#1B4D3E" />
                </View>
                <View style={styles.headerTextContainer}>
                  <Text style={styles.headerLabel}>Audioprzewodnik</Text>
                  <Text style={styles.headerTitle} numberOfLines={2}>
                    {title}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color="rgba(255,255,255,0.7)"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.progressSection}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={duration || 1}
                value={position}
                onSlidingStart={handleSliderStart}
                onValueChange={handleSliderChange}
                onSlidingComplete={handleSliderComplete}
                minimumTrackTintColor="#4ADE80"
                maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
                thumbTintColor="#FFFFFF"
              />
              <View style={styles.timeRow}>
                <Text style={styles.timeText}>{formatTime(position)}</Text>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>
            </View>

            <View style={styles.controlsSection}>
              <TouchableOpacity
                style={styles.skipButton}
                onPress={skipBackward}
              >
                <Ionicons name="play-back" size={28} color="#FFFFFF" />
                <Text style={styles.skipText}>10s</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.playButton}
                onPress={togglePlayPause}
                disabled={!isLoaded}
              >
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={36}
                  color="#FFFFFF"
                />
              </TouchableOpacity>

              <TouchableOpacity style={styles.skipButton} onPress={skipForward}>
                <Ionicons name="play-forward" size={28} color="#FFFFFF" />
                <Text style={styles.skipText}>10s</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end'
  },
  overlayTouchable: {
    flex: 1
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden'
  },
  blurContainer: {
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingHorizontal: 20
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12
  },
  audioBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#4ADE80',
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerTextContainer: {
    flex: 1
  },
  headerLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
    marginBottom: 2
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 22
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12
  },
  progressSection: {
    marginBottom: 24
  },
  slider: {
    width: '100%',
    height: 40
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 4
  },
  timeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500'
  },
  controlsSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32
  },
  skipButton: {
    alignItems: 'center',
    gap: 4
  },
  skipText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600'
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1B4D3E',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#1B4D3E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12
      },
      android: {
        elevation: 8
      }
    })
  }
});
