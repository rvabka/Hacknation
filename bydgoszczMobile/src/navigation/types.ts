import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

// Bottom Tab Navigator - dodaj ARView tutaj!
export type BottomTabParamList = {
  MapTab: undefined;
  AttractionsTab: undefined;
  ARView: {
    attraction: {
      id: string;
      title: string;
      description: string;
      rating: number;
      location: string;
      coordinate: {
        latitude: number;
        longitude: number;
      };
    };
  };
};

// Stack Navigator - bez ARView
export type RootStackParamList = {
  MainTabs: undefined;
  Details: {
    id: string;
    title: string;
    description: string;
    rating: number;
    location: string;
  };
};

// Screen Props
export type MapTabScreenProps = BottomTabScreenProps<
  BottomTabParamList,
  'MapTab'
>;

export type AttractionsTabScreenProps = BottomTabScreenProps<
  BottomTabParamList,
  'AttractionsTab'
>;

export type DetailsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Details'
>;

export type ARViewScreenProps = BottomTabScreenProps<
  BottomTabParamList,
  'ARView'
>;
