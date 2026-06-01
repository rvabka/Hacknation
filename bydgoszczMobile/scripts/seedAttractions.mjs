// Pobiera atrakcje Lublina z OpenStreetMap (Overpass API) + Wikipedia,
// zapisuje do tabeli `attractions` w Supabase.
//
// Uruchomienie:  node scripts/seedAttractions.mjs
// Wymaga Node 18+ (wbudowany fetch) i kluczy Supabase w .env

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// === Załaduj .env ręcznie ===
try {
  const envText = readFileSync(resolve(__dirname, '../.env'), 'utf-8');
  for (const raw of envText.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim();
    if (key && !process.env[key]) process.env[key] = val;
  }
} catch {
  console.warn('[seed] Nie znaleziono .env – używam zmiennych środowiskowych');
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[seed] Brak EXPO_PUBLIC_SUPABASE_URL lub *_ANON_KEY w .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// === Konfiguracja ===
const OVERPASS_URLS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://z.overpass-api.de/api/interpreter'
];
const LUBLIN_BBOX = '51.18,22.45,51.30,22.65';

const overpassQuery = `
[out:json][timeout:60];
(
  node["tourism"~"attraction|museum|artwork|gallery|viewpoint"]["name"](${LUBLIN_BBOX});
  way["tourism"~"attraction|museum|artwork|gallery|viewpoint"]["name"](${LUBLIN_BBOX});
  node["historic"]["name"](${LUBLIN_BBOX});
  way["historic"]["name"](${LUBLIN_BBOX});
  node["amenity"="place_of_worship"]["name"](${LUBLIN_BBOX});
  way["amenity"="place_of_worship"]["name"](${LUBLIN_BBOX});
);
out center 250;
`;

// === Czytelna nazwa typu OSM (dla syntetycznego opisu gdy brak Wiki) ===
function osmTypeLabel(tags) {
  const t = tags || {};
  if (t.tourism === 'museum') return 'muzeum';
  if (t.tourism === 'artwork') return 'instalacja artystyczna';
  if (t.tourism === 'gallery') return 'galeria sztuki';
  if (t.tourism === 'viewpoint') return 'punkt widokowy';
  if (t.tourism === 'attraction') return 'atrakcja turystyczna';
  if (t.amenity === 'place_of_worship') return 'obiekt sakralny';
  if (t.historic === 'church') return 'zabytkowy kościół';
  if (t.historic === 'chapel') return 'kaplica';
  if (t.historic === 'monastery') return 'klasztor';
  if (t.historic === 'castle') return 'zamek';
  if (t.historic === 'monument') return 'pomnik';
  if (t.historic === 'memorial') return 'miejsce pamięci';
  if (t.historic === 'statue') return 'rzeźba';
  if (t.historic === 'tower') return 'wieża';
  if (t.historic === 'gate') return 'brama miejska';
  if (t.historic === 'ruins') return 'ruiny';
  if (t.historic === 'fort') return 'fortyfikacja';
  if (t.historic === 'building') return 'zabytkowy budynek';
  if (t.historic) return 'obiekt historyczny';
  return 'miejsce w Lublinie';
}

function generateSyntheticDescription(name, tags) {
  const typeLabel = osmTypeLabel(tags);
  const street = tags['addr:street'] || tags['addr:place'];
  const year = tags.start_date || tags['building:start_date'];
  const parts = [`${name} – ${typeLabel} w Lublinie.`];
  if (street) parts.push(`Znajduje się przy ${street}.`);
  if (year) parts.push(`Powstał(a) w ${year}.`);
  if (tags.architect) parts.push(`Architekt: ${tags.architect}.`);
  return parts.join(' ');
}

