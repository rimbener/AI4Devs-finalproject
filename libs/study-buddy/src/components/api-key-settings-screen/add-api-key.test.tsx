jest.mock('@helsoft/localization', () => ({
  useLocalization: jest.fn(),
}));

// Spies on the extracted focusApiKeyField helper (add-api-key.helpers.test.ts owns its own
// conditional-focus logic) — this only asserts AddApiKey's effect calls it with the right args
// on the right renders, not the underlying imperative TextInput.focus() itself.
jest.mock('./add-api-key.helpers', () => ({
  ...jest.requireActual('./add-api-key.helpers'),
  focusApiKeyField: jest.fn(),
}));

import { lightTheme } from '@helsoft/components/theme';
import { useLocalization } from '@helsoft/localization';
import type { AiProvider } from '@helsoft/types';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';

import { localizationValue } from '../../test-utils/auth-test-factories';
import { AddApiKey } from './add-api-key';
import { focusApiKeyField } from './add-api-key.helpers';

const mockUseLocalization = useLocalization as jest.Mock;
const mockFocusApiKeyField = focusApiKeyField as jest.Mock;

const providerNames: Record<AiProvider, string> = {
  groq: 'Groq',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
  xai: 'xAI',
  deepseek: 'DeepSeek',
};

const baseProps = {
  formMode: 'add' as const,
  providerNames,
  unsavedProviders: ['groq', 'openai'] as AiProvider[],
  formProvider: null,
  onSelectProvider: jest.fn(),
  apiKey: '',
  onApiKeyChange: jest.fn(),
  isSubmitting: false,
  guidanceUrls: {},
};

