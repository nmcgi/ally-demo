'use client';

import { useLoans } from '@/hooks/useLoans';
import { useLoanWizardStore } from '@/store/loanWizardStore';
import { LoanCard } from './LoanCard';
import { LoanApplicationWizard } from './LoanApplicationWizard';
import { LoanStatusPanel } from './LoanStatus';

export default function LoanApplication() {
  const { data: loans = [], isLoading } = useLoans();

  const {
    view, selectedLoanId, submittedId, errorMessage: wizardError,
    setView, setSelectedLoanId, reset, setStep,
  } = useLoanWizardStore();

  function handleViewLoan(id: string) {
    setSelectedLoanId(id);
    setView('status');
  }

  function handleStartApply() {
    reset();
    setView('apply');
  }

  function handleBack() {
    reset();
    setView('list');
  }

  if (submittedId && view === 'apply') {
    return (
      <div className="max-w-xl mx-auto p-4 sm:p-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="h-7 w-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Application submitted!</h2>
          <p className="text-sm text-gray-500">
            Your loan application is being reviewed. We'll notify you of any updates.
          </p>
          <p className="text-xs text-gray-400 font-mono">Ref: {submittedId}</p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => handleViewLoan(submittedId)}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700"
            >
              Track status
            </button>
            <button
              onClick={handleBack}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back to loans
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (wizardError && view === 'apply') {
    return (
      <div className="max-w-xl mx-auto p-4 sm:p-6">
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="h-7 w-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Submission failed</h2>
          <p className="text-sm text-red-600">{wizardError}</p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep(4)}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700"
            >
              Try again
            </button>
            <button
              onClick={handleBack}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6 space-y-4">
      {view === 'list' && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Loans</h1>
              <p className="text-sm text-gray-500 mt-0.5">{loans.length} application{loans.length !== 1 ? 's' : ''}</p>
            </div>
            <button
              onClick={handleStartApply}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-xl hover:bg-brand-700"
            >
              + Apply
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : loans.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
              <p className="text-sm text-gray-500 mb-4">No loan applications yet.</p>
              <button
                onClick={handleStartApply}
                className="px-6 py-2 text-sm font-medium text-white bg-brand-600 rounded-xl hover:bg-brand-700"
              >
                Apply for a loan
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {loans.map((loan) => (
                <LoanCard key={loan.id} loan={loan} onClick={() => handleViewLoan(loan.id)} />
              ))}
            </div>
          )}
        </>
      )}

      {view === 'apply' && (
        <>
          <button onClick={handleBack} className="text-sm text-brand-600 hover:underline flex items-center gap-1">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to loans
          </button>
          <LoanApplicationWizard />
        </>
      )}

      {view === 'status' && selectedLoanId && (
        <LoanStatusPanel loanId={selectedLoanId} onBack={() => setView('list')} />
      )}
    </div>
  );
}
