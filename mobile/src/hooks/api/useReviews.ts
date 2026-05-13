import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { api } from '../../services/api';

export interface ReviewData {
  id: string;
  authorName: string;
  authorAvatarUrl?: string;
  rating: number;
  comment: string;
  serviceType: string;
  createdAt: string;
}

export function useProviderReviews(providerId: string, limit = 3) {
  return useQuery({
    queryKey: ['reviews', 'provider', providerId, limit],
    queryFn: async () => {
      const res = await api.get<{ items: ReviewData[]; total: number }>(`/reviews?providerId=${providerId}&limit=${limit}`);
      return res.data;
    },
    enabled: !!providerId,
    staleTime: 120_000,
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { bookingId: string; rating: number; comment?: string }) => {
      const res = await api.post<ReviewData>('/reviews', input);
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['reviews'] });
      void qc.invalidateQueries({ queryKey: ['bookings'] });
      Toast.show({ type: 'success', text1: 'Avis publié', text2: 'Merci pour votre retour !' });
    },
    onError: (e: Error) => Toast.show({ type: 'error', text1: 'Erreur', text2: e.message }),
  });
}
