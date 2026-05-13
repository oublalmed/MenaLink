import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';

export interface QuoteData {
  pricePerHour: number;
  totalAmount: number;
  commission: number;
  providerAmount: number;
  durationHours: number;
}

export function useQuote(providerId: string, serviceType: string, durationHours: number) {
  return useQuery({
    queryKey: ['quote', providerId, serviceType, durationHours],
    queryFn: async () => {
      const q = new URLSearchParams({ providerId, serviceType, durationHours: String(durationHours) });
      const res = await api.get<QuoteData>(`/bookings/quote?${q.toString()}`);
      return res.data;
    },
    enabled: !!providerId && !!serviceType && durationHours > 0,
    staleTime: 30_000,
  });
}
