import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

try {
  const envText = readFileSync(resolve(__dirname, '../.env'), 'utf-8');
  for (const raw of envText.split('\n')) {
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

const { data, error } = await supabase
  .from('attractions')
  .select('id, title, image_url')
  .order('title');

if (error) {
  console.error('Błąd:', error);
  process.exit(1);
}

const withImage = data.filter(a => a.image_url);
const withoutImage = data.filter(a => !a.image_url);

console.log(`Łącznie: ${data.length}`);
console.log(`Ze zdjęciem: ${withImage.length}`);
console.log(`Bez zdjęcia: ${withoutImage.length}`);

// Statystyki źródeł zdjęć
const sources = { google: 0, wikipedia: 0, commons: 0, other: 0 };
withImage.forEach(a => {
  const u = a.image_url;
  if (u.includes('googleapis.com')) sources.google++;
  else if (u.includes('upload.wikimedia.org')) sources.wikipedia++;
  else if (u.includes('commons.wikimedia.org')) sources.commons++;
  else sources.other++;
});
console.log('\n=== Źródła zdjęć ===');
console.log(`Google Places: ${sources.google}`);
console.log(`Wikipedia (upload): ${sources.wikipedia}`);
console.log(`Wikimedia Commons: ${sources.commons}`);
console.log(`Inne: ${sources.other}`);

console.log('\n=== Pierwsze 20 atrakcji ===');
data.slice(0, 20).forEach(a => {
  const src = a.image_url?.includes('googleapis.com') ? '[GOOGLE]' :
              a.image_url?.includes('wikimedia') ? '[WIKI]' :
              a.image_url ? '[OTHER]' : '[BRAK]';
  console.log(`${src} ${a.title}`);
});
