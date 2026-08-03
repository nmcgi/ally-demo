'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { useAppSelector } from '@/store';
import { RemoteBoundary, RemoteLoader } from '@/components/layout/RemoteBoundary';

const AdminPortal = dynamic(
  () => import('admin/AdminPortal').catch(() => ({ default: MissingRemote })),
  { ssr: false, loading: () => <RemoteLoader /> },
);

function MissingRemote(_props: { role?: string | undefined }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-400">
      <p className="text-lg font-medium">Admin module</p>
      <p className="text-sm mt-1">
        The <code className="font-mono">web-admin</code> module failed to load. With
        <code className="font-mono"> ENABLE_MODULE_FEDERATION=true</code>, check that the remote is
        running on port 3003.
      </p>
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
  const role = useAppSelector((s) => s.entitlements.role);

  if (!permissions.includes('admin:users')) return <Unauthorized />;

  return (
    <RemoteBoundary name="Admin">
      <Suspense fallback={<RemoteLoader />}>
        <AdminPortal role={role ?? undefined} />
      </Suspense>
    </RemoteBoundary>
  );
}
