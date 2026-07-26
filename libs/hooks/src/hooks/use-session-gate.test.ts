jest.mock('./use-session', () => ({ useSession: jest.fn() }));

import { renderHook } from '@testing-library/react-native';
import { useSession } from './use-session';
import { useSessionGate } from './use-session-gate';

const mockUseSession = useSession as jest.Mock;

describe('useSessionGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Shared gating hoisted out of use-api-key.ts/use-profile.ts (round 1 full-review finding):
  // a user-scoped query should be enabled/loading in lockstep with the session.
  it('enables and reports not-loading-yet when a session user id is present and the session settled', () => {
    mockUseSession.mockReturnValue({
      session: { user: { id: 'user-1' } },
      isLoading: false,
    });

    const { result } = renderHook(() => useSessionGate());

    expect(result.current.sessionUserId).toBe('user-1');
    expect(result.current.enabled).toBe(true);
    expect(result.current.deriveIsLoading(false)).toBe(false);
  });

  it('disables and never reports loading when there is no session', () => {
    mockUseSession.mockReturnValue({ session: null, isLoading: false });

    const { result } = renderHook(() => useSessionGate());

    expect(result.current.sessionUserId).toBeUndefined();
    expect(result.current.enabled).toBe(false);
    expect(result.current.deriveIsLoading(true)).toBe(false);
  });

  it('reports loading while the session itself is still resolving, regardless of query-pending state', () => {
    mockUseSession.mockReturnValue({ session: null, isLoading: true });

    const { result } = renderHook(() => useSessionGate());

    expect(result.current.enabled).toBe(false);
    expect(result.current.deriveIsLoading(false)).toBe(true);
  });

  it('derives loading from the query-pending flag once authenticated and settled', () => {
    mockUseSession.mockReturnValue({
      session: { user: { id: 'user-1' } },
      isLoading: false,
    });

    const { result } = renderHook(() => useSessionGate());

    expect(result.current.deriveIsLoading(true)).toBe(true);
    expect(result.current.deriveIsLoading(false)).toBe(false);
  });
});
