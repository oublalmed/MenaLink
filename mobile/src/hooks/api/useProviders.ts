import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { api } from '../../services/api';

export interface Provider {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  bio?: string;
  averageRating: number;
  totalReviews: number;
  totalMissions: number;
  hourlyRateMin: number;
  hourlyRateMax: number;
  isVerified: boolean;
  isAvailable: boolean;
  isOnline: boolean;
  serviceRadiusKm: number;
  latitude?: number;
  longitude?: number;
  services: { serviceType: string; pricePerHour: number }[];
  distanceKm?: number;
}

export interface ProviderListParams {
  query?: string;
  serviceType?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  verifiedOnly?: boolean;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  limit?: number;
}

async function fetchProviders(params: ProviderListParams & { page: number }) {
  const q = new URLSearchParams();
  q.set('page', String(params.page));
  q.set('limit', String(params.limit ?? 15));
  if (params.query)       q.set('query', params.query);
  if (params.serviceType) q.set('serviceType', params.serviceType);
  if (params.minPrice)    q.set('minPrice', String(params.minPrice));
  if (params.maxPrice)    q.set('maxPrice', String(params.maxPrice));
  if (params.minRating)   q.set('minRating', String(params.minRating));
  if (params.verifiedOnly) q.set('verifiedOnly', 'true');
  if (params.lat)         q.set('lat', String(params.lat));
  if (params.lng)         q.set('lng', String(params.lng));
  if (params.radiusKm)    q.set('radiusKm', String(params.radiusKm));
  const res = await api.get<{ items: Provider[]; total: number; page: number; totalPages: number }>(`/providers?${q.toString()}`);
  return res.data;
}

export function useProviders(params: ProviderListParams) {
  return useInfiniteQuery({
    queryKey: ['providers', params],
    queryFn: ({ pageParam }) => fetchProviders({ ...params, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (last) => last.page < last.totalPages ? last.page + 1 : undefined,
    staleTime: 60_000,
  });
}

export function useProvider(providerId: string) {
  return useQuery({
    queryKey: ['provider', providerId],
    queryFn: async () => {
      const res = await api.get<Provider>(`/providers/${providerId}`);
      return res.data;
    },
    enabled: !!providerId,
  });
}

export function useNearbyProviders(lat?: number, lng?: number) {
  return useQuery({
    queryKey: ['providers', 'nearby', lat, lng],
    queryFn: () => fetchProviders({ lat, lng, radiusKm: 20, limit: 8, page: 1 }),
    enabled: lat != null && lng != null,
    staleTime: 120_000,
  });
}
