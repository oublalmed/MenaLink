import { create } from 'zustand';

export interface SearchFilters {
  serviceTypes: string[];
  minPrice: number;
  maxPrice: number;
  minRating: number;
  verifiedOnly: boolean;
  availableDate: Date | null;
  radiusKm: number;
}

const DEFAULT_FILTERS: SearchFilters = {
  serviceTypes: [],
  minPrice: 0,
  maxPrice: 500,
  minRating: 0,
  verifiedOnly: false,
  availableDate: null,
  radiusKm: 20,
};

interface SearchState {
  query: string;
  filters: SearchFilters;
  viewMode: 'list' | 'map';
  activeFilterCount: number;

  setQuery: (query: string) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  resetFilters: () => void;
  setViewMode: (mode: 'list' | 'map') => void;
}

function countActiveFilters(f: SearchFilters): number {
  let count = 0;
  if (f.serviceTypes.length > 0) count++;
  if (f.minPrice > 0 || f.maxPrice < 500) count++;
  if (f.minRating > 0) count++;
  if (f.verifiedOnly) count++;
  if (f.availableDate != null) count++;
  if (f.radiusKm !== 20) count++;
  return count;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  query: '',
  filters: DEFAULT_FILTERS,
  viewMode: 'list',
  activeFilterCount: 0,

  setQuery: (query) => set({ query }),

  setFilters: (partial) => {
    const filters = { ...get().filters, ...partial };
    set({ filters, activeFilterCount: countActiveFilters(filters) });
  },

  resetFilters: () => set({ filters: DEFAULT_FILTERS, activeFilterCount: 0 }),

  setViewMode: (viewMode) => set({ viewMode }),
}));
