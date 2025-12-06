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
  Easing
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font'; // 1. Importujemy hook do czcionek
import type { AttractionsTabScreenProps } from '../navigation/types';

const { width, height } = Dimensions.get('window');
const GRADIENT_SIZE = Math.sqrt(width * width + height * height) * 1.5;

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

const attractions = [
  {
    id: '1',
    title: 'Pomnik Łuczniczki',
    image: require('../../assets/lucznik.jpeg'), 
    description: 'Symbol Bydgoszczy, piękna rzeźba w parku Jana Kochanowskiego.',
    rating: 4.8,
    location: 'Śródmieście',
    reviews: 124
  },
  {
    id: '2',
    title: 'Wyspa Młyńska',
    image: { uri: 'https://images.unsplash.com/photo-1679396165867-d40224e22039?q=80&w=1000&auto=format&fit=crop' },
    description: 'Malownicza wyspa nad Brdą, idealna na spacery i relaks.',
    rating: 4.7,
    location: 'Śródmieście',
    reviews: 89
  },
  {
    id: '3',
    title: 'Opera Nova',
    image: { uri: 'https://plus.unsplash.com/premium_photo-1697730267396-878551e83929?q=80&w=1000&auto=format&fit=crop' },
    description: 'Nowoczesna opera nad rzeką z imponującą architekturą.',
    rating: 4.9,
    location: 'Wyspa Młyńska',
    reviews: 215
  }
];

export default function AttractionsScreen({
  navigation
}: AttractionsTabScreenProps) {
  // 2. Ładowanie czcionek
  // Upewnij się, że pliki .ttf są w folderze assets/fonts/
  const [fontsLoaded] = useFonts({
    'Kollektif': require('../../assets/fonts/Kollektif.ttf'),
    'Kollektif-Bold': require('../../assets/fonts/Kollektif-Bold.ttf'),
  });

  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 15000, 
        easing: Easing.linear,
        useNativeDriver: true, 
      })
    ).start();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  // 3. Czekamy na załadowanie czcionek przed renderowaniem
  if (!fontsLoaded) {
    return null; // Lub <ActivityIndicator />
  }

  return (
    <View style={styles.mainWrapper}>
      
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

      <ScrollView 
        style={styles.scrollViewContainer} 
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.screenHeader}>
          
          
        </View>

        {attractions.map(attraction => (
          <TouchableOpacity
            key={attraction.id}
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => {
              // @ts-ignore - Navigate to Details screen (ensure it's defined in your navigator)
              navigation.navigate('Details', {
                id: attraction.id,
                title: attraction.title,
                description: attraction.description,
                rating: attraction.rating,
                location: attraction.location
              });
            }}
          >
            <View style={styles.imageContainer}>
              <Image
                source={attraction.image}
                style={styles.image}
                resizeMode="cover"
              />
              
              <View style={styles.favoriteButton}>
                <Ionicons name="heart-outline" size={22} color="#FFFFFF" />
              </View>

              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={14} color="#4ADE80" style={{ marginRight: 4 }} />
                <Text style={styles.ratingText}>{attraction.rating}</Text>
                <Text style={styles.ratingCount}>({attraction.reviews})</Text>
              </View>
            </View>

            <View style={styles.content}>
              <View style={styles.headerRow}>
                <View style={styles.titleWrapper}>
                  <Text style={styles.title}>{attraction.title}</Text>
                  <View style={styles.locationRow}>
                    <Ionicons name="location-sharp" size={16} color="#1B4D3E" style={{ marginRight: 4 }} />
                    <Text style={styles.locationText}>{attraction.location}, Bydgoszcz</Text>
                  </View>
                </View>
                
                <View style={styles.arrowButton}>
                  <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
                </View>
              </View>

              <View style={styles.separator} />

              <Text style={styles.description} numberOfLines={2}>
                {attraction.description}
              </Text>

              <View style={styles.footer}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>#Zabytek</Text>
                </View>
                <View style={styles.tagActive}>
                  <Text style={styles.tagTextActive}>#{attraction.location.split(' ')[0]}</Text>
                </View>
              </View>

            </View>
          </TouchableOpacity>
        ))}
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
  scrollViewContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  screenHeader: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 5,
  },
  screenTitle: {
    marginBottom: 30,
    fontSize: 35 ,
    // fontWeight: '800', // Usuwamy standardowy bold, bo używamy fontu Bold
    fontFamily: 'Kollektif-Bold', // Nowa czcionka
    color: '#ffffffff',
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 16,
    fontFamily: 'Kollektif', // Nowa czcionka
    color: '#666',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginBottom: 24,
    overflow: 'hidden',
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
  imageContainer: {
    height: 220,
    width: '100%',
    position: 'relative',
    backgroundColor: '#E0E7FF',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 18,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'rgba(27, 77, 62, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: '#FFFFFF',
    // fontWeight: '700',
    fontFamily: 'Kollektif-Bold', // Nowa czcionka
    fontSize: 14,
    marginRight: 4,
  },
  ratingCount: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontFamily: 'Kollektif',
  },
  content: {
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleWrapper: {
    flex: 1,
    paddingRight: 10,
  },
  title: {
    fontSize: 22,
    // fontWeight: '800',
    fontFamily: 'Kollektif-Bold', // Nowa czcionka dla tytułu
    color: '#000000',
    marginBottom: 6,
    lineHeight: 26,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 13,
    color: '#1B4D3E',
    // fontWeight: '600',
    fontFamily: 'Kollektif-Bold', // Lub zwykły Kollektif, zależnie od preferencji
  },
  arrowButton: {
    backgroundColor: '#000000',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#EEEEEE',
    width: '100%',
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: '#555555',
    marginBottom: 20,
    fontFamily: 'Kollektif', // Nowa czcionka
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  tagText: {
    color: '#666666',
    fontSize: 12,
    // fontWeight: '500',
    fontFamily: 'Kollektif',
  },
  tagActive: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
  },
  tagTextActive: {
    color: '#1B4D3E',
    fontSize: 12,
    // fontWeight: '600',
    fontFamily: 'Kollektif-Bold',
  }
});