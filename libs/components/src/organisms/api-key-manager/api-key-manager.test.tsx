jest.mock('@helsoft/localization', () => ({
  useLocalization: jest.fn(),
}));

import { useLocalization } from '@helsoft/localization';
import type { AiProvider, SavedProviderKey } from '@helsoft/types';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { ApiKeyManager } from './api-key-manager';
import type { ApiKeyManagerProps } from './api-key-manager.types';

const mockUseLocalization = useLocalization as jest.Mock;

const tMap: Record<string, string> = {
  'settings.apiKey.inputLabel': 'API key',
  'settings.apiKey.save': 'Save',
  'settings.apiKey.saving': 'Saving…',
  'settings.apiKey.loadingStatus': 'Checking…',
  'settings.apiKey.replace': 'Replace',
  'settings.apiKey.remove': 'Remove',
  'settings.apiKey.removeConfirmHeadline': 'Remove API key?',
  'settings.apiKey.removeConfirmBody': "You'll lose access to generation.",
  'settings.apiKey.removeConfirmAction': 'Confirm removal',
  'settings.apiKey.removeConfirmCancelAction': 'Cancel',
  'settings.apiKey.manager.addHeading': 'Add provider',
  'settings.apiKey.manager.selectProvider': 'Select provider',
  'settings.apiKey.manager.emptyMessage': 'No API keys configured',
  'settings.apiKey.provider.groq': 'Groq',
  'settings.apiKey.provider.openai': 'OpenAI',
  'settings.apiKey.provider.anthropic': 'Anthropic',
  'settings.apiKey.provider.google': 'Google',
  'settings.apiKey.provider.xai': 'xAI',
  'settings.apiKey.provider.deepseek': 'DeepSeek',
};

type TOptions = Record<string, unknown>;
const t = (key: string, opts?: TOptions) => {
  if (key === 'settings.apiKey.guidanceTemplate' && opts) {
    return `Don't have a key? Get one from ${opts.provider}`;
  }
  return tMap[key] ?? key;
};

const providerNameKeys: Record<AiProvider, string> = {
  groq: 'settings.apiKey.provider.groq',
  openai: 'settings.apiKey.provider.openai',
  anthropic: 'settings.apiKey.provider.anthropic',
  google: 'settings.apiKey.provider.google',
  xai: 'settings.apiKey.provider.xai',
  deepseek: 'settings.apiKey.provider.deepseek',
};

const providerNames: Record<AiProvider, string> = {
  groq: 'Groq',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
  xai: 'xAI',
  deepseek: 'DeepSeek',
};

const guidanceUrls: Partial<Record<AiProvider, string>> = {
  groq: 'https://console.groq.com/keys',
  openai: 'https://platform.openai.com/api-keys',
};

const getSavedStatusLabel = (provider: AiProvider, updatedAt: string) =>
  `${providerNames[provider]} key saved · Updated ${new Date(updatedAt).toLocaleDateString('en')}`;

const groqKey: SavedProviderKey = { provider: 'groq', updatedAt: '2026-01-01T00:00:00.000Z' };

const defaultProps: ApiKeyManagerProps = {
  savedKeys: [],
  onSave: jest.fn(),
  onRemove: jest.fn(),
  guidanceUrls,
  getSavedStatusLabel,
  providerNameKeys,
};

