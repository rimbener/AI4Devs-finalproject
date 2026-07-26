jest.mock('@helsoft/localization', () => ({
  useLocalization: jest.fn(),
}));

import { useLocalization } from '@helsoft/localization';
import type { AiProvider, SavedProviderKey } from '@helsoft/types';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';

import { ApiKeyManager } from './api-key-manager';
import type { ApiKeyManagerProps } from './api-key-manager.types';

const mockUseLocalization = useLocalization as jest.Mock;

const tMap: Record<string, string> = {
  'settings.apiKey.inputLabel': 'API key',
  'general.save': 'Save',
  'general.saving': 'Saving…',
  'settings.apiKey.loadingStatus': 'Checking…',
  'settings.apiKey.replace': 'Replace',
  'settings.apiKey.remove': 'Remove',
  'settings.apiKey.removeConfirmHeadline': 'Remove API key?',
  'settings.apiKey.removeConfirmBody': "You'll lose access to generation.",
  'settings.apiKey.removeConfirmAction': 'Confirm removal',
  'settings.apiKey.removeConfirmCancelAction': 'Cancel',
  'settings.apiKey.manager.addHeading': 'Add provider',
  'settings.apiKey.manager.addNew': 'Add new provider',
  'settings.apiKey.manager.selectProvider': 'Select provider',
  'settings.apiKey.manager.emptyMessage': 'No API keys saved',
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

const providers: readonly AiProvider[] = [
  'groq',
  'openai',
  'anthropic',
  'google',
  'xai',
  'deepseek',
];

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
  providers,
  onSave: jest.fn(),
  onRemove: jest.fn(),
  guidanceUrls,
  getSavedStatusLabel,
  providerNames,
};

