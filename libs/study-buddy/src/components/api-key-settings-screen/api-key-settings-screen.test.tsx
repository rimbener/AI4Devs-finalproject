// @ts-nocheck
jest.mock('@helsoft/hooks', () => ({
  ...jest.requireActual('@helsoft/hooks'),
  useAiProviders: jest.fn(),
  useApiKey: jest.fn(),
}));
jest.mock('@helsoft/localization', () => ({
  useLocalization: jest.fn(),
}));

/** Capture every ApiKeyManager call's props so a perf test can assert referential stability
 * of the screen's memoized derivations across re-renders. */
const capturedManagerProps: {
  calls: Array<import('@helsoft/components').ApiKeyManagerProps>;
} = { calls: [] };
jest.mock('@helsoft/components', () => {
  const actual = jest.requireActual('@helsoft/components') as typeof import('@helsoft/components');
  return {
    ...actual,
    ApiKeyManager: (props: import('@helsoft/components').ApiKeyManagerProps) => {
      capturedManagerProps.calls.push(props);
      return actual.ApiKeyManager(props);
    },
  };
});

import { lightTheme } from '@helsoft/components/theme';
import { AI_PROVIDER_CATALOG_FIXTURE, useAiProviders, useApiKey } from '@helsoft/hooks';
import { useLocalization } from '@helsoft/localization';
import type { AiProviderCatalogEntry } from '@helsoft/types';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';

import { aiProvidersValue } from '../../test-utils/ai-provider-test-factories';
import { localizationValue } from '../../test-utils/auth-test-factories';
import { ApiKeySettingsScreen } from './api-key-settings-screen';

const mockUseAiProviders = useAiProviders as jest.Mock;
const mockUseApiKey = useApiKey as jest.Mock;
const mockUseLocalization = useLocalization as jest.Mock;

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

