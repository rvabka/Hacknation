import './global.css';
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/navigation/SplashScreen';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [fontsLoaded] = useFonts({
    Kollektif: require('./assets/fonts/Kollektif.ttf'),
    'Kollektif-Bold': require('./assets/fonts/Kollektif-Bold.ttf')
  });

  const handleSplashFinish = () => {
    setIsLoading(false);
  };

  if (!fontsLoaded || isLoading) {
    return (
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SplashScreen onFinish={handleSplashFinish} />
          <StatusBar style="light" />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer>
          <AppNavigator />
          <StatusBar style="dark" />
        </NavigationContainer>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
