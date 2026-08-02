import { Account } from '@ally/shared-types';
import { useTransferStore } from '@/store/transferStore';
import { formatCurrency, formatAccountType } from '@/lib/format';

interface TransferFormProps {
  accounts: Account[];
  onCancel: () => void;
}

export function TransferForm({ accounts, onCancel }: TransferFormProps) {
  const { form, setForm, setStep } = useTransferStore();

  const activeAccounts = accounts.filter((a) => a.isActive);
  const toAccounts = activeAccounts.filter((a) => a.id !== form.fromAccountId);
  const fromAccount = activeAccounts.find((a) => a.id === form.fromAccountId);

  const amount = parseFloat(form.amount);
  const isValid =
    form.fromAccountId &&
    form.toAccountId &&
    form.fromAccountId !== form.toAccountId &&
    amount > 0 &&
    fromAccount &&
    amount <= fromAccount.availableBalance;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isValid) setStep('confirm');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">From account</label>
        <select
          value={form.fromAccountId}
          onChange={(e) => setForm({ fromAccountId: e.target.value, toAccountId: '' })}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Select account…</option>
          {activeAccounts.map((a) => (
            <option key={a.id} value={a.id}>
              {formatAccountType(a.type)} ••••{a.accountNumber.slice(-4)} —{' '}
              {formatCurrency(a.availableBalance)} available
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">To account</label>
        <select
          value={form.toAccountId}
          onChange={(e) => setForm({ toAccountId: e.target.value })}
          required
          disabled={!form.fromAccountId}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50 disabled:text-gray-400"
        >
          <option value="">Select account…</option>
          {toAccounts.map((a) => (
            <option key={a.id} value={a.id}>
              {formatAccountType(a.type)} ••••{a.accountNumber.slice(-4)} —{' '}
              {formatCurrency(a.balance)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ amount: e.target.value })}
            required
            placeholder="0.00"
            className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        {fromAccount && amount > fromAccount.availableBalance && (
          <p className="text-xs text-red-600 mt-1">Exceeds available balance of {formatCurrency(fromAccount.availableBalance)}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Memo <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          maxLength={140}
          value={form.memo}
          onChange={(e) => setForm({ memo: e.target.value })}
          placeholder="e.g. Rent, Savings transfer…"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isValid}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Review transfer
        </button>
      </div>
    </form>
  );
}
