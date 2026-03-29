import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(30)).current;
  const featuresOpacity = useRef(new Animated.Value(0)).current;
  const featuresTranslateY = useRef(new Animated.Value(20)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true
      })
    ).start();

    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true
        })
      ]),

      Animated.delay(200),
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true
        }),
        Animated.spring(textTranslateY, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true
        })
      ]),

      Animated.delay(200),
      Animated.parallel([
        Animated.timing(featuresOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true
        }),
        Animated.spring(featuresTranslateY, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true
        })
      ]),

      Animated.timing(progressWidth, {
        toValue: 1,
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false
      })
    ]).start(() => {
      setTimeout(onFinish, 300);
    });
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const progressInterpolated = progressWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1B4D3E', '#0D2B22', '#061512']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <Animated.View
        style={[
          styles.decorativeCircle,
          styles.circle1,
          { transform: [{ scale: pulseAnim }] }
        ]}
      />
      <Animated.View
        style={[
          styles.decorativeCircle,
          styles.circle2,
          { transform: [{ scale: pulseAnim }] }
        ]}
      />
      <Animated.View
        style={[
          styles.decorativeCircle,
          styles.circle3,
          {
            transform: [
              {
                scale: pulseAnim.interpolate({
                  inputRange: [1, 1.2],
                  outputRange: [1.2, 1]
                })
              }
            ]
          }
        ]}
      />

      <Animated.View
        style={[styles.rotatingRing, { transform: [{ rotate: spin }] }]}
      >
        <View style={styles.ringDot} />
        <View style={[styles.ringDot, styles.ringDot2]} />
        <View style={[styles.ringDot, styles.ringDot3]} />
      </Animated.View>

      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }]
            }
          ]}
        >
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }]
            }
          ]}
        >
          <Text style={styles.title}>Odkryj Lublin</Text>
          <Text style={styles.subtitle}>
            Twój przewodnik po atrakcjach miasta
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.featuresContainer,
            {
              opacity: featuresOpacity,
              transform: [{ translateY: featuresTranslateY }]
            }
          ]}
        >
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, styles.featureIconAR]}>
              <Ionicons name="cube-outline" size={20} color="#8B5CF6" />
            </View>
            <Text style={styles.featureText}>AR</Text>
          </View>

          <View style={styles.featureDivider} />

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, styles.featureIconAudio]}>
              <Ionicons name="headset-outline" size={20} color="#4ADE80" />
            </View>
            <Text style={styles.featureText}>Audio</Text>
          </View>

          <View style={styles.featureDivider} />

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, styles.featureIconAI]}>
              <Ionicons name="sparkles" size={20} color="#FBBF24" />
            </View>
            <Text style={styles.featureText}>AI Guide</Text>
          </View>
        </Animated.View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <Animated.View
              style={[styles.progressBar, { width: progressInterpolated }]}
            />
          </View>
          <Text style={styles.loadingText}>Ładowanie...</Text>
        </View>
      </View>

      <View style={styles.bottomDecoration}>
        <Text style={styles.versionText}>v1.0.0</Text>
        <View style={styles.madeWithLove}>
          <Text style={styles.madeWithText}>Made with</Text>
          <Ionicons name="heart" size={12} color="#EF4444" />
          <Text style={styles.madeWithText}>in Lublin</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  gradient: {
    ...StyleSheet.absoluteFillObject
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.1)'
  },
  circle1: {
    width: width * 1.5,
    height: width * 1.5,
    top: -width * 0.5,
    left: -width * 0.25
  },
  circle2: {
    width: width * 1.2,
    height: width * 1.2,
    bottom: -width * 0.4,
    right: -width * 0.3,
    borderColor: 'rgba(139, 92, 246, 0.1)'
  },
  circle3: {
    width: width * 0.8,
    height: width * 0.8,
    top: height * 0.1,
    right: -width * 0.2,
    borderColor: 'rgba(251, 191, 36, 0.1)'
  },
  rotatingRing: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.2)',
    borderStyle: 'dashed'
  },
  ringDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
    top: -4,
    left: '50%',
    marginLeft: -4
  },
  ringDot2: {
    top: '50%',
    left: -4,
    marginTop: -4,
    marginLeft: 0,
    backgroundColor: '#8B5CF6'
  },
  ringDot3: {
    top: '50%',
    left: 'auto',
    right: -4,
    marginTop: -4,
    marginLeft: 0,
    backgroundColor: '#FBBF24'
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40
  },
  logoContainer: {
    marginBottom: 24
  },
  logo: {
    width: 180,
    height: 160
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 32
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 0.5
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center'
  },
  featuresContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 40
  },
  featureItem: {
    alignItems: 'center',
    gap: 8
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  featureIconAR: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)'
  },
  featureIconAudio: {
    backgroundColor: 'rgba(74, 222, 128, 0.2)'
  },
  featureIconAI: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)'
  },
  featureText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)'
  },
  featureDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 20
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center'
  },
  progressBackground: {
    width: '80%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4ADE80',
    borderRadius: 2
  },
  loadingText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)'
  },
  bottomDecoration: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
    gap: 8
  },
  versionText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.3)'
  },
  madeWithLove: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  madeWithText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)'
  }
});
