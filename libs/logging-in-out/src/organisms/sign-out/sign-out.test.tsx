jest.mock('@helsoft/localization', () => ({
  useLocalization: jest.fn(),
}));

import { useLocalization } from '@helsoft/localization';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { localizationValue } from '../../test-utils/auth-test-factories';
import { SignOut } from './sign-out';
import type { SignOutProps } from './sign-out.types';

const mockUseLocalization = useLocalization as jest.Mock;

const defaultProps = (): SignOutProps => ({
  onSignOut: jest.fn().mockResolvedValue(undefined),
  isSigningOut: false,
  error: null,
});

const renderSignOut = (overrides: Partial<SignOutProps> = {}) =>
  render(<SignOut {...defaultProps()} {...overrides} />);

describe('SignOut', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalization.mockReturnValue(localizationValue());
  });

  // @s4/@s11 — the trigger button is rendered, labelled from localized copy.
  it('renders a Log Out trigger', async () => {
    await renderSignOut();

    expect(screen.getByRole('button', { name: 'auth.logOut' })).toBeTruthy();
  });

  // @s4/@s10/@s11 — the confirmation dialog is not shown before the trigger is pressed.
  it('does not show the confirmation dialog before the trigger is pressed', async () => {
    await renderSignOut();

    expect(screen.queryByText('auth.logOutConfirmBody')).toBeNull();
  });

  it('renders only the controlled confirmation dialog and reports close changes', async () => {
    const onOpenChange = jest.fn();
    await renderSignOut({ open: true, onOpenChange });

    expect(screen.queryByRole('button', { name: 'auth.logOut' })).toBeNull();
    expect(screen.getByText('auth.logOutConfirmBody')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'auth.logOutCancelAction' }));
    });

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  // @s4/@s10/@s11 — pressing the trigger shows a confirmation dialog before signing out.
  it('shows a confirmation dialog when the trigger is pressed', async () => {
    await renderSignOut();
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'auth.logOut' }));
    });

    expect(screen.getByText('auth.logOutConfirmBody')).toBeTruthy();
    expect(screen.getByText('auth.logOutConfirmHeadline')).toBeTruthy();
  });

  // @s4/@s11 — confirming in the dialog signs the user out.
  it('calls onSignOut when the confirmation is accepted', async () => {
    const onSignOut = jest.fn().mockResolvedValue(undefined);
    await renderSignOut({ onSignOut });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'auth.logOut' }));
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'auth.logOutConfirmAction' }));
    });

    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  // @s4/@s11 — confirming closes the dialog.
  it('closes the confirmation dialog after confirming', async () => {
    const onSignOut = jest.fn().mockResolvedValue(undefined);
    await renderSignOut({ onSignOut });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'auth.logOut' }));
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'auth.logOutConfirmAction' }));
    });

    expect(screen.queryByText('auth.logOutConfirmBody')).toBeNull();
  });

  // @s10 — dismissing the dialog keeps the session active: onSignOut is never called.
  it('does not call onSignOut when the confirmation is dismissed', async () => {
    const onSignOut = jest.fn();
    await renderSignOut({ onSignOut });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'auth.logOut' }));
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'auth.logOutCancelAction' }));
    });

    expect(onSignOut).not.toHaveBeenCalled();
    expect(screen.queryByText('auth.logOutConfirmBody')).toBeNull();
  });

  it('shows an error dialog when error is set', async () => {
    await renderSignOut({ error: 'network_error' });

    expect(screen.getByText('auth.logOutError')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'auth.logOutRetry' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'auth.logOutCancelAction' })).toBeTruthy();
  });

  it('hides the confirm dialog while the error dialog is open', async () => {
    await renderSignOut({ open: true, error: 'network_error' });

    expect(screen.queryByText('auth.logOutConfirmBody')).toBeNull();
    expect(screen.getByText('auth.logOutError')).toBeTruthy();
  });

  it('resets and signs out again when retry is pressed', async () => {
    const onSignOut = jest.fn().mockResolvedValue(undefined);
    const onSignOutError = jest.fn();
    await renderSignOut({ error: 'network_error', onSignOut, onSignOutError });

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'auth.logOutRetry' }));
    });

    expect(onSignOutError).toHaveBeenCalledTimes(1);
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  it('only resets when error-dialog cancel is pressed', async () => {
    const onSignOut = jest.fn();
    const onSignOutError = jest.fn();
    await renderSignOut({ error: 'network_error', onSignOut, onSignOutError });

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'auth.logOutCancelAction' }));
    });

    expect(onSignOutError).toHaveBeenCalledTimes(1);
    expect(onSignOut).not.toHaveBeenCalled();
  });

  it('disables the trigger while signing out', async () => {
    await renderSignOut({ isSigningOut: true });

    expect(screen.getByRole('button', { name: 'auth.logOut' })).toBeDisabled();
  });
});
