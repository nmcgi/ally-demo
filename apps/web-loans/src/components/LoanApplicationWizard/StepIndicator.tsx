import { clsx } from 'clsx';
import { WizardStep } from '@/store/loanWizardStore';

const STEPS = [
  { n: 1 as WizardStep, label: 'Loan details' },
  { n: 2 as WizardStep, label: 'Employment' },
  { n: 3 as WizardStep, label: 'Income' },
  { n: 4 as WizardStep, label: 'Review' },
];

export function StepIndicator({ current }: { current: WizardStep }) {
  return (
    <nav aria-label="Application steps">
      <ol className="flex items-center">
        {STEPS.map((s, i) => {
          const done = current > s.n;
          const active = current === s.n;
          return (
            <li key={s.n} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={clsx(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                    done && 'bg-brand-600 text-white',
                    active && 'bg-brand-600 text-white ring-4 ring-brand-100',
                    !done && !active && 'bg-gray-100 text-gray-400',
                  )}
                >
                  {done ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    s.n
                  )}
                </div>
                <span className={clsx('text-xs font-medium hidden sm:block', active ? 'text-brand-700' : 'text-gray-400')}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={clsx('flex-1 h-0.5 mx-2 mb-4 rounded', done ? 'bg-brand-600' : 'bg-gray-200')} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
