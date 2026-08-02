import { Transaction } from '@ally/shared-types';
import { formatCurrency, formatDate } from '@/lib/format';
import { clsx } from 'clsx';

const TYPE_LABELS: Record<string, string> = {
  debit: 'Purchase',
  credit: 'Deposit',
  transfer_in: 'Transfer In',
  transfer_out: 'Transfer Out',
  fee: 'Fee',
  interest: 'Interest',
};

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  posted: '',
  failed: 'bg-red-100 text-red-700',
  reversed: 'bg-gray-100 text-gray-500',
};

interface TransactionItemProps {
  transaction: Transaction;
}

export function TransactionItem({ transaction: tx }: TransactionItemProps) {
  const isCredit = ['credit', 'transfer_in', 'interest'].includes(tx.type);
  const badge = STATUS_BADGE[tx.status];

  return (
    <div className="flex items-center justify-between py-3.5 gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900 truncate">
            {tx.merchantName ?? tx.description}
          </p>
          {badge && (
            <span className={clsx('text-xs px-1.5 py-0.5 rounded-full font-medium', badge)}>
              {tx.status}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-400">{TYPE_LABELS[tx.type] ?? tx.type}</span>
          {tx.category && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-xs text-gray-400">{tx.category}</span>
            </>
          )}
          <span className="text-gray-300">·</span>
          <span className="text-xs text-gray-400">
            {tx.postedAt ? formatDate(tx.postedAt) : formatDate(tx.createdAt)}
          </span>
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className={clsx('text-sm font-semibold tabular-nums', isCredit ? 'text-emerald-600' : 'text-gray-900')}>
          {isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
        </p>
        <p className="text-xs text-gray-400 tabular-nums mt-0.5">
          Bal {formatCurrency(tx.balance)}
        </p>
      </div>
    </div>
  );
}
