import { ImageSourcePropType } from 'react-native';

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
  // FIX: Typ 'any' akceptuje require(...) oraz URL
  image?: any; 
  category?: string;
  openingHours?: string;
  price?: string;
  website?: string;
  phone?: string;
}

export const attractions: Attraction[] = [
  {
    id: '1',
    title: 'Rzeźba Łuczniczki',
    image: require('../../assets/lucznik.jpeg'),
    description:
      'Jeden z najbardziej rozpoznawalnych symboli Bydgoszczy. Smukła rzeźba dłuta Ferdinanda Lepckego, stojąca w parku Jana Kochanowskiego, zachwyca elegancją i proporcjami.',
    rating: 4.6,
    location: 'Stary Rynek', // Uwaga: w Twoim kodzie było Stary Rynek, choć fizycznie jest w Parku Kochanowskiego, ale nie zmieniałem location zgodnie z prośbą o zmianę TYLKO description
    coordinate: {
      latitude: 53.122853,
      longitude: 17.999333
    }
  },
  {
    id: '2',
    title: 'Wioślarz "Na mecie"',
    image: require('../../assets/wioslarz.jpeg'),
    description:
      'Rzeźba usytuowana nad Brdą, upamiętniająca Teodora Kocerkę – wybitnego bydgoskiego wioślarza. Symbolizuje bogate tradycje sportów wodnych w mieście.',
    rating: 4.7,
    location: 'Nad Brdą',
    coordinate: {
      latitude: 53.123425,
      longitude: 18.00199
    }
  },
  {
    id: '3',
    title: 'Śluza miejska',
    image: require('../../assets/sluza.jpeg'),
    description:
      'Wybudowana podczas przebudowy Kanału Bydgoskiego (1908–1915). Jednokomorowa, dokowa, część Szlaku zabytków hydrotechniki.',
    rating: 4.5,
    location: 'Kanał Bydgoski',
    coordinate: {
      latitude: 53.1221,
      longitude: 17.9945
    }
  },
  {
    id: '4',
    title: 'Budynek Poczty Polskiej',
    image: require('../../assets/poczta.jpeg'),
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
    image: require('../../assets/cisnienie.jpeg'),
    description:
      'Obiekt Muzeum Wodociągów z ekspozycją o dziejach wodociągów i kanalizacji. Posiada taras widokowy z panoramą Bydgoszczy.',
    rating: 4.7,
    location: 'Wzgórze Dąbrowskiego',
    coordinate: {
      latitude: 53.119444,
      longitude: 17.990278
    }
  },
  {
    id: '6',
    title: 'Kościół pw. Wniebowzięcia NMP (Kościół Klarysek)',
    image: require('../../assets/kosciol.jpeg'),
    description:
      'Jeden z najbardziej charakterystycznych obiektów. Gotycko-renesansowa świątynia (1582-1618) z polichromowanym, kasetonowym stropem.',
    rating: 4.6,
    location: 'Śródmieście',
    coordinate: {
      latitude: 53.124319,
      longitude: 18.003008
    }
  },
  {
    id: '7',
    title: 'Bydgoski Ratusz',
    image: require('../../assets/ratusz.jpeg'),
    description:
      'Budynek ma blisko 400-letnią historię. Wzniesiony w latach 1644-1653 jako Kolegium Jezuickie.',
    rating: 4.3,
    location: 'Stary Rynek',
    coordinate: {
      latitude: 53.121944,
      longitude: 17.998889
    }
  },
  {
    id: '8',
    title: 'Kościół garnizonowy pw. NMP Królowej Pokoju',
    image: require('../../assets/garnizon.jpeg'),
    description:
      'Dawniej kościół oo. bernardynów. Początek budowy około 1480 roku, ukończony w stylu późnogotyckim w 1557 roku po pożarze.',
    rating: 4.5,
    location: 'Śródmieście',
    coordinate: {
      latitude: 53.119722,
      longitude: 18.006944
    }
  },
  {
    id: '9',
    title: 'Fontanna Potop',
    image: require('../../assets/fontanna.jpeg'),
    description:
      'Monumentalna, wielopostaciowa fontanna w Parku Kazimierza Wielkiego, przedstawiająca biblijną scenę Potopu. Zrekonstruowana z pietyzmem, stanowi ozdobę bydgoskiego śródmieścia.',
    rating: 4.2,
    location: 'Stare Miasto',
    coordinate: {
      latitude: 53.120778,
      longitude: 18.00025
    }
  },
  {
    id: '10',
    title: 'Hala Targowa',
    image: require('../../assets/hala.jpeg'),
    description:
      'Zabytkowy obiekt handlowy o charakterystycznej architekturze, łączący cechy neogotyku i modernizmu. Po rewitalizacji pełni funkcję przestrzeni gastronomiczno-kulturalnej.',
    rating: 4.4,
    location: 'Spichrze (Muzeum Okręgowe)',
    coordinate: {
      latitude: 53.1235,
      longitude: 18.002
    }
  }
];