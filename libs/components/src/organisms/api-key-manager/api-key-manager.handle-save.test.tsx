jest.mock('@helsoft/localization', () => ({
  useLocalization: jest.fn(),
}));
jest.mock('../api-key-form-dialog/api-key-form-dialog', () => ({
  ApiKeyFormDialog: jest.fn(() => null),
}));

import { useLocalization } from '@helsoft/localization';
import type { AiProvider } from '@helsoft/types';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { ApiKeyFormDialog } from '../api-key-form-dialog/api-key-form-dialog';
import { ApiKeyManager } from './api-key-manager';
import type { ApiKeyManagerProps } from './api-key-manager.types';

const mockUseLocalization = useLocalization as jest.Mock;
const mockDialog = ApiKeyFormDialog as jest.Mock;

const t = (key: string) => key;

const providers: readonly AiProvider[] = [
  'groq',
  'openai',
  'anthropic',
  'google',
  'xai',
  'deepseek',
];
const providerNames = {
  groq: 'Groq',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
  xai: 'xAI',
  deepseek: 'DeepSeek',
} as ApiKeyManagerProps['providerNames'];

const defaultProps: ApiKeyManagerProps = {
  savedKeys: [],
  providers,
  enabledProviders: providers,
  onSave: jest.fn(),
  onRemove: jest.fn(),
  guidanceUrls: {},
  getSavedStatusLabel: () => '',
  providerNames,
};

const latestDialogProps = () => mockDialog.mock.calls.at(-1)?.[0];

// `const handleSave = () => { if (formProvider) { onSave(formProvider, apiKey); } };`
// The real Save button is disabled whenever `formProvider` is unset (`isSaveDisabled` includes
// `!formProvider`), so a normal `fireEvent.press` can never reach `handleSave` with a falsy
// `formProvider` — a disabled `Pressable` swallows the press entirely. Mocking `ApiKeyFormDialog`
// lets this test invoke the exact `onSave` prop directly, bypassing that UI guard, to prove the
// `if (formProvider)` check inside `handleSave` itself — not just the button's disabled state.
describe('ApiKeyManager handleSave guard', () => {
  beforeEach(() => {
    mockUseLocalization.mockReturnValue({ t });
    mockDialog.mockClear();
  });

  it('does not call onSave when invoked with no formProvider selected', async () => {
    const onSave = jest.fn();
    await render(<ApiKeyManager {...defaultProps} onSave={onSave} />);

    await act(async () => {
      latestDialogProps().onSave();
    });

    expect(onSave).not.toHaveBeenCalled();
  });

  it('calls onSave with the exact formProvider and apiKey once a provider is selected', async () => {
    const onSave = jest.fn();
    await render(<ApiKeyManager {...defaultProps} onSave={onSave} />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'settings.apiKey.manager.addNew' }));
    });
    await act(async () => {
      latestDialogProps().onSelectProvider('groq');
    });
    await act(async () => {
      latestDialogProps().onApiKeyChange('sk-test-key');
    });

    await act(async () => {
      latestDialogProps().onSave();
    });

    expect(onSave).toHaveBeenCalledWith('groq', 'sk-test-key');
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