describe('ApiKeyManager', () => {
  beforeEach(() => {
    mockUseLocalization.mockReturnValue({ t });
  });

  // @s1 — no keys saved: empty message and Add button only (no inline radios).
  it('shows the empty message and Add button when no keys are saved', async () => {
    await render(<ApiKeyManager {...defaultProps} />);

    expect(screen.getByText('No API keys saved')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add new provider' })).toBeTruthy();
    expect(screen.queryByRole('radiogroup')).toBeNull();
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

  it('renders a loading indicator when isLoading is true', async () => {
    await render(<ApiKeyManager {...defaultProps} isLoading />);

    expect(screen.queryByLabelText('API key')).toBeNull();
    expect(screen.queryByText('No API keys saved')).toBeNull();
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

  it('renders no error banner when errorMessage is absent', async () => {
    await render(<ApiKeyManager {...defaultProps} />);

    expect(screen.queryByText("Couldn't reach the server.")).toBeNull();
  });

  it('shows the key input after opening Add and selecting a provider', async () => {
    await render(<ApiKeyManager {...defaultProps} />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Add new provider' }));
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('radio', { name: 'Groq' }));
    });

    expect(screen.getByLabelText('API key')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Groq', checked: true })).toBeTruthy();
  });

  // @s1 — Save is disabled until a non-blank key is typed.
  it('keeps Save disabled until a non-blank key is entered', async () => {
    await render(<ApiKeyManager {...defaultProps} />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Add new provider' }));
    });
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
      fireEvent.press(screen.getByRole('button', { name: 'Add new provider' }));
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('radio', { name: 'Groq' }));
    });
    await act(async () => {
      fireEvent.changeText(screen.getByLabelText('API key'), 'sk-test-key');
    });
    fireEvent.press(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledWith('groq', 'sk-test-key');
  });

  // @s2 — isSubmitting shows progress and hides Save (no empty-form flash).
  it('disables Save and shows a progress label while isSubmitting', async () => {
    const view = await render(<ApiKeyManager {...defaultProps} />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Add new provider' }));
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('radio', { name: 'Groq' }));
    });

    await view.rerender(<ApiKeyManager {...defaultProps} isSubmitting />);

    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
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

  it('shows the key input when Replace is pressed on a saved row', async () => {
    await render(<ApiKeyManager {...defaultProps} savedKeys={[groqKey]} />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Replace Groq' }));
    });

    expect(screen.getByLabelText('API key')).toBeTruthy();
    expect(screen.getByText('Groq')).toBeTruthy();
    expect(screen.queryByRole('radiogroup')).toBeNull();
  });

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

  it('hides the Add button when all six providers have saved keys', async () => {
    const allKeys: SavedProviderKey[] = [
      { provider: 'groq', updatedAt: '2026-01-01T00:00:00.000Z' },
      { provider: 'openai', updatedAt: '2026-01-01T00:00:00.000Z' },
      { provider: 'anthropic', updatedAt: '2026-01-01T00:00:00.000Z' },
      { provider: 'google', updatedAt: '2026-01-01T00:00:00.000Z' },
      { provider: 'xai', updatedAt: '2026-01-01T00:00:00.000Z' },
      { provider: 'deepseek', updatedAt: '2026-01-01T00:00:00.000Z' },
    ];

    await render(<ApiKeyManager {...defaultProps} savedKeys={allKeys} />);

    expect(screen.queryByRole('button', { name: 'Add new provider' })).toBeNull();
    expect(screen.queryByRole('radiogroup')).toBeNull();
  });

  // @s6 — add modal radio only shows providers that don't have a saved key.
  it('shows only unsaved providers in the add modal radio group', async () => {
    await render(<ApiKeyManager {...defaultProps} savedKeys={[groqKey]} />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Add new provider' }));
    });

    expect(screen.queryByRole('radio', { name: 'Groq' })).toBeNull();
    expect(screen.getByRole('radio', { name: 'OpenAI' })).toBeTruthy();
  });

  it('shows the guidance link after selecting a provider with a configured guidanceUrl', async () => {
    await render(<ApiKeyManager {...defaultProps} />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Add new provider' }));
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('radio', { name: 'Groq' }));
    });

    expect(
      screen.getByRole('button', { name: "Don't have a key? Get one from Groq" }),
    ).toBeTruthy();
  });

  it('requests localized chrome via the expected i18n keys', async () => {
    const t = jest.fn((key: string, opts?: TOptions) => {
      if (key === 'settings.apiKey.guidanceTemplate' && opts) {
        return `guidance:${opts.provider}`;
      }
      return key;
    });
    mockUseLocalization.mockReturnValue({ t });

    await render(<ApiKeyManager {...defaultProps} savedKeys={[groqKey]} />);

    expect(t).toHaveBeenCalledWith('settings.apiKey.manager.addNew');
    expect(t).toHaveBeenCalledWith('settings.apiKey.replace');
    expect(t).toHaveBeenCalledWith('settings.apiKey.remove');
    // Provider display names are plain catalog strings now (Decision 3) — no i18n key lookup.
    expect(t).not.toHaveBeenCalledWith('settings.apiKey.provider.groq');
  });

  it('clears the key field when selecting a provider in the add modal', async () => {
    await render(<ApiKeyManager {...defaultProps} />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Add new provider' }));
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('radio', { name: 'Groq' }));
    });
    await act(async () => {
      fireEvent.changeText(screen.getByLabelText('API key'), 'sk-old');
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('radio', { name: 'OpenAI' }));
    });

    expect(screen.getByLabelText('API key').props.value).toBe('');
  });

  it('does not show guidance when replacing an already saved provider', async () => {
    await render(<ApiKeyManager {...defaultProps} savedKeys={[groqKey]} />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Replace Groq' }));
    });

    expect(screen.queryByRole('button', { name: /Don't have a key/ })).toBeNull();
  });

  it('keeps the progress label after isSubmitting clears until the modal closes', async () => {
    const view = await render(<ApiKeyManager {...defaultProps} />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Add new provider' }));
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('radio', { name: 'Groq' }));
    });
    await act(async () => {
      fireEvent.changeText(screen.getByLabelText('API key'), 'sk-test-key');
    });

    await view.rerender(<ApiKeyManager {...defaultProps} isSubmitting />);
    expect(screen.getByText('Saving…')).toBeTruthy();

    // Success: submitting ends and savedKeys update in the same tick — progress must
    // stay until close (no empty-form flash from unsavedProviders shrinking).
    await act(async () => {
      await view.rerender(
        <ApiKeyManager {...defaultProps} savedKeys={[groqKey]} isSubmitting={false} />,
      );
    });

    expect(screen.queryByText('Saving…')).toBeNull();
    expect(screen.queryByLabelText('API key')).toBeNull();
  });

  it('announces loading status via the localized loading key', async () => {
    const t = jest.fn((key: string) => tMap[key] ?? key);
    mockUseLocalization.mockReturnValue({ t });

    await render(<ApiKeyManager {...defaultProps} isLoading />);

    expect(t).toHaveBeenCalledWith('settings.apiKey.loadingStatus');
  });

  it('hides the empty message once at least one provider is saved', async () => {
    await render(<ApiKeyManager {...defaultProps} savedKeys={[groqKey]} />);

    expect(screen.queryByText('No API keys saved')).toBeNull();
  });

  it('renders only saved provider rows in registry order', async () => {
    const openaiKey: SavedProviderKey = {
      provider: 'openai',
      updatedAt: '2026-02-01T00:00:00.000Z',
    };
    await render(<ApiKeyManager {...defaultProps} savedKeys={[openaiKey]} />);

    expect(screen.getByRole('button', { name: 'Replace OpenAI' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Replace Groq' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Replace Anthropic' })).toBeNull();
  });

  it('renders exactly one saved row when only one provider key exists', async () => {
    await render(<ApiKeyManager {...defaultProps} savedKeys={[groqKey]} />);

    expect(screen.getAllByRole('button', { name: /^Replace / })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /^Remove / })).toHaveLength(1);
  });

  it('binds each saved row to its own provider metadata', async () => {
    const openaiKey: SavedProviderKey = {
      provider: 'openai',
      updatedAt: '2026-02-01T00:00:00.000Z',
    };
    const labelFor = (provider: AiProvider, updatedAt: string) => `${provider}@${updatedAt}`;

    await render(
      <ApiKeyManager
        {...defaultProps}
        savedKeys={[groqKey, openaiKey]}
        getSavedStatusLabel={labelFor}
      />,
    );

    expect(screen.getByText(`groq@${groqKey.updatedAt}`)).toBeTruthy();
    expect(screen.getByText(`openai@${openaiKey.updatedAt}`)).toBeTruthy();
  });

  it('renders replace and remove button labels from i18n keys', async () => {
    const t = jest.fn((key: string, opts?: TOptions) => {
      if (key === 'settings.apiKey.guidanceTemplate' && opts) {
        return `guidance:${opts.provider}`;
      }
      return tMap[key] ?? key;
    });
    mockUseLocalization.mockReturnValue({ t });

    await render(<ApiKeyManager {...defaultProps} savedKeys={[groqKey]} />);

    expect(screen.getByRole('button', { name: 'Replace Groq' })).toHaveTextContent('Replace');
    expect(screen.getByRole('button', { name: 'Remove Groq' })).toHaveTextContent('Remove');
  });

  it('does not open a guidance URL when the selected provider has no configured URL', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);
    await render(
      <ApiKeyManager {...defaultProps} guidanceUrls={{ groq: 'https://console.groq.com/keys' }} />,
    );

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Add new provider' }));
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('radio', { name: 'OpenAI' }));
    });
    expect(screen.queryByRole('button', { name: /Don't have a key/ })).toBeNull();

    openURL.mockRestore();
  });

  it('opens the guidance URL when the add-form guidance link is pressed', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);
    await render(<ApiKeyManager {...defaultProps} />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Add new provider' }));
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('radio', { name: 'Groq' }));
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: "Don't have a key? Get one from Groq" }));
    });

    expect(openURL).toHaveBeenCalledWith('https://console.groq.com/keys');
    openURL.mockRestore();
  });

  it('requests input, remove-dialog, and picker i18n keys', async () => {
    const t = jest.fn((key: string, opts?: TOptions) => {
      if (key === 'settings.apiKey.guidanceTemplate' && opts) {
        return `guidance:${opts.provider}`;
      }
      return tMap[key] ?? key;
    });
    mockUseLocalization.mockReturnValue({ t });

    await render(<ApiKeyManager {...defaultProps} savedKeys={[groqKey]} />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Replace Groq' }));
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Remove Groq' }));
    });

    expect(t).toHaveBeenCalledWith('settings.apiKey.inputLabel');
    expect(t).toHaveBeenCalledWith('settings.apiKey.manager.selectProvider');
    expect(t).toHaveBeenCalledWith('settings.apiKey.removeConfirmBody');
  });

  it('clears the key field when Replace is pressed', async () => {
    await render(<ApiKeyManager {...defaultProps} savedKeys={[groqKey]} />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Replace Groq' }));
    });
    await act(async () => {
      fireEvent.changeText(screen.getByLabelText('API key'), 'sk-old');
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Replace Groq' }));
    });

    expect(screen.getByLabelText('API key').props.value).toBe('');
  });
});
