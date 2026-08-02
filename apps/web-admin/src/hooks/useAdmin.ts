import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { User, Account, LoanApplication } from '@ally/shared-types';

export function useUserSearch(q: string) {
  return useQuery({
    queryKey: ['admin', 'users', q],
    queryFn: () => api.get<User[]>(`/admin/users?q=${encodeURIComponent(q)}`),
    enabled: q.length >= 2,
    staleTime: 15_000,
  });
}

export function useUserAccounts(userId: string | null) {
  return useQuery({
    queryKey: ['admin', 'users', userId, 'accounts'],
    queryFn: () => api.get<Account[]>(`/admin/users/${userId}/accounts`),
    enabled: !!userId,
  });
}

export function usePendingLoans() {
  return useQuery({
    queryKey: ['admin', 'loans', 'pending'],
    queryFn: () => api.get<LoanApplication[]>('/admin/loans/pending'),
    refetchInterval: 30_000,
  });
}

export function useReviewLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision, reason }: { id: string; decision: 'approved' | 'rejected'; reason?: string }) =>
      api.post<LoanApplication>(`/admin/loans/${id}/review`, { decision, reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'loans', 'pending'] }),
  });
}
