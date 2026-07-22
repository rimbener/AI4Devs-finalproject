jest.mock('@helsoft/hooks', () => ({
  ...jest.requireActual('@helsoft/hooks'),
  useAuth: jest.fn(),
  useSession: jest.fn(),
}));
jest.mock('@helsoft/localization', () => ({
  useLocalization: jest.fn(),
}));
jest.mock('expo-router', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(),
}));

import { useAuth, useSession } from '@helsoft/hooks';
import { useLocalization } from '@helsoft/localization';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { usePathname, useRouter } from 'expo-router';

import { authValue, localizationValue } from '../../test-utils/auth-test-factories';
import { AppChrome } from './app-chrome';

const mockUseAuth = useAuth as jest.Mock;
const mockUseLocalization = useLocalization as jest.Mock;
const mockUsePathname = usePathname as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;
const mockUseSession = useSession as jest.Mock;

const navigate = jest.fn();

const sessionValue = {
  isLoading: false,
  session: {
    user: {
      email: 'ada@example.com',
      user_metadata: { full_name: 'Ada Lovelace' },
    },
  },
};

describe('AppChrome', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue(authValue());
    mockUseLocalization.mockReturnValue(localizationValue());
    mockUsePathname.mockReturnValue('/');
    mockUseRouter.mockReturnValue({ navigate });
    mockUseSession.mockReturnValue(sessionValue);
  });

  // @s3 — desktop-only chrome: DesktopBar with My lessons; no New lesson; no MobileBar.
  it('renders desktop bar with My lessons only and no mobile chrome', async () => {
    await render(<AppChrome />);

    expect(screen.getByText('brand.name')).toBeOnTheScreen();
    expect(screen.getByRole('link', { name: 'nav.myLessons' })).toBeOnTheScreen();
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.queryByRole('link', { name: 'nav.newLesson' })).toBeNull();
    expect(screen.queryByTestId('mobile-top-bar')).toBeNull();
    expect(screen.queryByTestId('mobile-bottom-bar')).toBeNull();
  });

  it('navigates Home from the desktop bar', async () => {
    await render(<AppChrome />);

    await act(async () => {
      fireEvent.press(screen.getByRole('link', { name: 'nav.myLessons' }));
    });

    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('uses the latest router for Home navigation after a rerender', async () => {
    const initialNavigate = jest.fn();
    const updatedNavigate = jest.fn();
    mockUseRouter.mockReturnValue({ navigate: initialNavigate });
    const { rerender } = await render(<AppChrome />);

    mockUseRouter.mockReturnValue({ navigate: updatedNavigate });
    await rerender(<AppChrome />);
    await act(async () => {
      fireEvent.press(screen.getByRole('link', { name: 'nav.myLessons' }));
    });

    expect(initialNavigate).not.toHaveBeenCalled();
    expect(updatedNavigate).toHaveBeenCalledWith('/');
  });

  // @s12 — Sign out stays on desktop AccountMenu confirm flow.
  it('uses session identity for account actions and the controlled sign-out dialog', async () => {
    const signOut = jest.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue(authValue({ signOut }));
    await render(<AppChrome />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'nav.openAccountMenu' }));
    });

    expect(screen.getByText('Ada Lovelace')).toBeTruthy();
    expect(screen.getByText('ada@example.com')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByRole('menuitem', { name: 'auth.logOut' }));
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'auth.logOutConfirmAction' }));
    });

    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('exposes the account-menu trigger name and expanded state', async () => {
    const t = jest.fn((key: string) => key);
    mockUseLocalization.mockReturnValue(localizationValue({ t }));
    await render(<AppChrome />);

    expect(t).toHaveBeenCalledWith('nav.openAccountMenu', { label: 'Ada Lovelace' });

    const trigger = screen.getByRole('button', { name: 'nav.openAccountMenu' });
    expect(trigger.props.accessibilityState).toEqual({ expanded: false });

    await act(async () => {
      fireEvent.press(trigger);
    });

    expect(
      screen.getByRole('button', { name: 'nav.openAccountMenu' }).props.accessibilityState,
    ).toEqual({ expanded: true });
  });

  // @s11 — Settings via AccountMenu only; not a DesktopBar destination.
  it('navigates to settings from the account menu without a Settings bar item', async () => {
    mockUsePathname.mockReturnValue('/settings');
    await render(<AppChrome />);

    expect(screen.getByRole('link', { name: 'nav.myLessons' }).props.accessibilityState).toEqual({
      selected: false,
    });
    expect(screen.queryByRole('link', { name: 'nav.settings' })).toBeNull();

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'nav.openAccountMenu' }));
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('menuitem', { name: 'nav.settings' }));
    });

    expect(navigate).toHaveBeenCalledWith('/settings');
  });

  it('does not invent an identity while session loading', async () => {
    mockUseSession.mockReturnValue({ isLoading: true, session: null });
    await render(<AppChrome />);

    expect(screen.queryByRole('button')).toBeNull();
  });
});
