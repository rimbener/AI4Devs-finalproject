import type {
  AiProviderCatalogEntry,
  AiProviderCatalogModel,
  ApiKeyStatus,
  SavedProviderKey,
} from './index';

describe('ai-provider types and registry', () => {
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

  // task-1 (ai-provider-registry-frontend) — shape lock for the Service's catalog output types.
  it('AiProviderCatalogModel/AiProviderCatalogEntry carry exactly their documented fields', () => {
    const model: AiProviderCatalogModel = {
      modelId: 'gpt-5.6-luna',
      label: 'GPT-5.6 Luna',
      vision: true,
      isVisionDefault: true,
      sortOrder: 1,
    };
    const entry: AiProviderCatalogEntry = {
      id: 'openai',
      name: 'OpenAI',
      guidanceUrl: 'https://platform.openai.com/api-keys',
      enabled: true,
      sortOrder: 2,
      models: [model],
    };

    expect(Object.keys(model).sort()).toEqual(
      ['modelId', 'label', 'vision', 'isVisionDefault', 'sortOrder'].sort(),
    );
    expect(Object.keys(entry).sort()).toEqual(
      ['id', 'name', 'guidanceUrl', 'enabled', 'sortOrder', 'models'].sort(),
    );
  });
});
