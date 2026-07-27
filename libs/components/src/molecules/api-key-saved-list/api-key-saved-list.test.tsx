jest.mock('@helsoft/localization', () => ({
  useLocalization: jest.fn(),
}));

import { useLocalization } from '@helsoft/localization';
import type { AiProvider, SavedProviderKey } from '@helsoft/types';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { ApiKeySavedList } from './api-key-saved-list';
import type { ApiKeySavedListProps } from './api-key-saved-list.types';

const mockUseLocalization = useLocalization as jest.Mock;

const tMap: Record<string, string> = {
  'settings.apiKey.replace': 'Replace',
  'settings.apiKey.remove': 'Remove',
  'settings.apiKey.manager.disabled': 'Disabled',
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

const groqKey: SavedProviderKey = { provider: 'groq', updatedAt: '2026-01-01T00:00:00.000Z' };
const openaiKey: SavedProviderKey = { provider: 'openai', updatedAt: '2026-02-01T00:00:00.000Z' };

const getSavedStatusLabel = (provider: AiProvider, updatedAt: string) =>
  `${provider} · ${updatedAt}`;

const defaultProps: ApiKeySavedListProps = {
  savedKeys: [groqKey],
  providers,
  savedProviders: new Set<AiProvider>(['groq']),
  enabledProviders: providers,
  getSavedStatusLabel,
  providerNames,
  onReplace: jest.fn(),
  onRemove: jest.fn(),
  children: <></>,
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

  // @s3/@s20 (task-3) — row order follows the passed-in providers prop (catalog order), not a
  // hardcoded constant; a reordered catalog reorders rows with no other code change.
  it('renders rows in the order of the passed-in providers prop, not alphabetically', async () => {
    await render(
      <ApiKeySavedList
        {...defaultProps}
        providers={['xai', 'groq', 'anthropic', 'google', 'deepseek', 'openai']}
        savedKeys={[groqKey, openaiKey]}
        savedProviders={new Set<AiProvider>(['groq', 'openai'])}
      />,
    );

    const replaceButtons = screen.getAllByRole('button', { name: /^Replace /i });
    expect(replaceButtons.map((button) => button.props.accessibilityLabel)).toEqual([
      'Replace Groq',
      'Replace OpenAI',
    ]);
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

  // @s5/@s6 — a saved provider absent from enabledProviders stays in the list, badged.
  it('shows the Disabled indicator on a saved provider absent from enabledProviders', async () => {
    await render(
      <ApiKeySavedList
        {...defaultProps}
        enabledProviders={providers.filter((p) => p !== 'groq')}
      />,
    );

    expect(screen.getByText('Disabled')).toBeTruthy();
    // @s6 — the row itself (and its Remove action) stays present, never auto-removed.
    expect(screen.getByText(`groq · ${groqKey.updatedAt}`)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Remove Groq' })).toBeTruthy();
  });

  // @s22 — the indicator carries its own text, not a color-only cue: it renders as real text
  // content (an actual node with the localized "Disabled" string), never a bare styled dot/icon.
  it('renders the Disabled indicator as real text content, not a color-only marker', async () => {
    await render(
      <ApiKeySavedList
        {...defaultProps}
        enabledProviders={providers.filter((p) => p !== 'groq')}
      />,
    );

    const indicator = screen.getByText('Disabled');
    expect(indicator.props.children).toBe('Disabled');
  });

  it('shows no Disabled indicator for a provider still enabled', async () => {
    await render(<ApiKeySavedList {...defaultProps} enabledProviders={providers} />);

    expect(screen.queryByText('Disabled')).toBeNull();
  });

  // Only the disabled row gets the indicator when multiple rows render.
  it('scopes the Disabled indicator to only the disabled row among several saved providers', async () => {
    await render(
      <ApiKeySavedList
        {...defaultProps}
        savedKeys={[groqKey, openaiKey]}
        savedProviders={new Set<AiProvider>(['groq', 'openai'])}
        enabledProviders={providers.filter((p) => p !== 'groq')}
      />,
    );

    expect(screen.getAllByText('Disabled')).toHaveLength(1);
  });
});
