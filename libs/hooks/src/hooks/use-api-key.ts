import { ApiKeyService } from '@helsoft/supabase-services';
import type { AiProvider, ApiKeyError, ApiKeyErrorCode, ApiKeyStatus } from '@helsoft/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useRef } from 'react';

import type { UseApiKeyResult } from './use-api-key.types';
import { useSessionGate } from './use-session-gate';

const EMPTY_STATUS: ApiKeyStatus = { keys: [] };

const API_KEY_ERROR_CODES: ReadonlySet<ApiKeyErrorCode> = new Set([
  'network_error',
  'validation_error',
]);

const isApiKeyErrorShape = (cause: unknown): cause is ApiKeyError =>
  API_KEY_ERROR_CODES.has((cause as { code?: unknown } | null)?.code as ApiKeyErrorCode);

/** Query key for a learner's key status, scoped by user id (D1) — never leaks across users. */
export const apiKeyStatusQueryKey = (userId: string) => ['api-key', 'status', userId] as const;

/**
 * Tagged union so save/remove share one mutation slot (D3) — see use-api-key's module doc.
 * Deliberately excludes the raw key: TanStack's `MutationCache` retains a settled mutation's
 * `state.variables` for up to `gcTime` (stock 5 min) after every call, on every platform
 * including web — so anything passed as `variables` here would sit in-memory, reachable via
 * `queryClient.getMutationCache()`, far longer than its useful life (round 1 full-review
 * security finding). The raw key instead flows through `pendingRawKeyRef` below, never through
 * the mutation's own state.
 */
type ApiKeyMutationVariables =
  | { kind: 'save'; provider: AiProvider }
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
  const { sessionUserId, enabled, deriveIsLoading } = useSessionGate();
  const queryClient = useQueryClient();
  // Holds the raw key only for the duration of the in-flight `saveApiKey` call — never passed
  // as a mutation variable, and cleared as soon as the mutation settles (see the type doc above).
  const pendingRawKeyRef = useRef<string | null>(null);

  const { data, isPending } = useQuery({
    queryKey: apiKeyStatusQueryKey(sessionUserId ?? ''),
    queryFn: () => ApiKeyService.getApiKeyStatus(),
    enabled,
  });

  const {
    mutateAsync,
    isPending: isSubmitting,
    error: mutationError,
  } = useMutation({
    mutationFn: (variables: ApiKeyMutationVariables) =>
      variables.kind === 'save'
        ? // Stryker disable next-line StringLiteral: equivalent mutant — `pendingRawKeyRef.current`
          // is always set (non-null) synchronously by `saveApiKey` immediately before this mutation
          // fires, so the `?? ''` right-hand side never evaluates under the public hook contract
          // (confirmed NoCoverage by Stryker itself, not just a hard-to-reach branch). It exists
          // only so `useRef<string | null>` type-checks; see the doc comment above this type.
          ApiKeyService.saveApiKey(variables.provider, pendingRawKeyRef.current ?? '')
        : ApiKeyService.removeApiKey(variables.provider),
    onSuccess: (nextStatus) => {
      if (!sessionUserId) return;
      queryClient.setQueryData(apiKeyStatusQueryKey(sessionUserId), nextStatus);
    },
    // Stryker disable next-line BlockStatement: equivalent mutant — resetting the ref here is
    // pure memory hygiene (shrinking the window the raw key sits in the ref). It's never
    // re-read except by the 'save' branch above, which always overwrites it fresh right before
    // use, so no sequence of calls through the public API can observe whether this ran.
    onSettled: () => {
      pendingRawKeyRef.current = null;
    },
  });

  const saveApiKey = useCallback(
    async (provider: AiProvider, rawKey: string) => {
      pendingRawKeyRef.current = rawKey;
      await mutateAsync({ kind: 'save', provider });
    },
    // Stryker disable next-line ArrayDeclaration: equivalent mutant — TanStack's MutationObserver
    // binds `mutate`/`mutateAsync` once in its constructor (`this.mutate = this.mutate.bind(this)`
    // in `@tanstack/query-core`'s MutationObserver), so `mutateAsync` is referentially stable for
    // the life of this hook instance regardless of what's in this array.
    [mutateAsync],
  );

  const removeApiKey = useCallback(
    async (provider: AiProvider) => {
      await mutateAsync({ kind: 'remove', provider });
    },
    // Stryker disable next-line ArrayDeclaration: same equivalence as saveApiKey's deps above.
    [mutateAsync],
  );

  // A disabled query reports isPending: true — only treat that as loading while authenticated,
  // so the unauthenticated case reads { isLoading: false, status: { keys: [] } } (s38).
  const isLoading = deriveIsLoading(isPending);
  const status = data ?? EMPTY_STATUS;
  const hasKey = useMemo(() => status.keys.length > 0, [status]);
  const error = mutationError
    ? isApiKeyErrorShape(mutationError)
      ? mutationError.code
      : ('network_error' satisfies ApiKeyErrorCode)
    : null;

  return { status, isLoading, isSubmitting, error, hasKey, saveApiKey, removeApiKey };
};
