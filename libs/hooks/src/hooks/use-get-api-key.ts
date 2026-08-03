import { ApiKeyService } from '@helsoft/supabase-services';
import type { ApiKeyStatus } from '@helsoft/types';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useSessionGate } from './use-session-gate';

const EMPTY_STATUS: ApiKeyStatus = { keys: [] };

/** Query key for a learner's key status, scoped by user id (D1) — never leaks across users. */
export const apiKeyStatusQueryKey = (userId = '') => ['api-key', 'status', userId] as const;

/**
 * React integration over ApiKeyService.getApiKeyStatus(): loads the current multi-key status for
 * an authenticated user under a per-user cache key. The read side of the split `useApiKey`
 * (mutations) / `useGetApiKey` (status) pair — exposes a derived `hasKey` so create/upload gates
 * and the app bootstrap can decide readiness without touching the mutations. Two consumers under
 * the same QueryClient share one read — no provider needed (s49). `isLoading` is the query's own
 * pending state: the app bootstrap owns session/signed-out resolution (it branches on the session
 * before trusting this flag), so a signed-out consumer must not gate on it alone.
 */
export const useGetApiKey = () => {
  const { sessionUserId, enabled } = useSessionGate();

  const { data, isPending } = useQuery({
    queryKey: apiKeyStatusQueryKey(sessionUserId),
    queryFn: () => ApiKeyService.getApiKeyStatus(),
    enabled,
  });

  const status = data ?? EMPTY_STATUS;
  const hasKey = useMemo(() => status.keys.length > 0, [status]);

  return {
    status,
    hasKey,
    isLoading: isPending,
  };
};
