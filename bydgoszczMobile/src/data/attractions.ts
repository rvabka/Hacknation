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
    title: 'Zamek Lubelski',
    image: require('../../assets/lucznik.jpeg'),
    description:
      'Dawna siedziba królewska i trybunał koronny. Obecnie mieści Muzeum Lubelskie z bogatą kolekcją malarstwa i rzemiosła artystycznego.',
    location: 'Wzgórze Zamkowe',
    coordinate: { latitude: 51.2500, longitude: 22.5722 },
    category: 'Muzeum',
    yearBuilt: 'XIV w.',
    funFacts: [
      'W kaplicy zamkowej znajdują się **unikalne freski rusko-bizantyjskie** z 1418 roku.',
      'Zamek służył jako więzienie w czasach zaborów — przetrzymywano tu więźniów politycznych.',
      'Z wieży zamkowej rozciąga się panorama na całe Stare Miasto.',
      'To tutaj podpisano Unię Lubelską w 1569 roku — jeden z najważniejszych aktów w historii Polski.'
    ],
    openingHours: 'Wt-Nd: 9:00-16:00',
    price: '15 zł / 10 zł',
    mp3: require('../../assets/audio/lucznik.mp3'),
    model: require('../../assets/models/lucznik2.glb'),
    hasAR: true,
    hasAudio: true,
    hasAI: true
  },
  {
    id: '2',
    title: 'Brama Krakowska',
    image: require('../../assets/wioslarz.jpeg'),
    description:
      'Gotycka brama miejska z XIV wieku, symbol Lublina. Stanowi główne wejście na Stare Miasto i mieści Muzeum Historii Miasta Lublina.',
    location: 'Stare Miasto',
    coordinate: { latitude: 51.2481, longitude: 22.5656 },
    category: 'Architektura',
    yearBuilt: '1341',
    funFacts: [
      'Brama była częścią średniowiecznych fortyfikacji miejskich — jedyna zachowana brama wjazdowa.',
      'Na szczycie wieży mieści się **taras widokowy** z panoramą miasta.',
      'Trąbka grana z wieży o godz. 12:00 to tradycja sięgająca XIX wieku.',
      'Brama przetrwała liczne oblężenia i pożary, zachowując gotycki charakter.'
    ],
    hasAR: false,
    hasAudio: false,
    hasAI: true
  },
  {
    id: '3',
    title: 'Katedra Lubelska',
    image: require('../../assets/sluza.jpeg'),
    description:
      'Barokowa katedra z XVI wieku, jedna z najwspanialszych świątyń w Polsce. Słynie z unikatowych fresków Józefa Meyera.',
    location: 'Plac Katedralny',
    coordinate: { latitude: 51.2469, longitude: 22.5653 },
    category: 'Sakralny',
    yearBuilt: '1592',
    architect: 'Jan Maria Bernardoni',
    funFacts: [
      'Freski w technice **trompe-l\'oeil** autorstwa Józefa Meyera tworzą iluzję trójwymiarowej przestrzeni.',
      'Skarbiec katedralny kryje bezcenne relikwie i naczynia liturgiczne.',
      'Katedra była pierwszym kościołem jezuickim w Polsce.',
      'Akustyczna Szeptucha — szept przy ścianie jest słyszalny po przeciwnej stronie nawy.'
    ],
    openingHours: 'Codziennie: 6:00-19:00',
    hasAR: false,
    hasAudio: false,
    hasAI: true
  },
  {
    id: '4',
    title: 'Stare Miasto',
    image: require('../../assets/poczta.jpeg'),
    description:
      'Malownicze uliczki i kamienice z XV-XVIII wieku. Serce historycznego Lublina z licznymi kawiarniami, galeriami i rzemieślniczymi warsztatami.',
    location: 'Stare Miasto',
    coordinate: { latitude: 51.2486, longitude: 22.5678 },
    category: 'Architektura',
    yearBuilt: 'XV w.',
    funFacts: [
      'Pod Starym Miastem biegnie **Lubelski Podziemny Szlak** — trasa turystyczna w dawnych piwnicach kupieckich.',
      'Rynek Starego Miasta to jedno z najlepiej zachowanych średniowiecznych założeń urbanistycznych w Polsce.',
      'Na fasadach kamienic zachowały się oryginalne renesansowe sgraffita i attyki.',
      'W średniowieczu Lublin był jednym z najważniejszych miast handlowych na szlaku wschód-zachód.'
    ],
    model: require('../../assets/models/poczta.glb'),
    mp3: require('../../assets/audio/poczta.mp3'),
    hasAR: true,
    hasAudio: true,
    hasAI: true
  },
  {
    id: '5',
    title: 'Plac Litewski',
    image: require('../../assets/cisnienie.jpeg'),
    description:
      'Największy plac w centrum Lublina z multimedialnymi fontannami. Miejsce upamiętniające Unię Lubelską z 1569 roku.',
    location: 'Śródmieście',
    coordinate: { latitude: 51.2467, longitude: 22.5600 },
    category: 'Architektura',
    yearBuilt: 'XVIII w.',
    funFacts: [
      'Multimedialne fontanny oferują **pokazy wodno-świetlne** w sezonie letnim.',
      'Na placu stoi Pomnik Unii Lubelskiej wzniesiony w 1826 roku.',
      'Plac przeszedł gruntowną rewitalizację w 2017 roku za ponad 60 mln zł.',
      'To popularne miejsce spotkań mieszkańców i wydarzeń kulturalnych.'
    ],
    mp3: require('../../assets/audio/wiezacisnien.mp3'),
    model: require('../../assets/models/wieza.glb'),
    hasAR: true,
    hasAudio: true,
    hasAI: true
  },
  {
    id: '6',
    title: 'Kościół Dominikanów',
    image: require('../../assets/kosciol.jpeg'),
    description:
      'Gotycko-renesansowy kościół z XIV wieku z bogatym barokowym wnętrzem. Jedna z najstarszych świątyń w Lublinie.',
    location: 'Stare Miasto',
    coordinate: { latitude: 51.2489, longitude: 22.5696 },
    category: 'Sakralny',
    yearBuilt: '1342',
    funFacts: [
      'W kościele znajduje się **cudowny obraz Matki Boskiej z Pożaru** z XVII wieku.',
      'Kaplice boczne zdobią dzieła wybitnych artystów epoki baroku.',
      'Klasztor dominikanów w Lublinie to jeden z najstarszych w Polsce.',
      'Pod kościołem zachowały się gotyckie krypty z pochówkami zakonników.'
    ],
    openingHours: 'Codziennie: 6:00-19:00',
    hasAR: false,
    hasAudio: false,
    hasAI: true
  },
  {
    id: '7',
    title: 'Trybunał Koronny',
    image: require('../../assets/ratusz.jpeg'),
    description:
      'Renesansowy budynek na Rynku Starego Miasta, dawna siedziba Trybunału Koronnego Małopolski. Obecnie muzeum.',
    location: 'Rynek Starego Miasta',
    coordinate: { latitude: 51.2487, longitude: 22.5681 },
    category: 'Architektura',
    yearBuilt: '1578',
    funFacts: [
      'Trybunał Koronny był najwyższym sądem apelacyjnym Rzeczypospolitej Obojga Narodów.',
      'Na fasadzie budynku zachowały się **oryginalne renesansowe detale architektoniczne**.',
      'W piwnicach mieści się wystawa multimedialna poświęcona historii sądownictwa.',
      'budynek stanął na miejscu dawnego ratusza miejskiego.'
    ],
    openingHours: 'Wt-Nd: 9:00-16:00',
    hasAR: false,
    hasAudio: false,
    hasAI: true
  },
  {
    id: '8',
    title: 'Brama Grodzka',
    image: require('../../assets/garnizon.jpeg'),
    description:
      'Historyczna brama na granicy chrześcijańskiego i żydowskiego Lublina. Obecnie ośrodek kulturalny "Grodzka Gate – NN Theatre".',
    location: 'Stare Miasto',
    coordinate: { latitude: 51.2492, longitude: 22.5703 },
    category: 'Architektura',
    yearBuilt: 'XIV w.',
    funFacts: [
      'Bramę nazywano **„bramą między światami"** — łączyła dzielnicę chrześcijańską z żydowską.',
      'Ośrodek "Grodzka Gate" prowadzi projekty dokumentujące wielokulturową historię Lublina.',
      'W archiwum Bramy Grodzkiej znajdują się unikalne zbiory dotyczące zagłady lubelskich Żydów.',
      'Brama wielokrotnie zmieniała swój wygląd — obecna forma pochodzi z XVIII wieku.'
    ],
    openingHours: 'Pn-Pt: 9:00-17:00',
    hasAR: false,
    hasAudio: false,
    hasAI: true
  },
  {
    id: '9',
    title: 'Pomnik Unii Lubelskiej',
    image: require('../../assets/fontanna.jpeg'),
    description:
      'Obelisk upamiętniający podpisanie Unii Lubelskiej w 1569 roku. Jeden z najstarszych pomników w Polsce.',
    location: 'Plac Litewski',
    coordinate: { latitude: 51.2470, longitude: 22.5603 },
    category: 'Rzeźba',
    yearBuilt: '1826',
    funFacts: [
      'Pomnik wzniesiono z inicjatywy Stanisława Staszica ku czci unii polsko-litewskiej.',
      'Obelisk ma **ponad 10 metrów** wysokości i jest zwieńczony kulą ziemską z orłem.',
      'Unia Lubelska z 1569 roku stworzyła Rzeczpospolitą Obojga Narodów — jedno z największych państw Europy.',
      'Pomnik przetrwał zarówno zabory, jak i obie wojny światowe.'
    ],
    hasAR: false,
    hasAudio: false,
    hasAI: true
  },
  {
    id: '10',
    title: 'Centrum Spotkania Kultur',
    image: require('../../assets/hala.jpeg'),
    description:
      'Nowoczesna instytucja kultury w sercu Lublina. Mieści teatr, sale koncertowe, galerie sztuki i taras widokowy.',
    location: 'Śródmieście',
    coordinate: { latitude: 51.2453, longitude: 22.5583 },
    category: 'Architektura',
    yearBuilt: '2016',
    architect: 'Bolesław Stelmach',
    funFacts: [
      'Budynek powstał na fundamentach **nieukończonego teatru** z lat 80. XX wieku.',
      'Z tarasu widokowego na dachu rozciąga się panorama na Stare Miasto i Zamek.',
      'Centrum jest jedną z największych instytucji kultury we wschodniej Polsce.',
      'Fasada budynku została zaprojektowana z myślą o grze światła i cienia.'
    ],
    openingHours: 'Pn-Nd: 10:00-20:00',
    hasAR: false,
    hasAudio: false,
    hasAI: true
  }
];

export const getARCount = () => attractions.filter(a => a.model).length;
export const getAudioCount = () => attractions.filter(a => a.hasAudio).length;
