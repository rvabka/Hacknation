import { useState, useEffect, useCallback } from 'react';
import { favoritesService } from '../services/favoritesService';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    favoritesService.getFavorites().then(ids => {
      setFavorites(new Set(ids));
      setLoading(false);
    });
  }, []);

  const isFavorite = useCallback(
    (attractionId: string) => favorites.has(attractionId),
    [favorites]
  );

  const toggleFavorite = useCallback(
    async (attractionId: string) => {
      const wasFav = favorites.has(attractionId);

      setFavorites(prev => {
        const next = new Set(prev);
        if (wasFav) next.delete(attractionId);
        else next.add(attractionId);
        return next;
      });

      if (wasFav) {
        await favoritesService.removeFavorite(attractionId);
      } else {
        await favoritesService.addFavorite(attractionId);
      }
    },
    [favorites]
  );

  return { isFavorite, toggleFavorite, loading, favoritesCount: favorites.size };
}
