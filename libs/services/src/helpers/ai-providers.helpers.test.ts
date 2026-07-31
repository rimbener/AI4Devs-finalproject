import type { AiProviderCatalogEntry } from '@helsoft/types';
import {
  getEnabledProviderIds,
  getEnabledProviders,
  getProviderGuidanceUrls,
  getProviderNames,
} from './ai-providers.helpers';

const entry = (overrides: Partial<AiProviderCatalogEntry> = {}): AiProviderCatalogEntry => ({
  id: 'groq',
  name: 'Groq',
  guidanceUrl: null,
  enabled: true,
  sortOrder: 0,
  models: [],
  ...overrides,
});

describe('getEnabledProviders', () => {
  it('keeps only enabled providers, in catalog order', () => {
    const catalog = [
      entry({ id: 'groq', enabled: true }),
      entry({ id: 'openai', enabled: false }),
      entry({ id: 'anthropic', enabled: true }),
    ];

    expect(getEnabledProviders(catalog).map((p) => p.id)).toEqual(['groq', 'anthropic']);
  });

  it('returns an empty array when no provider is enabled', () => {
    expect(getEnabledProviders([entry({ enabled: false })])).toEqual([]);
  });
});

describe('getEnabledProviderIds', () => {
  it('maps enabled providers to their bare ids', () => {
    const catalog = [entry({ id: 'groq', enabled: true }), entry({ id: 'openai', enabled: false })];

    expect(getEnabledProviderIds(catalog)).toEqual(['groq']);
  });
});

describe('getProviderNames', () => {
  it('maps every provider (enabled or not) to its display name', () => {
    const catalog = [
      entry({ id: 'groq', name: 'Groq', enabled: true }),
      entry({ id: 'openai', name: 'OpenAI', enabled: false }),
    ];

    expect(getProviderNames(catalog)).toEqual({ groq: 'Groq', openai: 'OpenAI' });
  });
});

describe('getProviderGuidanceUrls', () => {
  it('keeps only providers with a non-null guidanceUrl', () => {
    const catalog = [
      entry({ id: 'groq', guidanceUrl: 'https://console.groq.com/keys' }),
      entry({ id: 'openai', guidanceUrl: null }),
    ];

    expect(getProviderGuidanceUrls(catalog)).toEqual({
      groq: 'https://console.groq.com/keys',
    });
  });

  it('returns an empty object when no provider has a guidanceUrl', () => {
    expect(getProviderGuidanceUrls([entry({ guidanceUrl: null })])).toEqual({});
  });
});
