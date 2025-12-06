import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import type { AttractionsTabScreenProps } from '../navigation/types';

const attractions = [
  {
    id: '1',
    title: '🏰 Stare Miasto',
    description: 'Zabytkowe centrum Bydgoszczy z pięknymi kamienicami',
    rating: 4.8,
    location: 'Centrum'
  },
  {
    id: '2',
    title: '🌊 Wyspa Młyńska',
    description: 'Malownicza wyspa nad Brdą',
    rating: 4.7,
    location: 'Śródmieście'
  },
  {
    id: '3',
    title: '🎭 Opera Nova',
    description: 'Nowoczesna opera nad rzeką',
    rating: 4.9,
    location: 'Wyspa Młyńska'
  }
];

export default function AttractionsScreen({
  navigation
}: AttractionsTabScreenProps) {
  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-6">
        <Text className="text-3xl font-bold text-gray-800 mb-2">
          Witaj w Bydgoszczy! 👋
        </Text>
        <Text className="text-gray-600 mb-6">
          Odkryj najciekawsze miejsca w mieście
        </Text>

        {attractions.map(attraction => (
          <TouchableOpacity
            key={attraction.id}
            className="bg-white p-4 h-60 items-center rounded-xl mb-4 shadow-sm"
            onPress={() => navigation.navigate('Details', attraction)}
          >
            <Text className="text-xl font-bold text-gray-800 mb-6">
              {attraction.title}
            </Text>
            <Text className="text-gray-600 mb-2">{attraction.description}</Text>
            <View className="flex-row items-center">
              <Text className="text-yellow-500 mr-2">
                ⭐ {attraction.rating}
              </Text>
              <Text className="text-gray-500">📍 {attraction.location}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
