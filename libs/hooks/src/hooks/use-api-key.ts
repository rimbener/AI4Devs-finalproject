import { ApiKeyService } from '@helsoft/supabase-services';
import type { AiProvider, ApiKeyError, ApiKeyErrorCode, ApiKeyStatus } from '@helsoft/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import type { UseApiKeyResult } from './use-api-key.types';
import { useSession } from './use-session';

const EMPTY_STATUS: ApiKeyStatus = { keys: [] };

const API_KEY_ERROR_CODES: ReadonlySet<ApiKeyErrorCode> = new Set([
  'network_error',
  'validation_error',
]);

const isApiKeyErrorShape = (cause: unknown): cause is ApiKeyError =>
  API_KEY_ERROR_CODES.has((cause as { code?: unknown } | null)?.code as ApiKeyErrorCode);

/** Query key for a learner's key status, scoped by user id (D1) — never leaks across users. */
export const apiKeyStatusQueryKey = (userId: string) => ['api-key', 'status', userId] as const;

/** Tagged union so save/remove share one mutation slot (D3) — see use-api-key's module doc. */
type ApiKeyMutationVariables =
  | { kind: 'save'; provider: AiProvider; rawKey: string }
  | { kind: 'remove'; provider: AiProvider };

/**
 * React integration over ApiKeyService: loads the current multi-key status for an
 * authenticated user under a per-user cache key, and exposes save/remove behind **one**
 * tagged-union mutation (D3) so a single error/isSubmitting slot mirrors the old reducer's
 * cross-clearing semantics — a successful remove clears an error left by a failed save.
 * Exposes a derived `hasKey` so `useProfile().canCreate` + `ApiKeyGate` keep working unchanged.
 * Two consumers under the same QueryClient share one read — no provider needed (s49).
 */
export const useApiKey = (): UseApiKeyResult => {
  const { session, isLoading: isSessionLoading } = useSession();
  const sessionUserId = session?.user?.id;
  const queryClient = useQueryClient();

  const { data, isPending } = useQuery({
    queryKey: apiKeyStatusQueryKey(sessionUserId ?? ''),
    queryFn: () => ApiKeyService.getApiKeyStatus(),
    enabled: Boolean(sessionUserId) && !isSessionLoading,
  });

  const {
    mutateAsync,
    isPending: isSubmitting,
    error: mutationError,
  } = useMutation({
    mutationFn: (variables: ApiKeyMutationVariables) =>
      variables.kind === 'save'
        ? ApiKeyService.saveApiKey(variables.provider, variables.rawKey)
        : ApiKeyService.removeApiKey(variables.provider),
    onSuccess: (nextStatus) => {
      if (!sessionUserId) return;
      queryClient.setQueryData(apiKeyStatusQueryKey(sessionUserId), nextStatus);
    },
  });

  const saveApiKey = useCallback(
    async (provider: AiProvider, rawKey: string) => {
      await mutateAsync({ kind: 'save', provider, rawKey });
    },
    [mutateAsync],
  );

  const removeApiKey = useCallback(
    async (provider: AiProvider) => {
      await mutateAsync({ kind: 'remove', provider });
    },
    [mutateAsync],
  );

  // A disabled query reports isPending: true — only treat that as loading while authenticated,
  // so the unauthenticated case reads { isLoading: false, status: { keys: [] } } (s38).
  const isLoading = isSessionLoading || (Boolean(sessionUserId) && isPending);
  const status = data ?? EMPTY_STATUS;
  const hasKey = useMemo(() => status.keys.length > 0, [status]);
  const error = mutationError
    ? isApiKeyErrorShape(mutationError)
      ? mutationError.code
      : ('network_error' satisfies ApiKeyErrorCode)
    : null;

  return { status, isLoading, isSubmitting, error, hasKey, saveApiKey, removeApiKey };
};
