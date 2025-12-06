import React from 'react';
import { Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';

import BottomTabNavigator from './BottomTabNavigator';
import DetailsScreen from '../screens/DetailsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false
        }}
      >
        <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
        <Stack.Screen
          name="Details"
          component={DetailsScreen}
          options={{
            headerShown: true,
            headerBackVisible: false,
            headerTitle: () => (
              <Image
                source={require('../../assets/bydgoszczLogo.png')}
                style={{ width: 150, height: 100, top: -20 }}
                resizeMode="contain"
              />
            ),
            headerTitleAlign: 'center',
            headerStyle: {
              backgroundColor: 'white',
            },
            headerShadowVisible: false,
            headerTintColor: '#1B4D3E',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}