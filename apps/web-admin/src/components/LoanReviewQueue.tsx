'use client';

import { usePendingLoans, useReviewLoan } from '@/hooks/useAdmin';
import { useAdminStore } from '@/store/adminStore';
import { LoanApplication } from '@ally/shared-types';
import { formatCurrency, formatDate, formatLoanType, formatLoanStatus } from '@/lib/format';
import { clsx } from 'clsx';

const STATUS_BADGE: Record<string, string> = {
  submitted: 'bg-blue-100 text-blue-700',
  kyc_pending: 'bg-yellow-100 text-yellow-700',
  kyc_approved: 'bg-yellow-100 text-yellow-700',
  credit_check_pending: 'bg-yellow-100 text-yellow-700',
  underwriting: 'bg-purple-100 text-purple-700',
};

export function LoanReviewQueue() {
  const { data: loans = [], isLoading, error } = usePendingLoans();
  const { selectedLoan, setSelectedLoan } = useAdminStore();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600 px-1">Failed to load pending applications.</p>;
  }

  if (selectedLoan) {
    return <LoanReviewDetail loan={selectedLoan} />;
  }

  return (
    <div className="space-y-3">
      {loans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <div className="w-12 h-12 bg-emerald-100 ring-8 ring-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">No pending applications. Queue is clear.</p>
        </div>
      ) : (
        loans.map((loan) => (
          <button
            key={loan.id}
            onClick={() => setSelectedLoan(loan)}
            className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-brand-200 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900 text-sm">{formatLoanType(loan.type)}</span>
                  <span className={clsx('px-2 py-0.5 text-xs font-medium rounded-full', STATUS_BADGE[loan.status] ?? 'bg-gray-100 text-gray-600')}>
                    {formatLoanStatus(loan.status)}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Submitted {loan.submittedAt ? formatDate(loan.submittedAt) : '—'}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-gray-900">{formatCurrency(loan.requestedAmount)}</p>
                <p className="text-xs text-gray-400">{loan.termMonths} months</p>
              </div>
            </div>
          </button>
        ))
      )}
      <p className="text-xs text-gray-400 text-center pt-1">Refreshes every 30 seconds.</p>
    </div>
  );
}

function LoanReviewDetail({ loan }: { loan: LoanApplication }) {
  const {
    confirmingDecision, rejectReason,
    setConfirmingDecision, setRejectReason, resetReview,
  } = useAdminStore();
  const review = useReviewLoan();

  async function handleDecision(decision: 'approved' | 'rejected') {
    const payload: { id: string; decision: 'approved' | 'rejected'; reason?: string } = { id: loan.id, decision };
    if (rejectReason) payload.reason = rejectReason;
    await review.mutateAsync(payload);
    resetReview();
  }

  return (
    <div className="space-y-4">
      <button onClick={resetReview} className="text-sm text-brand-600 hover:underline flex items-center gap-1">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to queue
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{formatLoanType(loan.type)}</h3>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">{loan.id}</p>
          </div>
          <span className={clsx('px-2.5 py-1 text-xs font-medium rounded-full', STATUS_BADGE[loan.status] ?? 'bg-gray-100 text-gray-600')}>
            {formatLoanStatus(loan.status)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <Field label="Amount" value={formatCurrency(loan.requestedAmount)} />
          <Field label="Term" value={`${loan.termMonths} months`} />
          <Field label="Employment" value={loan.employmentType} />
          <Field label="Annual income" value={formatCurrency(loan.annualIncome)} />
          {loan.employer && <Field label="Employer" value={loan.employer} />}
          {loan.creditScore && <Field label="Credit score" value={String(loan.creditScore)} />}
          <Field label="Submitted" value={loan.submittedAt ? formatDate(loan.submittedAt) : '—'} />
          <Field label="Purpose" value={loan.purpose} />
        </div>

        {confirmingDecision === null ? (
          <div className="flex gap-3 pt-2 border-t border-gray-50">
            <button
              onClick={() => setConfirmingDecision('rejected')}
              className="flex-1 px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-200 rounded-xl hover:bg-red-50"
            >
              Reject
            </button>
            <button
              onClick={() => setConfirmingDecision('approved')}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700"
            >
              Approve
            </button>
          </div>
        ) : confirmingDecision === 'rejected' ? (
          <div className="space-y-3 border-t border-gray-50 pt-4">
            <label className="block text-sm font-medium text-gray-700">Rejection reason</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={2}
              placeholder="Insufficient income, credit score below threshold…"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmingDecision(null)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                disabled={review.isPending}
                onClick={() => void handleDecision('rejected')}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50"
              >
                {review.isPending ? 'Rejecting…' : 'Confirm rejection'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 border-t border-gray-50 pt-4">
            <p className="text-sm text-gray-700">Approve this application for <strong>{formatCurrency(loan.requestedAmount)}</strong>?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmingDecision(null)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                disabled={review.isPending}
                onClick={() => void handleDecision('approved')}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50"
              >
                {review.isPending ? 'Approving…' : 'Confirm approval'}
              </button>
            </div>
          </div>
        )}

        {review.isError && (
          <p className="text-xs text-red-600 text-center">
            {review.error instanceof Error ? review.error.message : 'Action failed. Please try again.'}
          </p>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-900 capitalize">{value}</p>
    </div>
  );
}
