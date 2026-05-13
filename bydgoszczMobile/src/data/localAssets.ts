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

const ASSETS_BY_TITLE: Record<string, LocalAssets> = {
  [norm('Zamek Lubelski')]: {
    image: require('../../assets/lucznik.jpeg'),
    mp3: require('../../assets/audio/lucznik.mp3'),
    model: require('../../assets/models/lucznik2.glb')
  },
  [norm('Brama Krakowska')]: {
    image: require('../../assets/wioslarz.jpeg')
  },
  [norm('Katedra Lubelska')]: {
    image: require('../../assets/sluza.jpeg')
  },
  [norm('Stare Miasto')]: {
    image: require('../../assets/poczta.jpeg'),
    mp3: require('../../assets/audio/poczta.mp3'),
    model: require('../../assets/models/poczta.glb')
  },
  [norm('Plac Litewski')]: {
    image: require('../../assets/cisnienie.jpeg'),
    mp3: require('../../assets/audio/wiezacisnien.mp3'),
    model: require('../../assets/models/wieza.glb')
  },
  [norm('Kościół Dominikanów')]: {
    image: require('../../assets/kosciol.jpeg')
  },
  [norm('Bazylika Dominikanów w Lublinie')]: {
    image: require('../../assets/kosciol.jpeg')
  },
  [norm('Trybunał Koronny')]: {
    image: require('../../assets/ratusz.jpeg')
  },
  [norm('Brama Grodzka')]: {
    image: require('../../assets/garnizon.jpeg')
  },
  [norm('Pomnik Unii Lubelskiej')]: {
    image: require('../../assets/fontanna.jpeg')
  },
  [norm('Centrum Spotkania Kultur')]: {
    image: require('../../assets/hala.jpeg')
  }
};

export function getLocalAssets(title: string): LocalAssets {
  return ASSETS_BY_TITLE[norm(title)] ?? {};
}

// Generyczne zdjęcia per kategoria – fallback gdy atrakcja nie ma swojego
const CATEGORY_FALLBACK_IMAGES: Record<string, ImageSourcePropType> = {
  Muzeum: require('../../assets/lucznik.jpeg'),
  Sakralny: require('../../assets/kosciol.jpeg'),
  Architektura: require('../../assets/poczta.jpeg'),
  Rzeźba: require('../../assets/fontanna.jpeg'),
  'Zabytek techniki': require('../../assets/cisnienie.jpeg')
};

export function getCategoryFallbackImage(
  category: string
): ImageSourcePropType | undefined {
  return CATEGORY_FALLBACK_IMAGES[category];
}
