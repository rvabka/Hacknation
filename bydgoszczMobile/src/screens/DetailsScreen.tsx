import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import type { DetailsScreenProps } from '../navigation/types';

export default function DetailsScreen({
  route,
  navigation
}: DetailsScreenProps) {
  const { title, description, rating, location } = route.params;

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-6">
        <Text className="text-3xl font-bold text-gray-800 mb-4">{title}</Text>

        <View className="bg-blue-50 p-4 rounded-xl mb-4">
          <Text className="text-lg text-gray-700 mb-2">📝 {description}</Text>
        </View>

        <View className="flex-row items-center mb-4">
          <Text className="text-2xl mr-2">⭐</Text>
          <Text className="text-xl font-bold text-gray-800">{rating}</Text>
        </View>

        <View className="flex-row items-center mb-6">
          <Text className="text-2xl mr-2">📍</Text>
          <Text className="text-lg text-gray-600">{location}</Text>
        </View>

        <TouchableOpacity
          className="bg-blue-500 p-4 rounded-xl"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-white text-center font-bold text-lg">
            ← Powrót
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
