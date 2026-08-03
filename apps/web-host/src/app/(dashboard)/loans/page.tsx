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
      <p className="text-sm mt-1">
        The <code className="font-mono">web-loans</code> module failed to load. With
        <code className="font-mono"> ENABLE_MODULE_FEDERATION=true</code>, check that the remote is
        running on port 3002.
      </p>
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
