jest.mock('@helsoft/supabase-services', () => ({
  AuthService: {
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(),
  },
}));

import type { Session } from '@helsoft/supabase-services';
import { AuthService } from '@helsoft/supabase-services';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useSession } from './use-session';

const service = AuthService as jest.Mocked<typeof AuthService>;

describe('useSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    service.getSession.mockResolvedValue(null);
    service.onAuthStateChange.mockReturnValue(jest.fn());
  });

  it('starts loading then exposes the session from AuthService.getSession', async () => {
    const session = { access_token: 'tok' } as never;
    service.getSession.mockResolvedValue(session);

    const { result } = renderHook(() => useSession());

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

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const next = { access_token: 'next' } as Session;
    act(() => {
      push?.(next);
    });

    expect(result.current.session).toBe(next);
  });

  it('unsubscribes on unmount', async () => {
    const stop = jest.fn();
    service.onAuthStateChange.mockReturnValue(stop);

    const { unmount } = renderHook(() => useSession());

    await waitFor(() => {
      expect(service.getSession).toHaveBeenCalled();
    });

    unmount();

    expect(stop).toHaveBeenCalledWith();
  });
});
