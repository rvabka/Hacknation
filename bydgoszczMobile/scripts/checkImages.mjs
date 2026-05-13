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
console.log('\n=== Przykłady ze zdjęciem ===');
withImage.slice(0, 5).forEach(a => {
  console.log(`- ${a.title}\n  ${a.image_url}`);
});
console.log('\n=== Przykłady bez zdjęcia ===');
withoutImage.slice(0, 5).forEach(a => {
  console.log(`- ${a.title}`);
});
