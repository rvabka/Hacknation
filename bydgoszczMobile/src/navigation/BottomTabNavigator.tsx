import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabParamList } from './types';
import { colors, font, radii } from '../theme';

import MapScreen from '../screens/MapScreen';
import AttractionsScreen from '../screens/AttractionsScreen';
import PlannerScreen from '../screens/PlannerScreen';

const Tab = createBottomTabNavigator<BottomTabParamList>();

const ICONS: Record<
  string,
  {
    active: keyof typeof Ionicons.glyphMap;
    inactive: keyof typeof Ionicons.glyphMap;
  }
> = {
  MapTab: { active: 'map', inactive: 'map-outline' },
  AttractionsTab: { active: 'compass', inactive: 'compass-outline' },
  PlannerTab: { active: 'calendar', inactive: 'calendar-outline' }
};

export default function BottomTabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => {
          const icon = ICONS[route.name] ?? ICONS.MapTab;
          return (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Ionicons
                name={focused ? icon.active : icon.inactive}
                size={22}
                color={focused ? colors.mint : colors.onForestSoft}
              />
            </View>
          );
        },
        tabBarLabel: ({ focused, children }) => (
          <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
            {children}
          </Text>
        ),
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 58 + insets.bottom,
          paddingTop: 9,
          paddingBottom: insets.bottom > 0 ? insets.bottom - 6 : 8,
          paddingHorizontal: 8,
          backgroundColor: colors.forestDeep,
          borderTopLeftRadius: radii.xl,
          borderTopRightRadius: radii.xl,
          borderTopWidth: 0,
          ...Platform.select({
            ios: {
              shadowColor: '#0C271C',
              shadowOffset: { width: 0, height: -6 },
              shadowOpacity: 0.18,
              shadowRadius: 16
            },
            android: { elevation: 16 }
          })
        },
        tabBarActiveTintColor: colors.mint,
        tabBarInactiveTintColor: colors.onForestSoft,
        tabBarItemStyle: { paddingTop: 0 }
      })}
    >
      <Tab.Screen
        name="MapTab"
        component={MapScreen}
        options={{ tabBarLabel: 'Mapa' }}
      />
      <Tab.Screen
        name="AttractionsTab"
        component={AttractionsScreen}
        options={{ tabBarLabel: 'Odkrywaj' }}
      />
      <Tab.Screen
        name="PlannerTab"
        component={PlannerScreen}
        options={{ tabBarLabel: 'Planuj' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 46,
    height: 30,
    borderRadius: radii.pill,
    justifyContent: 'center',
    alignItems: 'center'
  },
  iconWrapActive: { backgroundColor: 'rgba(55,208,138,0.16)' },
  tabLabel: {
    fontSize: 11,
    fontFamily: font.regular,
    color: colors.onForestSoft,
    marginTop: 3
  },
  tabLabelActive: { color: colors.mint, fontFamily: font.bold }
});
