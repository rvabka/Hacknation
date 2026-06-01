import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface SplashScreenProps {
  onFinish: () => void;
}

const MINT = '#37D08A';

const FEATURES: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}[] = [
  { icon: 'map-outline', label: 'Mapa' },
  { icon: 'sparkles-outline', label: 'Przewodnik AI' },
  { icon: 'navigate-outline', label: 'Trasy' }
];

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0.6)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textY = useRef(new Animated.Value(20)).current;
  const featuresOpacity = useRef(new Animated.Value(0)).current;
  const featuresY = useRef(new Animated.Value(16)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(glow, {
          toValue: 0.6,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    ).start();

    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 7,
          tension: 50,
          useNativeDriver: true
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true
        })
      ]),
      Animated.delay(120),
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true
        }),
        Animated.spring(textY, {
          toValue: 0,
          friction: 8,
          tension: 50,
          useNativeDriver: true
        })
      ]),
      Animated.delay(120),
      Animated.parallel([
        Animated.timing(featuresOpacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true
        }),
        Animated.spring(featuresY, {
          toValue: 0,
          friction: 8,
          tension: 50,
          useNativeDriver: true
        })
      ]),
      Animated.timing(progress, {
        toValue: 1,
        duration: 1100,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false
      })
    ]).start(() => setTimeout(onFinish, 250));
  }, []);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1B4D3E', '#0C271C', '#061512']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.content}>
        <View style={styles.logoBlock}>
          <Animated.View
            style={[styles.glow, { opacity: glow }]}
            pointerEvents="none"
          />
          <Animated.View
            style={[
              styles.logoTile,
              { opacity: logoOpacity, transform: [{ scale: logoScale }] }
            ]}
          >
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        <Animated.View
          style={{ opacity: textOpacity, transform: [{ translateY: textY }] }}
        >
          <Text style={styles.title}>Odkryj Lublin</Text>
          <Text style={styles.subtitle}>
            Twój przewodnik po atrakcjach miasta
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.features,
            { opacity: featuresOpacity, transform: [{ translateY: featuresY }] }
          ]}
        >
          {FEATURES.map((f, i) => (
            <React.Fragment key={f.label}>
              {i > 0 && <View style={styles.featureDivider} />}
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Ionicons name={f.icon} size={19} color={MINT} />
                </View>
                <Text style={styles.featureLabel}>{f.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </Animated.View>

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Zrobione z</Text>
        <Ionicons name="heart" size={12} color={MINT} />
        <Text style={styles.footerText}>w Lublinie</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { alignItems: 'center', paddingHorizontal: 40, width: '100%' },

  logoBlock: {
    width: 132,
    height: 132,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28
  },
  glow: {
    position: 'absolute',
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: 'rgba(55,208,138,0.18)'
  },
  logoTile: {
    width: 124,
    height: 124,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24
  },
  logo: { width: 104, height: 104 },

  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.3
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(244,247,242,0.7)',
    textAlign: 'center',
    marginTop: 8
  },

  features: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(55,208,138,0.18)',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 22,
    marginTop: 36,
    marginBottom: 40
  },
  featureItem: { alignItems: 'center', gap: 8, minWidth: 64 },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: 'rgba(55,208,138,0.14)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  featureLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(244,247,242,0.85)'
  },
  featureDivider: {
    width: 1,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginHorizontal: 14
  },

  progressTrack: {
    width: '74%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 2,
    overflow: 'hidden'
  },
  progressFill: { height: '100%', backgroundColor: MINT, borderRadius: 2 },

  footer: {
    position: 'absolute',
    bottom: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  footerText: { fontSize: 12, color: 'rgba(244,247,242,0.45)' }
});
