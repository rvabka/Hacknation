import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import type { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'Home'>;

export default function HomeScreen({ navigation }: Props) {
  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-3xl font-bold text-gray-800 mb-4">
          🎉 Witaj w Bydgoszczy!
        </Text>

        <Text className="text-lg text-gray-600 text-center mb-8">
          Odkrywaj najpiękniejsze miejsca naszego miasta
        </Text>

        <View className="w-full space-y-4">
          <TouchableOpacity
            className="bg-blue-500 p-4 rounded-lg shadow-lg active:bg-blue-600"
            onPress={() =>
              navigation.navigate('Details', {
                itemId: '1',
                title: 'Stary Rynek'
              })
            }
          >
            <Text className="text-white text-center font-semibold text-lg">
              Zobacz Atrakcje
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-green-500 p-4 rounded-lg shadow-lg active:bg-green-600"
            onPress={() =>
              navigation.navigate('Profile', {
                userId: 'user123'
              })
            }
          >
            <Text className="text-white text-center font-semibold text-lg">
              Mój Profil
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-purple-500 p-4 rounded-lg shadow-lg active:bg-purple-600"
            onPress={() =>
              navigation.navigate('Details', {
                itemId: '2',
                title: 'Wyspa Młyńska'
              })
            }
          >
            <Text className="text-white text-center font-semibold text-lg">
              Wyspa Młyńska
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mt-8 p-4 bg-blue-50 rounded-lg">
          <Text className="text-sm text-gray-600 text-center">
            💡 Tip: Naciśnij przyciski aby nawigować między ekranami
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
