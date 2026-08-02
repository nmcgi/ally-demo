'use client';

import { useLoanWizardStore } from '@/store/loanWizardStore';
import { StepIndicator } from './StepIndicator';
import { Step1LoanDetails } from './Step1LoanDetails';
import { Step2Employment } from './Step2Employment';
import { Step3Income } from './Step3Income';
import { Step4Review } from './Step4Review';

export function LoanApplicationWizard() {
  const { step, reset } = useLoanWizardStore();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Apply for a loan</h2>
        <p className="text-sm text-gray-500">Complete all steps to submit your application.</p>
      </div>

      <StepIndicator current={step} />

      <div className="pt-2">
        {step === 1 && <Step1LoanDetails />}
        {step === 2 && <Step2Employment />}
        {step === 3 && <Step3Income />}
        {step === 4 && <Step4Review />}
      </div>

      {step > 1 && (
        <button
          onClick={reset}
          className="text-xs text-gray-400 hover:text-gray-600 hover:underline"
        >
          Start over
        </button>
      )}
    </div>
  );
}
