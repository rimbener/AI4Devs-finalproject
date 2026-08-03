jest.mock('./use-session', () => ({ useSession: jest.fn() }));

import { renderHook } from '@testing-library/react-native';
import { useSession } from './use-session';
import { useSessionGate } from './use-session-gate';

const mockUseSession = useSession as jest.Mock;

describe('useSessionGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Shared gating hoisted out of use-get-api-key.ts/use-profile.ts (round 1 full-review
  // finding): a user-scoped query should be enabled in lockstep with the session.
  it('enables when a session user id is present and the session settled', () => {
    mockUseSession.mockReturnValue({
      session: { user: { id: 'user-1' } },
      isLoading: false,
    });

    const { result } = renderHook(() => useSessionGate());

    expect(result.current.sessionUserId).toBe('user-1');
    expect(result.current.isSessionLoading).toBe(false);
    expect(result.current.enabled).toBe(true);
  });

  it('disables when there is no session', () => {
    mockUseSession.mockReturnValue({ session: null, isLoading: false });

    const { result } = renderHook(() => useSessionGate());

    expect(result.current.sessionUserId).toBeUndefined();
    expect(result.current.enabled).toBe(false);
  });

  it('disables while the session itself is still resolving', () => {
    mockUseSession.mockReturnValue({ session: null, isLoading: true });

    const { result } = renderHook(() => useSessionGate());

    expect(result.current.sessionUserId).toBeUndefined();
    expect(result.current.isSessionLoading).toBe(true);
    expect(result.current.enabled).toBe(false);
  });

  // Mutation-kill — a session object with no `user` field (e.g. a partially-hydrated session)
  // must never throw; both `?.` links guard independently.
  it('never throws and reports no sessionUserId when the session has no user field', () => {
    mockUseSession.mockReturnValue({ session: {}, isLoading: false });

    expect(() => renderHook(() => useSessionGate())).not.toThrow();
    const { result } = renderHook(() => useSessionGate());

    expect(result.current.sessionUserId).toBeUndefined();
    expect(result.current.enabled).toBe(false);
  });
});
