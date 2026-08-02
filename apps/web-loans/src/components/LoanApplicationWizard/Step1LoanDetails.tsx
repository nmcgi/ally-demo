import { LoanType } from '@ally/shared-types';
import { useLoanWizardStore } from '@/store/loanWizardStore';
import { formatLoanType, formatCurrency, estimateMonthlyPayment } from '@/lib/format';
import { WizardNav } from './WizardNav';

const LOAN_TYPES: LoanType[] = ['personal', 'auto', 'home_equity', 'mortgage'];
const TERM_OPTIONS: Record<LoanType, number[]> = {
  personal: [12, 24, 36, 48, 60],
  auto: [24, 36, 48, 60, 72],
  home_equity: [60, 84, 120, 180],
  mortgage: [120, 180, 240, 360],
};
const ESTIMATED_RATES: Record<LoanType, number> = {
  personal: 11.5,
  auto: 7.2,
  home_equity: 8.5,
  mortgage: 6.8,
};

export function Step1LoanDetails() {
  const { form, setForm, setStep } = useLoanWizardStore();

  const amount = parseFloat(form.requestedAmount) || 0;
  const term = parseInt(form.termMonths) || 0;
  const rate = form.type ? ESTIMATED_RATES[form.type as LoanType] ?? 0 : 0;
  const monthly = amount > 0 && term > 0 ? estimateMonthlyPayment(amount, rate, term) : null;

  const termOptions = form.type ? (TERM_OPTIONS[form.type as LoanType] ?? []) : [];

  const isValid =
    form.type &&
    amount >= 500 &&
    amount <= 500_000 &&
    form.termMonths &&
    form.purpose.trim().length >= 3;

  function handleNext(e: React.FormEvent) {
    e.preventDefault();
    if (isValid) setStep(2);
  }

  return (
    <form onSubmit={handleNext} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Loan type</label>
        <div className="grid grid-cols-2 gap-2">
          {LOAN_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setForm({ type: t, termMonths: '' })}
              className={`px-4 py-3 rounded-xl border text-sm font-medium text-left transition-colors ${
                form.type === t
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {formatLoanType(t)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Loan amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
            <input
              type="number"
              min={500}
              max={500000}
              step={100}
              value={form.requestedAmount}
              onChange={(e) => setForm({ requestedAmount: e.target.value })}
              required
              placeholder="10,000"
              className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Term</label>
          <select
            value={form.termMonths}
            onChange={(e) => setForm({ termMonths: e.target.value })}
            required
            disabled={!form.type}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="">Select term…</option>
            {termOptions.map((m) => (
              <option key={m} value={m}>
                {m} months ({Math.floor(m / 12)}y{m % 12 > 0 ? ` ${m % 12}m` : ''})
              </option>
            ))}
          </select>
        </div>
      </div>

      {monthly !== null && (
        <div className="rounded-xl bg-brand-50 border border-brand-100 px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-brand-700">Estimated monthly payment</span>
          <span className="text-lg font-bold text-brand-900">{formatCurrency(monthly)}</span>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Purpose</label>
        <input
          type="text"
          value={form.purpose}
          onChange={(e) => setForm({ purpose: e.target.value })}
          required
          minLength={3}
          maxLength={255}
          placeholder="e.g. Home renovation, new car purchase…"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <WizardNav onBack={null} nextDisabled={!isValid} />
    </form>
  );
}
