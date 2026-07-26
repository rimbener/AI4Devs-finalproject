import { ProfileService } from '@helsoft/supabase-services';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useApiKey } from './use-api-key';
import type { UseProfileResult } from './use-profile.types';
import { useSessionGate } from './use-session-gate';

export const profileQueryKey = (userId: string) => ['profile', userId] as const;

export const useProfile = (): UseProfileResult => {
  const { sessionUserId, enabled, deriveIsLoading } = useSessionGate();
  const { hasKey, isLoading: isApiKeyLoading } = useApiKey();

  const {
    data,
    isPending,
    error: queryError,
    refetch: retry,
  } = useQuery({
    queryKey: profileQueryKey(sessionUserId ?? ''),
    queryFn: () => ProfileService.getProfile(),
    enabled,
  });

  const error = queryError
    ? queryError instanceof Error
      ? queryError
      : new Error(String(queryError))
    : null;

  const isLoading = deriveIsLoading(isPending) || isApiKeyLoading;

  const profile = useMemo(() => {
    if (!data || isLoading || error) return null;
    return { ...data, canCreate: data.keySource === 'platform' || hasKey };
  }, [data, isLoading, error, hasKey]);

  return { profile, isLoading, error, retry };
};
