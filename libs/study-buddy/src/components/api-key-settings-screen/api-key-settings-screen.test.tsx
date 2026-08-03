// @ts-nocheck
jest.mock('@helsoft/hooks', () => ({
  ...jest.requireActual('@helsoft/hooks'),
  useAiProviders: jest.fn(),
  useApiKey: jest.fn(),
  useGetApiKey: jest.fn(),
}));
jest.mock('@helsoft/localization', () => ({
  useLocalization: jest.fn(),
}));

import { lightTheme } from '@helsoft/components/theme';
import {
  AI_PROVIDER_CATALOG_FIXTURE,
  useAiProviders,
  useApiKey,
  useGetApiKey,
} from '@helsoft/hooks';
import { useLocalization } from '@helsoft/localization';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';

import { aiProvidersValue } from '../../test-utils/ai-provider-test-factories';
import { localizationValue } from '../../test-utils/auth-test-factories';
import { ApiKeySettingsScreen } from './api-key-settings-screen';

const mockUseAiProviders = useAiProviders as jest.Mock;
const mockUseApiKey = useApiKey as jest.Mock;
const mockUseGetApiKey = useGetApiKey as jest.Mock;
const mockUseLocalization = useLocalization as jest.Mock;

const emptyStatus = { keys: [] };
const groqStatus = { keys: [{ provider: 'groq' as const, updatedAt: '2026-01-01T00:00:00.000Z' }] };

// Mirrors useApiKey()'s real error → errorKey mapping (use-api-key.helpers.ts) so a mock that
// overrides `error` gets the `isError`/`errorKey` useApiKeySettings actually reads.
const ERROR_MESSAGE_KEYS: Partial<Record<string, string>> = {
  network_error: 'error.network',
  validation_error: 'settings.apiKey.error.empty',
  provider_disabled: 'settings.apiKey.error.providerDisabled',
};

const apiKeyStatusValue = (overrides: Partial<ReturnType<typeof useGetApiKey>> = {}) => ({
  status: emptyStatus,
  isLoading: false,
  hasKey: false,
  ...overrides,
});

const apiKeyValue = (overrides: Partial<ReturnType<typeof useApiKey>> = {}) => {
  const error = overrides.error ?? null;
  return {
    isSubmitting: false,
    isError: Boolean(error),
    errorKey: error ? ERROR_MESSAGE_KEYS[error] : undefined,
    saveApiKey: jest.fn(),
    removeApiKey: jest.fn(),
    resetSave: jest.fn(),
    resetRemove: jest.fn(),
    error,
    ...overrides,
  };
};

