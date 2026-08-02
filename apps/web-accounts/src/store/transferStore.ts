import { create } from 'zustand';

type Step = 'form' | 'confirm' | 'success' | 'error';

interface TransferFormData {
  fromAccountId: string;
  toAccountId: string;
  amount: string;
  memo: string;
}

interface TransferState {
  isOpen: boolean;
  step: Step;
  form: TransferFormData;
  resultTransactionId: string | null;
  errorMessage: string | null;

  open: () => void;
  close: () => void;
  setForm: (data: Partial<TransferFormData>) => void;
  setStep: (step: Step) => void;
  setResult: (transactionId: string) => void;
  setError: (message: string) => void;
  reset: () => void;
}

const defaultForm: TransferFormData = {
  fromAccountId: '',
  toAccountId: '',
  amount: '',
  memo: '',
};

export const useTransferStore = create<TransferState>((set) => ({
  isOpen: false,
  step: 'form',
  form: defaultForm,
  resultTransactionId: null,
  errorMessage: null,

  open: () => set({ isOpen: true, step: 'form', form: defaultForm, resultTransactionId: null, errorMessage: null }),
  close: () => set({ isOpen: false }),
  setForm: (data) => set((s) => ({ form: { ...s.form, ...data } })),
  setStep: (step) => set({ step }),
  setResult: (transactionId) => set({ resultTransactionId: transactionId, step: 'success' }),
  setError: (message) => set({ errorMessage: message, step: 'error' }),
  reset: () => set({ step: 'form', form: defaultForm, resultTransactionId: null, errorMessage: null }),
}));
