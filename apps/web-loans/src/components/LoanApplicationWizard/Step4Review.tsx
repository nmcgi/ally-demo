import { useLoanWizardStore } from '@/store/loanWizardStore';
import { useCreateLoan, useSubmitLoan } from '@/hooks/useLoans';
import { formatCurrency, formatLoanType, formatEmploymentType, estimateMonthlyPayment } from '@/lib/format';
import { LoanType, EmploymentType } from '@ally/shared-types';

const ESTIMATED_RATES: Record<string, number> = {
  personal: 11.5, auto: 7.2, home_equity: 8.5, mortgage: 6.8,
};

export function Step4Review() {
  const { form, setStep, setSubmitting, setSubmittedId, setError, isSubmitting } = useLoanWizardStore();
  const createLoan = useCreateLoan();
  const submitLoan = useSubmitLoan();

  const amount = parseFloat(form.requestedAmount);
  const term = parseInt(form.termMonths);
  const income = parseFloat(form.annualIncome);
  const rate = ESTIMATED_RATES[form.type] ?? 0;
  const monthly = estimateMonthlyPayment(amount, rate, term);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const loan = await createLoan.mutateAsync({
        type: form.type as LoanType,
        requestedAmount: amount,
        termMonths: term,
        purpose: form.purpose,
        annualIncome: income,
        employmentType: form.employmentType as EmploymentType,
        ...(form.employer ? { employer: form.employer } : {}),
      });

      await submitLoan.mutateAsync(loan.id);
      setSubmittedId(loan.id);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Submission failed. Please try again.';
      setError(msg);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 divide-y divide-gray-100">
        <Section title="Loan details">
          <Row label="Type" value={formatLoanType(form.type)} />
          <Row label="Amount" value={formatCurrency(amount)} />
          <Row label="Term" value={`${term} months`} />
          <Row label="Purpose" value={form.purpose} />
          <Row label="Est. rate" value={`${rate}% APR`} note="Indicative only" />
          <Row label="Est. monthly payment" value={formatCurrency(monthly)} emphasis />
        </Section>

        <Section title="Employment & income">
          <Row label="Employment" value={formatEmploymentType(form.employmentType)} />
          {form.employer && <Row label="Employer" value={form.employer} />}
          <Row label="Annual income" value={formatCurrency(income)} />
        </Section>
      </div>

      <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-xs text-amber-700 space-y-1">
        <p className="font-medium">Before you submit</p>
        <p>By submitting this application you authorise Ally Demo to perform a soft credit inquiry. This will not affect your credit score. A hard inquiry is performed only if you accept a loan offer.</p>
      </div>

      {isSubmitting && (
        <div className="text-center text-sm text-gray-500 py-2">Submitting your application…</div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => setStep(3)}
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={() => void handleSubmit()}
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting && (
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          Submit application
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value, note, emphasis }: { label: string; value: string; note?: string; emphasis?: boolean }) {
  return (
    <div className="flex justify-between items-baseline gap-4">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span className={`text-sm text-right ${emphasis ? 'font-semibold text-gray-900' : 'text-gray-900'}`}>
        {value}
        {note && <span className="text-xs text-gray-400 ml-1">({note})</span>}
      </span>
    </div>
  );
}
