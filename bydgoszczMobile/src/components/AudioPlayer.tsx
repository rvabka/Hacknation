import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

interface AudioPlayerProps {
  audioFile: any; // require('../../assets/audio/...')
  onClose?: () => void;
}

export default function AudioPlayer({ audioFile, onClose }: AudioPlayerProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const expandAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadAudio();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [audioFile]);

  const loadAudio = async () => {
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        audioFile,
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );
      setSound(newSound);
    } catch (error) {
      console.error('Error loading audio:', error);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);

      if (status.didJustFinish) {
        setIsPlaying(false);
        sound?.setPositionAsync(0);
      }
    }
  };

  const togglePlayPause = async () => {
    if (!sound) return;

    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
  };

  const skipForward = async () => {
    if (!sound) return;
    const newPosition = Math.min(position + 10000, duration);
    await sound.setPositionAsync(newPosition);
  };

  const skipBackward = async () => {
    if (!sound) return;
    const newPosition = Math.max(position - 10000, 0);
    await sound.setPositionAsync(newPosition);
  };

  const toggleExpand = () => {
    const toValue = isExpanded ? 0 : 1;
    setIsExpanded(!isExpanded);
    
    Animated.spring(expandAnim, {
      toValue,
      friction: 8,
      tension: 40,
      useNativeDriver: false
    }).start();
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const expandedHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [56, 140]
  });

  const progressWidth = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <Animated.View style={[styles.container, { height: expandedHeight }]}>
      <View style={styles.mainRow}>
        <TouchableOpacity 
          style={styles.mainButton} 
          onPress={togglePlayPause}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={20}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.expandButton}
          onPress={toggleExpand}
        >
          <Ionicons
            name={isExpanded ? 'chevron-down' : 'chevron-up'}
            size={18}
            color="rgba(255,255,255,0.7)"
          />
        </TouchableOpacity>

        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        )}
      </View>

      {isExpanded && (
        <View style={styles.expandedContent}>
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
              <Ionicons name="play-back" size={24} color="#FFFFFF" />
              <Text style={styles.skipText}>10s</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.mainPlayButton}
              onPress={togglePlayPause}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={28}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.controlButton}
              onPress={skipForward}
            >
              <Ionicons name="play-forward" size={24} color="#FFFFFF" />
              <Text style={styles.skipText}>10s</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden'
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  mainButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1B4D3E',
    justifyContent: 'center',
    alignItems: 'center'
  },
  expandButton: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  expandedContent: {
    marginTop: 16
  },
  progressContainer: {
    marginBottom: 16
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4ADE80',
    borderRadius: 2
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8
  },
  timeText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500'
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24
  },
  controlButton: {
    alignItems: 'center',
    gap: 4
  },
  skipText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600'
  },
  mainPlayButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1B4D3E',
    justifyContent: 'center',
    alignItems: 'center'
  }
});