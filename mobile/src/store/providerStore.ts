import { create } from 'zustand';
import { api } from '../services/api';
import Toast from 'react-native-toast-message';

export interface ProviderStats {
  todayMissions: number;
  todayEarnings: number;
  averageRating: number;
  monthMissions: number;
  acceptanceRate: number;
  isAvailable: boolean;
  isOnline: boolean;
}

interface ProviderState {
  stats: ProviderStats | null;
  isAvailable: boolean;
  isLoading: boolean;
  fetchStats: () => Promise<void>;
  toggleAvailability: (value: boolean) => Promise<void>;
}

export const useProviderStore = create<ProviderState>((set, get) => ({
  stats: null,
  isAvailable: true,
  isLoading: false,

  fetchStats: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get<ProviderStats>('/providers/me/stats');
      set({ stats: res.data, isAvailable: res.data.isAvailable });
    } catch {
      // keep previous state
    } finally {
      set({ isLoading: false });
    }
  },

  toggleAvailability: async (value) => {
    const previous = get().isAvailable;
    set({ isAvailable: value });
    try {
      await api.patch('/providers/me', { isAvailable: value });
      Toast.show({ type: 'success', text1: value ? 'Vous êtes disponible' : 'Vous êtes indisponible' });
    } catch {
      set({ isAvailable: previous });
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Impossible de changer le statut' });
    }
  },
}));
