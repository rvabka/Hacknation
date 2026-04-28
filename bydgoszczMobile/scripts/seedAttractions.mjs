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
const WIKI_BASE = 'https://pl.wikipedia.org/api/rest_v1/page/summary/';
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

// === Główna logika ===
async function main() {
  const elements = await fetchOverpass();
  console.log(`[seed] Znaleziono ${elements.length} elementów OSM`);

  const seenTitles = new Set();
  const rows = [];
  const allFacts = [];

  let processed = 0;

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

    // Wikipedia – po tagu 'wikipedia' lub po nazwie
    let wiki = null;
    if (tags.wikipedia) {
      const [lang, title] = tags.wikipedia.split(':');
      if (lang && title) wiki = await fetchWiki(title, lang);
    }
    if (!wiki) wiki = await fetchWiki(name, 'pl');
    await sleep(50); // grzeczność dla Wikipedia API

    const description =
      (wiki?.extract ?? tags.description ?? '').trim().slice(0, 600);

    if (!description) continue; // pomijamy bezopisowe

    seenTitles.add(name.toLowerCase());

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
      category: mapCategory(tags),
      year_built: tags.start_date || tags['building:start_date'] || null,
      architect: tags.architect || null,
      opening_hours: tags.opening_hours || null,
      price: tags.fee === 'no' ? 'Wstęp bezpłatny' : null,
      image_url: wiki?.thumbnail?.source ?? null,
      wikipedia_url: wikipediaUrl,
      has_ar: false,
      has_audio: false,
      has_ai: true,
      source: 'osm',
      source_id: String(el.id)
    });

    // Ciekawostki – pierwsze 2-3 zdania z opisu jako fakty (proste podejście)
    const sentences = description.split(/(?<=[.!?])\s+/).filter(s => s.length > 30);
    sentences.slice(0, 3).forEach((sentence, i) => {
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
  console.log(`  attractions: ${rows.length}`);
  console.log(`  fun_facts:   ${allFacts.length}`);
}

main().catch((e) => {
  console.error('[seed] Błąd:', e);
  process.exit(1);
});
