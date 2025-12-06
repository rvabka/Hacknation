import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabParamList } from './types';

import MapScreen from '../screens/MapScreen';
import AttractionsScreen from '../screens/AttractionsScreen';

const Tab = createBottomTabNavigator<BottomTabParamList>();

export default function BottomTabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'MapTab') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'AttractionsTab') {
            iconName = focused ? 'compass' : 'compass-outline';
          } else {
            iconName = 'camera-outline';
          }

          return (
            <View
              style={[
                styles.iconContainer,
                focused && styles.iconContainerActive
              ]}
            >
              <Ionicons name={iconName} size={24} color={color} />
            </View>
          );
        },
        tabBarLabel: ({ focused, children }) => (
          <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
            {children}
          </Text>
        ),
        headerShown: true,
        headerTitle: () => (
          <Image
            source={require('../../assets/bydgoszczLogo.png')}
            style={{ width: 150, height: 100, top: -10 }}
            resizeMode="contain"
          />
        ),
        headerTitleAlign: 'center',
        headerStyle: {
          backgroundColor: 'white',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
          height: 120,
        },
        headerTintColor: '#1B4D3E',
        headerTitleStyle: {
          fontWeight: 'bold',
          color: '#1B4D3E'
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 50 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 12,
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.3,
              shadowRadius: 12
            },
            android: {
              elevation: 10
            }
          })
        },
        tabBarActiveTintColor: '#4ADE80',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)',
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center'
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
          tabBarLabel: 'Odkrywaj',
          title: 'Atrakcje'
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    marginBottom: 10,
    alignItems: 'center',
    backgroundColor: 'transparent'
  },
  iconContainerActive: {
    backgroundColor: 'rgba(74, 222, 128, 0.15)'
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4
  },
  tabLabelActive: {
    color: '#4ADE80',
    fontWeight: '600'
  }
});
