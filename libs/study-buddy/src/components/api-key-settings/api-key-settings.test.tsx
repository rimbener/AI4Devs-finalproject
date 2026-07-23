jest.mock('@helsoft/hooks', () => ({
  ...jest.requireActual('@helsoft/hooks'),
  useApiKey: jest.fn(),
  useProfile: jest.fn(),
}));
jest.mock('@helsoft/localization', () => ({
  useLocalization: jest.fn(),
}));
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

import { useApiKey, useProfile } from '@helsoft/hooks';
import { useLocalization } from '@helsoft/localization';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { AccessibilityInfo, Linking } from 'react-native';

import { localizationValue } from '../../test-utils/auth-test-factories';
import {
  API_KEY_SETTINGS_GUIDANCE_URLS,
  ApiKeySettings,
  ApiKeySettingsScreen,
  apiKeySettingsStyles,
} from './api-key-settings';

const mockUseApiKey = useApiKey as jest.Mock;
const mockUseProfile = useProfile as jest.Mock;
const mockUseLocalization = useLocalization as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;

const emptyStatus = { keys: [] };
const groqStatus = { keys: [{ provider: 'groq' as const, updatedAt: '2026-01-01T00:00:00.000Z' }] };

const apiKeyValue = (overrides: Partial<ReturnType<typeof useApiKey>> = {}) => ({
  status: emptyStatus,
  isLoading: false,
  isSubmitting: false,
  hasKey: false,
  error: null,
  saveApiKey: jest.fn(),
  removeApiKey: jest.fn(),
  ...overrides,
});

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

    await render(<ApiKeySettings />);

    expect(announce).not.toHaveBeenCalled();
    announce.mockRestore();
  });

  it('announces when entitlement loading starts after mount', async () => {
    const announce = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(jest.fn());
    mockUseLocalization.mockReturnValue(localizationValue());
    const view = await render(<ApiKeySettings />);

    mockUseProfile.mockReturnValue(profileValue({ profile: null, isLoading: true }));
    await view.rerender(<ApiKeySettings />);

    expect(announce).toHaveBeenCalledWith('entitlements.loading');
    announce.mockRestore();
  });

  it('hides key settings when resolved entitlements are absent', async () => {
    mockUseProfile.mockReturnValue(profileValue({ profile: null }));
    mockUseLocalization.mockReturnValue(localizationValue());

    const view = await render(<ApiKeySettings />);

    expect(view.toJSON()).toBeNull();
  });

  it('preserves the concrete error and hidden styles', () => {
    expect(apiKeySettingsStyles.error).toEqual({ gap: 16 });
    expect(apiKeySettingsStyles.errorMessage).toMatchObject({
      color: '#b7191c',
      fontFamily: 'IBM Plex Sans',
      fontSize: 14,
      fontWeight: '400',
      letterSpacing: 0.25,
      lineHeight: 20,
    });
    expect(apiKeySettingsStyles.visuallyHidden).toEqual({
      position: 'absolute',
      width: 1,
      height: 1,
      overflow: 'hidden',
    });
  });

  it('renders the Show API keys settings entry button', async () => {
    mockUseLocalization.mockReturnValue(localizationValue());

    await render(<ApiKeySettings />);

    expect(screen.getByRole('button', { name: 'settings.apiKey.showSettings' })).toBeTruthy();
  });

  it('navigates to /settings/api-keys when the entry button is pressed', async () => {
    const push = jest.fn();
    mockUseRouter.mockReturnValue({ push });
    mockUseLocalization.mockReturnValue(localizationValue());

    await render(<ApiKeySettings />);

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

    await render(<ApiKeySettings />);

    expect(screen.queryByText('settings.apiKey.showSettings')).toBeNull();
    expect(screen.getByText('entitlements.loading').props.accessibilityLiveRegion).toBe('polite');
    expect(announce).toHaveBeenCalledWith('entitlements.loading');
    announce.mockRestore();
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

    const view = await render(<ApiKeySettings />);

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

    await render(<ApiKeySettings />);

    expect(screen.getByRole('alert')).toHaveTextContent('entitlements.error.message');
    expect(screen.queryByText('settings.apiKey.showSettings')).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'entitlements.error.retry' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});

