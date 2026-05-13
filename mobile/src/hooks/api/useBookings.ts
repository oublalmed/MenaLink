import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { api } from '../../services/api';

export interface BookingData {
  id: string;
  providerId: string;
  providerName: string;
  providerAvatarUrl?: string;
  clientId: string;
  serviceType: string;
  scheduledDate: string;
  scheduledTime: string;
  durationHours: number;
  totalAmount: number;
  commission: number;
  providerAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  addressId?: string;
  notes?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  hasReview?: boolean;
}

export interface CreateBookingInput {
  providerId: string;
  serviceType: string;
  scheduledDate: string;
  scheduledTime: string;
  durationHours: number;
  addressId?: string;
  notes?: string;
  paymentMethod: 'ONLINE' | 'CASH';
}

export function useBookings(status?: string) {
  return useInfiniteQuery({
    queryKey: ['bookings', status],
    queryFn: async ({ pageParam }) => {
      const q = new URLSearchParams({ page: String(pageParam), limit: '10' });
      if (status && status !== 'ALL') q.set('status', status);
      const res = await api.get<{ items: BookingData[]; total: number; page: number; totalPages: number }>(`/bookings?${q.toString()}`);
      return res.data;
    },
    initialPageParam: 1,
    getNextPageParam: (last) => last.page < last.totalPages ? last.page + 1 : undefined,
  });
}

export function useBooking(bookingId: string) {
  return useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const res = await api.get<BookingData>(`/bookings/${bookingId}`);
      return res.data;
    },
    enabled: !!bookingId,
    refetchInterval: (query) =>
      query.state.data?.status === 'IN_PROGRESS' ? 30_000 : false,
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateBookingInput) => {
      const res = await api.post<BookingData>('/bookings', input);
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['bookings'] });
      Toast.show({ type: 'success', text1: 'Réservation créée', text2: 'Votre demande a été envoyée au prestataire.' });
    },
    onError: (e: Error) => Toast.show({ type: 'error', text1: 'Erreur', text2: e.message }),
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bookingId: string) => {
      await api.patch(`/bookings/${bookingId}/cancel`);
    },
    onSuccess: (_data, bookingId) => {
      void qc.invalidateQueries({ queryKey: ['bookings'] });
      void qc.invalidateQueries({ queryKey: ['booking', bookingId] });
      Toast.show({ type: 'success', text1: 'Réservation annulée' });
    },
    onError: (e: Error) => Toast.show({ type: 'error', text1: 'Impossible d\'annuler', text2: e.message }),
  });
}
