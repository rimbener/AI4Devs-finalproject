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
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { useApiKey } from './use-api-key';
import { apiKeyStatusQueryKey } from './use-get-api-key';
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

describe('useApiKey (mutations)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue(authenticatedSession);
  });

  // @s43 — saving a key writes the returned status straight to the cache, no re-read.
  it('saveApiKey writes the returned status to the cache without re-reading', async () => {
    const status = keysStatus(['groq']);
    service.saveApiKey.mockResolvedValue(status);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useApiKey(), { wrapper: createWrapper(queryClient) });

    act(() => {
      result.current.saveApiKey('groq', 'sk-test-key');
    });

    await waitFor(() => expect(service.saveApiKey).toHaveBeenCalledWith('groq', 'sk-test-key'));
    await waitFor(() =>
      expect(queryClient.getQueryData(apiKeyStatusQueryKey('u1'))).toEqual(status),
    );
    expect(service.getApiKeyStatus).not.toHaveBeenCalled();
  });

  // @s44 — removing a key writes the returned status straight to the cache, no re-read.
  it('removeApiKey writes the returned status to the cache without re-reading', async () => {
    service.removeApiKey.mockResolvedValue(keysStatus(['openai']));
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useApiKey(), { wrapper: createWrapper(queryClient) });

    act(() => {
      result.current.removeApiKey('groq');
    });

    await waitFor(() => expect(service.removeApiKey).toHaveBeenCalledWith('groq'));
    await waitFor(() =>
      expect(queryClient.getQueryData(apiKeyStatusQueryKey('u1'))).toEqual(keysStatus(['openai'])),
    );
    expect(result.current.error).toBeNull();
    expect(service.getApiKeyStatus).not.toHaveBeenCalled();
  });

  // @s45 — a failed save exposes a normalized error code and preserves the loaded status.
  // Callers read `error` reactively — mutate is fire-and-forget (no reject to the caller).
  it('sets error to the normalized code and preserves the loaded status after a failed saveApiKey', async () => {
    const savedStatus = keysStatus(['groq']);
    service.saveApiKey.mockRejectedValue(
      Object.assign(new Error('bad key'), { code: 'validation_error' }),
    );
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(apiKeyStatusQueryKey('u1'), savedStatus);
    const { result } = renderHook(() => useApiKey(), { wrapper: createWrapper(queryClient) });

    act(() => {
      result.current.saveApiKey('groq', 'sk-bad');
    });

    await waitFor(() => expect(result.current.error).toBe('validation_error'));
    expect(result.current.errorKey).toBe('settings.apiKey.error.empty');
    expect(queryClient.getQueryData(apiKeyStatusQueryKey('u1'))).toEqual(savedStatus);
  });

  // task-8, @s16 — a provider_disabled rejection is recognized distinctly from network_error,
  // not swallowed by the hook's own default fallback.
  it('sets error to provider_disabled when saveApiKey rejects with the recognized code', async () => {
    service.saveApiKey.mockRejectedValue(
      Object.assign(new Error('provider disabled'), { code: 'provider_disabled' }),
    );
    const { result } = renderHook(() => useApiKey(), { wrapper: createWrapper() });

    act(() => {
      result.current.saveApiKey('groq', 'sk-test');
    });

    await waitFor(() => expect(result.current.error).toBe('provider_disabled'));
    expect(result.current.errorKey).toBe('settings.apiKey.error.providerDisabled');
  });

  // @s46 — an unrecognized failure normalizes to the network error code.
  it('falls back to network_error when the rejection carries no recognized code', async () => {
    service.saveApiKey.mockRejectedValue(new Error('unexpected'));
    const { result } = renderHook(() => useApiKey(), { wrapper: createWrapper() });

    act(() => {
      result.current.saveApiKey('groq', 'sk-test');
    });

    await waitFor(() => expect(result.current.error).toBe('network_error'));
    expect(result.current.errorKey).toBe('error.network');
  });

  // @s47 — remove success resets the save mutation so a prior save error is cleared (D3).
  it('clears an error left by a failed saveApiKey once removeApiKey succeeds', async () => {
    service.saveApiKey.mockRejectedValue(
      Object.assign(new Error('offline'), { code: 'network_error' }),
    );
    service.removeApiKey.mockResolvedValue(emptyStatus);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useApiKey(), { wrapper: createWrapper(queryClient) });

    act(() => {
      result.current.saveApiKey('groq', 'sk-test');
    });
    await waitFor(() => expect(result.current.error).toBe('network_error'));

    act(() => {
      result.current.removeApiKey('groq');
    });

    await waitFor(() => expect(service.removeApiKey).toHaveBeenCalledWith('groq'));
    await waitFor(() =>
      expect(queryClient.getQueryData(apiKeyStatusQueryKey('u1'))).toEqual(emptyStatus),
    );
    expect(result.current.error).toBeNull();
  });

  // Mutation-kill (saveMutation onSuccess guard) — with no session, sessionUserId is falsy: a
  // successful save must NOT write the cache under the empty-user key and must NOT reset the
  // sibling removeMutation (which would otherwise clear its error).
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

  // Mutation-kill (removeMutation onSuccess guard) — with no session, sessionUserId is falsy: a
  // successful remove must NOT write the cache under the empty-user key and must NOT reset the
  // sibling saveMutation (which would otherwise clear its error).
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
    let resolveSave: (value: unknown) => void = () => {};
    service.saveApiKey.mockReturnValue(
      new Promise((resolve) => {
        resolveSave = resolve;
      }) as never,
    );
    const { result } = renderHook(() => useApiKey(), { wrapper: createWrapper() });

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
    let resolveRemove: (value: unknown) => void = () => {};
    service.removeApiKey.mockReturnValue(
      new Promise((resolve) => {
        resolveRemove = resolve;
      }) as never,
    );
    const { result } = renderHook(() => useApiKey(), { wrapper: createWrapper() });

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
    const { result } = renderHook(() => useApiKey(), { wrapper: createWrapper() });

    expect(result.current.isError).toBe(false);
  });

  it('reports isError true when only saveApiKey has failed', async () => {
    service.saveApiKey.mockRejectedValue(
      Object.assign(new Error('bad key'), { code: 'validation_error' }),
    );
    const { result } = renderHook(() => useApiKey(), { wrapper: createWrapper() });

    act(() => {
      result.current.saveApiKey('groq', 'sk-test');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('reports isError true when only removeApiKey has failed', async () => {
    service.removeApiKey.mockRejectedValue(
      Object.assign(new Error('offline'), { code: 'network_error' }),
    );
    const { result } = renderHook(() => useApiKey(), { wrapper: createWrapper() });

    act(() => {
      result.current.removeApiKey('groq');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  // @s50 — the raw key is never retained in the hook's state.
  it('does not retain the raw key anywhere in the returned hook state', async () => {
    service.saveApiKey.mockResolvedValue(keysStatus(['groq']));
    const { result } = renderHook(() => useApiKey(), { wrapper: createWrapper() });

    act(() => {
      result.current.saveApiKey('groq', 'sk-should-never-be-retained');
    });
    await waitFor(() => expect(result.current.isSubmitting).toBe(false));

    expect(JSON.stringify(result.current)).not.toContain('sk-should-never-be-retained');
  });

  // @s50-security — `gcTime: 0` drops the mutation once no observers remain, so the raw key
  // in `mutation.state.variables` is not retained after the consumer unmounts.
  it('never writes the raw key into the mutation cache after a saveApiKey call', async () => {
    service.saveApiKey.mockResolvedValue(keysStatus(['groq']));
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result, unmount } = renderHook(() => useApiKey(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.saveApiKey('groq', 'sk-should-never-be-cached');
    });
    await waitFor(() => expect(result.current.isSubmitting).toBe(false));

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
