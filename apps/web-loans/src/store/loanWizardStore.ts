import { create } from 'zustand';
import { LoanType, EmploymentType } from '@ally/shared-types';

export type WizardStep = 1 | 2 | 3 | 4;
export type LoanView = 'list' | 'apply' | 'status';

export interface LoanWizardForm {
  // Step 1 — Loan details
  type: LoanType | '';
  requestedAmount: string;
  termMonths: string;
  purpose: string;
  // Step 2 — Employment
  employmentType: EmploymentType | '';
  employer: string;
  // Step 3 — Income
  annualIncome: string;
}

interface LoanWizardState {
  // Navigation
  view: LoanView;
  selectedLoanId: string | null;
  // Wizard
  step: WizardStep;
  form: LoanWizardForm;
  submittedId: string | null;
  isSubmitting: boolean;
  errorMessage: string | null;

  setView: (view: LoanView) => void;
  setSelectedLoanId: (id: string | null) => void;
  setStep: (step: WizardStep) => void;
  setForm: (data: Partial<LoanWizardForm>) => void;
  setSubmitting: (v: boolean) => void;
  setSubmittedId: (id: string) => void;
  setError: (msg: string) => void;
  reset: () => void;
}

const defaultForm: LoanWizardForm = {
  type: '',
  requestedAmount: '',
  termMonths: '',
  purpose: '',
  employmentType: '',
  employer: '',
  annualIncome: '',
};

export const useLoanWizardStore = create<LoanWizardState>((set) => ({
  view: 'list',
  selectedLoanId: null,
  step: 1,
  form: defaultForm,
  submittedId: null,
  isSubmitting: false,
  errorMessage: null,

  setView: (view) => set({ view }),
  setSelectedLoanId: (id) => set({ selectedLoanId: id }),
  setStep: (step) => set({ step }),
  setForm: (data) => set((s) => ({ form: { ...s.form, ...data } })),
  setSubmitting: (v) => set({ isSubmitting: v }),
  setSubmittedId: (id) => set({ submittedId: id, isSubmitting: false }),
  setError: (msg) => set({ errorMessage: msg, isSubmitting: false }),
  reset: () => set({ step: 1, form: defaultForm, submittedId: null, isSubmitting: false, errorMessage: null }),
}));
