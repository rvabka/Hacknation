import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from 'react';
import { favoritesService } from '../services/favoritesService';

interface FavoritesValue {
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  favoriteIds: string[];
  favoritesCount: number;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesValue>({
  isFavorite: () => false,
  toggleFavorite: () => {},
  favoriteIds: [],
  favoritesCount: 0,
  loading: true
});

// Globalny stan ulubionych. Wcześniej każdy ekran wołał useFavorites osobno,
// więc miał WŁASNĄ kopię zbioru – serce kliknięte w jednym miejscu nie
// odświeżało się w innym i znikało po remoncie. Tu trzymamy jedno źródło prawdy
// dla całej apki; zapis idzie do favoritesService (plik lokalny + Supabase).
export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    favoritesService
      .getFavorites()
      .then(ids => {
        if (active) setFavorites(new Set(ids));
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const isFavorite = useCallback((id: string) => favorites.has(id), [favorites]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      const wasFav = next.has(id);
      if (wasFav) {
        next.delete(id);
        favoritesService.removeFavorite(id).catch(() => {});
      } else {
        next.add(id);
        favoritesService.addFavorite(id).catch(() => {});
      }
      return next;
    });
  }, []);

  return (
    <FavoritesContext.Provider
      value={{
        isFavorite,
        toggleFavorite,
        favoriteIds: [...favorites],
        favoritesCount: favorites.size,
        loading
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavoritesContext() {
  return useContext(FavoritesContext);
}