// === Whitelist: znane atrakcje Lublina z dokładnymi tytułami Wikipedii ===
// Klucz: znormalizowana nazwa OSM (lowercase, bez znaków diakrytycznych)
// Wartość: dokładny tytuł artykułu na pl.wikipedia.org
const FAMOUS_LANDMARKS_WIKI = {
  'zamek lubelski': 'Zamek w Lublinie',
  'brama krakowska': 'Brama Krakowska w Lublinie',
  'brama grodzka': 'Brama Grodzka w Lublinie',
  'katedra lubelska': 'Archikatedra św. Jana Chrzciciela i św. Jana Ewangelisty w Lublinie',
  'archikatedra lubelska': 'Archikatedra św. Jana Chrzciciela i św. Jana Ewangelisty w Lublinie',
  'plac litewski': 'Plac Litewski w Lublinie',
  'trybunal koronny': 'Trybunał Koronny w Lublinie',
  'trybunał koronny': 'Trybunał Koronny w Lublinie',
  'stare miasto': 'Stare Miasto w Lublinie',
  'pomnik unii lubelskiej': 'Pomnik Unii Lubelskiej w Lublinie',
  'centrum spotkania kultur': 'Centrum Spotkania Kultur w Lublinie',
  'kosciol dominikanow': 'Bazylika św. Stanisława w Lublinie',
  'kościół dominikanów': 'Bazylika św. Stanisława w Lublinie',
  'bazylika dominikanow': 'Bazylika św. Stanisława w Lublinie',
  'wieża trynitarska': 'Wieża Trynitarska w Lublinie',
  'wieza trynitarska': 'Wieża Trynitarska w Lublinie',
  'ogród saski': 'Ogród Saski w Lublinie',
  'ogrod saski': 'Ogród Saski w Lublinie',
  'kul': 'Katolicki Uniwersytet Lubelski Jana Pawła II',
  'umcs': 'Uniwersytet Marii Curie-Skłodowskiej',
  'państwowe muzeum na majdanku': 'Państwowe Muzeum na Majdanku'
};

function normName(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// === Mapowanie kategorii OSM → CategoryType w aplikacji ===
function mapCategory(tags) {
  const t = tags || {};
  if (t.tourism === 'museum') return 'Muzeum';
  if (
    t.amenity === 'place_of_worship' ||
    t.historic === 'church' ||
    t.historic === 'chapel' ||
    t.historic === 'monastery'
  ) return 'Sakralny';
  if (
    t.tourism === 'artwork' ||
    t.historic === 'monument' ||
    t.historic === 'memorial' ||
    t.historic === 'statue'
  ) return 'Rzeźba';
  if (t.historic === 'industrial' || t.historic === 'manor' || t.man_made) {
    return 'Zabytek techniki';
  }
  return 'Architektura';
}

// === Helpery ===
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchOverpass() {
  console.log('[seed] Pobieranie atrakcji z Overpass...');
  let lastError = null;

  for (const url of OVERPASS_URLS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'User-Agent': 'lublin-explorer-seed/1.0'
        },
        body: 'data=' + encodeURIComponent(overpassQuery)
      });

      if (!res.ok) {
        const body = (await res.text()).slice(0, 180).replace(/\s+/g, ' ').trim();
        throw new Error(`HTTP ${res.status}${body ? `: ${body}` : ''}`);
      }

      const data = await res.json();
      return data.elements ?? [];
    } catch (err) {
      lastError = err;
      console.warn(`[seed] Overpass endpoint niedostępny: ${url} -> ${err.message}`);
    }
  }

  throw new Error(`Overpass failed on all endpoints: ${lastError?.message ?? 'unknown error'}`);
}

async function fetchWiki(title, lang = 'pl') {
  try {
    const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.type === 'disambiguation') return null;
    return data;
  } catch {
    return null;
  }
}

// === Gemini – wzbogacanie opisów i ciekawostek ===
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// Circuit breaker: po 3 fail w rzędzie wyłączamy Gemini do końca seedu
// (dzienny RPD już wyczerpany – nie ma sensu marnować 25s/retry).
let geminiConsecutiveFails = 0;
let geminiDisabled = false;

