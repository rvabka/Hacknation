import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabParamList } from './types';

import MapScreen from '../screens/MapScreen';
import AttractionsScreen from '../screens/AttractionsScreen';

const Tab = createBottomTabNavigator<BottomTabParamList>();

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#6b7280',
        headerStyle: {
          backgroundColor: '#3b82f6'
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold'
        }
      }}
    >
      <Tab.Screen
        name="MapTab"
        component={MapScreen}
        options={{
          title: 'Mapa',
          tabBarLabel: 'Mapa',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          )
        }}
      />
      <Tab.Screen
        name="AttractionsTab"
        component={AttractionsScreen}
        options={{
          title: 'Atrakcje',
          tabBarLabel: 'Atrakcje',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="business" size={size} color={color} />
          )
        }}
      />
    </Tab.Navigator>
  );
}