describe('ApiKeySettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseApiKey.mockReturnValue(apiKeyValue());
  });

  it('renders the screen title', async () => {
    mockUseLocalization.mockReturnValue(localizationValue());

    await render(<ApiKeySettingsScreen />);

    expect(screen.getByRole('header', { name: 'settings.apiKey.screenTitle' })).toBeTruthy();
  });

  // @s1 — no keys: empty message + Add button.
  it('shows the empty manager state when no keys are saved', async () => {
    mockUseLocalization.mockReturnValue(localizationValue());

    await render(<ApiKeySettingsScreen />);

    expect(screen.getByText('settings.apiKey.manager.emptyMessage')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'settings.apiKey.manager.addNew' })).toBeTruthy();
  });

  // @s1 — entering and saving a key calls useApiKey().saveApiKey with provider and value.
  it('calls saveApiKey with the selected provider and entered key on submit', async () => {
    const saveApiKey = jest.fn().mockResolvedValue(undefined);
    mockUseApiKey.mockReturnValue(apiKeyValue({ saveApiKey }));
    mockUseLocalization.mockReturnValue(localizationValue());

    await render(<ApiKeySettingsScreen />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'settings.apiKey.manager.addNew' }));
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('radio', { name: 'settings.apiKey.provider.groq' }));
    });
    await act(async () => {
      fireEvent.changeText(screen.getByLabelText('settings.apiKey.inputLabel'), 'sk-test-key');
    });
    fireEvent.press(screen.getByRole('button', { name: 'settings.apiKey.save' }));

    expect(saveApiKey).toHaveBeenCalledWith('groq', 'sk-test-key');
  });

  // @s3 — a returning user (status.keys with groq) sees the masked saved state.
  it('renders the masked saved-status text built from the localized template', async () => {
    const updatedAt = '2026-01-01T00:00:00.000Z';
    mockUseApiKey.mockReturnValue(apiKeyValue({ status: groqStatus, hasKey: true }));
    mockUseLocalization.mockReturnValue(
      localizationValue({
        t: (key: string, options?: Record<string, unknown>) =>
          options ? `${key}:${JSON.stringify(options)}` : key,
        locale: 'en',
      }),
    );

    await render(<ApiKeySettingsScreen />);

    const expectedDate = new Date(updatedAt).toLocaleDateString('en');
    expect(
      screen.getByText(
        `settings.apiKey.savedStatus:{"provider":"settings.apiKey.provider.groq","date":"${expectedDate}"}`,
      ),
    ).toBeTruthy();
  });

  // @s3 — useApiKey().isLoading drives the loading spinner.
  it('shows the loading placeholder while useApiKey().isLoading is true', async () => {
    mockUseApiKey.mockReturnValue(apiKeyValue({ isLoading: true }));
    mockUseLocalization.mockReturnValue(localizationValue());

    await render(<ApiKeySettingsScreen />);

    expect(screen.queryByLabelText('settings.apiKey.inputLabel')).toBeNull();
    expect(screen.queryByText('settings.apiKey.manager.emptyMessage')).toBeNull();
  });

  // @s2 — useApiKey().isSubmitting disables the Save control.
  it('disables Save while useApiKey().isSubmitting is true', async () => {
    mockUseApiKey.mockReturnValue(apiKeyValue({ isSubmitting: true }));
    mockUseLocalization.mockReturnValue(localizationValue());

    await render(<ApiKeySettingsScreen />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'settings.apiKey.manager.addNew' }));
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('radio', { name: 'settings.apiKey.provider.groq' }));
    });

    expect(
      screen.getByRole('button', { name: 'settings.apiKey.save', disabled: true }),
    ).toBeTruthy();
  });

  // @s7/@s9 — a network_error maps to the network message.
  it('maps a network_error to the network message', async () => {
    mockUseApiKey.mockReturnValue(apiKeyValue({ error: 'network_error' }));
    mockUseLocalization.mockReturnValue(localizationValue());

    await render(<ApiKeySettingsScreen />);

    expect(screen.getByText('settings.apiKey.error.network')).toBeTruthy();
  });

  // @s8 — validation_error maps to the empty-key banner (service-layer backstop).
  it('maps a validation_error to the empty-key message', async () => {
    mockUseApiKey.mockReturnValue(apiKeyValue({ error: 'validation_error' }));
    mockUseLocalization.mockReturnValue(localizationValue());

    await render(<ApiKeySettingsScreen />);

    expect(screen.getByText('settings.apiKey.error.empty')).toBeTruthy();
  });

  // @s8 — confirming removal calls useApiKey().removeApiKey with the provider.
  it('calls removeApiKey with the provider when the removal is confirmed', async () => {
    const removeApiKey = jest.fn().mockResolvedValue(undefined);
    mockUseApiKey.mockReturnValue(apiKeyValue({ status: groqStatus, hasKey: true, removeApiKey }));
    mockUseLocalization.mockReturnValue(localizationValue());

    await render(<ApiKeySettingsScreen />);

    await act(async () => {
      fireEvent.press(
        screen.getByRole('button', {
          name: 'settings.apiKey.remove settings.apiKey.provider.groq',
        }),
      );
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'settings.apiKey.removeConfirmAction' }));
    });

    expect(removeApiKey).toHaveBeenCalledWith('groq');
  });

  it('lists every provider name key in the add modal radio group', async () => {
    mockUseLocalization.mockReturnValue(localizationValue());

    await render(<ApiKeySettingsScreen />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'settings.apiKey.manager.addNew' }));
    });

    for (const key of [
      'settings.apiKey.provider.groq',
      'settings.apiKey.provider.openai',
      'settings.apiKey.provider.anthropic',
      'settings.apiKey.provider.google',
      'settings.apiKey.provider.xai',
      'settings.apiKey.provider.deepseek',
    ]) {
      expect(screen.getByRole('radio', { name: key })).toBeTruthy();
    }
  });

  it('preserves every provider guidance URL constant', () => {
    expect(API_KEY_SETTINGS_GUIDANCE_URLS).toEqual({
      groq: 'https://console.groq.com/keys',
      openai: 'https://platform.openai.com/api-keys',
      anthropic: 'https://console.anthropic.com/settings/keys',
      google: 'https://aistudio.google.com/app/apikey',
      xai: 'https://console.x.ai',
      deepseek: 'https://platform.deepseek.com/api_keys',
    });
  });

  it('opens the groq guidance URL when the guidance link is pressed', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);
    mockUseLocalization.mockReturnValue(
      localizationValue({
        t: (key: string, options?: Record<string, unknown>) =>
          options ? `${key}:${JSON.stringify(options)}` : key,
      }),
    );

    await render(<ApiKeySettingsScreen />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'settings.apiKey.manager.addNew' }));
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('radio', { name: 'settings.apiKey.provider.groq' }));
    });
    await act(async () => {
      fireEvent.press(
        screen.getByRole('button', {
          name: 'settings.apiKey.guidanceTemplate:{"provider":"settings.apiKey.provider.groq"}',
        }),
      );
    });

    expect(openURL).toHaveBeenCalledWith('https://console.groq.com/keys');
    openURL.mockRestore();
  });
});
