export interface Attraction {
  id: string;
  title: string;
  description: string;
  rating: number;
  location: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  image?: string;
  category?: string;
  openingHours?: string;
  price?: string;
  website?: string;
  phone?: string;
}

export const attractions: Attraction[] = [
  {
    id: '1',
    title: 'Katedra Bydgoska św. Marcina i Mikołaja',
    image: '',
    description:
      'Najstarszy kościół i budynek w Bydgoszczy, wzniesiony w latach 1466-1502. Posiada starsze fragmenty ściany północnej.',
    rating: 4.6,
    location: 'Stary Rynek',
    coordinate: {
      latitude: 53.122853, // 53°07′22,27″N
      longitude: 17.999333 // 17°59′57,60″E
    }
  },
  {
    id: '2',
    title: 'Spichrze nad Brdą',
    image: '',
    description:
      'Niemal jak herb miasta, odwieczne logo Bydgoszczy. Pełniły ważną funkcję ze względu na położenie Bydgoszczy nad rzeką.',
    rating: 4.7,
    location: 'Nad Brdą',
    coordinate: {
      latitude: 53.123425, // 53°7'24.33"N
      longitude: 18.00199 // 18°0'7.25"E
    }
  },
  {
    id: '3',
    title: 'Śluza miejska',
    image: '',
    description:
      'Wybudowana podczas przebudowy Kanału Bydgoskiego (1908–1915). Jednokomorowa, dokowa, część Szlaku zabytków hydrotechniki.',
    rating: 4.5,
    location: 'Kanał Bydgoski',
    coordinate: {
      latitude: 53.1221, // Przybliżona lokalizacja
      longitude: 17.9945 // Przybliżona lokalizacja
    }
  },
  {
    id: '4',
    title: 'Budynek Poczty Polskiej',
    image: '',
    description:
      'Budynek nad Brdą, który przeznaczono na siedzibę poczty głównej po 1815 roku. Najstarsze informacje o poczcie królewskiej w Bydgoszczy pochodzą z I połowy XVIII w.',
    rating: 4.0,
    location: 'Nad Brdą',
    coordinate: {
      latitude: 53.1233,
      longitude: 18.0033
    }
  },
  {
    id: '5',
    title: 'Wieża ciśnień',
    image: '',
    description:
      'Obiekt Muzeum Wodociągów z ekspozycją o dziejach wodociągów i kanalizacji. Posiada taras widokowy z panoramą Bydgoszczy.',
    rating: 4.7,
    location: 'Wzgórze Dąbrowskiego',
    coordinate: {
      latitude: 53.119444, // 53°07′10″N
      longitude: 17.990278 // 17°59′25″E
    }
  },
  {
    id: '6',
    title: 'Kościół pw. Wniebowzięcia NMP (Kościół Klarysek)',
    image: '',
    description:
      'Jeden z najbardziej charakterystycznych obiektów. Gotycko-renesansowa świątynia (1582-1618) z polichromowanym, kasetonowym stropem.',
    rating: 4.6,
    location: 'Śródmieście',
    coordinate: {
      latitude: 53.124319, // 53°07′27,55″N
      longitude: 18.003008 // 18°00′10,73″E
    }
  },
  {
    id: '7',
    title: 'Bydgoski Ratusz',
    image: '',
    description:
      'Budynek ma blisko 400-letnią historię. Wzniesiony w latach 1644-1653 jako Kolegium Jezuickie.',
    rating: 4.3,
    location: 'Stary Rynek',
    coordinate: {
      latitude: 53.121944, // 53°07′19″N
      longitude: 17.998889 // 17°59′56″E
    }
  },
  {
    id: '8',
    title: 'Kościół garnizonowy pw. NMP Królowej Pokoju',
    image: '',
    description:
      'Dawniej kościół oo. bernardynów. Początek budowy około 1480 roku, ukończony w stylu późnogotyckim w 1557 roku po pożarze.',
    rating: 4.5,
    location: 'Śródmieście',
    coordinate: {
      latitude: 53.119722, // 53°07′11″N
      longitude: 18.006944 // 18°00′25″E
    }
  },
  {
    id: '9',
    title: 'Ulica Długa',
    image: '',
    description:
      'Spacer wśród stylowych kamieniczek głównie z końca XVIII w. i początku XIX w. Niegdyś kupiecka arteria miasta.',
    rating: 4.2,
    location: 'Stare Miasto',
    coordinate: {
      latitude: 53.120778, // 53°07′14,8″N
      longitude: 18.00025 // 18°00′00,9″E
    }
  },
  {
    id: '10',
    title: 'Makieta dawnej Bydgoszczy',
    image: '',
    description:
      'Makieta Bydgoszczy z dawnych wieków znajdująca się przed głównym wejściem do Muzeum Okręgowego (Spichrzy).',
    rating: 4.4,
    location: 'Spichrze (Muzeum Okręgowe)',
    coordinate: {
      latitude: 53.1235,
      longitude: 18.002
    }
  },
  {
    id: '11',
    title: 'Czerwony Spichrz',
    image: '',
    description:
      'Powstał w 1861 roku jako Młyn Camphausa. Obecnie mieści się tu Galeria Sztuki Nowoczesnej Muzeum Okręgowego.',
    rating: 4.6,
    location: 'Wyspa Młyńska',
    coordinate: {
      latitude: 53.1232, // Przybliżona lokalizacja
      longitude: 17.9972 // Przybliżona lokalizacja
    }
  },
  {
    id: '12',
    title: 'Biały Spichrz',
    image: '',
    description:
      'Powstał po 1789 roku jako spichrz przeładunkowy. Obecnie przeznaczony na zbiory archeologiczne Muzeum Okręgowego.',
    rating: 4.5,
    location: 'Wyspa Młyńska',
    coordinate: {
      latitude: 53.123232, // 53° 07′ 23,64″ N
      longitude: 17.997741 // 17° 59′ 51,87″ E
    }
  },
  {
    id: '13',
    title: 'Hala Targowa',
    image: '',
    description:
      'Wzniesiona w 1904 roku w stylu neogotycko-modernistycznym. Charakterystyczne wejście z dwiema wieżyczkami i herbem miasta.',
    rating: 4.3,
    location: 'Śródmieście',
    coordinate: {
      latitude: 53.121389, // 53°07′17″N
      longitude: 18.002222 // 18°00′08″E
    }
  },
  {
    id: '14',
    title: 'Bazylika Mniejsza św. Wincentego à Paulo',
    image: '',
    description:
      'Największa świątynia w Bydgoszczy i jedna z największych w Polsce. Wzniesiona w latach 1925-1939 na wzór rzymskiego Panteonu.',
    rating: 4.8,
    location: 'Śródmieście',
    coordinate: {
      latitude: 53.126667, // 53°07′36″N
      longitude: 18.016944 // 18°01′01″E
    }
  },
  {
    id: '15',
    title: 'Rzeźba Łuczniczki',
    image: '',
    description: 'Ikoniczna rzeźba Bydgoszczy.',
    rating: 4.9,
    location: 'Park im. Jana Kochanowskiego',
    coordinate: {
      latitude: 53.130556, // 53°07′50″N
      longitude: 18.012222 // 18°00′44″E
    }
  },
  {
    id: '16',
    title: 'Mistrz Twardowski',
    image: '',
    description: 'Element Szlaku Figur w Bydgoszczy.',
    rating: 4.7,
    location: 'Stary Rynek 15',
    coordinate: {
      latitude: 53.121667, // 53°07′18″N
      longitude: 18.000833 // 18°00′03″E
    }
  },
  {
    id: '17',
    title: 'Wioślarz "Na mecie"',
    image: '',
    description: 'Rzeźba upamiętniająca tradycje wioślarskie Bydgoszczy.',
    rating: 4.4,
    location: 'Nad Brdą',
    coordinate: {
      latitude: 53.1238, // Przybliżona lokalizacja
      longitude: 18.0055 // Przybliżona lokalizacja
    }
  },
  {
    id: '18',
    title: 'Oko',
    image: '',
    description: 'Rzeźba lub instalacja artystyczna w przestrzeni miejskiej.',
    rating: 4.0,
    location: 'Bydgoszcz',
    coordinate: {
      latitude: 53.135767, // Przybliżona lokalizacja
      longitude: 17.983636 // Przybliżona lokalizacja
    }
  },
  {
    id: '19',
    title: 'Wikliniarka',
    image: '',
    description: 'Rzeźba nawiązująca do rzemiosła lub tradycji regionu.',
    rating: 4.1,
    location: 'Bydgoszcz',
    coordinate: {
      latitude: 53.1228, // Przybliżona lokalizacja ul. Jatki
      longitude: 18.0005 // Przybliżona lokalizacja ul. Jatki
    }
  },
  {
    id: '20',
    title: 'Zegar z czasem bydgoskim',
    image: '',
    description:
      'Charakterystyczny element architektoniczny lub instalacja na Starym Rynku.',
    rating: 4.5,
    location: 'ul. Stary Rynek 1',
    coordinate: {
      latitude: 53.122, // 53°07′19,2″N (Stary Rynek)
      longitude: 18.0 // 18°00′00,0″E (Stary Rynek)
    }
  },
  {
    id: '21',
    title: 'Przechodzący przez Rzekę',
    image: '',
    description:
      'Dynamiczna rzeźba "Przechodzący przez rzekę" (inaczej "Balansujący na linie") - symbol Bydgoszczy.',
    rating: 4.8,
    location: 'Mostowa',
    coordinate: {
      latitude: 53.123056, // 53°07′23″N
      longitude: 18.001389 // 18°00′05″E
    }
  },
  {
    id: '22',
    title: 'Fontanna Potop',
    image: '',
    description:
      'Zrekonstruowana monumentalna fontanna w Parku Kazimierza Wielkiego.',
    rating: 4.7,
    location: 'Park im. Kazimierza Wielkiego',
    coordinate: {
      latitude: 53.126111, // 53°07′34″N
      longitude: 18.005556 // 18°00′20″E
    }
  },
  {
    id: '23',
    title: 'Pomnik Kopernika',
    image: '',
    description: 'Pomnik Mikołaja Kopernika.',
    rating: 4.3,
    location: 'Skwer przy ul. Kopernika',
    coordinate: {
      latitude: 53.1215, // Przybliżona lokalizacja
      longitude: 18.0085 // Przybliżona lokalizacja
    }
  }
];
