import { ImageSourcePropType } from 'react-native';

export interface LocalAssets {
  image?: ImageSourcePropType;
  mp3?: any;
  model?: any;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

// Mapa lokalnych assetów (audio + modele 3D) – wpięta po znormalizowanym tytule.
// Zdjęcia atrakcji są teraz pobierane z Google Places i hostowane w Supabase,
// więc tutaj utrzymujemy WYŁĄCZNIE assety binarne których nie da się hostować
// (pliki .glb i .mp3 bundle'owane razem z aplikacją).
const ASSETS_BY_TITLE: Record<string, LocalAssets> = {
  [norm('Zamek Lubelski')]: {
    mp3: require('../../assets/audio/lucznik.mp3'),
    model: require('../../assets/models/lucznik2.glb')
  },
  [norm('Zamek w Lublinie')]: {
    mp3: require('../../assets/audio/lucznik.mp3'),
    model: require('../../assets/models/lucznik2.glb')
  },
  [norm('Stare Miasto')]: {
    mp3: require('../../assets/audio/poczta.mp3'),
    model: require('../../assets/models/poczta.glb')
  },
  [norm('Plac Litewski')]: {
    mp3: require('../../assets/audio/wiezacisnien.mp3'),
    model: require('../../assets/models/wieza.glb')
  }
};

export function getLocalAssets(title: string): LocalAssets {
  return ASSETS_BY_TITLE[norm(title)] ?? {};
}

// Fallback po kategorii – obecnie niedostępny (brak generycznych zdjęć w bundle).
// Atrakcje bez Google Places photo wpadają w UI-owy placeholder z ikoną kategorii.
export function getCategoryFallbackImage(
  _category: string
): ImageSourcePropType | undefined {
  return undefined;
}
