# Bydgoszcz Mobile App 📱

Profesjonalna aplikacja mobilna React Native z nawigacją dla miasta Bydgoszcz.

## 🏗️ Struktura Projektu

```
bydgoszczMobile/
├── src/
│   ├── components/       # Reusable components
│   │   └── index.ts
│   ├── navigation/       # Navigation configuration
│   │   ├── AppNavigator.tsx
│   │   └── types.ts
│   ├── screens/         # App screens
│   │   ├── HomeScreen.tsx
│   │   ├── DetailsScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   └── index.ts
│   ├── hooks/           # Custom React hooks
│   │   └── index.ts
│   └── utils/           # Utility functions
│       └── index.ts
├── assets/              # Images, fonts, etc.
├── App.tsx              # Root component
├── global.css           # Global styles (NativeWind)
└── package.json
```

## 🚀 Technologie

- **React Native** - Framework mobilny
- **Expo** ~54.0.27 - Narzędzia deweloperskie
- **React Navigation** - Nawigacja
  - Native Stack Navigator
- **NativeWind** - Tailwind CSS dla React Native
- **TypeScript** - Type safety

## 📦 Instalacja

```bash
# Instalacja zależności
npm install

# Uruchomienie aplikacji
npm start

# Uruchomienie na iOS
npm run ios

# Uruchomienie na Android
npm run android
```

## 🧭 Nawigacja

Aplikacja używa **React Navigation Native Stack** z trzema ekranami:

### Screens:

- **HomeScreen** - Główny ekran z listą atrakcji
- **DetailsScreen** - Szczegóły wybranej atrakcji
- **ProfileScreen** - Profil użytkownika

### Type-Safe Navigation:

```typescript
// Navigation z parametrami
navigation.navigate('Details', {
  itemId: '1',
  title: 'Stary Rynek'
});

// Powrót
navigation.goBack();
```

## 🎨 Stylowanie

Aplikacja używa **NativeWind** (Tailwind CSS):

```tsx
<View className="flex-1 items-center justify-center p-6">
  <Text className="text-3xl font-bold text-gray-800">Witaj!</Text>
</View>
```

## 📱 Ekrany

### Home Screen

- Lista atrakcji Bydgoszczy
- Nawigacja do Details i Profile
- Przyjazny interfejs użytkownika

### Details Screen

- Szczegółowe informacje o atrakcji
- Oceny i lokalizacja
- Nawigacja powrotna

### Profile Screen

- Informacje użytkownika
- Statystyki (odwiedzone miejsca, ulubione, opinie)
- Dane kontaktowe

## 🔧 Rozwój

### Dodawanie nowego ekranu:

1. Zaktualizuj typy w `src/navigation/types.ts`:

```typescript
export type RootStackParamList = {
  // ...existing screens
  NewScreen: { param: string };
};
```

2. Stwórz nowy screen w `src/screens/NewScreen.tsx`:

```typescript
import type { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'NewScreen'>;

export default function NewScreen({ route, navigation }: Props) {
  // Your screen code
}
```

3. Dodaj do navigatora w `src/navigation/AppNavigator.tsx`:

```typescript
<Stack.Screen
  name="NewScreen"
  component={NewScreen}
  options={{ title: 'Nowy Ekran' }}
/>
```

### Dodawanie komponentu:

Utwórz w `src/components/YourComponent.tsx` i exportuj w `index.ts`.

### Dodawanie hooka:

Utwórz w `src/hooks/useYourHook.ts` i exportuj w `index.ts`.

## 🎯 Best Practices

- ✅ Type-safe navigation z TypeScript
- ✅ Separacja concerns (screens, components, navigation)
- ✅ Clean code architecture
- ✅ Reusable components
- ✅ Consistent styling z NativeWind
- ✅ Proper error handling
- ✅ Optimized performance

## 📄 License

MIT

## 👥 Author

Bydgoszcz Mobile Team
