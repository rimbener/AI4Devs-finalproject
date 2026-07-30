import type { AiProvider, SavedProviderKey } from '@helsoft/types';
import { render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { mapSavedKeysToItems } from './api-key-settings-screen-item';

const providerNames: Record<AiProvider, string> = {
  groq: 'Groq',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
  xai: 'xAI',
  deepseek: 'DeepSeek',
};

const getSavedStatusLabel = (provider: AiProvider, updatedAt: string) =>
  `${provider} saved ${updatedAt}`;

const groqKey: SavedProviderKey = { provider: 'groq', updatedAt: '2026-01-01T00:00:00.000Z' };
const openaiKey: SavedProviderKey = { provider: 'openai', updatedAt: '2026-02-01T00:00:00.000Z' };

describe('mapSavedKeysToItems', () => {
  it('maps each saved key to a CardListItem keyed by provider', () => {
    const items = mapSavedKeysToItems(
      [groqKey, openaiKey],
      providerNames,
      getSavedStatusLabel,
      ['groq', 'openai'],
      'Disabled',
    );

    expect(items).toHaveLength(2);
    expect(items[0]!.id).toBe('groq');
    expect(items[1]!.id).toBe('openai');
  });

  it('carries the saved key as data and the status label as accessibleLabel', () => {
    const items = mapSavedKeysToItems(
      [groqKey],
      providerNames,
      getSavedStatusLabel,
      ['groq'],
      'Disabled',
    );

    expect(items[0]!.data).toBe(groqKey);
    expect(items[0]!.accessibleLabel).toBe('groq saved 2026-01-01T00:00:00.000Z');
  });

  it('always requests both the edit and remove icon affordances', () => {
    const items = mapSavedKeysToItems(
      [groqKey],
      providerNames,
      getSavedStatusLabel,
      ['groq'],
      'Disabled',
    );

    expect(items[0]!.showEditButton).toBe(true);
    expect(items[0]!.showRemoveButton).toBe(true);
  });

  it('marks a key disabled when its provider is not in enabledProviderIds', () => {
    const items = mapSavedKeysToItems(
      [groqKey],
      providerNames,
      getSavedStatusLabel,
      [],
      'Disabled',
    );

    expect(items[0]!.disabled).toBe(true);
  });

  it('marks a key enabled when its provider is in enabledProviderIds', () => {
    const items = mapSavedKeysToItems(
      [groqKey],
      providerNames,
      getSavedStatusLabel,
      ['groq'],
      'Disabled',
    );

    expect(items[0]!.disabled).toBe(false);
  });

  it('renders the provider name, status label, and no disabled label when enabled', async () => {
    const items = mapSavedKeysToItems(
      [groqKey],
      providerNames,
      getSavedStatusLabel,
      ['groq'],
      'Disabled for this plan',
    );

    await render(items[0]!.content as ReactElement);

    expect(screen.getByText('Groq')).toBeTruthy();
    expect(screen.getByText('groq saved 2026-01-01T00:00:00.000Z')).toBeTruthy();
    expect(screen.queryByText('Disabled for this plan')).toBeNull();
  });

  it('renders the disabled label when the provider is not enabled', async () => {
    const items = mapSavedKeysToItems(
      [groqKey],
      providerNames,
      getSavedStatusLabel,
      [],
      'Disabled for this plan',
    );

    await render(items[0]!.content as ReactElement);

    expect(screen.getByText('Disabled for this plan')).toBeTruthy();
  });

  it('returns an empty array for an empty savedKeys list', () => {
    expect(mapSavedKeysToItems([], providerNames, getSavedStatusLabel, [], 'Disabled')).toEqual([]);
  });
});
