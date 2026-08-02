'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import { setCredentials, clearCredentials, setLoading } from '@/store/slices/authSlice';
import { setEntitlements, clearEntitlements } from '@/store/slices/entitlementsSlice';
import { getAccessToken, getRefreshToken, parseJwt, isTokenExpired } from '@/lib/auth';
import apiClient from '@/lib/api-client';
import { LoginResponse } from '@ally/shared-types';
import { Spinner } from '@/components/ui';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAppSelector((s) => s.auth);

  useEffect(() => {
    async function restoreSession() {
      const accessToken = getAccessToken();
      const refreshToken = getRefreshToken();

      if (!accessToken && !refreshToken) {
        dispatch(clearCredentials());
        router.replace('/login');
        return;
      }

      let validToken = accessToken;

      if (!accessToken || isTokenExpired(accessToken)) {
        if (!refreshToken) {
          dispatch(clearCredentials());
          router.replace('/login');
          return;
        }
        try {
          const res = await apiClient.post<LoginResponse>('/auth/refresh', { refreshToken });
          validToken = res.data.accessToken;
        } catch {
          dispatch(clearCredentials());
          dispatch(clearEntitlements());
          router.replace('/login');
          return;
        }
      }

      const user = validToken ? parseJwt(validToken) : null;
      if (!user || !validToken) {
        dispatch(clearCredentials());
        router.replace('/login');
        return;
      }

      dispatch(setCredentials({ user, accessToken: validToken }));
      dispatch(setEntitlements(user.role));
    }

    if (!isAuthenticated) {
      void restoreSession();
    } else {
      dispatch(setLoading(false));
    }
  }, [dispatch, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
