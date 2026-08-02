'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { RemoteBoundary, RemoteLoader } from '@/components/layout/RemoteBoundary';

const AccountsDashboard = dynamic(
  () => import('accounts/AccountsDashboard').catch(() => ({ default: MissingRemote })),
  { ssr: false, loading: () => <RemoteLoader /> },
);

function MissingRemote() {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-400">
      <p className="text-lg font-medium">Accounts module</p>
      <p className="text-sm mt-1">Start the <code className="font-mono">web-accounts</code> remote on port 3001 to load this module.</p>
    </div>
  );
}

export default function AccountsPage() {
  return (
    <RemoteBoundary name="Accounts">
      <Suspense fallback={<RemoteLoader />}>
        <AccountsDashboard />
      </Suspense>
    </RemoteBoundary>
  );
}
