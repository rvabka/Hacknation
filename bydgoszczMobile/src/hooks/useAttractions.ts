import { useEffect, useState, useCallback } from 'react';
import { attractionsService } from '../services/attractionsService';
import { Attraction } from '../data/attractions';

export function useAttractions() {
  const [data, setData] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await attractionsService.getAll();
      setData(list);
    } catch (e: any) {
      setError(e?.message ?? 'Błąd ładowania atrakcji');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { attractions: data, loading, error, refresh };
}
