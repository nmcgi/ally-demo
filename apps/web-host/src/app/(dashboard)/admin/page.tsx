'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { useAppSelector } from '@/store';
import { RemoteBoundary, RemoteLoader } from '@/components/layout/RemoteBoundary';

const AdminPortal = dynamic(
  () => import('admin/AdminPortal').catch(() => ({ default: MissingRemote })),
  { ssr: false, loading: () => <RemoteLoader /> },
);

function MissingRemote() {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-400">
      <p className="text-lg font-medium">Admin module</p>
      <p className="text-sm mt-1">Start the <code className="font-mono">web-admin</code> remote on port 3003 to load this module.</p>
    </div>
  );
}

function Unauthorized() {
  return (
    <div className="rounded-xl bg-red-50 border border-red-200 p-12 text-center text-red-600">
      <p className="text-lg font-medium">Access denied</p>
      <p className="text-sm mt-1">You do not have permission to view the admin portal.</p>
    </div>
  );
}

export default function AdminPage() {
  const permissions = useAppSelector((s) => s.entitlements.permissions);

  if (!permissions.includes('admin:users')) return <Unauthorized />;

  return (
    <RemoteBoundary name="Admin">
      <Suspense fallback={<RemoteLoader />}>
        <AdminPortal />
      </Suspense>
    </RemoteBoundary>
  );
}
