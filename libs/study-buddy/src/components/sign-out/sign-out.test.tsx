jest.mock('@helsoft/hooks', () => ({
  ...jest.requireActual('@helsoft/hooks'),
  useSignOut: jest.fn(),
}));
jest.mock('@helsoft/localization', () => ({
  useLocalization: jest.fn(),
}));

import { useSignOut } from '@helsoft/hooks';
import { useLocalization } from '@helsoft/localization';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { localizationValue } from '../../test-utils/auth-test-factories';
import { SignOut } from './sign-out';

const mockUseSignOut = useSignOut as jest.Mock;
const mockUseLocalization = useLocalization as jest.Mock;

const signOutValue = (
  overrides: Partial<ReturnType<typeof useSignOut>> = {},
): ReturnType<typeof useSignOut> => ({
  signOut: jest.fn().mockResolvedValue(undefined),
  isSigningOut: false,
  error: null,
  reset: jest.fn(),
  ...overrides,
});

describe('SignOut (study-buddy wiring)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalization.mockReturnValue(localizationValue());
  });

  it('wires useSignOut().signOut into the prop-driven confirm dialog', async () => {
    const signOut = jest.fn().mockResolvedValue(undefined);
    mockUseSignOut.mockReturnValue(signOutValue({ signOut }));

    await render(<SignOut />);
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'auth.logOut' }));
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'auth.logOutConfirmAction' }));
    });

    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('forwards controlled dialog props without rendering a trigger', async () => {
    mockUseSignOut.mockReturnValue(signOutValue());
    const onOpenChange = jest.fn();

    await render(<SignOut open onOpenChange={onOpenChange} />);

    expect(screen.queryByRole('button', { name: 'auth.logOut' })).toBeNull();
    expect(screen.getByText('auth.logOutConfirmBody')).toBeTruthy();
  });

  it('wires useSignOut error + reset into the error dialog', async () => {
    const signOut = jest.fn().mockResolvedValue(undefined);
    const reset = jest.fn();
    mockUseSignOut.mockReturnValue(signOutValue({ signOut, error: 'network_error', reset }));

    await render(<SignOut />);

    expect(screen.getByText('auth.logOutError')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'auth.logOutRetry' }));
    });

    expect(reset).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
