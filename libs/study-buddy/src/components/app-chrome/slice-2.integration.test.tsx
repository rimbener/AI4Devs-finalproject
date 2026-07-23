/**
 * Slice 2 integration: New Lesson CTA + desktop chrome trim + Settings sign-out placement.
 */
jest.mock('@helsoft/hooks', () => ({
  ...jest.requireActual('@helsoft/hooks'),
  useAuth: jest.fn(),
  useBreakpoint: jest.fn(),
  useLessons: jest.fn(),
  useSession: jest.fn(),
}));
jest.mock('@helsoft/localization', () => ({
  useLocalization: jest.fn(),
}));
jest.mock('expo-router', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(),
}));

import { useAuth, useBreakpoint, useLessons, useSession } from '@helsoft/hooks';
import { useLocalization } from '@helsoft/localization';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { usePathname, useRouter } from 'expo-router';
import { View } from 'react-native';

import { authValue, localizationValue } from '../../test-utils/auth-test-factories';
import { SavedLessons } from '../saved-lessons/saved-lessons';
import { SettingsSignOut } from '../settings-sign-out/settings-sign-out';
import { AppChrome } from './app-chrome';

const mockUseAuth = useAuth as jest.Mock;
const mockUseBreakpoint = useBreakpoint as jest.Mock;
const mockUseLessons = useLessons as jest.Mock;
const mockUseLocalization = useLocalization as jest.Mock;
const mockUsePathname = usePathname as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;
const mockUseSession = useSession as jest.Mock;

const t = (key: string, options?: Record<string, unknown>) => {
  if (key === 'nav.newLesson') return 'New lesson';
  if (key === 'home.savedLessons') return 'Saved lessons';
  if (key === 'home.empty') return 'No saved lessons yet. Create one to get started.';
  if (key === 'home.loading') return 'Loading saved lessons…';
  if (key === 'lessons.count') return `${options?.count ?? 0} lessons`;
  return key;
};

describe('native-bottom-tabs slice 2 integration', () => {
  const push = jest.fn();
  const navigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue(authValue());
    mockUseLocalization.mockReturnValue(localizationValue({ t }));
    mockUsePathname.mockReturnValue('/');
    mockUseRouter.mockReturnValue({ push, navigate });
    mockUseSession.mockReturnValue({
      isLoading: false,
      session: {
        user: {
          email: 'ada@example.com',
          user_metadata: { full_name: 'Ada Lovelace' },
        },
      },
    });
    mockUseLessons.mockReturnValue({
      lessons: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      deleteLesson: jest.fn().mockResolvedValue(undefined),
    });
  });

  it('wires CTA, desktop chrome AccountMenu, and breakpoint-gated Settings SignOut', async () => {
    mockUseBreakpoint.mockReturnValue('mobile');

    await render(
      <View>
        <AppChrome />
        <SavedLessons />
        <SettingsSignOut />
      </View>,
    );

    // @s6 — My lessons CTA → /pdf-files
    fireEvent.press(screen.getByRole('button', { name: 'New lesson' }));
    expect(push).toHaveBeenCalledWith('/pdf-files');

    // @s3 — DesktopBar: My lessons + PDF files; no New lesson bar item
    expect(screen.getByRole('link', { name: 'nav.myLessons' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'nav.myPdfFiles' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'nav.newLesson' })).toBeNull();

    // @s11 / @s12 — Settings + Sign out via AccountMenu
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'nav.openAccountMenu' }));
    });
    expect(screen.getByRole('menuitem', { name: 'nav.settings' })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'auth.logOut' })).toBeTruthy();

    // @s13 — mobile Settings shows uncontrolled SignOut button (@s14 gated in unit test)
    expect(screen.getByRole('button', { name: 'auth.logOut' })).toBeTruthy();
  });
});
