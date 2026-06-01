import { supabase } from '../lib/supabase';
import {
  attractions as fallbackAttractions,
  Attraction,
  CategoryType
} from '../data/attractions';
import { getLocalAssets, getCategoryFallbackImage } from '../data/localAssets';

interface DbAttractionRow {
  id: string;
  title: string;
  description: string;
  location: string | null;
  latitude: number;
  longitude: number;
  category: string;
  year_built: string | null;
  architect: string | null;
  opening_hours: string | null;
  price: string | null;
  image_url: string | null;
  image_urls: string[] | null;
  wikipedia_url: string | null;
  has_ar: boolean;
  has_audio: boolean;
  has_ai: boolean;
  fun_facts?: { content: string; order_idx: number }[];
}

const VALID_CATEGORIES: CategoryType[] = [
  'Rzeźba',
  'Architektura',
  'Sakralny',
  'Muzeum',
  'Zabytek techniki'
];

function rowToAttraction(row: DbAttractionRow): Attraction {
  const assets = getLocalAssets(row.title);

  const category: CategoryType = (VALID_CATEGORIES as string[]).includes(row.category)
    ? (row.category as CategoryType)
    : 'Architektura';

  const image =
    assets.image ??
    (row.image_url ? { uri: row.image_url } : undefined) ??
    getCategoryFallbackImage(category);

  const facts = (row.fun_facts ?? [])
    .sort((a, b) => a.order_idx - b.order_idx)
    .map(f => f.content);

  const images = Array.isArray(row.image_urls) && row.image_urls.length > 0
    ? row.image_urls
    : row.image_url
      ? [row.image_url]
      : [];

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    location: row.location ?? 'Lublin',
    coordinate: { latitude: row.latitude, longitude: row.longitude },
    image,
    images,
    category,
    yearBuilt: row.year_built ?? undefined,
    architect: row.architect ?? undefined,
    funFacts: facts,
    openingHours: row.opening_hours ?? undefined,
    price: row.price ?? undefined,
    hasAI: row.has_ai
  };
}

export const attractionsService = {
  async getAll(): Promise<Attraction[]> {
    if (!supabase) return fallbackAttractions;

    const { data, error } = await supabase
      .from('attractions')
      .select(
        '*, fun_facts(content, order_idx)'
      )
      .order('title');

    if (error) {
      console.warn('[attractionsService] błąd Supabase, fallback lokalny:', error.message);
      return fallbackAttractions;
    }

    if (!data || data.length === 0) return fallbackAttractions;

    return (data as DbAttractionRow[]).map(rowToAttraction);
  },

  async getById(id: string): Promise<Attraction | undefined> {
    if (!supabase) return fallbackAttractions.find(a => a.id === id);

    const { data, error } = await supabase
      .from('attractions')
      .select('*, fun_facts(content, order_idx)')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      return fallbackAttractions.find(a => a.id === id);
    }

    return rowToAttraction(data as DbAttractionRow);
  }
};