describe('AddApiKey', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalization.mockReturnValue(localizationValue());
  });

  it('renders a radio option per unsaved provider when formMode is "add"', async () => {
    await render(<AddApiKey {...baseProps} />);

    expect(screen.getByRole('radio', { name: 'Groq' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'OpenAI' })).toBeTruthy();
  });

  // Mutation coverage — the radio group's own accessible name comes from the translated key.
  it('gives the radio group its translated accessible name', async () => {
    await render(<AddApiKey {...baseProps} />);

    expect(screen.getByLabelText('settings.apiKey.manager.selectProvider')).toBeTruthy();
  });

  // Mutation coverage — TextField's own visible label (not just its accessible name) comes from
  // the translated key.
  it('shows the translated visible label above the api key field', async () => {
    await render(<AddApiKey {...baseProps} formProvider="groq" />);

    expect(screen.getByText('settings.apiKey.inputLabel')).toBeTruthy();
  });

  // Mutation coverage — the focus effect calls the extracted helper with the live formProvider
  // (its own conditional-focus logic is unit-tested directly in add-api-key.helpers.test.ts).
  it('calls focusApiKeyField with the selected provider', async () => {
    await render(<AddApiKey {...baseProps} formProvider="groq" />);

    expect(mockFocusApiKeyField).toHaveBeenCalledWith(expect.anything(), 'groq');
  });

  it('calls focusApiKeyField with null while no provider is selected', async () => {
    await render(<AddApiKey {...baseProps} formProvider={null} />);

    expect(mockFocusApiKeyField).toHaveBeenCalledWith(expect.anything(), null);
  });

  // Mutation coverage — the effect's `[formProvider]` dependency: re-selecting a different
  // provider must re-run the effect (call the helper again).
  it('re-invokes focusApiKeyField when the selected provider changes', async () => {
    const { rerender } = await render(<AddApiKey {...baseProps} formProvider="groq" />);
    expect(mockFocusApiKeyField).toHaveBeenCalledTimes(1);

    await rerender(<AddApiKey {...baseProps} formProvider="openai" />);

    expect(mockFocusApiKeyField).toHaveBeenCalledTimes(2);
    expect(mockFocusApiKeyField).toHaveBeenLastCalledWith(expect.anything(), 'openai');
  });

  it('marks the selected radio option as checked', async () => {
    await render(<AddApiKey {...baseProps} formProvider="groq" />);

    expect(screen.getByRole('radio', { name: 'Groq', checked: true })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'OpenAI', checked: false })).toBeTruthy();
  });

  it('calls onSelectProvider with the picked provider', async () => {
    const onSelectProvider = jest.fn();
    await render(<AddApiKey {...baseProps} onSelectProvider={onSelectProvider} />);

    await act(async () => {
      fireEvent.press(screen.getByRole('radio', { name: 'OpenAI' }));
    });

    expect(onSelectProvider).toHaveBeenCalledWith('openai');
  });

  it('renders the provider name as static text, not a radio group, when formMode is "replace"', async () => {
    await render(<AddApiKey {...baseProps} formMode="replace" formProvider="groq" />);

    expect(screen.getByText('Groq')).toBeTruthy();
    expect(screen.queryByRole('radio')).toBeNull();
  });

  it('renders neither the radio group nor the provider text when formMode is "replace" and formProvider is null', async () => {
    await render(<AddApiKey {...baseProps} formMode="replace" formProvider={null} />);

    expect(screen.queryByRole('radio')).toBeNull();
    expect(screen.queryByText('Groq')).toBeNull();
    expect(screen.queryByText('OpenAI')).toBeNull();
  });

  it('renders the api key field with the current value', async () => {
    await render(<AddApiKey {...baseProps} formProvider="groq" apiKey="sk-live" />);

    expect(screen.getByLabelText('settings.apiKey.inputLabel').props.value).toBe('sk-live');
  });

  it('calls onApiKeyChange with the typed text', async () => {
    const onApiKeyChange = jest.fn();
    await render(<AddApiKey {...baseProps} formProvider="groq" onApiKeyChange={onApiKeyChange} />);

    await act(async () => {
      fireEvent.changeText(screen.getByLabelText('settings.apiKey.inputLabel'), 'sk-new');
    });

    expect(onApiKeyChange).toHaveBeenCalledWith('sk-new');
  });

  it('disables the api key field while no provider is selected', async () => {
    await render(<AddApiKey {...baseProps} formProvider={null} />);

    const field = screen.getByLabelText('settings.apiKey.inputLabel');
    expect(field.props.accessibilityState.disabled).toBe(true);
    // Mutation coverage — the native `disabled` prop (TextField's own `editable={!disabled}`),
    // not just the mirrored accessibilityState, must also reflect it.
    expect(field.props.editable).toBe(false);
  });

  it('disables the api key field while submitting even with a provider selected', async () => {
    await render(<AddApiKey {...baseProps} formProvider="groq" isSubmitting />);

    expect(
      screen.getByLabelText('settings.apiKey.inputLabel').props.accessibilityState.disabled,
    ).toBe(true);
  });

  it('enables the api key field once a provider is selected and not submitting', async () => {
    await render(<AddApiKey {...baseProps} formProvider="groq" isSubmitting={false} />);

    const field = screen.getByLabelText('settings.apiKey.inputLabel');
    expect(field.props.accessibilityState.disabled).toBe(false);
    expect(field.props.editable).toBe(true);
  });

  it('renders the guidance link when the selected provider has a guidance url', async () => {
    mockUseLocalization.mockReturnValue(
      localizationValue({
        t: (key: string, options?: Record<string, unknown>) =>
          options ? `${key}:${JSON.stringify(options)}` : key,
      }),
    );
    await render(
      <AddApiKey
        {...baseProps}
        formProvider="groq"
        guidanceUrls={{ groq: 'https://groq.example' }}
      />,
    );

    expect(
      screen.getByRole('button', {
        name: 'settings.apiKey.guidanceTemplate:{"provider":"Groq"}',
      }),
    ).toBeTruthy();
  });

  it('does not render the guidance link when the selected provider has no guidance url', async () => {
    await render(<AddApiKey {...baseProps} formProvider="groq" guidanceUrls={{}} />);

    expect(screen.queryByText(/settings.apiKey.guidanceTemplate/)).toBeNull();
  });

  it('does not render the guidance link when no provider is selected', async () => {
    await render(
      <AddApiKey
        {...baseProps}
        formProvider={null}
        guidanceUrls={{ groq: 'https://groq.example' }}
      />,
    );

    expect(screen.queryByText(/settings.apiKey.guidanceTemplate/)).toBeNull();
  });

  it('opens the guidance url when the guidance link is pressed', async () => {
    mockUseLocalization.mockReturnValue(
      localizationValue({
        t: (key: string, options?: Record<string, unknown>) =>
          options ? `${key}:${JSON.stringify(options)}` : key,
      }),
    );
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    await render(
      <AddApiKey
        {...baseProps}
        formProvider="groq"
        guidanceUrls={{ groq: 'https://groq.example' }}
      />,
    );

    await act(async () => {
      fireEvent.press(
        screen.getByRole('button', {
          name: 'settings.apiKey.guidanceTemplate:{"provider":"Groq"}',
        }),
      );
    });

    expect(openURL).toHaveBeenCalledWith('https://groq.example');
    openURL.mockRestore();
  });

  // review.md's "Full review — Round 1 (post-CI-fix)", finding 8 (OWASP A08-adjacent) — a
  // non-http(s) guidance url must never reach Linking.openURL.
  it('does not open the guidance url when it uses a non-http(s) scheme', async () => {
    mockUseLocalization.mockReturnValue(
      localizationValue({
        t: (key: string, options?: Record<string, unknown>) =>
          options ? `${key}:${JSON.stringify(options)}` : key,
      }),
    );
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    await render(
      <AddApiKey
        {...baseProps}
        formProvider="groq"
        guidanceUrls={{ groq: 'javascript:alert(1)' }}
      />,
    );

    await act(async () => {
      fireEvent.press(
        screen.getByRole('button', {
          name: 'settings.apiKey.guidanceTemplate:{"provider":"Groq"}',
        }),
      );
    });

    expect(openURL).not.toHaveBeenCalled();
    openURL.mockRestore();
  });

  // Mutation coverage — the locked-provider text (formMode "replace") is styled from the theme.
  it('styles the locked-provider label from the theme', async () => {
    await render(<AddApiKey {...baseProps} formMode="replace" formProvider="groq" />);

    expect(screen.getByText('Groq')).toHaveStyle({
      ...lightTheme.typography.bodyMedium,
      color: lightTheme.colors.onSurfaceVariant,
    });
  });

  // Mutation coverage — the api key field gets its top spacing from the theme.
  it('spaces the api key field from the theme', async () => {
    await render(<AddApiKey {...baseProps} formProvider="groq" />);

    expect(screen.getByLabelText('settings.apiKey.inputLabel').parent?.parent).toHaveStyle({
      marginTop: lightTheme.spacing.s4,
    });
  });
});
