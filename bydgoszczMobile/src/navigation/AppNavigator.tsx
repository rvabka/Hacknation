import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';

import BottomTabNavigator from './BottomTabNavigator';
import DetailsScreen from '../screens/DetailsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right'
      }}
    >
      <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
      <Stack.Screen
        name="Details"
        component={DetailsScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_bottom'
        }}
      />
    </Stack.Navigator>
  );
}
