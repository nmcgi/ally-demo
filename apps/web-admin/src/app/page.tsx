import { ReactQueryDevShell } from './ReactQueryDevShell';
import AdminPortal from '@/components/AdminPortal';

export default function Page() {
  return (
    <ReactQueryDevShell>
      <div className="min-h-screen bg-gray-50 py-8">
        <AdminPortal role="admin" />
      </div>
    </ReactQueryDevShell>
  );
}
