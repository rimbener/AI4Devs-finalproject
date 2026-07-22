jest.mock('@helsoft/hooks', () => ({
  ...jest.requireActual('@helsoft/hooks'),
  useSession: jest.fn(),
}));

import { useSession } from '@helsoft/hooks';
import { act, renderHook } from '@testing-library/react-native';

import { useAppChrome } from './use-app-chrome';

const mockUseSession = useSession as jest.Mock;

describe('useAppChrome', () => {
  beforeEach(() => {
    mockUseSession.mockReturnValue({
      isLoading: false,
      session: {
        user: {
          email: 'ada@example.com',
          user_metadata: { full_name: 'Ada Lovelace' },
        },
      },
    });
  });

  it('derives identity, Home nav, and controlled sign-out state without newLesson/mobile title', async () => {
    const { result } = await renderHook(() => useAppChrome('/upload'));

    expect(result.current.identity).toMatchObject({
      email: 'ada@example.com',
      label: 'Ada Lovelace',
    });
    expect(result.current.home).toEqual({ active: false, labelKey: 'nav.myLessons' });
    expect(result.current).not.toHaveProperty('newLesson');
    expect(result.current).not.toHaveProperty('mobileTitleKey');
    expect(result.current.signOutOpen).toBe(false);

    await act(async () => {
      result.current.setSignOutOpen(true);
    });

    expect(result.current.signOutOpen).toBe(true);
  });

  it('marks Home active only at the root pathname', async () => {
    const { result, rerender } = await renderHook<
      ReturnType<typeof useAppChrome>,
      { pathname: string }
    >(({ pathname }) => useAppChrome(pathname), {
      initialProps: { pathname: '/' },
    });

    expect(result.current.home).toEqual({ active: true, labelKey: 'nav.myLessons' });

    await rerender({ pathname: '/lesson/123' });

    expect(result.current.home).toEqual({ active: false, labelKey: 'nav.myLessons' });
  });

  it('keeps navigation props stable for unrelated chrome state changes', async () => {
    const { result } = await renderHook(() => useAppChrome('/'));
    const { home } = result.current;

    await act(async () => {
      result.current.setSignOutOpen(true);
    });

    expect(result.current.home).toBe(home);
  });
});
