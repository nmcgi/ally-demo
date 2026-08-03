'use client';

import { LoanStatusPanel } from './LoanStatus';

interface Props {
  loanId: string;
}

export default function LoanStatusEntry({ loanId }: Props) {
  return (
    <div className="max-w-2xl mx-auto">
      <LoanStatusPanel loanId={loanId} />
    </div>
  );
}
