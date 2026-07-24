jest.mock('@helsoft/localization', () => ({
  useLocalization: jest.fn(),
}));

import { useLocalization } from '@helsoft/localization';
import type { AiProvider, SavedProviderKey } from '@helsoft/types';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { lightColors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { ApiKeySavedList, apiKeySavedListStyles } from './api-key-saved-list';
import type { ApiKeySavedListProps } from './api-key-saved-list.types';

const mockUseLocalization = useLocalization as jest.Mock;

const tMap: Record<string, string> = {
  'settings.apiKey.replace': 'Replace',
  'settings.apiKey.remove': 'Remove',
  'settings.apiKey.provider.groq': 'Groq',
  'settings.apiKey.provider.openai': 'OpenAI',
  'settings.apiKey.provider.anthropic': 'Anthropic',
  'settings.apiKey.provider.google': 'Google',
  'settings.apiKey.provider.xai': 'xAI',
  'settings.apiKey.provider.deepseek': 'DeepSeek',
};

const providerNameKeys: Record<AiProvider, string> = {
  groq: 'settings.apiKey.provider.groq',
  openai: 'settings.apiKey.provider.openai',
  anthropic: 'settings.apiKey.provider.anthropic',
  google: 'settings.apiKey.provider.google',
  xai: 'settings.apiKey.provider.xai',
  deepseek: 'settings.apiKey.provider.deepseek',
};

const groqKey: SavedProviderKey = { provider: 'groq', updatedAt: '2026-01-01T00:00:00.000Z' };
const openaiKey: SavedProviderKey = { provider: 'openai', updatedAt: '2026-02-01T00:00:00.000Z' };

const getSavedStatusLabel = (provider: AiProvider, updatedAt: string) =>
  `${provider} · ${updatedAt}`;

const defaultProps: ApiKeySavedListProps = {
  savedKeys: [groqKey],
  savedProviders: new Set<AiProvider>(['groq']),
  getSavedStatusLabel,
  providerNameKeys,
  onReplace: jest.fn(),
  onRemove: jest.fn(),
};

describe('ApiKeySavedList', () => {
  beforeEach(() => {
    mockUseLocalization.mockReturnValue({
      t: (key: string) => tMap[key] ?? key,
    });
  });

  it('renders a row for each saved provider in registry order', async () => {
    await render(
      <ApiKeySavedList
        {...defaultProps}
        savedKeys={[openaiKey, groqKey]}
        savedProviders={new Set<AiProvider>(['openai', 'groq'])}
      />,
    );

    expect(screen.getByText(`groq · ${groqKey.updatedAt}`)).toBeTruthy();
    expect(screen.getByText(`openai · ${openaiKey.updatedAt}`)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Replace Groq' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Replace OpenAI' })).toBeTruthy();
  });

  it('skips providers not present in savedProviders', async () => {
    await render(
      <ApiKeySavedList
        {...defaultProps}
        savedKeys={[groqKey, openaiKey]}
        savedProviders={new Set<AiProvider>(['openai'])}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Replace Groq' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Replace OpenAI' })).toBeTruthy();
  });

  it('calls onReplace with the provider when Replace is pressed', async () => {
    const onReplace = jest.fn();
    await render(<ApiKeySavedList {...defaultProps} onReplace={onReplace} />);

    fireEvent.press(screen.getByRole('button', { name: 'Replace Groq' }));

    expect(onReplace).toHaveBeenCalledWith('groq');
  });

  it('calls onRemove with the provider when Remove is pressed', async () => {
    const onRemove = jest.fn();
    await render(<ApiKeySavedList {...defaultProps} onRemove={onRemove} />);

    fireEvent.press(screen.getByRole('button', { name: 'Remove Groq' }));

    expect(onRemove).toHaveBeenCalledWith('groq');
  });

  it('disables Replace and Remove while submitting', async () => {
    await render(<ApiKeySavedList {...defaultProps} isSubmitting />);

    expect(screen.getByRole('button', { name: 'Replace Groq', disabled: true })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Remove Groq', disabled: true })).toBeTruthy();
  });

  it('preserves row layout styles', () => {
    expect(apiKeySavedListStyles.row).toMatchObject({ gap: 8 });
    expect(apiKeySavedListStyles.actionsRow).toMatchObject({
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    });
    expect(apiKeySavedListStyles.savedStatusLabel).toMatchObject({
      ...typography.bodyMedium,
      color: lightColors.onSurfaceVariant,
    });
  });
});
