import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps as RNBottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

// Bottom Tab Navigator
export type BottomTabParamList = {
  MapTab: undefined;
  AttractionsTab: undefined;
};

// Stack Navigator
export type RootStackParamList = {
  MainTabs: undefined;
  Details: {
    id: string;
    title: string;
    description: string;
    location: string;
  };
};

// Screen Props
export type DetailsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Details'
>;

export type MapScreenProps = CompositeScreenProps<
  RNBottomTabScreenProps<BottomTabParamList, 'MapTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

export type AttractionsScreenProps = CompositeScreenProps<
  RNBottomTabScreenProps<BottomTabParamList, 'AttractionsTab'>,
  NativeStackScreenProps<RootStackParamList>
>;