async function fetchGeminiEnrichment(name, category, tags, wikiExtract, mode = 'full', retries = 2) {
  if (!GEMINI_API_KEY || geminiDisabled) return null;

  const street = tags['addr:street'] || tags['addr:place'];
  const year = tags.start_date || tags['building:start_date'];
  const architect = tags.architect;

  const context = [
    `Atrakcja: ${name}`,
    `Kategoria: ${category}`,
    `Miasto: Lublin`,
    street && `Ulica: ${street}`,
    year && `Rok: ${year}`,
    architect && `Architekt: ${architect}`,
    wikiExtract && `Z Wikipedii: ${wikiExtract.slice(0, 500)}`
  ]
    .filter(Boolean)
    .join('\n');

  // Tryb facts_only: mamy już dobry opis z Wikipedii, prosimy tylko o ciekawostki.
  // Tryb full: brak opisu, generujemy opis + ciekawostki.
  const fullPrompt = `Jesteś przewodnikiem turystycznym po Lublinie. Na podstawie poniższych danych przygotuj treść dla turysty.

${context}

Wymagania:
- "description": 2-3 zdania, ciekawe i konkretne, ton zachęcający, max 350 znaków
- "funFacts": tablica 3 ciekawostek (po 1-2 zdania każda), unikalne fakty historyczne/kulturowe/architektoniczne, NIE powtarzaj opisu. Jeśli brak konkretów – wykorzystaj kontekst typu/kategorii i pisz wiarygodnie. Nie wymyślaj fałszywych faktów (dat, nazwisk).
- Odpowiedź WYŁĄCZNIE jako prawidłowy JSON, bez markdown/code fences.

Przykład formatu:
{"description":"...","funFacts":["...","...","..."]}`;

  const factsOnlyPrompt = `Jesteś przewodnikiem turystycznym po Lublinie. Na podstawie poniższych danych przygotuj 3 ciekawostki dla turysty.

${context}

Wymagania:
- "funFacts": tablica 3 ciekawostek (po 1-2 zdania każda), unikalne fakty historyczne/kulturowe/architektoniczne. Wybierz najbardziej intrygujące informacje z dostarczonego opisu Wikipedii i przedstaw je w sposób ciekawy dla turysty. Nie wymyślaj fałszywych faktów (dat, nazwisk).
- "description": MUSI być pustym stringiem (mamy własny opis z Wikipedii).
- Odpowiedź WYŁĄCZNIE jako prawidłowy JSON, bez markdown/code fences.

Format:
{"description":"","funFacts":["...","...","..."]}`;

  const prompt = mode === 'facts_only' ? factsOnlyPrompt : fullPrompt;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 600,
            responseMimeType: 'application/json'
          }
        })
      });

      if (res.status === 429) {
        if (attempt < retries) {
          const wait = 8000 * (attempt + 1);
          console.warn(`[gemini] 429, czekam ${wait}ms (próba ${attempt + 1}/${retries})`);
          await sleep(wait);
          continue;
        }
        geminiConsecutiveFails++;
        if (geminiConsecutiveFails >= 3) {
          geminiDisabled = true;
          console.warn('[gemini] 3 fail w rzędzie – wyłączam do końca seedu (RPD wyczerpany)');
        }
        return null;
      }

      if (!res.ok) {
        geminiConsecutiveFails++;
        if (geminiConsecutiveFails >= 3) geminiDisabled = true;
        return null;
      }
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        geminiConsecutiveFails++;
        return null;
      }

      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed?.funFacts)) {
        geminiConsecutiveFails++;
        return null;
      }
      const desc = String(parsed.description ?? '').trim();
      if (mode === 'full' && desc.length < 20) {
        geminiConsecutiveFails++;
        return null;
      }
      geminiConsecutiveFails = 0; // sukces – resetujemy licznik
      return {
        description: desc.slice(0, 600),
        funFacts: parsed.funFacts
          .filter(f => typeof f === 'string' && f.trim().length > 15)
          .map(f => f.trim().slice(0, 250))
          .slice(0, 5)
      };
    } catch (e) {
      if (attempt < retries) {
        await sleep(3000);
        continue;
      }
      geminiConsecutiveFails++;
      return null;
    }
  }
  return null;
}

