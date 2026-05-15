import { create } from 'zustand';
import { api } from '../services/api';
import Toast from 'react-native-toast-message';

export interface Mission {
  id: string;
  clientId: string;
  clientName: string;
  clientAvatarUrl?: string;
  clientPhone?: string;
  serviceType: string;
  scheduledDate: string;
  scheduledTime: string;
  durationHours: number;
  totalAmount: number;
  providerAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  createdAt: string;
  expiresAt?: string;
}

interface MissionState {
  activeMission: Mission | null;
  pendingMissions: Mission[];
  isLoading: boolean;
  fetchPendingMissions: () => Promise<void>;
  acceptMission: (id: string) => Promise<void>;
  declineMission: (id: string, reason?: string) => Promise<void>;
  startMission: (id: string) => Promise<void>;
  completeMission: (id: string) => Promise<void>;
  fetchActiveMission: () => Promise<void>;
}

export const useMissionStore = create<MissionState>((set, get) => ({
  activeMission: null,
  pendingMissions: [],
  isLoading: false,

  fetchPendingMissions: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get<{ items: Mission[] }>('/bookings?status=PENDING&limit=20');
      set({ pendingMissions: res.data.items ?? [] });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchActiveMission: async () => {
    try {
      const res = await api.get<{ items: Mission[] }>('/bookings?status=IN_PROGRESS&limit=1');
      set({ activeMission: res.data.items?.[0] ?? null });
    } catch {}
  },

  acceptMission: async (id) => {
    await api.put(`/bookings/${id}/confirm`);
    set(s => ({ pendingMissions: s.pendingMissions.filter(m => m.id !== id) }));
    Toast.show({ type: 'success', text1: 'Mission acceptée ✓', text2: 'Le client a été notifié.' });
  },

  declineMission: async (id, reason) => {
    await api.put(`/bookings/${id}/decline`, { reason });
    set(s => ({ pendingMissions: s.pendingMissions.filter(m => m.id !== id) }));
    Toast.show({ type: 'info', text1: 'Mission refusée', text2: 'Le client a été notifié.' });
  },

  startMission: async (id) => {
    const res = await api.put<Mission>(`/bookings/${id}/start`);
    set({ activeMission: res.data });
    Toast.show({ type: 'success', text1: 'Mission démarrée ✓' });
  },

  completeMission: async (id) => {
    await api.put(`/bookings/${id}/complete`);
    set({ activeMission: null });
    Toast.show({ type: 'success', text1: 'Mission terminée 🏁', text2: 'Gains crédités sur votre solde.' });
  },
}));
