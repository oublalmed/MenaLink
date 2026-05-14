import { create } from 'zustand';
import { api } from '../services/api';

export interface EarningsSummary {
  availableBalance: number;
  pendingBalance: number;
  totalEarned: number;
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
}

export interface WeeklyChartData {
  day: string;
  amount: number;
}

interface EarningsState {
  summary: EarningsSummary | null;
  weeklyChart: WeeklyChartData[];
  isLoading: boolean;
  fetchSummary: () => Promise<void>;
  fetchWeeklyChart: () => Promise<void>;
}

export const useEarningsStore = create<EarningsState>((set) => ({
  summary: null,
  weeklyChart: [],
  isLoading: false,

  fetchSummary: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get<EarningsSummary>('/earnings/summary');
      set({ summary: res.data });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchWeeklyChart: async () => {
    try {
      const res = await api.get<WeeklyChartData[]>('/earnings/weekly');
      set({ weeklyChart: res.data });
    } catch {
      // use mock data if endpoint not available
      const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
      set({ weeklyChart: days.map(day => ({ day, amount: Math.floor(Math.random() * 400) + 50 })) });
    }
  },
}));