describe('ApiKeySettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedManagerProps.calls = [];
    mockUseAiProviders.mockReturnValue(aiProvidersValue());
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
      fireEvent.press(screen.getByRole('radio', { name: 'Groq' }));
    });
    await act(async () => {
      fireEvent.changeText(screen.getByLabelText('settings.apiKey.inputLabel'), 'sk-test-key');
    });
    fireEvent.press(screen.getByRole('button', { name: 'general.save' }));

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
      screen.getByText(`settings.apiKey.savedStatus:{"provider":"Groq","date":"${expectedDate}"}`),
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
      fireEvent.press(screen.getByRole('radio', { name: 'Groq' }));
    });

    expect(screen.getByRole('button', { name: 'general.save', disabled: true })).toBeTruthy();
  });

  // @s7/@s9 — a network_error maps to the network message.
  it('maps a network_error to the network message', async () => {
    mockUseApiKey.mockReturnValue(apiKeyValue({ error: 'network_error' }));
    mockUseLocalization.mockReturnValue(localizationValue());

    await render(<ApiKeySettingsScreen />);

    expect(screen.getByText('error.network')).toBeTruthy();
  });

  // @s8 — validation_error maps to the empty-key banner (service-layer backstop).
  it('maps a validation_error to the empty-key message', async () => {
    mockUseApiKey.mockReturnValue(apiKeyValue({ error: 'validation_error' }));
    mockUseLocalization.mockReturnValue(localizationValue());

    await render(<ApiKeySettingsScreen />);

    expect(screen.getByText('settings.apiKey.error.empty')).toBeTruthy();
  });

  // task-8, @s16 — provider_disabled maps to its own distinct message, not the network banner.
  it('maps a provider_disabled error to its own message, distinct from network_error', async () => {
    mockUseApiKey.mockReturnValue(apiKeyValue({ error: 'provider_disabled' }));
    mockUseLocalization.mockReturnValue(localizationValue());

    await render(<ApiKeySettingsScreen />);

    expect(screen.getByText('settings.apiKey.error.providerDisabled')).toBeTruthy();
    expect(screen.queryByText('error.network')).toBeNull();
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
          name: 'settings.apiKey.remove Groq',
        }),
      );
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'settings.apiKey.removeConfirmAction' }));
    });

    expect(removeApiKey).toHaveBeenCalledWith('groq');
  });

  // task-6, @s5/@s6 — a saved provider later disabled in the catalog stays in the saved-keys
  // list, badged, with its key untouched.
  it('shows the Disabled indicator on a saved provider absent from enabledProviders', async () => {
    mockUseAiProviders.mockReturnValue(
      aiProvidersValue({
        enabledProviders: aiProvidersValue().providers.filter((p) => p.id !== 'groq'),
      }),
    );
    mockUseApiKey.mockReturnValue(apiKeyValue({ status: groqStatus, hasKey: true }));
    mockUseLocalization.mockReturnValue(localizationValue());

    await render(<ApiKeySettingsScreen />);

    expect(screen.getByText('settings.apiKey.manager.disabled')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'settings.apiKey.remove Groq' })).toBeTruthy();
  });

  // task-7, @s8 — a disabled, unsaved provider is excluded from the add-picker.
  it('excludes a disabled, unsaved provider from the add modal radio group', async () => {
    mockUseAiProviders.mockReturnValue(
      aiProvidersValue({
        enabledProviders: aiProvidersValue().providers.filter((p) => p.id !== 'xai'),
      }),
    );
    mockUseLocalization.mockReturnValue(localizationValue());

    await render(<ApiKeySettingsScreen />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'settings.apiKey.manager.addNew' }));
    });

    expect(screen.queryByRole('radio', { name: 'xAI' })).toBeNull();
    expect(screen.getByRole('radio', { name: 'Groq' })).toBeTruthy();
  });

  // @s1/@s3 (task-3) — every catalog provider's plain display name is offered, in catalog order.
  it('lists every catalog provider display name in the add modal radio group', async () => {
    mockUseLocalization.mockReturnValue(localizationValue());

    await render(<ApiKeySettingsScreen />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'settings.apiKey.manager.addNew' }));
    });

    for (const name of ['Groq', 'OpenAI', 'Anthropic', 'Google', 'xAI', 'DeepSeek']) {
      expect(screen.getByRole('radio', { name })).toBeTruthy();
    }
  });

  // @s2 — the guidance link offered comes from the live catalog's guidanceUrl, not a constant.
  it('opens the groq guidance URL from the catalog when the guidance link is pressed', async () => {
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
      fireEvent.press(screen.getByRole('radio', { name: 'Groq' }));
    });
    await act(async () => {
      fireEvent.press(
        screen.getByRole('button', {
          name: 'settings.apiKey.guidanceTemplate:{"provider":"Groq"}',
        }),
      );
    });

    expect(openURL).toHaveBeenCalledWith('https://console.groq.com/keys');
    openURL.mockRestore();
  });

  // @s1/@s3 (task-3, s11 foundation) — the screen withholds the picker/list while the catalog
  // itself is still loading, keeping today's existing loading affordance (no stale flash).
  it('shows the loading placeholder while useAiProviders().isLoading is true', async () => {
    mockUseAiProviders.mockReturnValue(aiProvidersValue({ isLoading: true }));
    mockUseLocalization.mockReturnValue(localizationValue());

    await render(<ApiKeySettingsScreen />);

    expect(screen.queryByLabelText('settings.apiKey.inputLabel')).toBeNull();
    expect(screen.queryByText('settings.apiKey.manager.emptyMessage')).toBeNull();
  });

  // @s19 — today's six seeded providers (backend gherkin-scenarios.md @s5) regress zero: the
  // fixture-driven add-picker shows the same six names/guidance links, in the same order, as
  // today's pre-migration hardcoded provider-name/guidance-url values (both deleted by task-11).
  it('shows the six catalog providers with unchanged names and guidance links (@s19)', async () => {
    mockUseAiProviders.mockReturnValue({
      providers: AI_PROVIDER_CATALOG_FIXTURE,
      enabledProviders: AI_PROVIDER_CATALOG_FIXTURE,
      isLoading: false,
    });
    mockUseLocalization.mockReturnValue(
      localizationValue({
        t: (key: string, options?: Record<string, unknown>) =>
          options ? `${key}:${JSON.stringify(options)}` : key,
      }),
    );
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);

    await render(<ApiKeySettingsScreen />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'settings.apiKey.manager.addNew' }));
    });

    expect(AI_PROVIDER_CATALOG_FIXTURE.map((entry) => entry.id)).toEqual([
      'groq',
      'openai',
      'anthropic',
      'google',
      'xai',
      'deepseek',
    ]);

    for (const entry of AI_PROVIDER_CATALOG_FIXTURE) {
      expect(screen.getByRole('radio', { name: entry.name })).toBeTruthy();

      await act(async () => {
        fireEvent.press(screen.getByRole('radio', { name: entry.name }));
      });
      await act(async () => {
        fireEvent.press(
          screen.getByRole('button', {
            name: `settings.apiKey.guidanceTemplate:{"provider":"${entry.name}"}`,
          }),
        );
      });
      expect(openURL).toHaveBeenCalledWith(entry.guidanceUrl);
    }

    openURL.mockRestore();
  });

  // perf (review finding) — providerIds/enabledProviderIds/providerNames/guidanceUrls must stay
  // referentially stable across re-renders when the catalog hooks return unchanged values, so
  // ApiKeyManager doesn't re-render on every parent pass.
  it('keeps the derived provider props referentially stable across re-renders with an unchanged catalog', async () => {
    mockUseLocalization.mockReturnValue(localizationValue());

    const { rerender } = await render(<ApiKeySettingsScreen />);
    const [firstCall] = capturedManagerProps.calls;

    await act(async () => {
      rerender(<ApiKeySettingsScreen />);
    });
    const lastCall = capturedManagerProps.calls.at(-1);

    expect(lastCall?.providers).toBe(firstCall?.providers);
    expect(lastCall?.enabledProviders).toBe(firstCall?.enabledProviders);
    expect(lastCall?.providerNames).toBe(firstCall?.providerNames);
    expect(lastCall?.guidanceUrls).toBe(firstCall?.guidanceUrls);
  });

  // Mutation — providerIds/enabledProviderIds/providerNames/guidanceUrls useMemo derivations
  // must reflect real, ordered catalog content, not just "an array/object exists".
  it('derives providerIds, enabledProviderIds, providerNames, and guidanceUrls from a mixed enabled/disabled, mixed-guidanceUrl catalog', async () => {
    const groqEntry: AiProviderCatalogEntry = {
      id: 'groq',
      name: 'Groq',
      guidanceUrl: 'https://groq.example/keys',
      enabled: true,
      sortOrder: 1,
      models: [],
    };
    const openaiEntry: AiProviderCatalogEntry = {
      id: 'openai',
      name: 'OpenAI',
      guidanceUrl: null,
      enabled: false,
      sortOrder: 2,
      models: [],
    };
    const anthropicEntry: AiProviderCatalogEntry = {
      id: 'anthropic',
      name: 'Anthropic',
      guidanceUrl: 'https://anthropic.example/keys',
      enabled: true,
      sortOrder: 3,
      models: [],
    };
    mockUseAiProviders.mockReturnValue({
      providers: [groqEntry, openaiEntry, anthropicEntry],
      enabledProviders: [groqEntry, anthropicEntry],
      isLoading: false,
    });
    mockUseLocalization.mockReturnValue(localizationValue());

    await render(<ApiKeySettingsScreen />);

    const [call] = capturedManagerProps.calls;
    expect(call?.providers).toEqual(['groq', 'openai', 'anthropic']);
    expect(call?.enabledProviders).toEqual(['groq', 'anthropic']);
    expect(call?.providerNames).toEqual({
      groq: 'Groq',
      openai: 'OpenAI',
      anthropic: 'Anthropic',
    });
    expect(call?.guidanceUrls).toEqual({
      groq: 'https://groq.example/keys',
      anthropic: 'https://anthropic.example/keys',
    });
    expect(call?.guidanceUrls).not.toHaveProperty('openai');
  });

  // Mutation — the useMemo dependency arrays ([providers]/[enabledProviders]) must actually
  // drive recomputation: mutating them to [] would freeze providerIds/enabledProviderIds/
  // providerNames/guidanceUrls at their first-render values even after the catalog changes.
  it('recomputes providerIds, enabledProviderIds, providerNames, and guidanceUrls when the catalog changes between renders', async () => {
    const firstEntry: AiProviderCatalogEntry = {
      id: 'groq',
      name: 'Groq',
      guidanceUrl: 'https://groq.example/keys',
      enabled: true,
      sortOrder: 1,
      models: [],
    };
    const secondEntry: AiProviderCatalogEntry = {
      id: 'openai',
      name: 'OpenAI',
      guidanceUrl: 'https://openai.example/keys',
      enabled: true,
      sortOrder: 1,
      models: [],
    };
    mockUseAiProviders.mockReturnValue({
      providers: [firstEntry],
      enabledProviders: [firstEntry],
      isLoading: false,
    });
    mockUseLocalization.mockReturnValue(localizationValue());

    const { rerender } = await render(<ApiKeySettingsScreen />);
    const [firstCall] = capturedManagerProps.calls;
    expect(firstCall?.providers).toEqual(['groq']);
    expect(firstCall?.providerNames).toEqual({ groq: 'Groq' });
    expect(firstCall?.guidanceUrls).toEqual({ groq: 'https://groq.example/keys' });

    mockUseAiProviders.mockReturnValue({
      providers: [secondEntry],
      enabledProviders: [secondEntry],
      isLoading: false,
    });
    await act(async () => {
      rerender(<ApiKeySettingsScreen />);
    });
    const lastCall = capturedManagerProps.calls.at(-1);

    expect(lastCall?.providers).toEqual(['openai']);
    expect(lastCall?.enabledProviders).toEqual(['openai']);
    expect(lastCall?.providerNames).toEqual({ openai: 'OpenAI' });
    expect(lastCall?.guidanceUrls).toEqual({ openai: 'https://openai.example/keys' });
  });

  // Mutation — StyleSheet.create's theme factory / screen / title objects → {}.
  it('applies the screen gap and title typography from the theme (StyleSheet.create objects)', async () => {
    mockUseLocalization.mockReturnValue(localizationValue());

    await render(<ApiKeySettingsScreen />);

    const title = screen.getByRole('header', { name: 'settings.apiKey.screenTitle' });
    expect(title).toHaveStyle({
      ...lightTheme.typography.titleLarge,
      color: lightTheme.colors.onSurface,
    });
    expect(title.parent).toHaveStyle({ gap: lightTheme.spacing.s4 });
  });
});