// === Google Places API – główne źródło zdjęć ===
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY ?? '';
const GOOGLE_FIND_PLACE_URL =
  'https://maps.googleapis.com/maps/api/place/findplacefromtext/json';
const GOOGLE_PHOTO_URL = 'https://maps.googleapis.com/maps/api/place/photo';

// Typy Google które wykluczają miejsce z listy atrakcji turystycznych.
// Stacja paliw, restauracja, sklep itp. – chyba że jednocześnie ma typ turystyczny.
const COMMERCIAL_TYPES = new Set([
  'gas_station',
  'convenience_store',
  'supermarket',
  'grocery_or_supermarket',
  'restaurant',
  'cafe',
  'bar',
  'meal_takeaway',
  'meal_delivery',
  'bakery',
  'food',
  'clothing_store',
  'shoe_store',
  'department_store',
  'electronics_store',
  'furniture_store',
  'hardware_store',
  'home_goods_store',
  'jewelry_store',
  'book_store',
  'bicycle_store',
  'pet_store',
  'liquor_store',
  'shopping_mall',
  'store',
  'lodging',
  'bank',
  'atm',
  'finance',
  'insurance_agency',
  'real_estate_agency',
  'gym',
  'beauty_salon',
  'hair_care',
  'spa',
  'doctor',
  'dentist',
  'pharmacy',
  'veterinary_care',
  'physiotherapist',
  'transit_station',
  'bus_station',
  'subway_station',
  'taxi_stand',
  'parking',
  'car_rental',
  'car_repair',
  'car_dealer',
  'car_wash',
  'laundry',
  'post_office'
]);

// Typy które JEDNOZNACZNIE wskazują na atrakcję turystyczną.
// Obecność któregokolwiek "ratuje" miejsce nawet jeśli ma też tag commercial.
const TOURIST_TYPES = new Set([
  'tourist_attraction',
  'museum',
  'art_gallery',
  'church',
  'place_of_worship',
  'hindu_temple',
  'mosque',
  'synagogue',
  'cemetery',
  'amusement_park',
  'aquarium',
  'zoo',
  'park',
  'natural_feature',
  'campground',
  'stadium',
  'library',
  'university',
  'city_hall',
  'embassy',
  'courthouse',
  'landmark'
]);

function isCommercialOnly(types) {
  if (!Array.isArray(types) || types.length === 0) return false;
  const hasTourist = types.some(t => TOURIST_TYPES.has(t));
  if (hasTourist) return false;
  return types.some(t => COMMERCIAL_TYPES.has(t));
}

