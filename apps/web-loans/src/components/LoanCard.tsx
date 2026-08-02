'use client';

import { LoanApplication } from '@ally/shared-types';
import { formatCurrency, formatLoanType, formatDate } from '@/lib/format';
import { clsx } from 'clsx';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-600' },
  submitted: { label: 'Submitted', className: 'bg-blue-100 text-blue-700' },
  kyc_pending: { label: 'KYC pending', className: 'bg-yellow-100 text-yellow-700' },
  kyc_approved: { label: 'KYC approved', className: 'bg-yellow-100 text-yellow-700' },
  kyc_failed: { label: 'KYC failed', className: 'bg-red-100 text-red-700' },
  credit_check_pending: { label: 'Credit check', className: 'bg-yellow-100 text-yellow-700' },
  credit_check_approved: { label: 'Credit approved', className: 'bg-yellow-100 text-yellow-700' },
  credit_check_failed: { label: 'Credit failed', className: 'bg-red-100 text-red-700' },
  underwriting: { label: 'Underwriting', className: 'bg-purple-100 text-purple-700' },
  approved: { label: 'Approved', className: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
  disbursed: { label: 'Disbursed', className: 'bg-emerald-100 text-emerald-700' },
  closed: { label: 'Closed', className: 'bg-gray-100 text-gray-500' },
};

const IN_PROGRESS_STATUSES = ['submitted', 'kyc_pending', 'kyc_approved', 'credit_check_pending', 'credit_check_approved', 'underwriting'];

interface Props {
  loan: LoanApplication;
  onClick?: () => void;
}

export function LoanCard({ loan, onClick }: Props) {
  const config = STATUS_CONFIG[loan.status] ?? { label: loan.status, className: 'bg-gray-100 text-gray-600' };
  const inProgress = IN_PROGRESS_STATUSES.includes(loan.status);

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-brand-200 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-brand-500"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900 text-sm truncate">{formatLoanType(loan.type)}</span>
            <span className={clsx('px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap', config.className)}>
              {inProgress && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-current mr-1 animate-pulse" />
              )}
              {config.label}
            </span>
          </div>
          <p className="text-xs text-gray-400 truncate">Applied {formatDate(loan.createdAt)}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-gray-900">{formatCurrency(loan.requestedAmount)}</p>
          <p className="text-xs text-gray-400">{loan.termMonths} months</p>
        </div>
      </div>

      {loan.purpose && (
        <p className="mt-3 text-xs text-gray-500 truncate border-t border-gray-50 pt-3">
          {loan.purpose}
        </p>
      )}
    </button>
  );
}
