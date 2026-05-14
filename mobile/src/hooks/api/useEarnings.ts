import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { api } from '../../services/api';

export interface EarningsSummary {
  availableBalance: number;
  pendingBalance: number;
  totalEarned: number;
  totalMissions: number;
}

export interface Transaction {
  id: string;
  type: 'PAYMENT' | 'REFUND' | 'WITHDRAWAL' | 'COMMISSION';
  amount: number;
  description: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  createdAt: string;
}

export interface WithdrawalRequest {
  id: string;
  amount: number;
  status: 'PENDING' | 'PROCESSED' | 'REJECTED';
  createdAt: string;
  processedAt?: string;
}

export function useEarningsSummary() {
  return useQuery({
    queryKey: ['earnings', 'summary'],
    queryFn: async () => {
      const res = await api.get<EarningsSummary>('/earnings/summary');
      return res.data;
    },
    staleTime: 30_000,
  });
}

export function useEarningsTransactions() {
  return useInfiniteQuery({
    queryKey: ['earnings', 'transactions'],
    queryFn: async ({ pageParam }) => {
      const res = await api.get<{ items: Transaction[]; total: number; page: number; totalPages: number }>(
        `/earnings/transactions?page=${pageParam}&limit=15`
      );
      return res.data;
    },
    initialPageParam: 1,
    getNextPageParam: (last) => last.page < last.totalPages ? last.page + 1 : undefined,
  });
}

export function useWithdrawals() {
  return useQuery({
    queryKey: ['earnings', 'withdrawals'],
    queryFn: async () => {
      const res = await api.get<{ items: WithdrawalRequest[] }>('/earnings/withdrawals');
      return res.data.items;
    },
  });
}

export function useRequestWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (amount: number) => {
      const res = await api.post<WithdrawalRequest>('/earnings/withdraw', { amount });
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['earnings'] });
      Toast.show({ type: 'success', text1: 'Demande envoyée', text2: 'Votre virement sera traité sous 24-48h.' });
    },
    onError: (e: Error) => Toast.show({ type: 'error', text1: 'Erreur', text2: e.message }),
  });
}
