import { ImageSourcePropType } from 'react-native';

export interface Attraction {
  id: string;
  title: string;
  description: string;
  location: string;
  coordinate: { latitude: number; longitude: number };
  image?: ImageSourcePropType;
  category: CategoryType;
  yearBuilt?: string;
  architect?: string;
  funFacts: string[];
  openingHours?: string;
  price?: string;
  mp3?: any;
  model?: any;
  hasAR: boolean;
  hasAudio: boolean;
  hasAI: boolean;
}

export type CategoryType =
  | 'Rzeźba'
  | 'Architektura'
  | 'Sakralny'
  | 'Muzeum'
  | 'Zabytek techniki';

// Mapowanie kategorii na ikony Ionicons
export const CATEGORY_ICONS: Record<CategoryType, string> = {
  Rzeźba: 'body-outline',
  Architektura: 'business-outline',
  Sakralny: 'home-outline',
  Muzeum: 'telescope-outline',
  'Zabytek techniki': 'cog-outline'
};

// Kolory kategorii
export const CATEGORY_COLORS: Record<CategoryType, string> = {
  Rzeźba: '#8B5CF6',
  Architektura: '#3B82F6',
  Sakralny: '#F59E0B',
  Muzeum: '#EC4899',
  'Zabytek techniki': '#10B981'
};

