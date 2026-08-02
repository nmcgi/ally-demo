import { Account } from '@ally/shared-types';
import { useTransferStore } from '@/store/transferStore';
import { useTransfer } from '@/hooks/useAccounts';
import { formatCurrency, formatAccountType } from '@/lib/format';

interface TransferConfirmProps {
  accounts: Account[];
}

export function TransferConfirm({ accounts }: TransferConfirmProps) {
  const { form, setStep, setResult, setError } = useTransferStore();
  const transfer = useTransfer();

  const fromAccount = accounts.find((a) => a.id === form.fromAccountId);
  const toAccount = accounts.find((a) => a.id === form.toAccountId);
  const amount = parseFloat(form.amount);

  async function handleConfirm() {
    try {
      const result = await transfer.mutateAsync({
        fromAccountId: form.fromAccountId,
        toAccountId: form.toAccountId,
        amount,
        ...(form.memo ? { memo: form.memo } : {}),
      });
      setResult(result.transactionId);
    } catch (err: unknown) {
      const msg =
        typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message: string }).message)
          : 'Transfer failed. Please try again.';
      setError(msg);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gray-50 border border-gray-200 p-5 space-y-4">
        <Row label="From" value={fromAccount ? `${formatAccountType(fromAccount.type)} ••••${fromAccount.accountNumber.slice(-4)}` : '—'} />
        <Row label="To" value={toAccount ? `${formatAccountType(toAccount.type)} ••••${toAccount.accountNumber.slice(-4)}` : '—'} />
        <div className="border-t border-gray-200 pt-4">
          <Row label="Amount" value={formatCurrency(amount)} large />
        </div>
        {form.memo && <Row label="Memo" value={form.memo} />}
      </div>

      <p className="text-xs text-gray-500 text-center">
        Transfers between your accounts are instant and cannot be reversed once confirmed.
      </p>

      <div className="flex gap-3">
        <button
          onClick={() => setStep('form')}
          disabled={transfer.isPending}
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={() => void handleConfirm()}
          disabled={transfer.isPending}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {transfer.isPending && (
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {transfer.isPending ? 'Processing…' : 'Confirm transfer'}
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, large }: { label: string; value: string; large?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={large ? 'text-lg font-bold text-gray-900' : 'text-sm font-medium text-gray-900'}>
        {value}
      </span>
    </div>
  );
}
