import { ProfileService } from '@helsoft/supabase-services';
import { useQuery } from '@tanstack/react-query';

import type { UseProfileResult } from './use-profile.types';
import { useSessionGate } from './use-session-gate';

export const profileQueryKey = (userId: string) => ['profile', userId] as const;

export const useProfile = (): UseProfileResult => {
  const { sessionUserId, enabled } = useSessionGate();

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

  return {
    profile: data ?? null,
    isLoading: isPending,
    error,
    retry,
  };
};
