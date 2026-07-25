jest.mock('@helsoft/supabase-services', () => ({
  AuthService: {
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(),
  },
}));

import type { Session } from '@helsoft/supabase-services';
import { AuthService } from '@helsoft/supabase-services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { createElement } from 'react';

import { useSession } from './use-session';

const service = AuthService as jest.Mocked<typeof AuthService>;

const createWrapper = () => {
  const queryClient = new QueryClient();
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
};

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

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.session).toBe(next);
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
});
