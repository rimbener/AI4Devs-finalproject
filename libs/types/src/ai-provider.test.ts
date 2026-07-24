import {
  AI_MODEL_REGISTRY,
  AI_PROVIDERS,
  type AiProvider,
  type AiProviderModels,
  API_KEY_SETTINGS_GUIDANCE_URLS,
  type ApiKeyStatus,
  PROVIDER_NAME_KEYS,
  type SavedProviderKey,
} from './index';

describe('ai-provider types and registry', () => {
  // @s3/@s6 — AI_PROVIDERS has exactly six members in the canonical order
  it('AI_PROVIDERS contains all six providers in fixed canonical order', () => {
    expect(AI_PROVIDERS).toEqual(['groq', 'openai', 'anthropic', 'google', 'xai', 'deepseek']);
  });

  // @s6 — registry has an entry for every provider in AI_PROVIDERS
  it('AI_MODEL_REGISTRY has an entry for every provider', () => {
    for (const provider of AI_PROVIDERS) {
      expect(AI_MODEL_REGISTRY[provider]).toBeDefined();
    }
  });

  // spec.md curated models — each provider has ≥1 model
  it('every provider has at least one curated model', () => {
    for (const provider of AI_PROVIDERS) {
      expect(AI_MODEL_REGISTRY[provider].models.length).toBeGreaterThan(0);
    }
  });

  // spec.md — visionDefault is either null or a model id that exists in that provider's list
  it('visionDefault is null or points to a model in the same provider list', () => {
    for (const provider of AI_PROVIDERS) {
      const entry: AiProviderModels = AI_MODEL_REGISTRY[provider];
      if (entry.visionDefault !== null) {
        const ids = entry.models.map((m) => m.id);
        expect(ids).toContain(entry.visionDefault);
      }
    }
  });

  // spec.md curated models — confirm the exact vision-capable entries and visionDefault values
  it('groq registry has the expected models and visionDefault', () => {
    expect(AI_MODEL_REGISTRY.groq.models.map((m) => m.id)).toEqual([
      'openai/gpt-oss-20b',
      'openai/gpt-oss-120b',
      'qwen/qwen3.6-27b',
    ]);
    expect(AI_MODEL_REGISTRY.groq.visionDefault).toBe('qwen/qwen3.6-27b');
    expect(AI_MODEL_REGISTRY.groq.models.find((m) => m.id === 'qwen/qwen3.6-27b')?.vision).toBe(
      true,
    );
  });

  it('all six providers have the expected visionDefault (non-null)', () => {
    for (const provider of AI_PROVIDERS) {
      expect(AI_MODEL_REGISTRY[provider].visionDefault).not.toBeNull();
    }
  });

  // @s9 — ApiKeyStatus carries only keys (no key material)
  it('ApiKeyStatus shape has only a keys field (no key material)', () => {
    const status: ApiKeyStatus = { keys: [] };
    expect(Object.keys(status)).toEqual(['keys']);
  });

  // @s9 — SavedProviderKey carries only provider + updatedAt (compile-time enforced by shape lock)
  it('SavedProviderKey carries only provider and updatedAt', () => {
    const key: SavedProviderKey = { provider: 'groq', updatedAt: '2026-01-01T00:00:00.000Z' };
    expect(Object.keys(key).sort()).toEqual(['provider', 'updatedAt'].sort());
  });

  // @s3 — unsaved providers = providers not in the saved keys list
  it('can derive unsaved providers from a saved keys list (s3: not offered again)', () => {
    const savedKeys: SavedProviderKey[] = [
      { provider: 'groq', updatedAt: '2026-01-01T00:00:00.000Z' },
    ];
    const savedProviders = new Set(savedKeys.map((k) => k.provider));
    const unsaved = AI_PROVIDERS.filter((p) => !savedProviders.has(p));
    expect(unsaved).toEqual(['openai', 'anthropic', 'google', 'xai', 'deepseek']);
  });

  // @s6 — add action is hidden when all six are saved
  it('unsaved providers list is empty when all six are saved (s6: add hidden)', () => {
    const savedKeys: SavedProviderKey[] = AI_PROVIDERS.map((p) => ({
      provider: p as AiProvider,
      updatedAt: '2026-01-01T00:00:00.000Z',
    }));
    const savedProviders = new Set(savedKeys.map((k) => k.provider));
    const unsaved = AI_PROVIDERS.filter((p) => !savedProviders.has(p));
    expect(unsaved).toHaveLength(0);
  });

  it('PROVIDER_NAME_KEYS covers every provider', () => {
    for (const provider of AI_PROVIDERS) {
      expect(PROVIDER_NAME_KEYS[provider]).toBe(`settings.apiKey.provider.${provider}`);
    }
  });

  it('API_KEY_SETTINGS_GUIDANCE_URLS covers every provider', () => {
    expect(API_KEY_SETTINGS_GUIDANCE_URLS).toEqual({
      groq: 'https://console.groq.com/keys',
      openai: 'https://platform.openai.com/api-keys',
      anthropic: 'https://console.anthropic.com/settings/keys',
      google: 'https://aistudio.google.com/app/apikey',
      xai: 'https://console.x.ai',
      deepseek: 'https://platform.deepseek.com/api_keys',
    });
  });
});
