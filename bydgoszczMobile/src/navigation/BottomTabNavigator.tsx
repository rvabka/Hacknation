import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabParamList } from './types';

import MapScreen from '../screens/MapScreen';
import AttractionsScreen from '../screens/AttractionsScreen';
import ARViewScreen from '../screens/ARViewScreen';

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
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
        headerStyle: {
          backgroundColor: '#3b82f6'
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold'
        }
      })}
    >
      <Tab.Screen
        name="MapTab"
        component={MapScreen}
        options={{
          tabBarLabel: 'Mapa',
          title: 'Mapa Bydgoszczy'
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
      <Tab.Screen
        name="ARView"
        component={ARViewScreen}
        options={{
          tabBarButton: () => null, // Ukrywa przycisk w tab bar
          tabBarStyle: { display: 'none' }, // Ukrywa cały tab bar na tym ekranie
          headerShown: false
        }}
      />
    </Tab.Navigator>
  );
}
