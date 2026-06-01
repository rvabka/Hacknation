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

const { data } = await supabase
  .from('attractions')
  .select('title')
  .order('title');

const suspects = ['BP', 'Aligator', 'Dłoń', 'Dzieci', 'Żółw', 'Orlen'];
console.log('=== Sprawdzam czy śmieciowe atrakcje zniknęły ===');
suspects.forEach(s => {
  const found = data.find(a => a.title.toLowerCase() === s.toLowerCase());
  console.log(found ? `  ❌ ${s}: WCIĄŻ JEST` : `  ✅ ${s}: zniknął`);
});

console.log(`\nŁącznie w bazie: ${data.length}`);
console.log('Wszystkie tytuły:');
data.forEach(a => console.log(`  - ${a.title}`));
