'use client';

import { useState } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { TransactionItem } from './TransactionItem';

const PAGE_SIZE = 25;

interface TransactionListProps {
  accountId: string;
}

export function TransactionList({ accountId }: TransactionListProps) {
  const [offset, setOffset] = useState(0);
  const { data, isLoading, isError } = useTransactions(accountId, { limit: PAGE_SIZE, offset });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center text-red-600 text-sm">
        Failed to load transactions.
      </div>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 p-10 text-center text-gray-400 text-sm">
        No transactions yet.
      </div>
    );
  }

  const hasMore = offset + PAGE_SIZE < data.total;
  const hasPrev = offset > 0;

  return (
    <div>
      <div className="divide-y divide-gray-100">
        {data.data.map((tx) => (
          <TransactionItem key={tx.id} transaction={tx} />
        ))}
      </div>

      {(hasPrev || hasMore) && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
            disabled={!hasPrev}
            className="text-sm text-brand-600 hover:underline disabled:opacity-40 disabled:no-underline"
          >
            ← Previous
          </button>
          <span className="text-xs text-gray-400">
            {offset + 1}–{Math.min(offset + PAGE_SIZE, data.total)} of {data.total}
          </span>
          <button
            onClick={() => setOffset((o) => o + PAGE_SIZE)}
            disabled={!hasMore}
            className="text-sm text-brand-600 hover:underline disabled:opacity-40 disabled:no-underline"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
