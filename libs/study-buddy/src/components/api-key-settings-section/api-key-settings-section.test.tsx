jest.mock('@helsoft/hooks', () => ({
  ...jest.requireActual('@helsoft/hooks'),
  useProfile: jest.fn(),
}));
jest.mock('@helsoft/localization', () => ({
  useLocalization: jest.fn(),
}));
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

import { lightTheme } from '@helsoft/components/theme';
import { useProfile } from '@helsoft/hooks';
import { useLocalization } from '@helsoft/localization';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { AccessibilityInfo } from 'react-native';

import { localizationValue } from '../../test-utils/auth-test-factories';
import { ApiKeySettingsSection } from './api-key-settings-section';

const mockUseProfile = useProfile as jest.Mock;
const mockUseLocalization = useLocalization as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;

const profileValue = (overrides: Partial<ReturnType<typeof useProfile>> = {}) => ({
  profile: {
    plan: 'free' as const,
    keySource: 'user' as const,
    showKeySettings: true,
    showAds: true,
    canCreate: false,
  },
  isLoading: false,
  error: null,
  retry: jest.fn(),
  ...overrides,
});

describe('ApiKeySettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseProfile.mockReturnValue(profileValue());
    mockUseRouter.mockReturnValue({ push: jest.fn() });
  });

  it('does not announce entitlement loading after entitlements resolve', async () => {
    const announce = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(jest.fn());
    mockUseLocalization.mockReturnValue(localizationValue());

    await render(<ApiKeySettingsSection />);

    expect(announce).not.toHaveBeenCalled();
    announce.mockRestore();
  });

  it('announces when entitlement loading starts after mount', async () => {
    const announce = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(jest.fn());
    mockUseLocalization.mockReturnValue(localizationValue());
    const view = await render(<ApiKeySettingsSection />);

    mockUseProfile.mockReturnValue(profileValue({ profile: null, isLoading: true }));
    await view.rerender(<ApiKeySettingsSection />);

    expect(announce).toHaveBeenCalledWith('entitlements.loading');
    announce.mockRestore();
  });

  it('hides key settings when resolved entitlements are absent', async () => {
    mockUseProfile.mockReturnValue(profileValue({ profile: null }));
    mockUseLocalization.mockReturnValue(localizationValue());

    const view = await render(<ApiKeySettingsSection />);

    expect(view.toJSON()).toBeNull();
  });

  it('renders the Show API keys settings entry button', async () => {
    mockUseLocalization.mockReturnValue(localizationValue());

    await render(<ApiKeySettingsSection />);

    expect(screen.getByRole('button', { name: 'settings.apiKey.showSettings' })).toBeTruthy();
  });

  it('navigates to /settings/api-keys when the entry button is pressed', async () => {
    const push = jest.fn();
    mockUseRouter.mockReturnValue({ push });
    mockUseLocalization.mockReturnValue(localizationValue());

    await render(<ApiKeySettingsSection />);

    fireEvent.press(screen.getByRole('button', { name: 'settings.apiKey.showSettings' }));

    expect(push).toHaveBeenCalledWith('/settings/api-keys');
  });

  // @s4 — plan-sensitive settings stay hidden until entitlements resolve.
  it('announces entitlement loading without rendering key settings', async () => {
    const announce = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(jest.fn());
    mockUseProfile.mockReturnValue(profileValue({ profile: null, isLoading: true }));
    mockUseLocalization.mockReturnValue(localizationValue());

    await render(<ApiKeySettingsSection />);

    expect(screen.queryByText('settings.apiKey.showSettings')).toBeNull();
    expect(screen.getByText('entitlements.loading').props.accessibilityLiveRegion).toBe('polite');
    expect(announce).toHaveBeenCalledWith('entitlements.loading');
    announce.mockRestore();
    // Mutation coverage — the visually-hidden loading label is offscreen, not just invisible.
    expect(screen.getByText('entitlements.loading')).toHaveStyle({
      position: 'absolute',
      width: 1,
      height: 1,
      overflow: 'hidden',
    });
  });

  // @s9/@s17 — paid users never see BYOK settings.
  it('renders nothing for paid entitlements when a user key remains saved', async () => {
    mockUseProfile.mockReturnValue(
      profileValue({
        profile: {
          plan: 'paid',
          keySource: 'platform',
          showKeySettings: false,
          showAds: false,
          canCreate: true,
        },
      }),
    );
    mockUseLocalization.mockReturnValue(localizationValue());

    const view = await render(<ApiKeySettingsSection />);

    expect(view.toJSON()).toBeNull();
  });

  // @s5/@s6 — entitlement failures hide key controls and delegate retry.
  it('renders an entitlement error and retries without showing key settings', async () => {
    const retry = jest.fn();
    mockUseProfile.mockReturnValue(
      profileValue({
        profile: null,
        error: new Error('read failed'),
        retry,
      }),
    );
    mockUseLocalization.mockReturnValue(localizationValue());

    await render(<ApiKeySettingsSection />);

    expect(screen.getByRole('alert')).toHaveTextContent('entitlements.error.message');
    expect(screen.queryByText('settings.apiKey.showSettings')).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'entitlements.error.retry' }));
    expect(retry).toHaveBeenCalledTimes(1);

    // Mutation coverage — the error container/message are styled from the theme.
    expect(screen.getByRole('alert').parent).toHaveStyle({ gap: lightTheme.spacing.s4 });
    expect(screen.getByRole('alert')).toHaveStyle({
      ...lightTheme.typography.bodyMedium,
      color: lightTheme.colors.error,
    });
  });
});
