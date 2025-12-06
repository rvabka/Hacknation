import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import type { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'Details'>;

export default function DetailsScreen({ route, navigation }: Props) {
  const { itemId, title } = route.params;

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 p-6">
        <View className="bg-blue-50 p-6 rounded-lg mb-6">
          <Text className="text-2xl font-bold text-gray-800 mb-2">
            {title || 'Szczegóły'}
          </Text>
          <Text className="text-sm text-gray-500">ID: {itemId}</Text>
        </View>

        <View className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            📍 Lokalizacja
          </Text>
          <Text className="text-gray-600">Bydgoszcz, centrum miasta</Text>
        </View>

        <View className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            ℹ️ Informacje
          </Text>
          <Text className="text-gray-600 leading-6">
            To jest przykładowy ekran szczegółów. Tutaj możesz wyświetlić więcej
            informacji o wybranej atrakcji, zdjęcia, opinie użytkowników i wiele
            więcej.
          </Text>
        </View>

        <View className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            ⭐ Ocena
          </Text>
          <Text className="text-2xl font-bold text-yellow-500">4.8 / 5.0</Text>
        </View>

        <TouchableOpacity
          className="bg-blue-500 p-4 rounded-lg shadow-lg active:bg-blue-600 mb-4"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-white text-center font-semibold text-lg">
            ← Powrót
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-green-500 p-4 rounded-lg shadow-lg active:bg-green-600"
          onPress={() => navigation.navigate('Home')}
        >
          <Text className="text-white text-center font-semibold text-lg">
            🏠 Strona Główna
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