describe('ApiKeyManager', () => {
  beforeEach(() => {
    mockUseLocalization.mockReturnValue({ t });
  });

  // @s1 — no keys saved: empty message and Add section visible.
  it('shows the empty message and Add section when no keys are saved', async () => {
    await render(<ApiKeyManager {...defaultProps} />);

    expect(screen.getByText('No API keys configured')).toBeTruthy();
    expect(screen.getByText('Add provider')).toBeTruthy();
  });

  // @s3 — a saved key renders as a masked row.
  it('renders a masked row for a saved provider key', async () => {
    const expectedLabel = getSavedStatusLabel('groq', groqKey.updatedAt);
    await render(<ApiKeyManager {...defaultProps} savedKeys={[groqKey]} />);

    expect(screen.getByText(expectedLabel)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Replace Groq' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Remove Groq' })).toBeTruthy();
  });

  // @s4/a11y — provider-scoped Replace/Remove labels stay unique when multiple rows render.
  it('scopes Replace and Remove accessible names to each saved provider row', async () => {
    const openaiKey: SavedProviderKey = {
      provider: 'openai',
      updatedAt: '2026-02-01T00:00:00.000Z',
    };
    await render(<ApiKeyManager {...defaultProps} savedKeys={[groqKey, openaiKey]} />);

    expect(screen.getByRole('button', { name: 'Replace Groq' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Remove Groq' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Replace OpenAI' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Remove OpenAI' })).toBeTruthy();
  });

  // @s3 — masked row does not render the raw key value.
  it('never renders the raw key value for a saved provider', async () => {
    await render(<ApiKeyManager {...defaultProps} savedKeys={[groqKey]} />);

    expect(screen.queryByDisplayValue('sk-secret')).toBeNull();
  });

  // loading state.
  it('renders a loading indicator when isLoading is true', async () => {
    await render(<ApiKeyManager {...defaultProps} isLoading />);

    expect(screen.queryByLabelText('API key')).toBeNull();
    expect(screen.queryByText('No API keys configured')).toBeNull();
  });

  // @s7 — error banner.
  it('renders an error banner when errorMessage is set', async () => {
    await render(<ApiKeyManager {...defaultProps} errorMessage="Couldn't reach the server." />);

    expect(screen.getByText("Couldn't reach the server.")).toBeTruthy();
    expect(screen.getByText("Couldn't reach the server.").parent).toBeTruthy();
  });

  // @s9 — error banner with saved row still visible.
  it('keeps the masked saved row visible alongside the error banner', async () => {
    const expectedLabel = getSavedStatusLabel('groq', groqKey.updatedAt);
    await render(
      <ApiKeyManager
        {...defaultProps}
        savedKeys={[groqKey]}
        errorMessage="Couldn't reach the server."
      />,
    );

    expect(screen.getByText("Couldn't reach the server.")).toBeTruthy();
    expect(screen.getByText(expectedLabel)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Replace Groq' })).toBeTruthy();
  });

  // No error → no banner.
  it('renders no error banner when errorMessage is absent', async () => {
    await render(<ApiKeyManager {...defaultProps} />);

    expect(screen.queryByText("Couldn't reach the server.")).toBeNull();
  });

  // Add flow: selecting a provider from the radio shows the key input.
  it('shows the key input after selecting a provider in the Add section', async () => {
    await render(<ApiKeyManager {...defaultProps} />);

    await act(async () => {
      fireEvent.press(screen.getByRole('radio', { name: 'Groq' }));
    });

    expect(screen.getByLabelText('API key')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
  });

  // @s1 — Save is disabled until a non-blank key is typed.
  it('keeps Save disabled until a non-blank key is entered', async () => {
    await render(<ApiKeyManager {...defaultProps} />);

    await act(async () => {
      fireEvent.press(screen.getByRole('radio', { name: 'Groq' }));
    });

    expect(screen.getByRole('button', { name: 'Save', disabled: true })).toBeTruthy();

    await act(async () => {
      fireEvent.changeText(screen.getByLabelText('API key'), 'sk-test-key');
    });

    expect(screen.getByRole('button', { name: 'Save', disabled: false })).toBeTruthy();
  });

  // @s1 — saving a key calls onSave with the correct provider and key.
  it('calls onSave with the selected provider and entered key', async () => {
    const onSave = jest.fn();
    await render(<ApiKeyManager {...defaultProps} onSave={onSave} />);

    await act(async () => {
      fireEvent.press(screen.getByRole('radio', { name: 'Groq' }));
    });
    await act(async () => {
      fireEvent.changeText(screen.getByLabelText('API key'), 'sk-test-key');
    });
    fireEvent.press(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledWith('groq', 'sk-test-key');
  });

  // @s2 — isSubmitting disables Save and shows a progress label.
  it('disables Save and shows a progress label while isSubmitting', async () => {
    await render(<ApiKeyManager {...defaultProps} isSubmitting />);

    await act(async () => {
      fireEvent.press(screen.getByRole('radio', { name: 'Groq' }));
    });

    expect(screen.getByRole('button', { name: 'Save', disabled: true })).toBeTruthy();
    expect(screen.getByText('Saving…')).toBeTruthy();
  });

  // @s8 — Remove button opens confirm dialog; confirming calls onRemove for that provider.
  it('calls onRemove for the selected provider after confirming removal', async () => {
    const onRemove = jest.fn();
    await render(<ApiKeyManager {...defaultProps} savedKeys={[groqKey]} onRemove={onRemove} />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Remove Groq' }));
    });

    expect(screen.getByText('Remove API key?')).toBeTruthy();
    expect(onRemove).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Confirm removal' }));
    });

    expect(onRemove).toHaveBeenCalledWith('groq');
  });

  // @s8 — cancelling the dialog does not call onRemove.
  it('does not call onRemove when removal is cancelled', async () => {
    const onRemove = jest.fn();
    await render(<ApiKeyManager {...defaultProps} savedKeys={[groqKey]} onRemove={onRemove} />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Remove Groq' }));
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
    });

    expect(onRemove).not.toHaveBeenCalled();
    expect(screen.queryByText('Remove API key?')).toBeNull();
  });

  // Replace: pressing Replace on a row shows the key input form.
  it('shows the key input when Replace is pressed on a saved row', async () => {
    await render(<ApiKeyManager {...defaultProps} savedKeys={[groqKey]} />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Replace Groq' }));
    });

    expect(screen.getByLabelText('API key')).toBeTruthy();
  });

  // Replace save: calls onSave with the provider.
  it('calls onSave with the correct provider when replacing a key', async () => {
    const onSave = jest.fn();
    await render(<ApiKeyManager {...defaultProps} savedKeys={[groqKey]} onSave={onSave} />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Replace Groq' }));
    });
    await act(async () => {
      fireEvent.changeText(screen.getByLabelText('API key'), 'sk-new-key');
    });
    fireEvent.press(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledWith('groq', 'sk-new-key');
  });

  // Add section hidden when all 6 providers are saved.
  it('hides the Add section when all six providers have saved keys', async () => {
    const allKeys: SavedProviderKey[] = [
      { provider: 'groq', updatedAt: '2026-01-01T00:00:00.000Z' },
      { provider: 'openai', updatedAt: '2026-01-01T00:00:00.000Z' },
      { provider: 'anthropic', updatedAt: '2026-01-01T00:00:00.000Z' },
      { provider: 'google', updatedAt: '2026-01-01T00:00:00.000Z' },
      { provider: 'xai', updatedAt: '2026-01-01T00:00:00.000Z' },
      { provider: 'deepseek', updatedAt: '2026-01-01T00:00:00.000Z' },
    ];

    await render(<ApiKeyManager {...defaultProps} savedKeys={allKeys} />);

    expect(screen.queryByText('Add provider')).toBeNull();
    expect(screen.queryByRole('radiogroup')).toBeNull();
  });

  // @s6 — unsaved providers radio only shows providers that don't have a saved key.
  it('shows only unsaved providers in the radio group', async () => {
    await render(<ApiKeyManager {...defaultProps} savedKeys={[groqKey]} />);

    expect(screen.queryByRole('radio', { name: 'Groq' })).toBeNull();
    expect(screen.getByRole('radio', { name: 'OpenAI' })).toBeTruthy();
  });

  // Guidance link shown when a provider is selected in the add form.
  it('shows the guidance link after selecting a provider with a configured guidanceUrl', async () => {
    await render(<ApiKeyManager {...defaultProps} />);

    await act(async () => {
      fireEvent.press(screen.getByRole('radio', { name: 'Groq' }));
    });

    expect(
      screen.getByRole('button', { name: "Don't have a key? Get one from Groq" }),
    ).toBeTruthy();
  });
});
