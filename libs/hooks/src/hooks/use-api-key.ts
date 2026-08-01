import { ApiKeyService } from '@helsoft/supabase-services';
import type { AiProvider, ApiKeyErrorCode, ApiKeyStatus } from '@helsoft/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { toErrorCode } from './error-code.helpers';
import { getApiKeyErrorMessageKey } from './use-api-key.helpers';
import { useSessionGate } from './use-session-gate';

const EMPTY_STATUS: ApiKeyStatus = { keys: [] };

const API_KEY_ERROR_CODES: ReadonlySet<ApiKeyErrorCode> = new Set([
  'network_error',
  'validation_error',
  'provider_disabled',
]);

/** Query key for a learner's key status, scoped by user id (D1) — never leaks across users. */
export const apiKeyStatusQueryKey = (userId = '') => ['api-key', 'status', userId] as const;

const toApiKeyErrorCode = (cause: unknown | null): ApiKeyErrorCode | null =>
  cause === null ? null : toErrorCode(API_KEY_ERROR_CODES, cause, 'network_error');

/**
 * React integration over ApiKeyService: loads the current multi-key status for an
 * authenticated user under a per-user cache key, and exposes save/remove as two independent
 * mutations whose `error`/`isSubmitting` are merged into the single slot the public contract
 * promises — a successful remove clears an error left by a failed save, and vice versa, via
 * each mutation's `onSuccess` resetting the other.
 * Exposes a derived `hasKey` so `useProfile().canCreate` + `ApiKeyGate` keep working unchanged.
 * Two consumers under the same QueryClient share one read — no provider needed (s49).
 */
export const useApiKey = () => {
  const queryClient = useQueryClient();
  const { sessionUserId, enabled, deriveIsLoading } = useSessionGate();

  const { data, isPending } = useQuery({
    queryKey: apiKeyStatusQueryKey(sessionUserId),
    queryFn: () => ApiKeyService.getApiKeyStatus(),
    enabled,
  });

  const saveMutation = useMutation({
    mutationFn: ({ provider, rawKey }: { provider: AiProvider; rawKey: string }) =>
      ApiKeyService.saveApiKey(provider, rawKey),
    onSuccess: (nextStatus) => {
      if (!sessionUserId) return;
      queryClient.setQueryData(apiKeyStatusQueryKey(sessionUserId), nextStatus);
      removeMutation.reset();
    },
    gcTime: 0,
  });

  const saveApiKey = (provider: AiProvider, rawKey: string) =>
    saveMutation.mutate({ provider, rawKey });

  const removeMutation = useMutation({
    mutationFn: (provider: AiProvider) => ApiKeyService.removeApiKey(provider),
    onSuccess: (nextStatus) => {
      if (!sessionUserId) return;
      queryClient.setQueryData(apiKeyStatusQueryKey(sessionUserId), nextStatus);
      saveMutation.reset();
    },
    gcTime: 0,
  });

  const status = data ?? EMPTY_STATUS;
  const hasKey = useMemo(() => status.keys.length > 0, [status]);
  const error = toApiKeyErrorCode(saveMutation.error) || toApiKeyErrorCode(removeMutation.error);

  const errorKey = getApiKeyErrorMessageKey(error);

  return {
    status,
    isLoading: deriveIsLoading(isPending),
    isSubmitting: saveMutation.isPending || removeMutation.isPending,
    isError: saveMutation.isError || removeMutation.isError,
    resetSave: saveMutation.reset,
    resetRemove: removeMutation.reset,
    error,
    errorKey,
    hasKey,
    saveApiKey,
    removeApiKey: removeMutation.mutate,
  };
};
