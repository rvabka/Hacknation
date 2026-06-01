import React, {
  createContext,
  useContext,
  useState,
  useCallback
} from 'react';

export interface TourStop {
  id: string;
  title: string;
  category: string;
  coordinate: { latitude: number; longitude: number };
  order: number;
}

export interface ActiveTour {
  stops: TourStop[];
  start: { latitude: number; longitude: number } | null;
  totalMinutes: number;
  totalMeters: number;
}

interface TourContextValue {
  tour: ActiveTour | null;
  startTour: (tour: ActiveTour) => void;
  endTour: () => void;
}

const TourContext = createContext<TourContextValue>({
  tour: null,
  startTour: () => {},
  endTour: () => {}
});

// Trzyma aktualnie aktywną "trasę zwiedzania" zaplanowaną w PlannerScreen,
// tak aby MapScreen (inna zakładka) mógł narysować ją jako Polyline z
// numerowanymi przystankami. Kontekst zamiast parametrów nawigacji – trasa to
// tablica atrakcji ze współrzędnymi, a zakładki dzielą jeden provider.
export function TourProvider({ children }: { children: React.ReactNode }) {
  const [tour, setTour] = useState<ActiveTour | null>(null);

  const startTour = useCallback((t: ActiveTour) => setTour(t), []);
  const endTour = useCallback(() => setTour(null), []);

  return (
    <TourContext.Provider value={{ tour, startTour, endTour }}>
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  return useContext(TourContext);
}
