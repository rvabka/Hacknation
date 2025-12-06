import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import type { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'Profile'>;

export default function ProfileScreen({ route, navigation }: Props) {
  const { userId } = route.params;

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 p-6">
        <View className="items-center mb-8">
          <View className="w-24 h-24 bg-blue-500 rounded-full items-center justify-center mb-4">
            <Text className="text-4xl text-white">👤</Text>
          </View>
          <Text className="text-2xl font-bold text-gray-800 mb-1">
            Jan Kowalski
          </Text>
          <Text className="text-sm text-gray-500">User ID: {userId}</Text>
        </View>

        <View className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            📊 Statystyki
          </Text>
          <View className="flex-row justify-around">
            <View className="items-center">
              <Text className="text-2xl font-bold text-blue-500">12</Text>
              <Text className="text-sm text-gray-600">Odwiedzonych</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-green-500">8</Text>
              <Text className="text-sm text-gray-600">Ulubionych</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-purple-500">5</Text>
              <Text className="text-sm text-gray-600">Opinii</Text>
            </View>
          </View>
        </View>

        <View className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            ✉️ Email
          </Text>
          <Text className="text-gray-600">jan.kowalski@example.com</Text>
        </View>

        <View className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            📱 Telefon
          </Text>
          <Text className="text-gray-600">+48 123 456 789</Text>
        </View>

        <TouchableOpacity
          className="bg-blue-500 p-4 rounded-lg shadow-lg active:bg-blue-600 mb-4"
          onPress={() => navigation.navigate('Home')}
        >
          <Text className="text-white text-center font-semibold text-lg">
            🏠 Strona Główna
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-gray-200 p-4 rounded-lg active:bg-gray-300"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-gray-700 text-center font-semibold text-lg">
            ← Powrót
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
