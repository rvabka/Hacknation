import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

export type RootStackParamList = {
  MainTabs: undefined;
  Details: {
    id: string;
    title: string;
    description: string;
    location: string;
  };
};

export type BottomTabParamList = {
  MapTab: undefined;
  AttractionsTab: undefined;
  PlannerTab: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type HomeTabScreenProps<T extends keyof BottomTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<BottomTabParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;

export type DetailsScreenProps = RootStackScreenProps<'Details'>;
export type AttractionsScreenProps = HomeTabScreenProps<'AttractionsTab'>;
export type MapScreenProps = HomeTabScreenProps<'MapTab'>;
export type PlannerScreenProps = HomeTabScreenProps<'PlannerTab'>;
