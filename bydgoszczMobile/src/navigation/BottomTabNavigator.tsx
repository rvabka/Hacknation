import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import type { BottomTabParamList } from './types';

import MapScreen from '../screens/MapScreen';
import AttractionsScreen from '../screens/AttractionsScreen';

const Tab = createBottomTabNavigator<BottomTabParamList>();

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'MapTab') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'AttractionsTab') {
            iconName = focused ? 'list' : 'list-outline';
          } else {
            iconName = 'camera-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },

        headerShown: true,
        // Konfiguracja logo w nagłówku
        headerTitle: () => (
          <Image
            // Ścieżka do logo (upewnij się, że plik istnieje w tej lokalizacji)
            source={require('../../assets/bydgoszczLogo.png')}
            style={{ width: 150, height: 100 , top: -10}} // Usunięto position: 'absolute' dla poprawnego centrowania
            resizeMode="contain"
          />
        ),
        headerTitleAlign: 'center', // To ustawienie centruje kontener z obrazkiem

        headerStyle: {
          backgroundColor: 'white',
          elevation: 0,        // Android: usuwa cień
          shadowOpacity: 0,    // iOS: usuwa cień
          borderBottomWidth: 0,
          height: 110,

        },
        headerTintColor: '#1B4D3E', // Zmieniono na ciemny, by ikony były widoczne na białym tle
        headerTitleStyle: {
          fontWeight: 'bold',
          color: '#1B4D3E'
        }
      })}
    >
      <Tab.Screen
        name="MapTab"
        component={MapScreen}
        options={{
          tabBarLabel: 'Mapa',
          title: 'Mapa Bydgoszczy' // Tytuł techniczny (nadpisany przez headerTitle)
        }}
      />
      <Tab.Screen
        name="AttractionsTab"
        component={AttractionsScreen}
        options={{
          tabBarLabel: 'Atrakcje',
          title: 'Atrakcje'
        }}
      />
    </Tab.Navigator>
  );
}