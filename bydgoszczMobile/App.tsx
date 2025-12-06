import './global.css';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

export default function App() {
  console.log("App component rendering...");
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold text-blue-500">
        Witaj w bydgoszczMobile kuaaarwaaaaaarrr! 🎉
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}