export const attractions: Attraction[] = [
  {
    id: '1',
    title: 'Rzeźba Łuczniczki',
    image: require('../../assets/lucznik.jpeg'),
    description:
      'Jeden z najbardziej rozpoznawalnych symboli Bydgoszczy. Smukła rzeźba dłuta Ferdinanda Lepckego, stojąca w parku Jana Kochanowskiego.',
    location: 'Park Kochanowskiego',
    coordinate: { latitude: 53.122853, longitude: 17.999333 },
    category: 'Rzeźba',
    yearBuilt: '1910',
    architect: 'Ferdinand Lepcke',
    funFacts: [
      'Oryginalna rzeźba znajduje się w Berlinie – bydgoska to odlew z 1910 roku',
      'Wysokość figury wraz z cokołem to ponad 3 metry',
      'Łuczniczka stała się oficjalnym symbolem miasta w latach 60. XX wieku',
      'Rzeźba przetrwała II wojnę światową ukryta przez mieszkańców'
    ],
    mp3: require('../../assets/audio/lucznik.mp3'),
    model: require('../../assets/models/lucznik2.glb'),
    hasAR: true,
    hasAudio: true,
    hasAI: true
  },
  {
    id: '2',
    title: 'Wioślarz "Na mecie"',
    image: require('../../assets/wioslarz.jpeg'),
    description:
      'Rzeźba usytuowana nad Brdą, upamiętniająca Teodora Kocerkę – wybitnego bydgoskiego wioślarza.',
    location: 'Wyspa Młyńska',
    coordinate: { latitude: 53.123425, longitude: 18.00199 },
    category: 'Rzeźba',
    yearBuilt: '2007',
    architect: 'Robert Sobociński',
    funFacts: [
      'Teodor Kocerka zdobył złoty medal na Olimpiadzie w Berlinie w 1936 roku',
      'Rzeźba waży ponad 300 kg i jest wykonana z brązu',
      'Bydgoszcz to "stolica polskiego wioślarstwa"',
      'Regaty na Brdzie organizowane są nieprzerwanie od 1881 roku'
    ],
    hasAR: false,
    hasAudio: false,
    hasAI: true
  },
  {
    id: '3',
    title: 'Śluza Miejska',
    image: require('../../assets/sluza.jpeg'),
    description:
      'Wybudowana podczas przebudowy Kanału Bydgoskiego (1908–1915). Część Szlaku zabytków hydrotechniki.',
    location: 'Kanał Bydgoski',
    coordinate: { latitude: 53.1221, longitude: 17.9945 },
    category: 'Zabytek techniki',
    yearBuilt: '1915',
    funFacts: [
      'Kanał Bydgoski to najstarszy czynny kanał w Polsce (1774)',
      'Śluza pokonuje różnicę poziomów wody wynoszącą 2,5 metra',
      'Rocznie przepływa przez nią około 3000 jednostek pływających',
      'Jest częścią międzynarodowej drogi wodnej E70'
    ],
    hasAR: false,
    hasAudio: false,
    hasAI: true
  },
  {
    id: '4',
    title: 'Budynek Poczty Polskiej',
    image: require('../../assets/poczta.jpeg'),
    description:
      'Budynek nad Brdą przeznaczony na siedzibę poczty głównej po 1815 roku.',
    location: 'Stare Miasto',
    coordinate: { latitude: 53.1233, longitude: 18.0033 },
    category: 'Architektura',
    yearBuilt: '1885',
    funFacts: [
      'To jeden z najstarszych budynków pocztowych w Polsce wciąż pełniący swoją funkcję',
      'Fasada łączy elementy neogotyku i neorenesansu',
      'W czasach zaborów był głównym węzłem pocztowym Prus Zachodnich',
      'Budynek przetrwał obie wojny światowe niemal nienaruszony'
    ],
    model: require('../../assets/models/poczta.glb'),
    mp3: require('../../assets/audio/poczta.mp3'),
    hasAR: true,
    hasAudio: true,
    hasAI: true
  },
  {
    id: '5',
    title: 'Wieża Ciśnień',
    image: require('../../assets/cisnienie.jpeg'),
    description:
      'Obiekt Muzeum Wodociągów z ekspozycją o dziejach wodociągów. Posiada taras widokowy.',
    location: 'Wzgórze Dąbrowskiego',
    coordinate: { latitude: 53.119444, longitude: 17.990278 },
    category: 'Muzeum',
    yearBuilt: '1900',
    architect: 'Heinrich Seeling',
    funFacts: [
      'Wysokość wieży to 45 metrów – z tarasu widać całą panoramę miasta',
      'Zbiornik mieścił 2000 m³ wody',
      'Jest jedną z najlepiej zachowanych wież ciśnień w Polsce',
      'Nocą wieża jest podświetlana'
    ],
    openingHours: 'Wt-Nd: 10:00-18:00',
    price: '15 zł / 10 zł',
    mp3: require('../../assets/audio/wiezacisnien.mp3'),
    model: require('../../assets/models/wiezacisnien.glb'),
    hasAR: true,
    hasAudio: true,
    hasAI: true
  },
  {
    id: '6',
    title: 'Kościół Klarysek',
    image: require('../../assets/kosciol.jpeg'),
    description:
      'Gotycko-renesansowa świątynia (1582-1618) z polichromowanym, kasetonowym stropem.',
    location: 'Śródmieście',
    coordinate: { latitude: 53.124319, longitude: 18.003008 },
    category: 'Sakralny',
    yearBuilt: '1618',
    funFacts: [
      'Kasetonowy strop składa się z 117 malowanych pól z XVII wieku',
      'Klasztor klarysek był jednym z najbogatszych w Rzeczypospolitej',
      'W kościele znajduje się cudowny obraz Matki Bożej Bydgoskiej z 1467 roku',
      'Budowla przetrwała "potop szwedzki"'
    ],
    openingHours: 'Codziennie: 6:00-19:00',
    hasAR: false,
    hasAudio: false,
    hasAI: true
  },
  {
    id: '7',
    title: 'Ratusz Bydgoski',
    image: require('../../assets/ratusz.jpeg'),
    description:
      'Budynek o blisko 400-letniej historii. Wzniesiony w latach 1644-1653 jako Kolegium Jezuickie.',
    location: 'Stary Rynek',
    coordinate: { latitude: 53.121944, longitude: 17.998889 },
    category: 'Architektura',
    yearBuilt: '1653',
    funFacts: [
      'Pierwotnie był siedzibą jezuitów, ratuszem stał się w 1773 roku',
      'Fasada w stylu baroku niderlandzkiego jest unikatowa w tej części Polski',
      'Z wieży codziennie o 13:00 grany jest hejnał miejski',
      'W piwnicach zachowały się oryginalne sklepienia z XVII wieku'
    ],
    openingHours: 'Pn-Pt: 8:00-16:00',
    hasAR: false,
    hasAudio: false,
    hasAI: true
  },
  {
    id: '8',
    title: 'Kościół Garnizonowy',
    image: require('../../assets/garnizon.jpeg'),
    description:
      'Dawniej kościół oo. bernardynów. Ukończony w stylu późnogotyckim w 1557 roku.',
    location: 'Śródmieście',
    coordinate: { latitude: 53.119722, longitude: 18.006944 },
    category: 'Sakralny',
    yearBuilt: '1557',
    funFacts: [
      'To najstarszy zachowany kościół w Bydgoszczy',
      'Gotyckie sklepienie gwiaździste jest dziełem mistrza toruńskiego',
      'Podczas II wojny światowej kościół służył jako magazyn',
      'W krypcie pochowani są polscy żołnierze'
    ],
    openingHours: 'Codziennie: 7:00-18:00',
    hasAR: false,
    hasAudio: false,
    hasAI: true
  },
  {
    id: '9',
    title: 'Fontanna Potop',
    image: require('../../assets/fontanna.jpeg'),
    description:
      'Monumentalna fontanna przedstawiająca biblijną scenę Potopu. Zrekonstruowana w 2014 roku.',
    location: 'Park Kazimierza Wielkiego',
    coordinate: { latitude: 53.120778, longitude: 18.00025 },
    category: 'Rzeźba',
    yearBuilt: '1904',
    architect: 'Ferdinand Lepcke',
    funFacts: [
      'Oryginalna fontanna została zniszczona podczas II wojny światowej',
      'Rekonstrukcja kosztowała ponad 2 miliony złotych',
      'Przedstawia scenę z Księgi Rodzaju',
      'Jest jedną z największych fontann figuralnych w Polsce'
    ],
    hasAR: false,
    hasAudio: false,
    hasAI: true
  },
  {
    id: '10',
    title: 'Hala Targowa',
    image: require('../../assets/hala.jpeg'),
    description:
      'Zabytkowy obiekt handlowy łączący cechy neogotyku i modernizmu. Obecnie food hall.',
    location: 'Stare Miasto',
    coordinate: { latitude: 53.1235, longitude: 18.002 },
    category: 'Architektura',
    yearBuilt: '1906',
    architect: 'Heinrich Seeling',
    funFacts: [
      'Stalowa konstrukcja dachu waży ponad 200 ton',
      'W latach świetności handlowało tu ponad 100 kupców',
      'Po rewitalizacji w 2016 r. stała się food hallem',
      'Witraże w oknach są replikami oryginalnych z początku XX wieku'
    ],
    openingHours: 'Pn-Sb: 10:00-22:00, Nd: 10:00-20:00',
    hasAR: false,
    hasAudio: false,
    hasAI: true
  }
];

// Helper do liczenia atrakcji z AR
export const getARCount = () => attractions.filter(a => a.model).length;
export const getAudioCount = () => attractions.filter(a => a.hasAudio).length;
