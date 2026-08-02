'use client';

import { useAccounts } from '@/hooks/useAccounts';
import { useTransferStore } from '@/store/transferStore';
import { useAccountsStore } from '@/store/accountsStore';
import { AccountCard } from './AccountCard';
import { TransactionList } from './TransactionList';
import { TransferWizard } from './TransferWizard';

export default function AccountsDashboard() {
  const { data: accounts, isLoading, isError } = useAccounts();
  const { selectedAccountId, setSelectedAccountId } = useAccountsStore();
  const openTransfer = useTransferStore((s) => s.open);

  const selectedAccount = accounts?.find((a) => a.id === selectedAccountId) ?? accounts?.[0] ?? null;
  const activeAccountId = selectedAccount?.id ?? null;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-gray-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !accounts) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-8 text-center text-red-700">
        <p className="font-medium">Could not load accounts.</p>
        <p className="text-sm mt-1 text-red-500">Check your connection or sign in again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Account cards */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Your accounts</h2>
          {accounts.length > 0 && (
            <button
              onClick={openTransfer}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Transfer
            </button>
          )}
        </div>

        {accounts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-400 text-sm">
            No accounts found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                selected={account.id === (selectedAccountId ?? accounts[0]?.id)}
                onClick={() => setSelectedAccountId(account.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Transactions for selected account */}
      {selectedAccount && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent transactions</h2>
            <span className="text-sm text-gray-400">
              ••••{selectedAccount.accountNumber.slice(-4)}
            </span>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4">
            <TransactionList accountId={activeAccountId!} />
          </div>
        </section>
      )}

      {/* Transfer modal */}
      {accounts.length > 0 && <TransferWizard accounts={accounts} />}
    </div>
  );
}
