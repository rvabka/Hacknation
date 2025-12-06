import React from 'react';
import { View, Text } from 'react-native';
import type { MapTabScreenProps } from '../navigation/types';

export default function MapScreen({ navigation }: MapTabScreenProps) {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold text-gray-800 mb-4">
        🗺️ Mapa Bydgoszczy
      </Text>
      <Text className="text-gray-600 text-center px-8">
        Tutaj będzie mapa z atrakcjami
      </Text>
    </View>
  );
}
