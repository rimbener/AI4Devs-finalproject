jest.mock('@helsoft/localization', () => ({
  useLocalization: jest.fn(),
}));
jest.mock('../api-key-form-dialog/api-key-form-dialog', () => ({
  ApiKeyFormDialog: jest.fn(() => null),
}));

import { useLocalization } from '@helsoft/localization';
import type { AiProvider, SavedProviderKey } from '@helsoft/types';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { ApiKeyFormDialog } from '../api-key-form-dialog/api-key-form-dialog';
import { ApiKeyManager } from './api-key-manager';
import type { ApiKeyManagerProps } from './api-key-manager.types';

const mockUseLocalization = useLocalization as jest.Mock;
const mockDialog = ApiKeyFormDialog as jest.Mock;

const t = (key: string) => key;

const guidanceUrls = {};
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

const groqKey: SavedProviderKey = { provider: 'groq', updatedAt: '2026-01-01T00:00:00.000Z' };

const defaultProps: ApiKeyManagerProps = {
  savedKeys: [],
  providers,
  enabledProviders: providers,
  onSave: jest.fn(),
  onRemove: jest.fn(),
  guidanceUrls,
  getSavedStatusLabel: () => '',
  providerNames,
};

describe('ApiKeyManager auto-close after a successful save', () => {
  beforeEach(() => {
    mockUseLocalization.mockReturnValue({ t });
    mockDialog.mockClear();
  });

  it('never reports isSubmitting=false to the dialog while it is auto-closing', async () => {
    const view = await render(<ApiKeyManager {...defaultProps} />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'settings.apiKey.manager.addNew' }));
    });

    mockDialog.mockClear();

    await act(async () => {
      await view.rerender(<ApiKeyManager {...defaultProps} isSubmitting />);
    });

    // Success: isSubmitting clears and savedKeys update in the same render (as the real
    // useApiKey mutation does) — the dialog must stay in its submitting look the whole
    // way through the auto-close, never flashing the add/replace form back.
    await act(async () => {
      await view.rerender(
        <ApiKeyManager {...defaultProps} savedKeys={[groqKey]} isSubmitting={false} />,
      );
    });

    const isSubmittingCalls = mockDialog.mock.calls.map(([props]) => props.isSubmitting);
    expect(isSubmittingCalls.length).toBeGreaterThan(0);
    expect(isSubmittingCalls.every(Boolean)).toBe(true);

    const lastCallProps = mockDialog.mock.calls.at(-1)?.[0];
    expect(lastCallProps.open).toBe(false);
  });

  it('drops the submitting look and keeps the modal open when the save fails', async () => {
    const view = await render(<ApiKeyManager {...defaultProps} />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'settings.apiKey.manager.addNew' }));
    });

    await act(async () => {
      await view.rerender(<ApiKeyManager {...defaultProps} isSubmitting />);
    });

    mockDialog.mockClear();

    await act(async () => {
      await view.rerender(
        <ApiKeyManager {...defaultProps} isSubmitting={false} errorMessage="Network error" />,
      );
    });

    const lastCallProps = mockDialog.mock.calls.at(-1)?.[0];
    expect(lastCallProps.open).toBe(true);
    expect(lastCallProps.isSubmitting).toBe(false);
  });
});
