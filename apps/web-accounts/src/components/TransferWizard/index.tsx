'use client';

import { Account } from '@ally/shared-types';
import { useTransferStore } from '@/store/transferStore';
import { TransferForm } from './TransferForm';
import { TransferConfirm } from './TransferConfirm';

interface TransferWizardProps {
  accounts: Account[];
}

export function TransferWizard({ accounts }: TransferWizardProps) {
  const { isOpen, step, close, reset, resultTransactionId, errorMessage } = useTransferStore();

  if (!isOpen) return null;

  const STEP_TITLES: Record<typeof step, string> = {
    form: 'Transfer money',
    confirm: 'Confirm transfer',
    success: 'Transfer complete',
    error: 'Transfer failed',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{STEP_TITLES[step]}</h2>
          <button
            onClick={close}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {step === 'form' && <TransferForm accounts={accounts} onCancel={close} />}

          {step === 'confirm' && <TransferConfirm accounts={accounts} />}

          {step === 'success' && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg className="h-7 w-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Your transfer was successful.</p>
                {resultTransactionId && (
                  <p className="text-xs text-gray-400 mt-1 font-mono">
                    Ref: {resultTransactionId.slice(0, 8).toUpperCase()}
                  </p>
                )}
              </div>
              <button
                onClick={close}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700"
              >
                Done
              </button>
            </div>
          )}

          {step === 'error' && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="h-7 w-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-sm text-red-700">{errorMessage}</p>
              <div className="flex gap-3">
                <button onClick={close} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  Close
                </button>
                <button onClick={reset} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700">
                  Try again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
