import { Platform } from 'react-native';

/**
 * Design tokens — jedno źródło prawdy dla całego UI.
 *
 * System (zablokowany, per design-taste-frontend):
 *  - Paleta: "Forest" — głęboka zieleń + kostny off-white + JEDEN akcent (mięta).
 *    Tekst to ciepła zieleń-prawie-czerń (nie czyste #000), tła to kość (nie #FFF na całość).
 *  - Akcent: mięta. Używana spójnie wszędzie; nie pojawia się drugi dekoracyjny akcent.
 *  - Kształt: jedna skala promieni. Karty = lg(20), przyciski = md(14),
 *    pełne pigułki/chipsy = pill, małe kontrolki = sm(10).
 *  - Cienie: tintowane kolorem marki (nigdy czysta czerń), miękkie.
 */

export const colors = {
  // tła / powierzchnie
  bg: '#F6F5EF', // kość — główne tło ekranów treściowych
  surface: '#FFFFFF', // karty
  surfaceAlt: '#EFEEE6', // subtelna powierzchnia (np. inputy, wypełnienia)
  scrim: 'rgba(11, 24, 18, 0.55)', // przyciemnienie pod modalami / na zdjęciach

  // marka
  forest: '#143D2B', // główna zieleń — przyciski, ciemne powierzchnie
  forestSoft: '#1B4D3E', // jaśniejszy wariant zieleni
  forestDeep: '#0C271C', // najgłębsza zieleń (nagłówki na ciemnym)

  // akcent (JEDEN)
  mint: '#37D08A', // akcent na ciemnym tle (ikony, marki, podświetlenia)
  mintInk: '#0B3D2E', // tekst/ikona NA mięcie (kontrast)
  mintWash: '#E4F4EA', // delikatne tło chipsów/akcentów na jasnym

  // tekst (ciepła zieleń-prawie-czerń, nie pure black)
  ink: '#16211B',
  inkSoft: '#586A60',
  inkFaint: '#93A096',
  onForest: '#F4F7F2', // tekst na zielonym
  onForestSoft: 'rgba(244,247,242,0.62)',

  // linie / obramowania
  line: '#E7E6DC',
  lineOnForest: 'rgba(244,247,242,0.14)',

  // semantyczne (funkcjonalne, nie dekoracyjne akcenty)
  favorite: '#F2546B', // serce „ulubione" — stan, nie drugi akcent
  white: '#FFFFFF'
} as const;

// Kolory kategorii — stonowane, ziemiste, zharmonizowane z paletą Forest
// (zamiast saturowanej tęczy). Funkcjonalne kodowanie kategorii.
export const categoryColor: Record<string, string> = {
  Rzeźba: '#B96A3C', // terakota
  Architektura: '#4C6B8A', // przygaszony błękit łupkowy
  Sakralny: '#C29A45', // złamane złoto
  Muzeum: '#9C5B78', // śliwka / przygaszony róż
  'Zabytek techniki': '#2F7D5C' // las / teal
};

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 56
} as const;

export const radii = {
  sm: 10, // małe kontrolki, inputy
  md: 14, // przyciski
  lg: 20, // karty
  xl: 24, // duże karty / hero
  pill: 999 // chipsy, okrągłe przyciski
} as const;

export const font = {
  regular: 'Kollektif',
  bold: 'Kollektif-Bold'
} as const;

/**
 * Skala typograficzna. Hierarchia budowana wagą + kolorem, nie tylko rozmiarem.
 * Każdy wpis to gotowy fragment stylu tekstu.
 */
export const type = {
  display: { fontFamily: font.bold, fontSize: 28, lineHeight: 34, color: colors.ink },
  title: { fontFamily: font.bold, fontSize: 21, lineHeight: 27, color: colors.ink },
  heading: { fontFamily: font.bold, fontSize: 17, lineHeight: 22, color: colors.ink },
  body: { fontFamily: font.regular, fontSize: 15, lineHeight: 23, color: colors.inkSoft },
  bodyStrong: { fontFamily: font.bold, fontSize: 15, lineHeight: 22, color: colors.ink },
  small: { fontFamily: font.regular, fontSize: 13, lineHeight: 19, color: colors.inkSoft },
  label: {
    fontFamily: font.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.6,
    color: colors.inkFaint
  },
  caption: { fontFamily: font.regular, fontSize: 12, lineHeight: 16, color: colors.inkFaint }
} as const;

/**
 * Cienie tintowane kolorem marki. Trzy poziomy elewacji.
 */
export const shadow = {
  sm: Platform.select({
    ios: {
      shadowColor: '#143D2B',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8
    },
    android: { elevation: 2 }
  }) as object,
  md: Platform.select({
    ios: {
      shadowColor: '#143D2B',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 18
    },
    android: { elevation: 6 }
  }) as object,
  lg: Platform.select({
    ios: {
      shadowColor: '#0C271C',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.16,
      shadowRadius: 28
    },
    android: { elevation: 12 }
  }) as object
} as const;

export const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };
