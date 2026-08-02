import { create } from 'zustand';

interface AccountsState {
  selectedAccountId: string | null;
  setSelectedAccountId: (id: string) => void;
}

export const useAccountsStore = create<AccountsState>((set) => ({
  selectedAccountId: null,
  setSelectedAccountId: (id) => set({ selectedAccountId: id }),
}));
