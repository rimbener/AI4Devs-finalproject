jest.mock('@helsoft/supabase-services', () => ({
  AuthService: {
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(),
  },
}));

import type { Session } from '@helsoft/supabase-services';
import { AuthService } from '@helsoft/supabase-services';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { act, render, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { createElement, useState } from 'react';

import { SESSION_QUERY_KEY, useSession } from './use-session';

const service = AuthService as jest.Mocked<typeof AuthService>;

const createWrapper = () => {
  const queryClient = new QueryClient();
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
};

const wrapWithClient = (queryClient: QueryClient) => {
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
};

const sessionFor = (userId: string): Session => ({ user: { id: userId } }) as unknown as Session;

describe('useSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    service.getSession.mockResolvedValue(null);
    service.onAuthStateChange.mockReturnValue(jest.fn());
  });

  it('starts loading then exposes the session from AuthService.getSession', async () => {
    const session = { access_token: 'tok' } as never;
    service.getSession.mockResolvedValue(session);

    const { result } = renderHook(() => useSession(), { wrapper: createWrapper() });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.session).toBe(session);
    expect(service.getSession).toHaveBeenCalledWith();
  });

  it('updates session when AuthService.onAuthStateChange fires', async () => {
    let push: ((session: Session | null) => void) | undefined;
    service.onAuthStateChange.mockImplementation((callback) => {
      push = callback;
      return jest.fn();
    });

    const { result } = renderHook(() => useSession(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const next = { access_token: 'next' } as Session;
    act(() => {
      push?.(next);
    });

    // TanStack Query batches the resulting cache notification onto a macrotask, so the
    // re-render lands one tick after the synchronous `act` above.
    await waitFor(() => {
      expect(result.current.session).toBe(next);
    });
  });

  it('does not let a slow initial getSession() overwrite a newer onAuthStateChange session', async () => {
    let resolveGetSession: (session: Session | null) => void = () => undefined;
    service.getSession.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveGetSession = resolve;
        }),
    );

    let push: ((session: Session | null) => void) | undefined;
    service.onAuthStateChange.mockImplementation((callback) => {
      push = callback;
      return jest.fn();
    });

    const { result } = renderHook(() => useSession(), { wrapper: createWrapper() });

    const next = { access_token: 'next' } as Session;
    act(() => {
      push?.(next);
    });

    await waitFor(() => {
      expect(result.current.session).toBe(next);
    });

    // The stale initial fetch, started before sign-in, finally resolves with the pre-sign-in
    // (null) session — it must not clobber the newer session just delivered above.
    act(() => {
      resolveGetSession(null);
    });

    // `isLoading` is already false at this point (setQueryData above already resolved the
    // query), so waiting on it alone would pass before the stale fetch's own queryFn
    // continuation — batched onto a macrotask by notifyManager — has actually run. A real
    // timer tick must elapse first, or a regression here (e.g. the guard's `?? null` returning
    // the stale `null` outright) would go undetected.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(result.current.session).toBe(next);
    expect(result.current.isLoading).toBe(false);
  });

  it('unsubscribes on unmount', async () => {
    const stop = jest.fn();
    service.onAuthStateChange.mockReturnValue(stop);

    const { unmount } = renderHook(() => useSession(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(service.getSession).toHaveBeenCalled();
    });

    unmount();

    expect(stop).toHaveBeenCalledWith();
  });

  it('@s1 evicts other cached entries and re-reads them when a different user signs in', async () => {
    const queryClient = new QueryClient();
    const profileKey = ['profile', 'user-1'];
    queryClient.setQueryData(profileKey, { name: 'Alice' });
    service.getSession.mockResolvedValue(sessionFor('user-1'));

    let push: ((session: Session | null) => void) | undefined;
    service.onAuthStateChange.mockImplementation((callback) => {
      push = callback;
      return jest.fn();
    });

    const wrapper = wrapWithClient(queryClient);
    const { result } = renderHook(() => useSession(), { wrapper });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      push?.(sessionFor('user-2'));
    });
    await waitFor(() => {
      expect(result.current.session).toEqual(sessionFor('user-2'));
    });

    expect(queryClient.getQueryData(profileKey)).toBeUndefined();

    const profileQueryFn = jest.fn().mockResolvedValue({ name: 'Alice' });
    renderHook(() => useQuery({ queryKey: profileKey, queryFn: profileQueryFn }), { wrapper });
    await waitFor(() => {
      expect(profileQueryFn).toHaveBeenCalledTimes(1);
    });
  });

  it('@s2 preserves the cache and does not re-read on a same-user token refresh', async () => {
    const queryClient = new QueryClient();
    const profileKey = ['profile', 'user-1'];
    const seededProfile = { name: 'Alice' };
    queryClient.setQueryData(SESSION_QUERY_KEY, sessionFor('user-1'));
    queryClient.setQueryData(profileKey, seededProfile);
    service.getSession.mockResolvedValue(sessionFor('user-1'));

    let push: ((session: Session | null) => void) | undefined;
    service.onAuthStateChange.mockImplementation((callback) => {
      push = callback;
      return jest.fn();
    });

    const wrapper = wrapWithClient(queryClient);
    const { result } = renderHook(() => useSession(), { wrapper });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const refreshed = sessionFor('user-1');
    act(() => {
      push?.(refreshed);
    });
    await waitFor(() => {
      expect(result.current.session).toEqual(refreshed);
    });

    expect(queryClient.getQueryData(profileKey)).toBe(seededProfile);

    const profileQueryFn = jest.fn().mockResolvedValue({ name: 'someone else' });
    renderHook(
      () => useQuery({ queryKey: profileKey, queryFn: profileQueryFn, staleTime: Infinity }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.session).toEqual(refreshed);
    });
    expect(profileQueryFn).not.toHaveBeenCalled();
  });

  it('@s3 evicts other cached entries when the session becomes unauthenticated, but never the session entry itself', async () => {
    const queryClient = new QueryClient();
    const profileKey = ['profile', 'user-1'];
    queryClient.setQueryData(SESSION_QUERY_KEY, sessionFor('user-1'));
    queryClient.setQueryData(profileKey, { name: 'Alice' });
    service.getSession.mockResolvedValue(sessionFor('user-1'));

    let push: ((session: Session | null) => void) | undefined;
    service.onAuthStateChange.mockImplementation((callback) => {
      push = callback;
      return jest.fn();
    });

    const wrapper = wrapWithClient(queryClient);
    const removeQueriesSpy = jest.spyOn(queryClient, 'removeQueries');
    const { result } = renderHook(() => useSession(), { wrapper });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      push?.(null);
    });
    await waitFor(() => {
      expect(result.current.session).toBeNull();
    });

    expect(queryClient.getQueryData(profileKey)).toBeUndefined();

    const call = removeQueriesSpy.mock.calls.at(-1)?.[0] as
      | { predicate?: (query: { queryKey: readonly unknown[] }) => boolean }
      | undefined;
    expect(call?.predicate?.({ queryKey: SESSION_QUERY_KEY })).toBe(false);
    expect(call?.predicate?.({ queryKey: profileKey })).toBe(true);
  });

  it('@s4 evicts the cache before writing the new session, so the write is never clobbered', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(SESSION_QUERY_KEY, sessionFor('user-1'));
    service.getSession.mockResolvedValue(sessionFor('user-1'));

    let push: ((session: Session | null) => void) | undefined;
    service.onAuthStateChange.mockImplementation((callback) => {
      push = callback;
      return jest.fn();
    });

    const wrapper = wrapWithClient(queryClient);
    const { result } = renderHook(() => useSession(), { wrapper });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const removeQueriesSpy = jest.spyOn(queryClient, 'removeQueries');
    const setQueryDataSpy = jest.spyOn(queryClient, 'setQueryData');
    const next = sessionFor('user-2');

    act(() => {
      push?.(next);
    });
    await waitFor(() => {
      expect(result.current.session).toEqual(next);
    });

    const removeCallOrder = removeQueriesSpy.mock.invocationCallOrder[0];
    const setCallOrder = setQueryDataSpy.mock.invocationCallOrder.find(
      (_, index) => setQueryDataSpy.mock.calls[index]?.[0] === SESSION_QUERY_KEY,
    );
    expect(removeCallOrder).toBeLessThan(setCallOrder as number);
  });

  // Mutation-kill — the auth-state-change subscription effect is keyed on `[queryClient]`: if a
  // consumer's ambient QueryClient is ever swapped (e.g. a provider re-init), the effect must
  // tear down the old subscription and re-subscribe against the new client, never keep writing
  // auth events into a QueryClient nobody reads from anymore.
  it('unsubscribes from the old client and re-subscribes against a new one when the QueryClient changes', async () => {
    const unsubscribeA = jest.fn();
    const unsubscribeB = jest.fn();
    service.onAuthStateChange.mockReturnValueOnce(unsubscribeA).mockReturnValueOnce(unsubscribeB);

    const clientA = new QueryClient();
    let setClient: (client: QueryClient) => void = () => {};
    const Consumer = () => {
      useSession();
      return null;
    };
    const Wrapper = () => {
      const [client, updateClient] = useState(clientA);
      setClient = updateClient;
      return createElement(QueryClientProvider, { client }, createElement(Consumer));
    };

    render(createElement(Wrapper));

    await waitFor(() => expect(service.onAuthStateChange).toHaveBeenCalledTimes(1));
    expect(unsubscribeA).not.toHaveBeenCalled();

    const clientB = new QueryClient();
    act(() => {
      setClient(clientB);
    });

    await waitFor(() => expect(service.onAuthStateChange).toHaveBeenCalledTimes(2));
    expect(unsubscribeA).toHaveBeenCalledTimes(1);
  });
});
