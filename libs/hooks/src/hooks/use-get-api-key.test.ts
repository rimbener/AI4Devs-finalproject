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

import { apiKeyStatusQueryKey, useGetApiKey } from './use-get-api-key';
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

describe('useGetApiKey', () => {
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

    const { result } = renderHook(() => useGetApiKey(), { wrapper: createWrapper(queryClient) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(queryClient.getQueryData(apiKeyStatusQueryKey('u1'))).toEqual(status);
  });

  // @s37 — an authenticated learner's key status loads under their own cache key.
  it('loads status on mount when authenticated and reflects keys', async () => {
    mockUseSession.mockReturnValue(authenticatedSession);
    const status = keysStatus(['groq']);
    service.getApiKeyStatus.mockResolvedValue(status);

    const { result } = renderHook(() => useGetApiKey(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.status).toEqual(status);
    expect(result.current.hasKey).toBe(true);
  });

  // Mutation-kill — hasKey is strictly `keys.length > 0`, false at the empty boundary.
  it('reports hasKey false when the loaded status has no keys', async () => {
    mockUseSession.mockReturnValue(authenticatedSession);
    service.getApiKeyStatus.mockResolvedValue(emptyStatus);

    const { result } = renderHook(() => useGetApiKey(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hasKey).toBe(false);
  });

  // @s38 — an unauthenticated visitor gets an empty status and the status service is never called.
  it('does not load the status when there is no session', async () => {
    mockUseSession.mockReturnValue(noSession);

    const { result } = renderHook(() => useGetApiKey(), { wrapper: createWrapper() });

    expect(service.getApiKeyStatus).not.toHaveBeenCalled();
    expect(result.current.status).toEqual(emptyStatus);
  });

  // isLoading is the query's own pending state (no bootstrap here): a disabled query never
  // settles in TanStack Query v5, so a logged-out visitor stays "loading" — the app bootstrap
  // owns that resolution (it branches on the session before trusting this flag, and the hook only
  // mounts under `(app)` once a session is resolved).
  it('keeps isLoading true for a logged-out visitor instead of settling, and never calls the service', async () => {
    mockUseSession.mockReturnValue(noSession);

    const { result } = renderHook(() => useGetApiKey(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(true));
    expect(service.getApiKeyStatus).not.toHaveBeenCalled();
  });

  // Mutation-kill — the disabled query for an unauthenticated visitor registers under the exact
  // empty-string-scoped key, not some other placeholder.
  it("registers the disabled query under apiKeyStatusQueryKey('') when there is no session", () => {
    mockUseSession.mockReturnValue(noSession);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    renderHook(() => useGetApiKey(), { wrapper: createWrapper(queryClient) });

    expect(queryClient.getQueryCache().find({ queryKey: apiKeyStatusQueryKey('') })).toBeDefined();
  });

  // @s39 — a still-resolving session keeps the status loading and the service is not called yet.
  it('keeps isLoading true while the session itself is still resolving', async () => {
    mockUseSession.mockReturnValue({ session: null, isLoading: true });

    const { result } = renderHook(() => useGetApiKey(), { wrapper: createWrapper() });

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

    const { result, rerender } = renderHook(() => useGetApiKey(), { wrapper: createWrapper() });
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

    const { result, rerender } = renderHook(() => useGetApiKey(), { wrapper: createWrapper() });
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

    const { result, rerender } = renderHook(() => useGetApiKey(), { wrapper: createWrapper() });

    mockUseSession.mockReturnValue({ session: null, isLoading: false });
    rerender(undefined);

    await waitFor(() => expect(result.current.status).toEqual(emptyStatus));

    await act(async () => {
      resolveStatus(keysStatus(['groq']));
    });

    expect(result.current.status).toEqual(emptyStatus);
  });

  // @s49 — two consumers share one read with no provider in the tree: the shared QueryClient
  // cache is the only thing deduping the read now that ApiKeyProvider is gone.
  it('calls the status service once when two consumers mount under the same QueryClient', async () => {
    mockUseSession.mockReturnValue(authenticatedSession);
    const status = keysStatus(['groq']);
    service.getApiKeyStatus.mockResolvedValue(status);
    const wrapper = createWrapper();

    const renders1: Array<ReturnType<typeof useGetApiKey>> = [];
    const renders2: Array<ReturnType<typeof useGetApiKey>> = [];
    const Consumer = ({
      onRender,
    }: {
      onRender: (result: ReturnType<typeof useGetApiKey>) => void;
    }) => {
      onRender(useGetApiKey());
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
});