// Dystans w metrach (Haversine)
function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Wyszukuje miejsce po nazwie z bias na koordynaty OSM.
// Zwraca obiekt z place_id + photos + geometry LUB null gdy:
//  - brak API key
//  - nie znaleziono żadnego kandydata
//  - kandydat jest dalej niż 250m od OSM (prawdopodobnie zły obiekt)
async function fetchGooglePlace(name, lat, lon) {
  if (!GOOGLE_PLACES_API_KEY) return null;
  try {
    const params = new URLSearchParams({
      input: name,
      inputtype: 'textquery',
      fields: 'place_id,name,photos,geometry,types',
      locationbias: `circle:5000@${lat},${lon}`,
      language: 'pl',
      key: GOOGLE_PLACES_API_KEY
    });
    const res = await fetch(`${GOOGLE_FIND_PLACE_URL}?${params}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 'OK') return null;
    const cand = data.candidates?.[0];
    if (!cand) return null;

    const gLat = cand.geometry?.location?.lat;
    const gLng = cand.geometry?.location?.lng;
    if (gLat == null || gLng == null) return null;

    const distance = haversineMeters(lat, lon, gLat, gLng);
    if (distance > 250) return null; // dopasowanie geograficzne nieudane

    return cand;
  } catch {
    return null;
  }
}

function buildGooglePhotoUrl(photoRef, maxWidth = 800) {
  if (!photoRef || !GOOGLE_PLACES_API_KEY) return null;
  return `${GOOGLE_PHOTO_URL}?maxwidth=${maxWidth}&photoreference=${encodeURIComponent(photoRef)}&key=${GOOGLE_PLACES_API_KEY}`;
}

// Wikidata P18 (image property) → Wikimedia Commons URL
async function fetchWikidataImage(qid) {
  try {
    const url = `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) return null;
    const data = await res.json();
    const claims = data?.entities?.[qid]?.claims;
    const filename = claims?.P18?.[0]?.mainsnak?.datavalue?.value;
    if (!filename) return null;
    return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=800`;
  } catch {
    return null;
  }
}

// Wikipedia search (fuzzy) – znajduje stronę po przybliżonej nazwie + miasto.
// Wymaga, by zwrócony artykuł wspominał "Lublin" – inaczej fuzzy łapie np.
// dla nazwy "Aligator" artykuł o aligatorze-zwierzęciu.
async function fetchWikiBySearch(name) {
  try {
    const query = `${name} Lublin`;
    const url =
      `https://pl.wikipedia.org/w/api.php?` +
      new URLSearchParams({
        action: 'query',
        list: 'search',
        srsearch: query,
        srlimit: '3',
        format: 'json'
      });
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) return null;
    const data = await res.json();
    const hits = data?.query?.search ?? [];
    for (const hit of hits) {
      const wiki = await fetchWiki(hit.title, 'pl');
      const text = `${wiki?.title ?? ''} ${wiki?.extract ?? ''} ${wiki?.description ?? ''}`.toLowerCase();
      if (wiki && text.includes('lublin')) return wiki;
    }
    return null;
  } catch {
    return null;
  }
}

// STRICT MODE: tylko zaufane źródła zdjęć ŚCIŚLE związanych z atrakcją.
// Geosearch / Mapillary są wyłączone bo zwracają zdjęcia niezwiązane z obiektem.
const BLOCKED_IMAGE_HOSTS = [
  'photos.app.goo.gl',     // Google Photos share-linki (nie renderują się w <Image>)
  'photos.google.com',
  'drive.google.com',
  'facebook.com',
  'instagram.com'
];

function isUsableImageUrl(url) {
  if (!url || !/^https?:\/\//i.test(url)) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return !BLOCKED_IMAGE_HOSTS.some(b => host.endsWith(b));
  } catch {
    return false;
  }
}

async function resolveImageUrl(tags, wiki) {
  if (isUsableImageUrl(tags.image)) {
    return tags.image;
  }
  if (tags.wikidata && /^Q\d+$/.test(tags.wikidata)) {
    const img = await fetchWikidataImage(tags.wikidata);
    if (isUsableImageUrl(img)) return img;
  }
  const wikiImg = wiki?.originalimage?.source ?? wiki?.thumbnail?.source ?? null;
  return isUsableImageUrl(wikiImg) ? wikiImg : null;
}

