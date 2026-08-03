jest.mock('@helsoft/hooks', () => ({
  ...jest.requireActual('@helsoft/hooks'),
  useApiKey: jest.fn(),
  useGetApiKey: jest.fn(),
}));
jest.mock('@helsoft/localization', () => ({
  useLocalization: jest.fn(),
}));
jest.mock('./use-api-key-settings-providers', () => ({
  useApiKeySettingsProviders: jest.fn(),
}));

import { useApiKey, useGetApiKey } from '@helsoft/hooks';
import { useLocalization } from '@helsoft/localization';
import { renderHook } from '@testing-library/react-native';

import { localizationValue } from '../../../test-utils/auth-test-factories';
import { useApiKeySettings } from './use-api-key-settings';
import { useApiKeySettingsProviders } from './use-api-key-settings-providers';

const mockUseApiKey = useApiKey as jest.Mock;
const mockUseGetApiKey = useGetApiKey as jest.Mock;
const mockUseLocalization = useLocalization as jest.Mock;
const mockUseApiKeySettingsProviders = useApiKeySettingsProviders as jest.Mock;

const apiKeyValue = (overrides: Partial<ReturnType<typeof useApiKey>> = {}) => ({
  isSubmitting: false,
  isError: false,
  errorKey: undefined,
  saveApiKey: jest.fn(),
  removeApiKey: jest.fn(),
  resetSave: jest.fn(),
  resetRemove: jest.fn(),
  ...overrides,
});

const apiKeyStatusValue = (overrides: Partial<ReturnType<typeof useGetApiKey>> = {}) => ({
  status: { keys: [] },
  isLoading: false,
  hasKey: false,
  ...overrides,
});

const providersValue = (
  overrides: Partial<ReturnType<typeof useApiKeySettingsProviders>> = {},
) => ({
  enabledProviderIds: ['groq'],
  providerNames: {
    groq: 'Groq',
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    google: 'Google',
    xai: 'xAI',
    deepseek: 'DeepSeek',
  },
  guidanceUrls: {},
  isLoading: false,
  ...overrides,
});

describe('useApiKeySettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseApiKey.mockReturnValue(apiKeyValue());
    mockUseGetApiKey.mockReturnValue(apiKeyStatusValue());
    mockUseLocalization.mockReturnValue(localizationValue());
    mockUseApiKeySettingsProviders.mockReturnValue(providersValue());
  });

  it('builds the saved-status label from providerNames, locale, and the translated template', async () => {
    const { result } = await renderHook(() => useApiKeySettings());

    const label = result.current?.getSavedStatusLabel('groq', '2026-01-01T00:00:00.000Z');

    expect(label).toBe('settings.apiKey.savedStatus');
  });

  // Mutation coverage — getSavedStatusLabel's `[locale, providerNames, t]` dependency: it must
  // reflect an updated providerNames map after a rerender, not a stale closure from first render.
  it('reflects an updated providerNames map in the saved-status label after rerender', async () => {
    const { result, rerender } = await renderHook(() => useApiKeySettings());

    mockUseApiKeySettingsProviders.mockReturnValue(
      providersValue({
        providerNames: { ...providersValue().providerNames, groq: 'Groq (renamed)' },
      }),
    );
    mockUseLocalization.mockReturnValue(
      localizationValue({
        t: (key: string, options?: Record<string, unknown>) =>
          options ? JSON.stringify(options) : key,
      }),
    );

    await rerender(undefined);

    const label = result.current?.getSavedStatusLabel('groq', '2026-01-01T00:00:00.000Z');

    expect(label).toContain('Groq (renamed)');
  });

  it('exposes isLoading true when either the api key or the provider catalog is still loading', async () => {
    mockUseGetApiKey.mockReturnValue(apiKeyStatusValue({ isLoading: true }));

    const { result } = await renderHook(() => useApiKeySettings());

    expect(result.current?.isLoading).toBe(true);
  });
});
