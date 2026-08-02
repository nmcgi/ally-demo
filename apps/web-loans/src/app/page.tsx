import { ReactQueryDevShell } from './ReactQueryDevShell';
import LoanApplication from '@/components/LoanApplication';

export default function Page() {
  return (
    <ReactQueryDevShell>
      <div className="min-h-screen bg-gray-50 py-8">
        <LoanApplication />
      </div>
    </ReactQueryDevShell>
  );
}
