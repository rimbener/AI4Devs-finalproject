jest.mock('@helsoft/localization', () => ({
  useLocalization: jest.fn(),
}));

import { useLocalization } from '@helsoft/localization';
import { AI_PROVIDERS, type AiProvider } from '@helsoft/types';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';

import { ApiKeyFormDialog } from './api-key-form-dialog';
import type { ApiKeyFormDialogProps } from './api-key-form-dialog.types';

const mockUseLocalization = useLocalization as jest.Mock;

const tMap: Record<string, string> = {
  'settings.apiKey.inputLabel': 'API key',
  'settings.apiKey.save': 'Save',
  'general.saving': 'Saving…',
  'settings.apiKey.replace': 'Replace',
  'settings.apiKey.removeConfirmCancelAction': 'Cancel',
  'settings.apiKey.manager.addNew': 'Add new provider',
  'settings.apiKey.manager.selectProvider': 'Select provider',
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

const guidanceUrls: Partial<Record<AiProvider, string>> = {
  groq: 'https://console.groq.com/keys',
};

const defaultProps: ApiKeyFormDialogProps = {
  open: true,
  onClose: jest.fn(),
  formMode: 'add',
  formProvider: null,
  unsavedProviders: AI_PROVIDERS,
  apiKey: '',
  onApiKeyChange: jest.fn(),
  onSelectProvider: jest.fn(),
  isSaveDisabled: true,
  onSave: jest.fn(),
  guidanceUrls,
  providerNameKeys,
};

describe('ApiKeyFormDialog', () => {
  beforeEach(() => {
    mockUseLocalization.mockReturnValue({ t });
  });

  it('renders nothing interactive when closed', async () => {
    await render(<ApiKeyFormDialog {...defaultProps} open={false} />);

    expect(screen.queryByLabelText('API key')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
  });

  it('shows provider radios and Save/Cancel in add mode', async () => {
    await render(<ApiKeyFormDialog {...defaultProps} />);

    expect(screen.getByRole('radio', { name: 'Groq' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save', disabled: true })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
  });

  it('calls onSelectProvider when a radio is pressed', async () => {
    const onSelectProvider = jest.fn();
    await render(<ApiKeyFormDialog {...defaultProps} onSelectProvider={onSelectProvider} />);

    await act(async () => {
      fireEvent.press(screen.getByRole('radio', { name: 'OpenAI' }));
    });

    expect(onSelectProvider).toHaveBeenCalledWith('openai');
  });

  it('calls onApiKeyChange when the key field changes', async () => {
    const onApiKeyChange = jest.fn();
    await render(
      <ApiKeyFormDialog
        {...defaultProps}
        formProvider="groq"
        onApiKeyChange={onApiKeyChange}
        isSaveDisabled
      />,
    );

    await act(async () => {
      fireEvent.changeText(screen.getByLabelText('API key'), 'sk-test');
    });

    expect(onApiKeyChange).toHaveBeenCalledWith('sk-test');
  });

  it('calls onSave when Save is enabled and pressed', async () => {
    const onSave = jest.fn();
    await render(
      <ApiKeyFormDialog
        {...defaultProps}
        formProvider="groq"
        apiKey="sk-test"
        isSaveDisabled={false}
        onSave={onSave}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Cancel is pressed', async () => {
    const onClose = jest.fn();
    await render(<ApiKeyFormDialog {...defaultProps} onClose={onClose} />);

    fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows fixed provider label and no radios in replace mode', async () => {
    await render(
      <ApiKeyFormDialog
        {...defaultProps}
        formMode="replace"
        formProvider="groq"
        unsavedProviders={[]}
      />,
    );

    expect(screen.getByText('Groq')).toBeTruthy();
    expect(screen.queryByRole('radiogroup')).toBeNull();
    expect(screen.getByLabelText('API key')).toBeTruthy();
  });

  it('shows saving label and hides the form while submitting', async () => {
    await render(
      <ApiKeyFormDialog
        {...defaultProps}
        formMode="replace"
        formProvider="groq"
        apiKey="sk-draft"
        isSubmitting
        isSaveDisabled
      />,
    );

    expect(screen.getByText('Saving…')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
    expect(screen.queryByLabelText('API key')).toBeNull();
  });

  it('shows guidance link and opens the URL for the selected provider', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);
    await render(<ApiKeyFormDialog {...defaultProps} formProvider="groq" />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: "Don't have a key? Get one from Groq" }));
    });

    expect(openURL).toHaveBeenCalledWith('https://console.groq.com/keys');
    openURL.mockRestore();
  });

  it('lists only the unsavedProviders passed in', async () => {
    await render(<ApiKeyFormDialog {...defaultProps} unsavedProviders={['openai', 'anthropic']} />);

    expect(screen.queryByRole('radio', { name: 'Groq' })).toBeNull();
    expect(screen.getByRole('radio', { name: 'OpenAI' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Anthropic' })).toBeTruthy();
  });
});
