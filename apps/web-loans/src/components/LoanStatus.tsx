'use client';

import { useLoan } from '@/hooks/useLoans';
import { formatCurrency, formatLoanType, formatDate, estimateMonthlyPayment } from '@/lib/format';
import { clsx } from 'clsx';

const STEPS = [
  { key: 'submitted', label: 'Application submitted' },
  { key: 'kyc_pending', label: 'Identity verification' },
  { key: 'credit_check_pending', label: 'Credit check' },
  { key: 'underwriting', label: 'Underwriting review' },
  { key: 'approved', label: 'Decision' },
];

const STATUS_ORDER = [
  'draft', 'submitted',
  'kyc_pending', 'kyc_approved', 'kyc_failed',
  'credit_check_pending', 'credit_check_approved', 'credit_check_failed',
  'underwriting', 'approved', 'rejected', 'disbursed', 'closed',
];

const ESTIMATED_RATES: Record<string, number> = {
  personal: 11.5, auto: 7.2, home_equity: 8.5, mortgage: 6.8,
};

interface Props {
  loanId: string;
  onBack?: () => void;
}

export function LoanStatusPanel({ loanId, onBack }: Props) {
  const { data: loan, isLoading, error } = useLoan(loanId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <svg className="animate-spin h-6 w-6 text-brand-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (error || !loan) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-6 text-center">
        <p className="text-sm text-red-700 font-medium">Unable to load loan status.</p>
        {onBack && (
          <button onClick={onBack} className="mt-3 text-sm text-brand-600 hover:underline">← Back to loans</button>
        )}
      </div>
    );
  }

  const currentIdx = STATUS_ORDER.indexOf(loan.status);
  const isTerminal = ['approved', 'rejected', 'disbursed', 'closed', 'kyc_failed', 'credit_check_failed'].includes(loan.status);
  const rate = ESTIMATED_RATES[loan.type] ?? 0;
  const monthly = estimateMonthlyPayment(loan.requestedAmount, rate, loan.termMonths);

  return (
    <div className="space-y-6">
      {onBack && (
        <button onClick={onBack} className="text-sm text-brand-600 hover:underline flex items-center gap-1">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to loans
        </button>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{formatLoanType(loan.type)}</h3>
            <p className="text-sm text-gray-500 mt-0.5">Applied {formatDate(loan.createdAt)}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(loan.requestedAmount)}</p>
            <p className="text-xs text-gray-400">{loan.termMonths} months · {formatCurrency(monthly)}/mo</p>
          </div>
        </div>

        {loan.status === 'rejected' ? (
          <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-4">
            <p className="text-sm font-semibold text-red-700 mb-1">Application not approved</p>
            <p className="text-xs text-red-600">We were unable to approve this application at this time. A letter will be sent to the address on file explaining the decision.</p>
          </div>
        ) : loan.status === 'approved' || loan.status === 'disbursed' ? (
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-4">
            <p className="text-sm font-semibold text-emerald-700 mb-1">
              {loan.status === 'disbursed' ? 'Loan disbursed' : 'Loan approved!'}
            </p>
            <p className="text-xs text-emerald-600">
              {loan.status === 'disbursed'
                ? `Funds have been deposited. Your first payment is due 30 days from disbursement.`
                : 'Review and sign your loan agreement to receive your funds.'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-xs text-gray-400 mb-3">Application progress</p>
            {STEPS.map((s, i) => {
              const stepIdx = STATUS_ORDER.indexOf(s.key);
              const done = currentIdx > stepIdx || (currentIdx === stepIdx && isTerminal);
              const active = currentIdx === stepIdx && !isTerminal;
              return (
                <div key={s.key} className="flex items-center gap-3">
                  <div className={clsx(
                    'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
                    done && 'bg-brand-600',
                    active && 'bg-white border-2 border-brand-600',
                    !done && !active && 'bg-gray-100',
                  )}>
                    {done ? (
                      <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : active ? (
                      <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse" />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={clsx('text-sm', active ? 'text-gray-900 font-medium' : done ? 'text-gray-600' : 'text-gray-300')}>
                      {s.label}
                    </p>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={clsx('absolute left-[2.25rem] w-px h-4 mt-6', done ? 'bg-brand-300' : 'bg-gray-100')} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!isTerminal && (
          <p className="text-xs text-gray-400 text-center">
            Status updates automatically every 10 seconds.
          </p>
        )}
      </div>
    </div>
  );
}
