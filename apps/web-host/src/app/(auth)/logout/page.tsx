'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store';
import { clearCredentials } from '@/store/slices/authSlice';
import { clearEntitlements } from '@/store/slices/entitlementsSlice';
import { clearTokens } from '@/lib/auth';
import { Spinner } from '@/components/ui';

export default function LogoutPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  useEffect(() => {
    clearTokens();
    dispatch(clearCredentials());
    dispatch(clearEntitlements());
    router.replace('/login');
  }, [dispatch, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
