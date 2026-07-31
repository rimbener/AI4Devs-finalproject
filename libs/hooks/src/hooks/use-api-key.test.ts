jest.mock('@helsoft/supabase-services', () => ({
  ApiKeyService: {
    saveApiKey: jest.fn(),
    getApiKeyStatus: jest.fn(),
    removeApiKey: jest.fn(),
  },
}));
jest.mock('./use-session', () => ({ useSession: jest.fn() }));

import { ApiKeyService } from '@helsoft/supabase-services';
import type { AiProvider } from '@helsoft/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { createElement } from 'react';

import { apiKeyStatusQueryKey, useApiKey } from './use-api-key';
import { useSession } from './use-session';

const service = ApiKeyService as jest.Mocked<typeof ApiKeyService>;
const mockUseSession = useSession as jest.Mock;

const createWrapper = (
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } }),
) => {
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
};

const authenticatedSession = {
  session: { access_token: 'tok', user: { id: 'u1' } },
  isLoading: false,
};
const noSession = { session: null, isLoading: false };

const keysStatus = (providers: AiProvider[]) => ({
  keys: providers.map((provider) => ({ provider, updatedAt: '2026-01-01T00:00:00.000Z' })),
});
const emptyStatus = { keys: [] };

describe('useApiKey', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    service.getApiKeyStatus.mockResolvedValue(emptyStatus);
  });

  // Migration anchor — cached under the user-scoped key, not a private reducer slice.
  it('caches the loaded status under apiKeyStatusQueryKey(userId)', async () => {
    mockUseSession.mockReturnValue(authenticatedSession);
    const status = keysStatus(['groq']);
    service.getApiKeyStatus.mockResolvedValue(status);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const { result } = renderHook(() => useApiKey(), { wrapper: createWrapper(queryClient) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(queryClient.getQueryData(apiKeyStatusQueryKey('u1'))).toEqual(status);
  });

  // @s37 — an authenticated learner's key status loads under their own cache key.
  it('loads status on mount when authenticated and reflects keys', async () => {
    mockUseSession.mockReturnValue(authenticatedSession);
    const status = keysStatus(['groq']);
    service.getApiKeyStatus.mockResolvedValue(status);

    const { result } = renderHook(() => useApiKey(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.status).toEqual(status);
    expect(result.current.hasKey).toBe(true);
  });

  // Mutation-kill — hasKey is strictly `keys.length > 0`, false at the empty boundary.
  it('reports hasKey false when the loaded status has no keys', async () => {
    mockUseSession.mockReturnValue(authenticatedSession);
    service.getApiKeyStatus.mockResolvedValue(emptyStatus);

    const { result } = renderHook(() => useApiKey(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hasKey).toBe(false);
  });

  // @s38 — an unauthenticated visitor gets an empty status and the status service is never called.
  it('does not load the status when there is no session', async () => {
    mockUseSession.mockReturnValue(noSession);

    const { result } = renderHook(() => useApiKey(), { wrapper: createWrapper() });

    expect(service.getApiKeyStatus).not.toHaveBeenCalled();
    expect(result.current.status).toEqual(emptyStatus);
  });

  // Bug fix (splash-screen-logomark mini-gate) — a disabled query's `isPending` never resolves
  // to false in TanStack Query v5 (a known v5 gotcha), so a logged-out visitor must resolve
  // `isLoading` via `deriveIsLoading`, exactly like `useProfile` already does, instead of trusting
  // the raw (permanently-pending) query status. Without this, `useProfile().isLoading` never
  // settles for a logged-out visitor and the app hangs on the splash screen forever.
  it('resolves isLoading to false for a logged-out visitor instead of staying stuck pending', async () => {
    mockUseSession.mockReturnValue(noSession);

    const { result } = renderHook(() => useApiKey(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(service.getApiKeyStatus).not.toHaveBeenCalled();
  });

  // Mutation-kill — the disabled query for an unauthenticated visitor registers under the exact
  // empty-string-scoped key, not some other placeholder.
  it("registers the disabled query under apiKeyStatusQueryKey('') when there is no session", () => {
    mockUseSession.mockReturnValue(noSession);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    renderHook(() => useApiKey(), { wrapper: createWrapper(queryClient) });

    expect(queryClient.getQueryCache().find({ queryKey: apiKeyStatusQueryKey('') })).toBeDefined();
  });

  // @s39 — a still-resolving session keeps the status loading and the service is not called yet.
  it('keeps isLoading true while the session itself is still resolving', async () => {
    mockUseSession.mockReturnValue({ session: null, isLoading: true });

    const { result } = renderHook(() => useApiKey(), { wrapper: createWrapper() });

    expect(result.current.isLoading).toBe(true);
    expect(service.getApiKeyStatus).not.toHaveBeenCalled();
  });

  // @s40 — a different signed-in user never sees the previous user's key status.
  it('reads under a new cache key and never exposes the previous status when the user changes', async () => {
    mockUseSession.mockReturnValue({
      session: { access_token: 'tok-1', user: { id: 'user-1' } },
      isLoading: false,
    });
    service.getApiKeyStatus.mockResolvedValueOnce(keysStatus(['groq']));
    service.getApiKeyStatus.mockResolvedValueOnce(keysStatus(['openai']));

    const { result, rerender } = renderHook(() => useApiKey(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.status).toEqual(keysStatus(['groq']));
    expect(service.getApiKeyStatus).toHaveBeenCalledTimes(1);

    mockUseSession.mockReturnValue({
      session: { access_token: 'tok-2', user: { id: 'user-2' } },
      isLoading: false,
    });
    rerender(undefined as never);

    await waitFor(() => expect(result.current.status).toEqual(keysStatus(['openai'])));
    expect(service.getApiKeyStatus).toHaveBeenCalledTimes(2);
  });

  // @s41 — a replaced session for the same user does not re-read the status.
  it('does not reload the status when the session is replaced for the same user', async () => {
    const sessionForUser1 = { access_token: 'tok-1', user: { id: 'user-1' } };
    mockUseSession.mockReturnValue({ session: sessionForUser1, isLoading: false });
    service.getApiKeyStatus.mockResolvedValue(keysStatus(['groq']));

    const { result, rerender } = renderHook(() => useApiKey(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(service.getApiKeyStatus).toHaveBeenCalledTimes(1);

    const refreshedSessionSameUser = { access_token: 'tok-2', user: { id: 'user-1' } };
    mockUseSession.mockReturnValue({ session: refreshedSessionSameUser, isLoading: false });
    rerender(undefined);

    expect(service.getApiKeyStatus).toHaveBeenCalledTimes(1);
  });

  // @s42 — a status read in flight before logout never overwrites the empty status: the
  // unauthenticated read is a different (disabled) cache entry, so the late resolution for the
  // previous user's key never lands where the hook is now reading.
  it('does not let a status load in flight before logout clobber the reset empty status', async () => {
    const sessionForUser1 = { access_token: 'tok-1', user: { id: 'user-1' } };
    mockUseSession.mockReturnValue({ session: sessionForUser1, isLoading: false });
    let resolveStatus: (value: unknown) => void = () => {};
    service.getApiKeyStatus.mockReturnValue(
      new Promise((resolve) => {
        resolveStatus = resolve;
      }) as never,
    );

    const { result, rerender } = renderHook(() => useApiKey(), { wrapper: createWrapper() });

    mockUseSession.mockReturnValue({ session: null, isLoading: false });
    rerender(undefined);

    await waitFor(() => expect(result.current.status).toEqual(emptyStatus));

    await act(async () => {
      resolveStatus(keysStatus(['groq']));
    });

    expect(result.current.status).toEqual(emptyStatus);
  });

  // @s43 — saving a key writes the returned status straight to the cache, no re-read.
  it('saveApiKey writes the returned status to the cache without re-reading', async () => {
    mockUseSession.mockReturnValue(authenticatedSession);
    const status = keysStatus(['groq']);
    service.saveApiKey.mockResolvedValue(status);
    const { result } = renderHook(() => useApiKey(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.saveApiKey('groq', 'sk-test-key');
    });

    await waitFor(() => expect(service.saveApiKey).toHaveBeenCalledWith('groq', 'sk-test-key'));
    await waitFor(() => expect(result.current.status).toEqual(status));
    expect(result.current.hasKey).toBe(true);
    expect(service.getApiKeyStatus).toHaveBeenCalledTimes(1);
  });

  // @s44 — removing a key writes the returned status straight to the cache, no re-read.
  it('removeApiKey writes the returned status to the cache without re-reading', async () => {
    mockUseSession.mockReturnValue(authenticatedSession);
    service.getApiKeyStatus.mockResolvedValue(keysStatus(['groq', 'openai']));
    service.removeApiKey.mockResolvedValue(keysStatus(['openai']));
    const { result } = renderHook(() => useApiKey(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.removeApiKey('groq');
    });

    await waitFor(() => expect(service.removeApiKey).toHaveBeenCalledWith('groq'));
    await waitFor(() => expect(result.current.status).toEqual(keysStatus(['openai'])));
    expect(result.current.error).toBeNull();
    expect(service.getApiKeyStatus).toHaveBeenCalledTimes(1);
  });

  // @s45 — a failed save exposes a normalized error code and preserves the loaded status.
  // Callers read `error` reactively — mutate is fire-and-forget (no reject to the caller).
  it('sets error to the normalized code and preserves status after a failed saveApiKey', async () => {
    mockUseSession.mockReturnValue(authenticatedSession);
    const savedStatus = keysStatus(['groq']);
    service.getApiKeyStatus.mockResolvedValue(savedStatus);
    service.saveApiKey.mockRejectedValue(
      Object.assign(new Error('bad key'), { code: 'validation_error' }),
    );
    const { result } = renderHook(() => useApiKey(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.saveApiKey('groq', 'sk-bad');
    });

    await waitFor(() => expect(result.current.error).toBe('validation_error'));
    expect(result.current.status).toEqual(savedStatus);
  });

  // task-8, @s16 — a provider_disabled rejection is recognized distinctly from network_error,
  // not swallowed by the hook's own default fallback.
  it('sets error to provider_disabled when saveApiKey rejects with the recognized code', async () => {
    mockUseSession.mockReturnValue(authenticatedSession);
    service.saveApiKey.mockRejectedValue(
      Object.assign(new Error('provider disabled'), { code: 'provider_disabled' }),
    );
    const { result } = renderHook(() => useApiKey(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.saveApiKey('groq', 'sk-test');
    });

    await waitFor(() => expect(result.current.error).toBe('provider_disabled'));
  });

  // @s46 — an unrecognized failure normalizes to the network error code.
  it('falls back to network_error when the rejection carries no recognized code', async () => {
    mockUseSession.mockReturnValue(authenticatedSession);
    service.saveApiKey.mockRejectedValue(new Error('unexpected'));
    const { result } = renderHook(() => useApiKey(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.saveApiKey('groq', 'sk-test');
    });

    await waitFor(() => expect(result.current.error).toBe('network_error'));
  });

  // @s47 — remove success resets the save mutation so a prior save error is cleared (D3).
  it('clears an error left by a failed saveApiKey once removeApiKey succeeds', async () => {
    mockUseSession.mockReturnValue(authenticatedSession);
    service.saveApiKey.mockRejectedValue(
      Object.assign(new Error('offline'), { code: 'network_error' }),
    );
    service.removeApiKey.mockResolvedValue(emptyStatus);
    const { result } = renderHook(() => useApiKey(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.saveApiKey('groq', 'sk-test');
    });
    await waitFor(() => expect(result.current.error).toBe('network_error'));

    act(() => {
      result.current.removeApiKey('groq');
    });

    await waitFor(() => expect(service.removeApiKey).toHaveBeenCalledWith('groq'));
    await waitFor(() => expect(result.current.status).toEqual(emptyStatus));
    expect(result.current.error).toBeNull();
  });

  // Mutation-kill (saveMutation onSuccess guard, line 49) — with no session, sessionUserId is
  // falsy: a successful save must NOT write the cache under the empty-user key and must NOT
  // reset the sibling removeMutation (which would otherwise clear its error).
  it('does not update the cache or reset the sibling mutation when saveApiKey succeeds without a session', async () => {
    mockUseSession.mockReturnValue(noSession);
    service.removeApiKey.mockRejectedValue(
      Object.assign(new Error('offline'), { code: 'network_error' }),
    );
    service.saveApiKey.mockResolvedValue(keysStatus(['groq']));
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useApiKey(), { wrapper: createWrapper(queryClient) });

    // Seed removeMutation with an error so we can prove saveMutation's onSuccess does not reset it.
    act(() => {
      result.current.removeApiKey('groq');
    });
    await waitFor(() => expect(result.current.error).toBe('network_error'));

    act(() => {
      result.current.saveApiKey('groq', 'sk-test');
    });

    await waitFor(() => expect(service.saveApiKey).toHaveBeenCalledWith('groq', 'sk-test'));
    await waitFor(() => expect(result.current.isSubmitting).toBe(false));

    expect(result.current.error).toBe('network_error');
    expect(queryClient.getQueryData(apiKeyStatusQueryKey(''))).toBeUndefined();
  });

  // Mutation-kill (removeMutation onSuccess guard, line 62) — with no session, sessionUserId is
  // falsy: a successful remove must NOT write the cache under the empty-user key and must NOT
  // reset the sibling saveMutation (which would otherwise clear its error).
  it('does not update the cache or reset the sibling mutation when removeApiKey succeeds without a session', async () => {
    mockUseSession.mockReturnValue(noSession);
    service.saveApiKey.mockRejectedValue(
      Object.assign(new Error('bad key'), { code: 'validation_error' }),
    );
    service.removeApiKey.mockResolvedValue(emptyStatus);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useApiKey(), { wrapper: createWrapper(queryClient) });

    // Seed saveMutation with an error so we can prove removeMutation's onSuccess does not reset it.
    act(() => {
      result.current.saveApiKey('groq', 'sk-bad');
    });
    await waitFor(() => expect(result.current.error).toBe('validation_error'));

    act(() => {
      result.current.removeApiKey('groq');
    });

    await waitFor(() => expect(service.removeApiKey).toHaveBeenCalledWith('groq'));
    await waitFor(() => expect(result.current.isSubmitting).toBe(false));

    expect(result.current.error).toBe('validation_error');
    expect(queryClient.getQueryData(apiKeyStatusQueryKey(''))).toBeUndefined();
  });

  // @s48 (example: saves a key) — isSubmitting is true while saveApiKey is in flight, false
  // once it settles.
  it('sets isSubmitting true during saveApiKey and false once it resolves', async () => {
    mockUseSession.mockReturnValue(authenticatedSession);
    let resolveSave: (value: unknown) => void = () => {};
    service.saveApiKey.mockReturnValue(
      new Promise((resolve) => {
        resolveSave = resolve;
      }) as never,
    );
    const { result } = renderHook(() => useApiKey(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.saveApiKey('groq', 'sk-test');
    });
    await waitFor(() => expect(result.current.isSubmitting).toBe(true));

    await act(async () => {
      resolveSave(keysStatus(['groq']));
    });

    await waitFor(() => expect(result.current.isSubmitting).toBe(false));
  });

  // @s48 (example: removes a key) — isSubmitting is true while removeApiKey is in flight, false
  // once it settles.
  it('sets isSubmitting true during removeApiKey and false once it resolves', async () => {
    mockUseSession.mockReturnValue(authenticatedSession);
    let resolveRemove: (value: unknown) => void = () => {};
    service.removeApiKey.mockReturnValue(
      new Promise((resolve) => {
        resolveRemove = resolve;
      }) as never,
    );
    const { result } = renderHook(() => useApiKey(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.removeApiKey('groq');
    });
    await waitFor(() => expect(result.current.isSubmitting).toBe(true));

    await act(async () => {
      resolveRemove(emptyStatus);
    });

    await waitFor(() => expect(result.current.isSubmitting).toBe(false));
  });

  // Mutation coverage: `isError: saveMutation.isError || removeMutation.isError` — either
  // mutation being in error must surface true; neither being in error must surface false.
  it('reports isError false while neither mutation has failed', async () => {
    mockUseSession.mockReturnValue(authenticatedSession);
    const { result } = renderHook(() => useApiKey(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(false);
  });

  it('reports isError true when only saveApiKey has failed', async () => {
    mockUseSession.mockReturnValue(authenticatedSession);
    service.saveApiKey.mockRejectedValue(
      Object.assign(new Error('bad key'), { code: 'validation_error' }),
    );
    const { result } = renderHook(() => useApiKey(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.saveApiKey('groq', 'sk-test');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('reports isError true when only removeApiKey has failed', async () => {
    mockUseSession.mockReturnValue(authenticatedSession);
    service.removeApiKey.mockRejectedValue(
      Object.assign(new Error('offline'), { code: 'network_error' }),
    );
    const { result } = renderHook(() => useApiKey(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.removeApiKey('groq');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  // @s49 — two consumers share one read with no provider in the tree: the shared QueryClient
  // cache is the only thing deduping the read now that ApiKeyProvider is gone.
  it('calls the status service once when two consumers mount under the same QueryClient', async () => {
    mockUseSession.mockReturnValue(authenticatedSession);
    const status = keysStatus(['groq']);
    service.getApiKeyStatus.mockResolvedValue(status);
    const wrapper = createWrapper();

    const renders1: Array<ReturnType<typeof useApiKey>> = [];
    const renders2: Array<ReturnType<typeof useApiKey>> = [];
    const Consumer = ({
      onRender,
    }: {
      onRender: (result: ReturnType<typeof useApiKey>) => void;
    }) => {
      onRender(useApiKey());
      return null;
    };

    render(
      createElement(
        wrapper,
        null,
        createElement(Consumer, { onRender: (r) => renders1.push(r) }),
        createElement(Consumer, { onRender: (r) => renders2.push(r) }),
      ),
    );

    await waitFor(() => expect(renders1.at(-1)?.isLoading).toBe(false));

    expect(service.getApiKeyStatus).toHaveBeenCalledTimes(1);
    expect(renders1.at(-1)?.status).toEqual(status);
    expect(renders2.at(-1)?.status).toEqual(status);
  });

  // @s50 — the raw key is never retained in the hook's state.
  it('does not retain the raw key anywhere in the returned hook state', async () => {
    mockUseSession.mockReturnValue(authenticatedSession);
    service.saveApiKey.mockResolvedValue(keysStatus(['groq']));
    const { result } = renderHook(() => useApiKey(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.saveApiKey('groq', 'sk-should-never-be-retained');
    });
    await waitFor(() => expect(result.current.hasKey).toBe(true));

    expect(JSON.stringify(result.current)).not.toContain('sk-should-never-be-retained');
  });

  // @s50-security — `gcTime: 0` drops the mutation once no observers remain, so the raw key
  // in `mutation.state.variables` is not retained after the consumer unmounts.
  it('never writes the raw key into the mutation cache after a saveApiKey call', async () => {
    mockUseSession.mockReturnValue(authenticatedSession);
    service.saveApiKey.mockResolvedValue(keysStatus(['groq']));
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result, unmount } = renderHook(() => useApiKey(), {
      wrapper: createWrapper(queryClient),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.saveApiKey('groq', 'sk-should-never-be-cached');
    });
    await waitFor(() => expect(result.current.hasKey).toBe(true));

    unmount();

    await waitFor(() => {
      const cachedVariables = queryClient
        .getMutationCache()
        .getAll()
        .map((mutation) => JSON.stringify(mutation.state.variables));
      expect(cachedVariables.join('|')).not.toContain('sk-should-never-be-cached');
    });
  });
});
