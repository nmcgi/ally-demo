import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { LoanApplication, CreateLoanApplicationRequest, LoanApplicationStatusResponse } from '@ally/shared-types';

export function useLoans() {
  return useQuery({
    queryKey: ['loans'],
    queryFn: () => api.get<LoanApplication[]>('/loans'),
  });
}

export function useLoan(id: string | null) {
  return useQuery({
    queryKey: ['loans', id],
    queryFn: () => api.get<LoanApplication>(`/loans/${id}`),
    enabled: !!id,
    // Poll every 10s while the loan is in an in-progress state
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      const inProgress = status && !['approved', 'rejected', 'disbursed', 'closed', 'draft'].includes(status);
      return inProgress ? 10_000 : false;
    },
  });
}

export function useCreateLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLoanApplicationRequest) =>
      api.post<LoanApplication>('/loans', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['loans'] }),
  });
}

export function useSubmitLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<LoanApplicationStatusResponse>(`/loans/${id}/submit`),
    onSuccess: (_, id) => {
      void qc.invalidateQueries({ queryKey: ['loans'] });
      void qc.invalidateQueries({ queryKey: ['loans', id] });
    },
  });
}
