import * as FileSystem from 'expo-file-system';
import { supabase } from '../lib/supabase';

const DEVICE_ID_PATH = `${FileSystem.documentDirectory}device_id.json`;
const FAVORITES_PATH = `${FileSystem.documentDirectory}favorites.json`;

let cachedDeviceId: string | null = null;

const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const getDeviceId = async (): Promise<string> => {
  if (cachedDeviceId) return cachedDeviceId;

  try {
    const info = await FileSystem.getInfoAsync(DEVICE_ID_PATH);
    if (info.exists) {
      const raw = await FileSystem.readAsStringAsync(DEVICE_ID_PATH);
      cachedDeviceId = JSON.parse(raw).id as string;
      return cachedDeviceId;
    }
  } catch {}

  const id = generateUUID();
  cachedDeviceId = id;
  await FileSystem.writeAsStringAsync(DEVICE_ID_PATH, JSON.stringify({ id }));
  return id;
};

const readLocalFavorites = async (): Promise<string[]> => {
  try {
    const info = await FileSystem.getInfoAsync(FAVORITES_PATH);
    if (info.exists) {
      const raw = await FileSystem.readAsStringAsync(FAVORITES_PATH);
      return JSON.parse(raw) as string[];
    }
  } catch {}
  return [];
};

const writeLocalFavorites = async (ids: string[]): Promise<void> => {
  await FileSystem.writeAsStringAsync(FAVORITES_PATH, JSON.stringify(ids));
};

export const favoritesService = {
  async getFavorites(): Promise<string[]> {
    const deviceId = await getDeviceId();

    if (supabase) {
      const { data, error } = await supabase
        .from('favorites')
        .select('attraction_id')
        .eq('device_id', deviceId);

      if (!error && data) {
        const ids = data.map((r: { attraction_id: string }) => r.attraction_id);
        await writeLocalFavorites(ids);
        return ids;
      }
    }

    return readLocalFavorites();
  },

  async addFavorite(attractionId: string): Promise<void> {
    const deviceId = await getDeviceId();

    const current = await readLocalFavorites();
    if (!current.includes(attractionId)) {
      await writeLocalFavorites([...current, attractionId]);
    }

    if (supabase) {
      await supabase
        .from('favorites')
        .upsert({ device_id: deviceId, attraction_id: attractionId });
    }
  },

  async removeFavorite(attractionId: string): Promise<void> {
    const deviceId = await getDeviceId();

    const current = await readLocalFavorites();
    await writeLocalFavorites(current.filter(id => id !== attractionId));

    if (supabase) {
      await supabase
        .from('favorites')
        .delete()
        .eq('device_id', deviceId)
        .eq('attraction_id', attractionId);
    }
  }
};