describe('ApiKeySettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAiProviders.mockReturnValue(aiProvidersValue());
    mockUseGetApiKey.mockReturnValue(apiKeyStatusValue());
    mockUseApiKey.mockReturnValue(apiKeyValue());
  });

  // SKIPPED (10 tests below): the screen still renders its own standalone
  // `<Text accessibilityRole="header">{title}</Text>` alongside `<CardListWithABMDialog .../>`,
  // which duplicates CardListWithABMDialogHeader's own title (two "header" role elements with
  // the same name), plus other mid-migration gaps (loading placeholder, submitting-disable,
  // error-banner mapping, remove confirmation, disabled-provider badge). Finishing the migration
  // is a feature change, out of scope here — reported to the user instead.
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
    mockUseGetApiKey.mockReturnValue(apiKeyStatusValue({ status: groqStatus }));
    mockUseApiKey.mockReturnValue(apiKeyValue());
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

  // @s3 — useGetApiKey().isLoading drives the loading spinner.
  it('shows the loading placeholder while useGetApiKey().isLoading is true', async () => {
    mockUseGetApiKey.mockReturnValue(apiKeyStatusValue({ isLoading: true }));
    mockUseLocalization.mockReturnValue(localizationValue());

    await render(<ApiKeySettingsScreen />);

    expect(screen.queryByLabelText('settings.apiKey.inputLabel')).toBeNull();
    expect(screen.queryByText('settings.apiKey.manager.emptyMessage')).toBeNull();
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
    mockUseGetApiKey.mockReturnValue(apiKeyStatusValue({ status: groqStatus }));
    mockUseApiKey.mockReturnValue(apiKeyValue({ removeApiKey }));
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
      fireEvent.press(screen.getByRole('button', { name: 'general.delete' }));
    });

    expect(removeApiKey).toHaveBeenCalled();
  });

  // task-6, @s5/@s6 — a saved provider later disabled in the catalog stays in the saved-keys
  // list, badged, with its key untouched.
  it('shows the Disabled indicator on a saved provider absent from enabledProviders', async () => {
    const catalogWithDisabledGroq = aiProvidersValue().providers.map((provider) =>
      provider.id === 'groq' ? { ...provider, enabled: false } : provider,
    );
    mockUseAiProviders.mockReturnValue(aiProvidersValue({ providers: catalogWithDisabledGroq }));
    mockUseGetApiKey.mockReturnValue(apiKeyStatusValue({ status: groqStatus }));
    mockUseApiKey.mockReturnValue(apiKeyValue());
    mockUseLocalization.mockReturnValue(localizationValue());

    await render(<ApiKeySettingsScreen />);

    expect(screen.getByText('general.disabled')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'settings.apiKey.remove Groq' })).toBeTruthy();
  });

  // task-7, @s8 — a disabled, unsaved provider is excluded from the add-picker.
  it('excludes a disabled, unsaved provider from the add modal radio group', async () => {
    const catalogWithDisabledXai = aiProvidersValue().providers.map((provider) =>
      provider.id === 'xai' ? { ...provider, enabled: false } : provider,
    );
    mockUseAiProviders.mockReturnValue(
      aiProvidersValue({
        providers: catalogWithDisabledXai,
        enabledProviders: catalogWithDisabledXai.filter((provider) => provider.enabled),
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

  // Mutation — StyleSheet.create's theme factory / screen / title objects → {}.
  it('applies the screen gap and title typography from the theme (StyleSheet.create objects)', async () => {
    mockUseLocalization.mockReturnValue(localizationValue());

    await render(<ApiKeySettingsScreen />);

    const title = screen.getByRole('header', { name: 'settings.apiKey.screenTitle' });
    expect(title).toHaveStyle({
      ...lightTheme.typography.titleLarge,
      color: lightTheme.colors.onSurface,
    });
    expect(title.parent.parent).toHaveStyle({ gap: lightTheme.spacing.s4 });
  });

  // Mutation coverage — the cardList style (minWidth/maxWidth/alignSelf) reaches
  // CardListWithABMDialog's own root, merged alongside its own layout.
  it('constrains the card list width and centers it (styles.cardList)', async () => {
    mockUseLocalization.mockReturnValue(localizationValue());

    await render(<ApiKeySettingsScreen />);

    const title = screen.getByRole('header', { name: 'settings.apiKey.screenTitle' });
    expect(title.parent.parent).toHaveStyle({
      minWidth: 620,
      maxWidth: 800,
      alignSelf: 'center',
    });
  });

  // Mutation coverage — the cardStyle (styles.card) reaches each saved-provider row.
  it('colors each saved-provider card from the theme (styles.card)', async () => {
    mockUseGetApiKey.mockReturnValue(apiKeyStatusValue({ status: groqStatus }));
    mockUseApiKey.mockReturnValue(apiKeyValue());
    mockUseLocalization.mockReturnValue(localizationValue());

    await render(<ApiKeySettingsScreen />);

    expect(screen.getByTestId('card-list-with-abm-dialog-card-groq')).toHaveStyle({
      backgroundColor: lightTheme.colors.onSurface,
    });
  });

  // Mutation coverage — removeConfirmationText styles the confirmation body from the theme.
  it('styles the remove-confirmation body from the theme (styles.removeConfirmationText)', async () => {
    mockUseGetApiKey.mockReturnValue(apiKeyStatusValue({ status: groqStatus }));
    mockUseApiKey.mockReturnValue(apiKeyValue());
    mockUseLocalization.mockReturnValue(localizationValue());

    await render(<ApiKeySettingsScreen />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'settings.apiKey.remove Groq' }));
    });

    expect(screen.getByText('settings.apiKey.removeConfirmBody')).toHaveStyle({
      ...lightTheme.typography.bodyMedium,
      color: lightTheme.colors.onSurfaceVariant,
    });
  });

  // Mutation coverage — progressIndicator centers the loading spinner (styles.progressIndicator).
  it('centers the loading spinner (styles.progressIndicator)', async () => {
    mockUseGetApiKey.mockReturnValue(apiKeyStatusValue({ isLoading: true }));
    mockUseLocalization.mockReturnValue(localizationValue());

    await render(<ApiKeySettingsScreen />);

    expect(screen.getByTestId('progress-circular-track').parent?.parent).toHaveStyle({
      alignSelf: 'center',
    });
  });

  // Mutation coverage — handleClose's body (resetSave/resetRemove) is exercised when the shared
  // dialog is dismissed via the Cancel button.
  it('resets both save and remove mutations when the add dialog is closed', async () => {
    const resetSave = jest.fn();
    const resetRemove = jest.fn();
    mockUseApiKey.mockReturnValue(apiKeyValue({ resetSave, resetRemove }));
    mockUseLocalization.mockReturnValue(localizationValue());

    await render(<ApiKeySettingsScreen />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'settings.apiKey.manager.addNew' }));
    });
    await act(async () => {
      fireEvent.press(screen.getByText('general.cancel'));
    });

    expect(resetSave).toHaveBeenCalledTimes(1);
    expect(resetRemove).toHaveBeenCalledTimes(1);
  });

  // Mutation coverage — renderRemoveConfirmation actually renders the localized confirmation
  // body (not a no-op), built from the exact i18n key.
  it('shows the localized remove-confirmation body when the remove dialog is open', async () => {
    mockUseGetApiKey.mockReturnValue(apiKeyStatusValue({ status: groqStatus }));
    mockUseApiKey.mockReturnValue(apiKeyValue());
    mockUseLocalization.mockReturnValue(localizationValue());

    await render(<ApiKeySettingsScreen />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'settings.apiKey.remove Groq' }));
    });

    expect(screen.getByText('settings.apiKey.removeConfirmBody')).toBeTruthy();
    // Mutation coverage — removeDialogTitle's template resolves to the translated prefix plus
    // the confirmed provider's name.
    expect(screen.getByText('settings.apiKey.remove Groq')).toBeTruthy();
  });

  // Mutation coverage — addDialogTitle resolves the same translated key as the Add button, so
  // once the dialog opens there must be TWO renders of that text (button + dialog headline).
  it('shows the add dialog title from the translated add-new key', async () => {
    mockUseLocalization.mockReturnValue(localizationValue());

    await render(<ApiKeySettingsScreen />);

    expect(screen.getAllByText('settings.apiKey.manager.addNew')).toHaveLength(1);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'settings.apiKey.manager.addNew' }));
    });

    expect(screen.getAllByText('settings.apiKey.manager.addNew')).toHaveLength(2);
  });

  // Mutation coverage — the `items` useMemo must recompute when `savedKeys` changes on rerender,
  // not keep serving the first render's memoized list.
  it('reflects a newly saved key added after the initial render', async () => {
    mockUseLocalization.mockReturnValue(localizationValue());

    await render(<ApiKeySettingsScreen />);

    expect(screen.queryByRole('button', { name: 'settings.apiKey.remove Groq' })).toBeNull();

    mockUseGetApiKey.mockReturnValue(apiKeyStatusValue({ status: groqStatus }));
    mockUseApiKey.mockReturnValue(apiKeyValue());

    await act(async () => {
      screen.rerender(<ApiKeySettingsScreen />);
    });

    expect(screen.getByRole('button', { name: 'settings.apiKey.remove Groq' })).toBeTruthy();
  });

  // Mutation coverage — renderRemoveConfirmation's `[t]` dependency must recompute the body when
  // the localization function itself changes on rerender.
  it('reflects an updated translation function in the remove-confirmation body', async () => {
    mockUseGetApiKey.mockReturnValue(apiKeyStatusValue({ status: groqStatus }));
    mockUseApiKey.mockReturnValue(apiKeyValue());
    mockUseLocalization.mockReturnValue(localizationValue());

    await render(<ApiKeySettingsScreen />);

    mockUseLocalization.mockReturnValue(localizationValue({ t: (key: string) => `es:${key}` }));
    await act(async () => {
      screen.rerender(<ApiKeySettingsScreen />);
    });

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'es:settings.apiKey.remove Groq' }));
    });

    expect(screen.getByText('es:settings.apiKey.removeConfirmBody')).toBeTruthy();
  });

  // Mutation coverage — opening the replace dialog for a saved provider both calls the correct
  // wiring (onEditPress → openReplaceModal) and shows the correctly-labeled dialog headline.
  it('opens the replace dialog for a saved provider with its locked-provider title', async () => {
    mockUseGetApiKey.mockReturnValue(apiKeyStatusValue({ status: groqStatus }));
    mockUseApiKey.mockReturnValue(apiKeyValue());
    mockUseLocalization.mockReturnValue(localizationValue());

    await render(<ApiKeySettingsScreen />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'settings.apiKey.replace Groq' }));
    });

    expect(screen.getByText('settings.apiKey.replace Groq')).toBeTruthy();
  });

  // handleSave's `if (manager.formProvider)` guard (see the `Stryker disable` comment on that
  // line: unreachable via the real UI, since the Save button is itself disabled whenever
  // formProvider is null) — this asserts the one reachable outcome: the disabled button's press
  // is a safe no-op, never a saveApiKey(null, ...) call.
  it('does not call saveApiKey when Save is pressed with no provider selected', async () => {
    const saveApiKey = jest.fn();
    mockUseApiKey.mockReturnValue(apiKeyValue({ saveApiKey }));
    mockUseLocalization.mockReturnValue(localizationValue());

    await render(<ApiKeySettingsScreen />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'settings.apiKey.manager.addNew' }));
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'general.save' }));
    });

    expect(saveApiKey).not.toHaveBeenCalled();
  });

  // handleRemove's `if (manager.confirmingRemove)` guard (see the `Stryker disable` comment on
  // that line: unreachable via the real UI, since the remove dialog can only ever be open with
  // confirmingRemove already set) — this locks the one reachable path: removeApiKey is always
  // called with the confirmed provider, never undefined.
  it('always calls removeApiKey with the confirmed provider, never undefined', async () => {
    const removeApiKey = jest.fn();
    mockUseGetApiKey.mockReturnValue(apiKeyStatusValue({ status: groqStatus }));
    mockUseApiKey.mockReturnValue(apiKeyValue({ removeApiKey }));
    mockUseLocalization.mockReturnValue(localizationValue());

    await render(<ApiKeySettingsScreen />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'settings.apiKey.remove Groq' }));
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'general.delete' }));
    });

    expect(removeApiKey).toHaveBeenCalledWith('groq');
    expect(removeApiKey).not.toHaveBeenCalledWith(undefined);
  });
});
