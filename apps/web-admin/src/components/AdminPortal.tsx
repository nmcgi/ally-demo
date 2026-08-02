'use client';

import { useAdminStore } from '@/store/adminStore';
import { UserSearch } from './UserSearch';
import { LoanReviewQueue } from './LoanReviewQueue';

interface Props {
  /** Role from Redux host shell — only 'admin' may take review actions */
  role?: string;
}

export default function AdminPortal({ role }: Props) {
  const { tab, setTab } = useAdminStore();

  const isAdmin = role === 'admin';

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-gray-900">Admin portal</h1>
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
            {isAdmin ? 'Admin' : 'Support'}
          </span>
        </div>
        <p className="text-sm text-gray-500">Internal tools — restricted to admin and support roles.</p>
      </div>

      <div className="flex border-b border-gray-200">
        {([
          { key: 'loans', label: 'Loan review queue' },
          { key: 'customers', label: 'Customer search' },
        ] as { key: 'loans' | 'customers'; label: string }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'loans' && (
        isAdmin ? (
          <LoanReviewQueue />
        ) : (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl px-6 py-8 text-center">
            <p className="text-sm font-medium text-amber-700 mb-1">Read-only access</p>
            <p className="text-xs text-amber-600">Approve / reject actions require the Admin role.</p>
          </div>
        )
      )}

      {tab === 'customers' && <UserSearch />}
    </div>
  );
}
