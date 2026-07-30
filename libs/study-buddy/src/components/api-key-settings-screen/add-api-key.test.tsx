jest.mock('@helsoft/localization', () => ({
  useLocalization: jest.fn(),
}));

import { useLocalization } from '@helsoft/localization';
import type { AiProvider } from '@helsoft/types';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';

import { localizationValue } from '../../test-utils/auth-test-factories';
import { AddApiKey } from './add-api-key';

const mockUseLocalization = useLocalization as jest.Mock;

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

    expect(
      screen.getByLabelText('settings.apiKey.inputLabel').props.accessibilityState.disabled,
    ).toBe(true);
  });

  it('disables the api key field while submitting even with a provider selected', async () => {
    await render(<AddApiKey {...baseProps} formProvider="groq" isSubmitting />);

    expect(
      screen.getByLabelText('settings.apiKey.inputLabel').props.accessibilityState.disabled,
    ).toBe(true);
  });

  it('enables the api key field once a provider is selected and not submitting', async () => {
    await render(<AddApiKey {...baseProps} formProvider="groq" isSubmitting={false} />);

    expect(
      screen.getByLabelText('settings.apiKey.inputLabel').props.accessibilityState.disabled,
    ).toBe(false);
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
});
