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
  .select('id, title, description, fun_facts(content, order_idx)')
  .order('title')
  .limit(10);

let withFacts = 0;
let withoutFacts = 0;
data.forEach(a => {
  if (a.fun_facts.length > 0) withFacts++;
  else withoutFacts++;
});

console.log(`=== Pierwsze 10 atrakcji ===`);
console.log(`Z ciekawostkami: ${withFacts}/10\n`);

data.forEach(a => {
  console.log(`\n━━━ ${a.title}`);
  console.log(`OPIS: ${a.description}`);
  if (a.fun_facts.length > 0) {
    a.fun_facts.sort((x, y) => x.order_idx - y.order_idx);
    a.fun_facts.forEach((f, i) => console.log(`  ${i + 1}. ${f.content}`));
  } else {
    console.log(`  (brak ciekawostek)`);
  }
});

// Statystyki globalne
const { data: all } = await supabase.from('attractions').select('id');
const { data: facts } = await supabase.from('fun_facts').select('attraction_id');
const factsByAttr = facts.reduce((acc, f) => { acc[f.attraction_id] = (acc[f.attraction_id]||0)+1; return acc; }, {});
const counts = { '0': 0, '1-2': 0, '3': 0, '4+': 0 };
all.forEach(a => {
  const c = factsByAttr[a.id] || 0;
  if (c === 0) counts['0']++;
  else if (c <= 2) counts['1-2']++;
  else if (c === 3) counts['3']++;
  else counts['4+']++;
});
console.log(`\n━━━ Statystyki ciekawostek (z ${all.length} atrakcji) ━━━`);
Object.entries(counts).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
