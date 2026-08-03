import { ApiKeyService } from '@helsoft/supabase-services';
import type { AiProvider, ApiKeyErrorCode } from '@helsoft/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toErrorCode } from './error-code.helpers';
import { getApiKeyErrorMessageKey } from './use-api-key.helpers';
import { apiKeyStatusQueryKey } from './use-get-api-key';
import { useSession } from './use-session';

const API_KEY_ERROR_CODES: ReadonlySet<ApiKeyErrorCode> = new Set([
  'network_error',
  'validation_error',
  'provider_disabled',
]);

const toApiKeyErrorCode = (cause: unknown | null): ApiKeyErrorCode | null =>
  cause === null ? null : toErrorCode(API_KEY_ERROR_CODES, cause, 'network_error');

/**
 * React integration over ApiKeyService's save/remove mutations — the write half of the
 * `useGetApiKey` (read) / `useApiKey` (mutate) split. Each mutation writes its returned status
 * straight into the shared per-user cache key (`apiKeyStatusQueryKey`), so `useGetApiKey`
 * consumers see the new status without a re-read. `error`/`isSubmitting` are merged into the
 * single slot the public contract promises — a successful remove clears an error left by a failed
 * save, and vice versa, via each mutation's `onSuccess` resetting the other.
 */
export const useApiKey = () => {
  const queryClient = useQueryClient();
  const { session } = useSession();
  const sessionUserId = session?.user?.id;

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

  const error = toApiKeyErrorCode(saveMutation.error) || toApiKeyErrorCode(removeMutation.error);

  return {
    isSubmitting: saveMutation.isPending || removeMutation.isPending,
    isError: saveMutation.isError || removeMutation.isError,
    resetSave: saveMutation.reset,
    resetRemove: removeMutation.reset,
    error,
    errorKey: getApiKeyErrorMessageKey(error),
    saveApiKey,
    removeApiKey: removeMutation.mutate,
  };
};
