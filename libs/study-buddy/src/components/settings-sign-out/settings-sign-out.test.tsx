jest.mock('@helsoft/hooks', () => ({
  ...jest.requireActual('@helsoft/hooks'),
  useSignOut: jest.fn(),
  useBreakpoint: jest.fn(),
}));
jest.mock('@helsoft/localization', () => ({
  useLocalization: jest.fn(),
}));

import { useBreakpoint, useSignOut } from '@helsoft/hooks';
import { useLocalization } from '@helsoft/localization';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { localizationValue, signOutValue } from '../../test-utils/auth-test-factories';
import { SettingsSignOut } from './settings-sign-out';

const mockUseSignOut = useSignOut as jest.Mock;
const mockUseBreakpoint = useBreakpoint as jest.Mock;
const mockUseLocalization = useLocalization as jest.Mock;

describe('SettingsSignOut', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSignOut.mockReturnValue(signOutValue());
    mockUseLocalization.mockReturnValue(localizationValue());
  });

  // @s13 — native / narrow web: Sign out on Settings with existing confirm flow.
  it('renders uncontrolled SignOut when breakpoint is mobile', async () => {
    const signOut = jest.fn();
    mockUseBreakpoint.mockReturnValue('mobile');
    mockUseSignOut.mockReturnValue(signOutValue({ signOut }));

    await render(<SettingsSignOut />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'auth.logOut' }));
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'auth.logOutConfirmAction' }));
    });

    expect(signOut).toHaveBeenCalledTimes(1);
  });

  // @s14 — wide web: no Sign out on Settings (AccountMenu owns it).
  it('renders nothing when breakpoint is desktop', async () => {
    mockUseBreakpoint.mockReturnValue('desktop');

    await render(<SettingsSignOut />);

    expect(screen.queryByRole('button', { name: 'auth.logOut' })).toBeNull();
    expect(screen.queryByText('auth.logOutConfirmBody')).toBeNull();
  });
});
