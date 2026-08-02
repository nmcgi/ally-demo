'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { RemoteBoundary, RemoteLoader } from '@/components/layout/RemoteBoundary';

const LoanApplication = dynamic(
  () => import('loans/LoanApplication').catch(() => ({ default: MissingRemote })),
  { ssr: false, loading: () => <RemoteLoader /> },
);

function MissingRemote() {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-400">
      <p className="text-lg font-medium">Loans module</p>
      <p className="text-sm mt-1">Start the <code className="font-mono">web-loans</code> remote on port 3002 to load this module.</p>
    </div>
  );
}

export default function LoansPage() {
  return (
    <RemoteBoundary name="Loans">
      <Suspense fallback={<RemoteLoader />}>
        <LoanApplication />
      </Suspense>
    </RemoteBoundary>
  );
}
