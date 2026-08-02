import { useLoanWizardStore } from '@/store/loanWizardStore';
import { formatCurrency } from '@/lib/format';
import { WizardNav } from './WizardNav';

const INCOME_PRESETS = [30_000, 50_000, 75_000, 100_000, 150_000, 200_000];

export function Step3Income() {
  const { form, setForm, setStep } = useLoanWizardStore();

  const income = parseFloat(form.annualIncome) || 0;
  const loanAmount = parseFloat(form.requestedAmount) || 0;
  const termN = parseFloat(form.termMonths) || 12;
  const dti = income > 0 ? ((loanAmount / termN) / (income / 12)) * 100 : null;

  const isValid = income >= 0;

  function handleNext(e: React.FormEvent) {
    e.preventDefault();
    if (isValid) setStep(4);
  }

  return (
    <form onSubmit={handleNext} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Annual income (before tax)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
          <input
            type="number"
            min={0}
            step={1000}
            value={form.annualIncome}
            onChange={(e) => setForm({ annualIncome: e.target.value })}
            required
            placeholder="75,000"
            className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {INCOME_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setForm({ annualIncome: String(p) })}
              className="px-2.5 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
            >
              {formatCurrency(p)}
            </button>
          ))}
        </div>
      </div>

      {income > 0 && loanAmount > 0 && dti !== null && (
        <div className={`rounded-xl border px-4 py-3 ${dti < 36 ? 'bg-emerald-50 border-emerald-100' : dti < 50 ? 'bg-yellow-50 border-yellow-100' : 'bg-red-50 border-red-100'}`}>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Estimated debt-to-income ratio</span>
            <span className={`text-sm font-bold ${dti < 36 ? 'text-emerald-700' : dti < 50 ? 'text-yellow-700' : 'text-red-700'}`}>
              {dti.toFixed(1)}%
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {dti < 36 ? 'Excellent — strong approval odds.' : dti < 50 ? 'Fair — may require additional review.' : 'High — approval may be challenging.'}
          </p>
        </div>
      )}

      <p className="text-xs text-gray-400">
        Your income is used solely for creditworthiness assessment and will not be shared with third parties.
      </p>

      <WizardNav onBack={() => setStep(2)} nextDisabled={!isValid} nextLabel="Review application" />
    </form>
  );
}