// === Główna logika ===
async function main() {
  const elements = await fetchOverpass();
  console.log(`[seed] Znaleziono ${elements.length} elementów OSM`);

  const seenTitles = new Set();
  const rows = [];
  const allFacts = [];

  let processed = 0;
  let geminiSuccess = 0;
  let geminiFailed = 0;

  for (const el of elements) {
    processed++;
    if (processed % 25 === 0) console.log(`  ... ${processed}/${elements.length}`);

    const tags = el.tags || {};
    const name = tags['name:pl'] || tags.name;
    if (!name) continue;
    if (seenTitles.has(name.toLowerCase())) continue;

    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (lat == null || lon == null) continue;

    // === HYBRID MODE ===
    // Wymagamy ZDJĘCIA z dowolnego zaufanego źródła. Opis bierzemy z Wiki
    // jeśli istnieje, inaczej syntetyczny z OSM tagów.

    // 1. Google Places (priorytet – realne zdjęcia z Google Maps + walidacja >250m)
    const google = await fetchGooglePlace(name, lat, lon);
    await sleep(40);

    // Odrzuć miejsca komercyjne (stacje paliw, restauracje, sklepy) chyba że
    // jednocześnie są oznaczone jako atrakcja turystyczna/muzeum/zabytek.
    if (google && isCommercialOnly(google.types)) {
      continue;
    }

    // 2. Wikipedia – dla opisu. STRICT: tytuł musi zawierać "lublin" LUB
    // nazwa OSM musi być częścią tytułu Wiki (eliminuje "Aligator" → artykuł
    // o aligatorach-zwierzętach, "Dłoń" → anatomia, itp.)
    let wiki = null;
    const whitelistTitle = FAMOUS_LANDMARKS_WIKI[normName(name)];
    if (whitelistTitle) wiki = await fetchWiki(whitelistTitle, 'pl');
    if (!wiki && tags.wikipedia) {
      const [lang, title] = tags.wikipedia.split(':');
      if (lang && title) wiki = await fetchWiki(title, lang);
    }
    if (!wiki) wiki = await fetchWiki(name, 'pl');
    if (!wiki) wiki = await fetchWikiBySearch(name);
    await sleep(50);

    // STRICT walidacja Wiki: artykuł MUSI być jednoznacznie o Lublinie.
    // Akceptujemy tylko:
    //  a) tytuł zawiera "lublin" (np. "Brama Krakowska w Lublinie"), LUB
    //  b) OSM ma explicit tag `wikipedia`, LUB
    //  c) atrakcja jest na whitelist znanych obiektów
    // Sam wt === on NIE wystarcza – "Baobab" matchuje artykuł o drzewie
    // afrykańskim, "Józef Bem" - generała polskiego (nie pomnik w Lublinie).
    if (wiki) {
      const wt = normName(wiki.title ?? '');
      const titleMatchesLublin = wt.includes('lublin');
      const fromExplicitTag = !!tags.wikipedia || !!whitelistTitle;
      if (!titleMatchesLublin && !fromExplicitTag) {
        wiki = null;
      }
    }

    // 3. Zdjęcie główne + galeria: Google → OSM image → Wikidata → Wiki
    let imageUrl = null;
    const imageUrls = [];

    // Google daje zwykle 5-10 zdjęć per atrakcja – zachowujemy do 6 do galerii
    if (Array.isArray(google?.photos)) {
      for (const p of google.photos.slice(0, 6)) {
        const url = buildGooglePhotoUrl(p.photo_reference);
        if (url) imageUrls.push(url);
      }
      if (imageUrls.length > 0) imageUrl = imageUrls[0];
    }
    if (!imageUrl) {
      imageUrl = await resolveImageUrl(tags, wiki);
      if (imageUrl) imageUrls.push(imageUrl);
    }
    if (!imageUrl) continue; // bez zdjęcia – pomijamy

    // 4. Deduplikacja po Google place_id (kilka OSM elementów może mapować na to samo)
    if (google?.place_id) {
      if (seenTitles.has(`gpid:${google.place_id}`)) continue;
      seenTitles.add(`gpid:${google.place_id}`);
    }
    seenTitles.add(name.toLowerCase());

    const category = mapCategory(tags);

    // 5. Opis + ciekawostki
    //    Strategia oszczędzania quoty Gemini (250 RPD free tier):
    //    a) Atrakcja ma solidny Wiki extract (≥200 znaków, wspomina Lublin)
    //       → Wiki jest wystarczające, Gemini generuje TYLKO ciekawostki
    //    b) Brak dobrego Wiki → Gemini generuje opis + ciekawostki
    let description = '';
    let geminiFunFacts = [];

    const wikiExtract = (wiki?.extract ?? '').trim();
    const hasSolidWiki =
      wikiExtract.length >= 200 &&
      wikiExtract.toLowerCase().includes('lublin');

    const enrichment = await fetchGeminiEnrichment(
      name,
      category,
      tags,
      wikiExtract,
      hasSolidWiki ? 'facts_only' : 'full'
    );
    // Sleep tylko jeśli Gemini wciąż żywe – inaczej szkoda czasu
    if (!geminiDisabled) await sleep(6500);

    if (enrichment) {
      description = hasSolidWiki
        ? wikiExtract.slice(0, 600)
        : enrichment.description;
      geminiFunFacts = enrichment.funFacts;
      geminiSuccess++;
    } else {
      description = wikiExtract.slice(0, 600);
      if (description.length < 50) {
        description = generateSyntheticDescription(name, tags);
      }
      geminiFailed++;
    }

    const id = `${el.type}/${el.id}`;
    const wikipediaUrl =
      tags.wikipedia
        ? (() => {
            const [lang, title] = tags.wikipedia.split(':');
            return `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title)}`;
          })()
        : wiki?.content_urls?.desktop?.page ?? null;

    rows.push({
      id,
      title: name,
      description,
      location: tags['addr:street'] || tags['addr:place'] || 'Lublin',
      latitude: lat,
      longitude: lon,
      category,
      year_built: tags.start_date || tags['building:start_date'] || null,
      architect: tags.architect || null,
      opening_hours: tags.opening_hours || null,
      price: tags.fee === 'no' ? 'Wstęp bezpłatny' : null,
      image_url: imageUrl,
      image_urls: imageUrls,
      wikipedia_url: wikipediaUrl,
      has_ar: false,
      has_audio: false,
      has_ai: true,
      source: 'osm',
      source_id: String(el.id)
    });

    // Ciekawostki – preferuj Gemini, fallback na podział opisu po zdaniach
    const factsSource =
      geminiFunFacts.length > 0
        ? geminiFunFacts
        : description.split(/(?<=[.!?])\s+/).filter(s => s.length > 30).slice(0, 3);
    factsSource.forEach((sentence, i) => {
      allFacts.push({
        attraction_id: id,
        content: sentence.trim(),
        order_idx: i
      });
    });
  }

  if (rows.length === 0) {
    console.warn('[seed] Brak rekordów do zapisu');
    return;
  }

  // STRICT MODE: czyścimy całą tabelę przed re-seedem, żeby pozbyć się
  // starych "śmieciowych" rekordów (z syntetycznymi opisami i Mapillary).
  console.log('[seed] Czyszczę istniejące atrakcje (i powiązane fun_facts via FK CASCADE)...');
  const { error: delErr } = await supabase
    .from('attractions')
    .delete()
    .neq('id', '__never__'); // hack: warunek zawsze true (delete all)
  if (delErr) {
    console.error('[seed] Błąd czyszczenia attractions:', delErr);
    process.exit(1);
  }

  console.log(`[seed] Upsert ${rows.length} atrakcji do Supabase...`);

  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    const { error } = await supabase
      .from('attractions')
      .upsert(batch, { onConflict: 'id' });
    if (error) {
      console.error('[seed] Błąd upsertu attractions:', error);
      process.exit(1);
    }
  }

  console.log(`[seed] Upsert ${allFacts.length} ciekawostek...`);
  // Najpierw czyścimy stare fakty dla tych atrakcji
  const ids = rows.map(r => r.id);
  await supabase.from('fun_facts').delete().in('attraction_id', ids);

  for (let i = 0; i < allFacts.length; i += 100) {
    const batch = allFacts.slice(i, i + 100);
    const { error } = await supabase.from('fun_facts').insert(batch);
    if (error) {
      console.error('[seed] Błąd insertu fun_facts:', error);
      process.exit(1);
    }
  }

  console.log('[seed] ✓ Gotowe');
  console.log(`  attractions:    ${rows.length}`);
  console.log(`  fun_facts:      ${allFacts.length}`);
  console.log(`  gemini success: ${geminiSuccess}`);
  console.log(`  gemini failed:  ${geminiFailed}`);
}

main().catch((e) => {
  console.error('[seed] Błąd:', e);
  process.exit(1);
});
