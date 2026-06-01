import { useFavoritesContext } from '../context/FavoritesContext';

// Cienki wrapper na globalny kontekst – zachowuje dotychczasowe API ekranów.
export function useFavorites() {
  return useFavoritesContext();
}
