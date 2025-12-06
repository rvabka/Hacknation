import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

// Bottom Tab Navigator
export type BottomTabParamList = {
  MapTab: undefined;
  AttractionsTab: undefined;
};

// Stack Navigator (dla Details)
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
export type MapTabScreenProps = CompositeScreenProps<
  BottomTabScreenProps<BottomTabParamList, 'MapTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

export type AttractionsTabScreenProps = CompositeScreenProps<
  BottomTabScreenProps<BottomTabParamList, 'AttractionsTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

export type DetailsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Details'
>;
