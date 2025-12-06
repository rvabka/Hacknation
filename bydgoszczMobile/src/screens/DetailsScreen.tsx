import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Image,
  Animated,
  Dimensions,
  Easing,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { DetailsScreenProps } from '../navigation/types';

const { width, height } = Dimensions.get('window');
const GRADIENT_SIZE = Math.sqrt(width * width + height * height) * 1.5;

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

export default function DetailsScreen({
  route,
  navigation
}: DetailsScreenProps) {
  const { title, description, rating, location } = route.params;
  const insets = useSafeAreaInsets();

  const [fontsLoaded] = useFonts({
    'Kollektif': require('../../assets/fonts/Kollektif.ttf'),
    'Kollektif-Bold': require('../../assets/fonts/Kollektif-Bold.ttf'),
  });

  const spinValue = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 15000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.mainWrapper}>
      <StatusBar barStyle="light-content" />
      
      {/* Animated Background Gradient */}
      <View style={styles.shimmerContainer}>
        <AnimatedGradient
          colors={[
            '#efe8bd',
            '#1B4D3E',
            '#1B4D3E',
            '#1B4D3E',
            '#1B4D3E',
            '#1B4D3E',
            '#1B4D3E'
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.rotatingGradient,
            { transform: [{ rotate: spin }] }
          ]}
          pointerEvents="none"
        />
      </View>

      {/* Custom Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Szczegóły</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.contentCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Main Info Section */}
          <View style={styles.mainSection}>
            <View style={styles.titleSection}>
              <Text style={styles.title}>{title}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-sharp" size={18} color="#1B4D3E" />
                <Text style={styles.locationText}>{location}, Bydgoszcz</Text>
              </View>
            </View>

            <View style={styles.ratingCard}>
              <Ionicons name="star" size={28} color="#4ADE80" />
              <Text style={styles.ratingNumber}>{rating}</Text>
              <Text style={styles.ratingLabel}>Ocena</Text>
            </View>
          </View>

          <View style={styles.separator} />

          {/* Description Section */}
          <View style={styles.descriptionSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={24} color="#1B4D3E" />
              <Text style={styles.sectionTitle}>Opis</Text>
            </View>
            <Text style={styles.description}>{description}</Text>
          </View>

          <View style={styles.separator} />

          {/* Quick Info Cards */}
          <View style={styles.quickInfoSection}>
            <Text style={styles.sectionTitle}>Informacje</Text>
            
            <View style={styles.infoGrid}>
              <View style={styles.infoCard}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="time-outline" size={24} color="#1B4D3E" />
                </View>
                <Text style={styles.infoLabel}>Czas wizyty</Text>
                <Text style={styles.infoValue}>~30 min</Text>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="cash-outline" size={24} color="#1B4D3E" />
                </View>
                <Text style={styles.infoLabel}>Wstęp</Text>
                <Text style={styles.infoValue}>Darmowy</Text>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="camera-outline" size={24} color="#1B4D3E" />
                </View>
                <Text style={styles.infoLabel}>Zdjęcia</Text>
                <Text style={styles.infoValue}>Dozwolone</Text>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="accessibility-outline" size={24} color="#1B4D3E" />
                </View>
                <Text style={styles.infoLabel}>Dostępność</Text>
                <Text style={styles.infoValue}>Pełna</Text>
              </View>
            </View>
          </View>

          {/* Tags Section */}
          <View style={styles.tagsSection}>
            <Text style={styles.sectionTitle}>Tagi</Text>
            <View style={styles.tagsRow}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>#Zabytek</Text>
              </View>
              <View style={styles.tagActive}>
                <Text style={styles.tagTextActive}>#{location.split(' ')[0]}</Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>#Historia</Text>
              </View>
            </View>
          </View>

        </Animated.View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.secondaryButton}>
            <Ionicons name="map-outline" size={20} color="#1B4D3E" />
            <Text style={styles.secondaryButtonText}>Pokaż na mapie</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryButton}>
            <Ionicons name="navigate" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Nawiguj</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    position: 'relative',
    overflow: 'hidden',
  },
  shimmerContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  rotatingGradient: {
    width: GRADIENT_SIZE,
    height: GRADIENT_SIZE,
    position: 'absolute',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Kollektif-Bold',
    color: '#FFFFFF',
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  mainSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  titleSection: {
    flex: 1,
    paddingRight: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Kollektif-Bold',
    color: '#000000',
    marginBottom: 8,
    lineHeight: 34,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#1B4D3E',
    fontFamily: 'Kollektif-Bold',
  },
  ratingCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    minWidth: 90,
  },
  ratingNumber: {
    fontSize: 32,
    fontFamily: 'Kollektif-Bold',
    color: '#1B4D3E',
    marginTop: 8,
  },
  ratingLabel: {
    fontSize: 12,
    fontFamily: 'Kollektif',
    color: '#1B4D3E',
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 20,
  },
  descriptionSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Kollektif-Bold',
    color: '#000000',
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: '#555555',
    fontFamily: 'Kollektif',
  },
  quickInfoSection: {
    marginBottom: 20,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  infoCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: 'Kollektif',
    color: '#666666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Kollektif-Bold',
    color: '#000000',
  },
  tagsSection: {
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  tagText: {
    color: '#666666',
    fontSize: 13,
    fontFamily: 'Kollektif',
  },
  tagActive: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
  },
  tagTextActive: {
    color: '#1B4D3E',
    fontSize: 13,
    fontFamily: 'Kollektif-Bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#1B4D3E',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  secondaryButtonText: {
    fontSize: 15,
    fontFamily: 'Kollektif-Bold',
    color: '#1B4D3E',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1B4D3E',
    paddingVertical: 16,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#1B4D3E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  primaryButtonText: {
    fontSize: 15,
    fontFamily: 'Kollektif-Bold',
    color: '#FFFFFF',
  },
});