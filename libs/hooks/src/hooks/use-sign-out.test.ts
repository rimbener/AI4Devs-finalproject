jest.mock('@helsoft/supabase-services', () => ({
  AuthService: {
    signOut: jest.fn(),
  },
}));

import { AuthService } from '@helsoft/supabase-services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { createElement } from 'react';

import { useSignOut } from './use-sign-out';

const service = AuthService as jest.Mocked<typeof AuthService>;

const createWrapper = () => {
  const queryClient = new QueryClient();
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useSignOut', () => {
  beforeEach(() => jest.clearAllMocks());

  // @s4 — signOut delegates to AuthService.
  it('signOut calls AuthService.signOut', async () => {
    service.signOut.mockResolvedValue(undefined);
    const { result } = renderHook(() => useSignOut(), { wrapper: createWrapper() });

    act(() => {
      result.current.signOut();
    });

    await waitFor(() => {
      expect(service.signOut).toHaveBeenCalledWith();
    });
  });

  // @s4 — isSigningOut mirrors the in-flight/resolved lifecycle.
  it('sets isSigningOut true during sign-out and false after it resolves', async () => {
    let resolveSignOut: (value: unknown) => void = () => {};
    service.signOut.mockReturnValue(
      new Promise((resolve) => {
        resolveSignOut = resolve;
      }) as never,
    );
    const { result } = renderHook(() => useSignOut(), { wrapper: createWrapper() });

    expect(result.current.isSigningOut).toBe(false);

    act(() => {
      result.current.signOut();
    });

    // TanStack Query batches the resulting mutation-state notification onto a macrotask, so
    // the re-render lands one tick after the synchronous `act` above.
    await waitFor(() => {
      expect(result.current.isSigningOut).toBe(true);
    });

    await act(async () => {
      resolveSignOut(undefined);
    });

    await waitFor(() => {
      expect(result.current.isSigningOut).toBe(false);
    });
  });

  // isSigningOut also returns to false when the sign-out call rejects (not just resolves), and
  // the rejection surfaces as the normalized network_error code.
  it('sets isSigningOut back to false and exposes network_error after a failed sign-out', async () => {
    service.signOut.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useSignOut(), { wrapper: createWrapper() });

    act(() => {
      result.current.signOut();
    });

    await waitFor(() => {
      expect(result.current.isSigningOut).toBe(false);
      expect(result.current.error).toBe('network_error');
    });
  });

  // reset clears a stale error without needing a fresh signOut call — e.g. dismissing an
  // error banner.
  it('reset clears a stale error', async () => {
    service.signOut.mockRejectedValueOnce(new Error('boom'));
    const { result } = renderHook(() => useSignOut(), { wrapper: createWrapper() });

    act(() => {
      result.current.signOut();
    });
    await waitFor(() => {
      expect(result.current.error).toBe('network_error');
    });

    act(() => {
      result.current.reset();
    });

    await waitFor(() => {
      expect(result.current.error).toBeNull();
    });
  });

  // Memoization — signOut/reset must stay referentially stable across re-renders that don't
  // change any dependency, so a memoized consumer never re-renders needlessly.
  it('keeps signOut and reset referentially stable across re-renders', () => {
    const { result, rerender } = renderHook(() => useSignOut(), { wrapper: createWrapper() });

    const firstSignOut = result.current.signOut;
    const firstReset = result.current.reset;

    rerender(undefined);

    expect(result.current.signOut).toBe(firstSignOut);
    expect(result.current.reset).toBe(firstReset);
  });
});
