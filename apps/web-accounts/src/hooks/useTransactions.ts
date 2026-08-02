import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Transaction, PaginatedResponse } from '@ally/shared-types';

interface TransactionQueryParams {
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
}

export function useTransactions(accountId: string | null, params: TransactionQueryParams = {}) {
  const { limit = 25, offset = 0, startDate, endDate } = params;

  const searchParams = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
  });

  return useQuery({
    queryKey: ['transactions', accountId, params],
    queryFn: () =>
      api.get<PaginatedResponse<Transaction>>(
        `/accounts/${accountId}/transactions?${searchParams}`,
      ),
    enabled: !!accountId,
  });
}
