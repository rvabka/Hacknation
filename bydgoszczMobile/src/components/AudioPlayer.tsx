import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface AudioPlayerModalProps {
  visible: boolean;
  audioFile: any;
  title: string;
  onClose: () => void;
}

let currentSound: Audio.Sound | null = null;

export const stopAndUnloadAudio = async () => {
  if (currentSound) {
    try {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
      currentSound = null;
    } catch (error) {
      console.error('Error unloading audio:', error);
    }
  }
};

export default function AudioPlayerModal({
  visible,
  audioFile,
  title,
  onClose
}: AudioPlayerModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible && audioFile) {
      loadAudio();
    }
    return () => {
      if (!visible) {
        stopAndUnloadAudio();
      }
    };
  }, [visible, audioFile]);

  const loadAudio = async () => {
    try {
      setIsLoading(true);
      
      // Zatrzymaj poprzednie audio jeśli jest
      await stopAndUnloadAudio();

      const { sound: newSound } = await Audio.Sound.createAsync(
        audioFile,
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );
      
      currentSound = newSound;
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading audio:', error);
      setIsLoading(false);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);

      if (status.didJustFinish) {
        setIsPlaying(false);
        currentSound?.setPositionAsync(0);
      }
    }
  };

  const togglePlayPause = async () => {
    if (!currentSound) return;

    try {
      if (isPlaying) {
        await currentSound.pauseAsync();
      } else {
        await currentSound.playAsync();
      }
    } catch (error) {
      console.error('Error toggling play/pause:', error);
    }
  };

  const skipForward = async () => {
    if (!currentSound) return;
    const newPosition = Math.min(position + 10000, duration);
    await currentSound.setPositionAsync(newPosition);
  };

  const skipBackward = async () => {
    if (!currentSound) return;
    const newPosition = Math.max(position - 10000, 0);
    await currentSound.setPositionAsync(newPosition);
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressWidth = duration > 0 ? (position / duration) * 100 : 0;

  const handleClose = async () => {
    await stopAndUnloadAudio();
    setPosition(0);
    setDuration(0);
    setIsPlaying(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <BlurView intensity={40} tint="dark" style={styles.blurContainer}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.musicIcon}>
                  <Ionicons name="musical-notes" size={20} color="#4ADE80" />
                </View>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {title}
                </Text>
              </View>
              <TouchableOpacity style={styles.modalCloseButton} onPress={handleClose}>
                <Ionicons name="close" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Ładowanie audio...</Text>
              </View>
            ) : (
              <>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[styles.progressFill, { width: `${progressWidth}%` }]}
                    />
                  </View>
                  <View style={styles.timeRow}>
                    <Text style={styles.timeText}>{formatTime(position)}</Text>
                    <Text style={styles.timeText}>{formatTime(duration)}</Text>
                  </View>
                </View>

                <View style={styles.controlsRow}>
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={skipBackward}
                  >
                    <Ionicons name="play-back" size={28} color="#FFFFFF" />
                    <Text style={styles.skipText}>10s</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.mainPlayButton}
                    onPress={togglePlayPause}
                  >
                    <Ionicons
                      name={isPlaying ? 'pause' : 'play'}
                      size={32}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={skipForward}
                  >
                    <Ionicons name="play-forward" size={28} color="#FFFFFF" />
                    <Text style={styles.skipText}>10s</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </BlurView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)'
  },
  blurContainer: {
    width: '90%',
    maxWidth: 380,
    borderRadius: 24,
    overflow: 'hidden'
  },
  modalContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 12
  },
  musicIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500'
  },
  progressContainer: {
    marginBottom: 32
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4ADE80',
    borderRadius: 3
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12
  },
  timeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600'
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32
  },
  controlButton: {
    alignItems: 'center',
    gap: 4
  },
  skipText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '700'
  },
  mainPlayButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1B4D3E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(74, 222, 128, 0.3)'
  }
});