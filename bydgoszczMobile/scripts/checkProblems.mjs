import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const env = readFileSync(resolve(__dirname, '../.env'), 'utf-8');
  for (const raw of env.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const k = line.slice(0, eq).trim();
    const v = line.slice(eq + 1).trim();
    if (k && !process.env[k]) process.env[k] = v;
  }
} catch {}

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

// 1. Czy image_urls jest zapełnione w bazie?
const { data: sample } = await supabase
  .from('attractions')
  .select('title, image_url, image_urls')
  .limit(3);

console.log('=== Stan kolumny image_urls (sample 3) ===');
sample.forEach(a => {
  console.log(`\n${a.title}`);
  console.log(`  image_url: ${a.image_url?.slice(0, 80) ?? 'null'}...`);
  console.log(`  image_urls: ${Array.isArray(a.image_urls) ? `array(${a.image_urls.length})` : 'NULL/missing'}`);
  if (Array.isArray(a.image_urls)) {
    a.image_urls.slice(0, 2).forEach((u, i) => console.log(`    [${i}]: ${u.slice(0, 80)}...`));
  }
});

// 2. Problematyczne atrakcje
const { data: problems } = await supabase
  .from('attractions')
  .select('title, description, image_url, image_urls')
  .in('title', ['Dłoń', 'Józef Bem', 'Baobab']);

console.log('\n\n=== Problematyczne atrakcje ===');
problems.forEach(a => {
  console.log(`\n--- ${a.title}`);
  console.log(`  OPIS: ${a.description.slice(0, 200)}`);
  console.log(`  image_url: ${a.image_url}`);
  console.log(`  images count: ${a.image_urls?.length ?? 0}`);
});

// 3. Statystyki image_urls
const { data: all } = await supabase
  .from('attractions')
  .select('image_urls');

const counts = { 'null/empty': 0, '1': 0, '2-3': 0, '4-6': 0 };
all.forEach(a => {
  const n = a.image_urls?.length ?? 0;
  if (n === 0) counts['null/empty']++;
  else if (n === 1) counts['1']++;
  else if (n <= 3) counts['2-3']++;
  else counts['4-6']++;
});
console.log('\n=== Rozkład liczby zdjęć w galerii ===');
Object.entries(counts).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
