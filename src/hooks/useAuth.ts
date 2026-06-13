'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types/auth.types';

const REFRESH_BEFORE_EXPIRY_MS = 2 * 60 * 1000; // 2 minutes
const ACCESS_TOKEN_TTL_MS      = 15 * 60 * 1000; // 15 minutes

// ─── Deduplicate concurrent refresh calls with a shared promise ───────────────
let refreshPromise: Promise<boolean> | null = null;

async function callRefreshEndpoint(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
      if (!res.ok) return false;

      const data = await res.json() as { user?: unknown; csrfToken?: string };

      if (data.user) {
        useAuthStore.getState().setUser(data.user as import('@/types/auth.types').User);
      }
      if (data.csrfToken) {
        useAuthStore.getState().setCsrfToken(data.csrfToken);
      }

      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ─── Public hook ──────────────────────────────────────────────────────────────

export function useAuth() {
  const {
    user,
    csrfToken,
    isLoading,
    isAuthenticated,
    setUser,
    setCsrfToken,
    setLoading,
    logout: storeLogout,
  } = useAuthStore();

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Schedule the next silent refresh 2 minutes before token expiry
  const scheduleRefresh = useCallback((offsetMs = ACCESS_TOKEN_TTL_MS) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

    const delay = Math.max(offsetMs - REFRESH_BEFORE_EXPIRY_MS, 30_000);

    refreshTimerRef.current = setTimeout(async () => {
      const ok = await callRefreshEndpoint();
      if (ok) {
        scheduleRefresh(); // reschedule for the next cycle
      } else {
        storeLogout();
      }
    }, delay);
  }, [storeLogout]);

  // On mount: verify we have a live session via a silent refresh
  useEffect(() => {
    if (!isAuthenticated) return;

    setLoading(true);
    callRefreshEndpoint()
      .then((ok) => {
        if (!ok) storeLogout();
        else scheduleRefresh();
      })
      .finally(() => setLoading(false));

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<{ error?: string }> => {
      setLoading(true);
      try {
        const res = await fetch('/api/auth/login', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email, password }),
          credentials: 'include',
        });

        const data = await res.json() as {
          user?: unknown;
          csrfToken?: string;
          error?: string;
        };

        if (!res.ok) return { error: data.error ?? 'Login failed' };

        if (data.user)      setUser(data.user as import('@/types/auth.types').User);
        if (data.csrfToken) setCsrfToken(data.csrfToken);

        scheduleRefresh();
        return {};
      } catch {
        return { error: 'Network error. Please try again.' };
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setUser, setCsrfToken, scheduleRefresh]
  );

  const logout = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', {
        method:  'POST',
        headers: csrfToken ? { 'x-csrf-token': csrfToken } : {},
        credentials: 'include',
      });
    } finally {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      storeLogout();
      setLoading(false);
    }
  }, [csrfToken, storeLogout, setLoading]);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    return callRefreshEndpoint();
  }, []);

  return {
    user,
    role:            user?.role as UserRole | undefined,
    isLoading,
    isAuthenticated,
    csrfToken,
    login,
    logout,
    refreshToken,
  };
}
