import { ProfileService } from '@helsoft/supabase-services';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { useApiKey } from './use-api-key';
import type { UseProfileResult } from './use-profile.types';
import { useSessionGate } from './use-session-gate';

/** Query key for a learner's profile+plan, scoped by user id (D1) — never leaks across users. */
export const profileQueryKey = (userId: string) => ['profile', userId] as const;

/**
 * React integration over ProfileService: loads the profile+plan join for an authenticated user
 * under a per-user cache key, composed with useSession + useApiKey so `isLoading` ORs all three
 * sources and `canCreate` mirrors the api-key's `hasKey`. Two consumers under the same
 * QueryClient share one read — no provider needed (s58).
 */
export const useProfile = (): UseProfileResult => {
  const { sessionUserId, enabled, deriveIsLoading } = useSessionGate();
  const { hasKey, isLoading: isApiKeyLoading } = useApiKey();

  const {
    data,
    isPending,
    error: queryError,
    refetch: queryRefetch,
  } = useQuery({
    queryKey: profileQueryKey(sessionUserId ?? ''),
    queryFn: () => ProfileService.getProfile(),
    enabled,
  });

  // ProfileDao rethrows the raw Supabase/Postgrest error object, not an Error instance — normalize
  // it the same way the deleted reducer did, so the Error | null contract always holds.
  const error = queryError
    ? queryError instanceof Error
      ? queryError
      : new Error(String(queryError))
    : null;

  const retry = useCallback(
    () => {
      void queryRefetch();
    },
    // Stryker disable next-line ArrayDeclaration: equivalent mutant — TanStack's QueryObserver
    // binds `refetch` once in its constructor (`this.refetch = this.refetch.bind(this)` in
    // `@tanstack/query-core`), so it's referentially stable for the life of this hook instance
    // regardless of what's in this array.
    [queryRefetch],
  );

  // A disabled query reports isPending: true — only treat that as loading while authenticated,
  // so the unauthenticated case reads { isLoading: false, profile: null } (s52).
  const isLoading = deriveIsLoading(isPending) || isApiKeyLoading;

  const profile = useMemo(() => {
    if (!data || isLoading || error) return null;
    return { ...data, canCreate: data.keySource === 'platform' || hasKey };
  }, [data, isLoading, error, hasKey]);

  return { profile, isLoading, error, retry };
};
