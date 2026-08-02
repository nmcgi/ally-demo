import { create } from 'zustand';
import { User, LoanApplication } from '@ally/shared-types';

export type AdminTab = 'loans' | 'customers';

interface AdminState {
  // Tab navigation
  tab: AdminTab;
  setTab: (tab: AdminTab) => void;

  // Customer search
  searchQuery: string;
  selectedUser: User | null;
  setSearchQuery: (q: string) => void;
  setSelectedUser: (user: User | null) => void;

  // Loan review queue
  selectedLoan: LoanApplication | null;
  confirmingDecision: 'approved' | 'rejected' | null;
  rejectReason: string;
  setSelectedLoan: (loan: LoanApplication | null) => void;
  setConfirmingDecision: (d: 'approved' | 'rejected' | null) => void;
  setRejectReason: (r: string) => void;
  resetReview: () => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  tab: 'loans',
  setTab: (tab) => set({ tab }),

  searchQuery: '',
  selectedUser: null,
  setSearchQuery: (q) => set({ searchQuery: q, selectedUser: null }),
  setSelectedUser: (user) => set({ selectedUser: user }),

  selectedLoan: null,
  confirmingDecision: null,
  rejectReason: '',
  setSelectedLoan: (loan) => set({ selectedLoan: loan, confirmingDecision: null, rejectReason: '' }),
  setConfirmingDecision: (d) => set({ confirmingDecision: d }),
  setRejectReason: (r) => set({ rejectReason: r }),
  resetReview: () => set({ selectedLoan: null, confirmingDecision: null, rejectReason: '' }),
}));
