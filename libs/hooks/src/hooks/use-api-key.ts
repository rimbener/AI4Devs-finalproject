import { ApiKeyService } from '@helsoft/supabase-services';
import type { AiProvider, ApiKeyError, ApiKeyErrorCode, ApiKeyStatus } from '@helsoft/types';
import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import { useApiKeyInitialState, useApiKeyReducer } from './use-api-key.reducer';
import type { ApiKeyProviderProps, UseApiKeyResult } from './use-api-key.types';
import { useSession } from './use-session';

const API_KEY_ERROR_CODES: ReadonlySet<ApiKeyErrorCode> = new Set([
  'network_error',
  'validation_error',
]);

const isApiKeyErrorShape = (cause: unknown): cause is ApiKeyError =>
  API_KEY_ERROR_CODES.has((cause as { code?: unknown } | null)?.code as ApiKeyErrorCode);

/**
 * The full stateful implementation, shared by both the standalone `useApiKey()` path and
 * `ApiKeyProvider`. `skip` short-circuits the status-fetch effect (rules-of-hooks: hooks
 * are always called in the same order every render).
 */
const useApiKeyState = (skip: boolean): UseApiKeyResult => {
  const { session, isLoading: isSessionLoading } = useSession();
  const sessionUserId = session?.user?.id;
  const [state, dispatch] = useReducer(useApiKeyReducer, useApiKeyInitialState);

  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed on the derived sessionUserId instead of the session object on purpose — see the comment above
  useEffect(() => {
    if (skip) return;

    let cancelled = false;

    if (isSessionLoading) return;

    if (!session) {
      dispatch({ type: 'status/unauthenticated' });
      return;
    }

    dispatch({ type: 'status/load/start' });
    ApiKeyService.getApiKeyStatus().then((nextStatus) => {
      if (cancelled) return;
      dispatch({ type: 'status/load/success', status: nextStatus });
    });

    return () => {
      cancelled = true;
    };
  }, [skip, sessionUserId, isSessionLoading]);

  const runMutation = useCallback(async (mutate: () => Promise<ApiKeyStatus>) => {
    dispatch({ type: 'mutation/start' });
    try {
      const nextStatus = await mutate();
      dispatch({ type: 'mutation/success', status: nextStatus });
    } catch (cause) {
      dispatch({
        type: 'mutation/failure',
        error: isApiKeyErrorShape(cause) ? cause.code : 'network_error',
      });
      throw cause;
    }
  }, []);

  const saveApiKey = useCallback(
    (provider: AiProvider, rawKey: string) =>
      runMutation(() => ApiKeyService.saveApiKey(provider, rawKey)),
    [runMutation],
  );
  const removeApiKey = useCallback(
    (provider: AiProvider) => runMutation(() => ApiKeyService.removeApiKey(provider)),
    [runMutation],
  );

  const hasKey = useMemo(() => state.status.keys.length > 0, [state.status.keys]);

  return useMemo(
    () => ({
      status: state.status,
      isLoading: state.isLoading,
      isSubmitting: state.isSubmitting,
      error: state.error,
      hasKey,
      saveApiKey,
      removeApiKey,
    }),
    [
      state.status,
      state.isLoading,
      state.isSubmitting,
      state.error,
      hasKey,
      saveApiKey,
      removeApiKey,
    ],
  );
};

const ApiKeyContext = createContext<UseApiKeyResult | undefined>(undefined);

/**
 * React integration over ApiKeyService: loads the current multi-key status for an
 * authenticated user and exposes per-provider save/remove mutations. Exposes a derived
 * `hasKey` boolean so `useProfile().canCreate` + `ApiKeyGate` continue working unchanged.
 *
 * When called underneath an `ApiKeyProvider`, returns that provider's single shared instance
 * instead of computing its own (avoids redundant `getApiKeyStatus()` reads when e.g. both
 * the Settings and Upload screens are mounted in the same expo-router session).
 */
export const useApiKey = (): UseApiKeyResult => {
  const shared = useContext(ApiKeyContext);
  const own = useApiKeyState(shared !== undefined);
  return shared ?? own;
};

/**
 * Computes `useApiKey()`'s state once and shares it via context with every `useApiKey()` call
 * nested underneath it. Wire this once around the app screens that read key status so visiting
 * both Settings and Upload in one session shares a single status read.
 */
export const ApiKeyProvider = ({ children }: ApiKeyProviderProps) => {
  const value = useApiKeyState(false);
  return createElement(ApiKeyContext.Provider, { value }, children);
};
