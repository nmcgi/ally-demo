'use client';

import { LoanStatusPanel } from './LoanStatus';

interface Props {
  loanId: string;
}

export default function LoanStatusEntry({ loanId }: Props) {
  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6">
      <LoanStatusPanel loanId={loanId} />
    </div>
  );
}
