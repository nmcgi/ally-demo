'use client';

import { useUserSearch, useUserAccounts } from '@/hooks/useAdmin';
import { useAdminStore } from '@/store/adminStore';
import { formatDate, formatRole, formatCurrency } from '@/lib/format';
import { User, Account } from '@ally/shared-types';
import { clsx } from 'clsx';

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  support: 'bg-blue-100 text-blue-700',
  customer: 'bg-gray-100 text-gray-600',
};

export function UserSearch() {
  const { searchQuery, selectedUser, setSearchQuery, setSelectedUser } = useAdminStore();
  const { data: users = [], isFetching } = useUserSearch(searchQuery);
  const { data: accounts = [], isLoading: loadingAccounts } = useUserAccounts(selectedUser?.id ?? null);

  return (
    <div className="space-y-4">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        {isFetching && (
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
      </div>

      {searchQuery.length >= 2 && !selectedUser && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {users.length === 0 && !isFetching ? (
            <p className="px-4 py-6 text-sm text-gray-400 text-center">No customers found.</p>
          ) : (
            users.map((u) => (
              <button
                key={u.id}
                onClick={() => setSelectedUser(u)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between gap-4 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{u.firstName} {u.lastName}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                </div>
                <span className={clsx('px-2 py-0.5 text-xs font-medium rounded-full shrink-0', ROLE_BADGE[u.role] ?? 'bg-gray-100 text-gray-600')}>
                  {formatRole(u.role)}
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {selectedUser && (
        <CustomerDetail
          user={selectedUser}
          accounts={accounts}
          loading={loadingAccounts}
          onBack={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}

function CustomerDetail({
  user, accounts, loading, onBack,
}: {
  user: User;
  accounts: Account[];
  loading: boolean;
  onBack: () => void;
}) {
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm text-brand-600 hover:underline flex items-center gap-1">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to results
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{user.firstName} {user.lastName}</h3>
            <p className="text-sm text-gray-500">{user.email}</p>
            <p className="text-xs text-gray-400 mt-1">Member since {formatDate(user.createdAt)}</p>
          </div>
          <span className={clsx('px-2.5 py-1 text-xs font-semibold rounded-full', ROLE_BADGE[user.role] ?? 'bg-gray-100 text-gray-600')}>
            {formatRole(user.role)}
          </span>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Accounts</p>
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : accounts.length === 0 ? (
            <p className="text-sm text-gray-400">No accounts found.</p>
          ) : (
            <div className="space-y-2">
              {accounts.map((a) => (
                <AccountRow key={a.id} account={a} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AccountRow({ account }: { account: Account }) {
  const typeLabel: Record<string, string> = { checking: 'Checking', savings: 'Savings', money_market: 'Money market' };
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl">
      <div>
        <p className="text-sm font-medium text-gray-900">{typeLabel[account.type] ?? account.type}</p>
        <p className="text-xs text-gray-400 font-mono">{account.accountNumber}</p>
      </div>
      <p className="text-sm font-semibold text-gray-900">{formatCurrency(account.balance)}</p>
    </div>
  );
}
