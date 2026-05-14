import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { api } from '../../services/api';
import type { Mission } from '../../store/missionStore';

export function useProviderMissions(status?: string) {
  return useInfiniteQuery({
    queryKey: ['provider-missions', status],
    queryFn: async ({ pageParam }) => {
      const q = new URLSearchParams({ page: String(pageParam), limit: '15' });
      if (status) q.set('status', status);
      const res = await api.get<{ items: Mission[]; total: number; page: number; totalPages: number }>(
        `/bookings?${q.toString()}`
      );
      return res.data;
    },
    initialPageParam: 1,
    getNextPageParam: (last) => last.page < last.totalPages ? last.page + 1 : undefined,
  });
}

export function useProviderStats() {
  return useQuery({
    queryKey: ['provider-stats'],
    queryFn: async () => {
      const res = await api.get<{
        todayMissions: number; todayEarnings: number;
        averageRating: number; monthMissions: number;
        acceptanceRate: number; weeklyEarnings: { day: string; amount: number }[];
        recentActivity: { id: string; text: string; time: string; icon: string }[];
      }>('/providers/me/stats');
      return res.data;
    },
    staleTime: 60_000,
  });
}

export function useAcceptMission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => api.patch(`/bookings/${bookingId}/confirm`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['provider-missions'] });
      void qc.invalidateQueries({ queryKey: ['provider-stats'] });
      Toast.show({ type: 'success', text1: 'Mission acceptée ✓', text2: 'Le client a été notifié.' });
    },
    onError: (e: Error) => Toast.show({ type: 'error', text1: 'Erreur', text2: e.message }),
  });
}

export function useDeclineMission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason?: string }) =>
      api.patch(`/bookings/${bookingId}/decline`, { reason }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['provider-missions'] });
      Toast.show({ type: 'info', text1: 'Mission refusée' });
    },
    onError: (e: Error) => Toast.show({ type: 'error', text1: 'Erreur', text2: e.message }),
  });
}

export function useStartMission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => api.patch(`/bookings/${bookingId}/start`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['provider-missions'] });
      void qc.invalidateQueries({ queryKey: ['provider-stats'] });
    },
  });
}

export function useCompleteMission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => api.patch(`/bookings/${bookingId}/complete`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['provider-missions'] });
      void qc.invalidateQueries({ queryKey: ['provider-stats'] });
      void qc.invalidateQueries({ queryKey: ['earnings'] });
      Toast.show({ type: 'success', text1: 'Mission terminée 🏁', text2: 'Vos gains ont été crédités.' });
    },
    onError: (e: Error) => Toast.show({ type: 'error', text1: 'Erreur', text2: e.message }),
  });
}
