jest.mock('@helsoft/supabase-services', () => ({
  AuthService: {
    signIn: jest.fn(),
  },
}));

import { AuthService } from '@helsoft/supabase-services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { createElement } from 'react';

import { useAuth } from './use-auth';

const service = AuthService as jest.Mocked<typeof AuthService>;

const createWrapper = () => {
  const queryClient = new QueryClient();
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useAuth', () => {
  beforeEach(() => jest.clearAllMocks());

  // @s2 — signIn delegates to AuthService with the given credentials.
  it('signIn calls AuthService.signIn with the given email and password', async () => {
    service.signIn.mockResolvedValue({ session: null, user: null } as never);
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    act(() => {
      result.current.signIn({ email: 'user@example.com', password: 'secret1' });
    });

    await waitFor(() => {
      expect(service.signIn).toHaveBeenCalledWith('user@example.com', 'secret1');
    });
  });

  // @s3 — isSigningIn is true while the sign-in call is in flight, false once it resolves.
  it('sets isSigningIn true during sign-in and false after it resolves', async () => {
    let resolveSignIn: (value: unknown) => void = () => {};
    service.signIn.mockReturnValue(
      new Promise((resolve) => {
        resolveSignIn = resolve;
      }) as never,
    );
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    expect(result.current.isSigningIn).toBe(false);

    act(() => {
      result.current.signIn({ email: 'user@example.com', password: 'secret1' });
    });

    // TanStack Query batches the resulting mutation-state notification onto a macrotask, so
    // the re-render lands one tick after the synchronous `act` above.
    await waitFor(() => {
      expect(result.current.isSigningIn).toBe(true);
    });

    await act(async () => {
      resolveSignIn({ session: null, user: null });
    });

    await waitFor(() => {
      expect(result.current.isSigningIn).toBe(false);
    });
  });

  // @s5/@s6 — a failed signIn exposes the normalized AuthErrorCode via `error`, so the UI can
  // render the right banner without ever seeing the raw service/DAO error.
  it('sets error to the failed signIn code, and null on a subsequent successful signIn', async () => {
    service.signIn.mockRejectedValueOnce({ code: 'invalid_credentials' });
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    expect(result.current.error).toBeNull();

    act(() => {
      result.current.signIn({ email: 'user@example.com', password: 'wrong' });
    });

    await waitFor(() => {
      expect(result.current.error).toBe('invalid_credentials');
    });

    service.signIn.mockResolvedValueOnce({ session: null, user: null } as never);

    act(() => {
      result.current.signIn({ email: 'user@example.com', password: 'secret1' });
    });

    await waitFor(() => {
      expect(result.current.error).toBeNull();
    });
  });

  // @s3/@s6 — the Loading state shows "no error yet" (spec.md UI-states table): a stale error
  // from a previous failed attempt must clear as soon as a new signIn attempt starts, not only
  // once it resolves.
  it('clears a previous error immediately when a new signIn attempt starts, before it resolves', async () => {
    service.signIn.mockRejectedValueOnce({ code: 'network_error' });
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    act(() => {
      result.current.signIn({ email: 'user@example.com', password: 'secret1' });
    });
    await waitFor(() => {
      expect(result.current.error).toBe('network_error');
    });

    let resolveSignIn: (value: unknown) => void = () => {};
    service.signIn.mockReturnValue(
      new Promise((resolve) => {
        resolveSignIn = resolve;
      }) as never,
    );

    act(() => {
      result.current.signIn({ email: 'user@example.com', password: 'secret1' });
    });

    // The new attempt's pending state clears the stale error before it resolves.
    await waitFor(() => {
      expect(result.current.isSigningIn).toBe(true);
      expect(result.current.error).toBeNull();
    });

    await act(async () => {
      resolveSignIn({ session: null, user: null });
    });
  });

  // @s3 — isSigningIn also returns to false when the sign-in call rejects (not just resolves).
  it('sets isSigningIn back to false after a failed sign-in', async () => {
    service.signIn.mockRejectedValue(new Error('invalid_credentials'));
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    act(() => {
      result.current.signIn({ email: 'user@example.com', password: 'wrong' });
    });

    await waitFor(() => {
      expect(result.current.isSigningIn).toBe(false);
    });
  });

  // Guard against a hypothetical AuthService contract violation (Round-1 slice-2 review,
  // Minor 4) — if signIn ever rejects with a cause lacking a valid string `.code`, useAuth must
  // not trust an unchecked `as AuthError` cast (which would silently read `undefined`); it falls
  // back to the safe network_error default instead.
  it('falls back to network_error when the rejected cause has no valid string code', async () => {
    service.signIn.mockRejectedValueOnce({ message: 'boom' });
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    act(() => {
      result.current.signIn({ email: 'user@example.com', password: 'wrong' });
    });

    await waitFor(() => {
      expect(result.current.error).toBe('network_error');
    });
  });

  // Full-review Round 1, Minor 7 — isAuthErrorShape only checked `typeof code === 'string'`, not
  // actual membership in the closed AuthErrorCode union, so an out-of-union string code would
  // have silently passed through instead of falling back to the safe network_error default.
  it('falls back to network_error when the rejected cause has a string code outside the AuthErrorCode union', async () => {
    service.signIn.mockRejectedValueOnce({ code: 'something_else' });
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    act(() => {
      result.current.signIn({ email: 'user@example.com', password: 'wrong' });
    });

    await waitFor(() => {
      expect(result.current.error).toBe('network_error');
    });
  });

  // Memoization — signIn must stay referentially stable across re-renders that don't change
  // any dependency, so a memoized consumer (e.g. React.memo'd button) never re-renders
  // needlessly. `mutate` is one of TanStack Query's stable primitives, so this holds for free.
  it('keeps signIn referentially stable across re-renders', () => {
    const { result, rerender } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    const firstSignIn = result.current.signIn;

    rerender(undefined);

    expect(result.current.signIn).toBe(firstSignIn);
  });

  // Stale-closure guard — a signIn reference captured on an early render must still drive
  // the *current* isSigningIn state correctly on a later render, not a stale snapshot.
  it('a signIn reference captured on an earlier render still drives the current isSigningIn state', async () => {
    let resolveSignIn: (value: unknown) => void = () => {};
    service.signIn.mockReturnValue(
      new Promise((resolve) => {
        resolveSignIn = resolve;
      }) as never,
    );
    const { result, rerender } = renderHook(() => useAuth(), { wrapper: createWrapper() });
    const signInFromFirstRender = result.current.signIn;

    rerender(undefined);

    act(() => {
      signInFromFirstRender({ email: 'user@example.com', password: 'secret1' });
    });

    await waitFor(() => {
      expect(result.current.isSigningIn).toBe(true);
    });

    await act(async () => {
      resolveSignIn({ session: null, user: null });
    });

    await waitFor(() => {
      expect(result.current.isSigningIn).toBe(false);
    });
  });
});
