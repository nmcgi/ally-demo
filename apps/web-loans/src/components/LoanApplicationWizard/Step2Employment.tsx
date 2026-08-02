import { EmploymentType } from '@ally/shared-types';
import { useLoanWizardStore } from '@/store/loanWizardStore';
import { formatEmploymentType } from '@/lib/format';
import { WizardNav } from './WizardNav';

const EMPLOYMENT_TYPES: EmploymentType[] = ['employed', 'self_employed', 'retired', 'student', 'unemployed'];
const NEEDS_EMPLOYER: EmploymentType[] = ['employed', 'self_employed'];

export function Step2Employment() {
  const { form, setForm, setStep } = useLoanWizardStore();

  const needsEmployer = form.employmentType && NEEDS_EMPLOYER.includes(form.employmentType as EmploymentType);

  const isValid =
    form.employmentType &&
    (!needsEmployer || form.employer.trim().length >= 2);

  function handleNext(e: React.FormEvent) {
    e.preventDefault();
    if (isValid) setStep(3);
  }

  return (
    <form onSubmit={handleNext} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Employment status</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {EMPLOYMENT_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setForm({ employmentType: t, employer: '' })}
              className={`px-3 py-2.5 rounded-xl border text-sm font-medium text-left transition-colors ${
                form.employmentType === t
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {formatEmploymentType(t)}
            </button>
          ))}
        </div>
      </div>

      {needsEmployer && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {form.employmentType === 'self_employed' ? 'Business name' : 'Employer name'}
          </label>
          <input
            type="text"
            value={form.employer}
            onChange={(e) => setForm({ employer: e.target.value })}
            required
            minLength={2}
            maxLength={100}
            placeholder={form.employmentType === 'self_employed' ? 'Acme LLC' : 'Acme Corp'}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      )}

      <WizardNav onBack={() => setStep(1)} nextDisabled={!isValid} />
    </form>
  );
}
