'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import { clearCredentials } from '@/store/slices/authSlice';
import { clearEntitlements } from '@/store/slices/entitlementsSlice';
import { clearTokens } from '@/lib/auth';
import { Button } from '@/components/ui';

export function Header() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useAppSelector((s) => s.auth.user);

  function handleLogout() {
    clearTokens();
    dispatch(clearCredentials());
    dispatch(clearEntitlements());
    router.push('/login');
  }

  return (
    <header className="bg-brand-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/accounts" className="text-xl font-bold tracking-tight hover:text-brand-100 transition-colors">
          Ally Demo
        </Link>

        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-brand-100">
              {user.email}
              <span className="ml-2 px-2 py-0.5 text-xs bg-brand-700 rounded-full capitalize">
                {user.role}
              </span>
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white hover:text-brand-900">
              Sign out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
