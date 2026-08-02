import { Account } from '@ally/shared-types';
import { formatCurrency, formatAccountType } from '@/lib/format';
import { clsx } from 'clsx';

const ACCOUNT_COLORS: Record<string, string> = {
  checking: 'from-brand-700 to-brand-900',
  savings: 'from-emerald-600 to-emerald-900',
  money_market: 'from-violet-600 to-violet-900',
};

interface AccountCardProps {
  account: Account;
  selected: boolean;
  onClick: () => void;
}

export function AccountCard({ account, selected, onClick }: AccountCardProps) {
  const gradient = ACCOUNT_COLORS[account.type] ?? 'from-gray-600 to-gray-900';

  return (
    <button
      onClick={onClick}
      className={clsx(
        'relative w-full text-left rounded-2xl p-6 bg-gradient-to-br text-white transition-all duration-150',
        gradient,
        selected ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-100 shadow-lg scale-[1.02]' : 'shadow hover:shadow-md hover:scale-[1.01]',
      )}
    >
      <div className="flex justify-between items-start mb-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest opacity-75">
            {formatAccountType(account.type)}
          </p>
          <p className="text-sm opacity-60 mt-0.5">
            ••••{account.accountNumber.slice(-4)}
          </p>
        </div>
        {account.nickname && (
          <span className="text-xs bg-white/20 px-2 py-1 rounded-full">{account.nickname}</span>
        )}
      </div>

      <div>
        <p className="text-xs opacity-75 mb-0.5">Available balance</p>
        <p className="text-3xl font-bold tracking-tight">
          {formatCurrency(account.availableBalance, account.currency)}
        </p>
        {account.availableBalance !== account.balance && (
          <p className="text-xs opacity-60 mt-1">
            Total: {formatCurrency(account.balance, account.currency)}
          </p>
        )}
      </div>
    </button>
  );
}
