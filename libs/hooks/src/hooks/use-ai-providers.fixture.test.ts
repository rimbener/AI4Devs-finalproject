import type { AiProviderCatalogEntry, AiProviderCatalogModel } from '@helsoft/types';

import { AI_PROVIDER_CATALOG_FIXTURE } from './use-ai-providers.fixture';

// Pins every field of every provider/model in AI_PROVIDER_CATALOG_FIXTURE to its exact literal
// value. The fixture is pure data (docs/features/ai-provider-registry-frontend/mutation.md round
// 2: ~61 StringLiteral/BooleanLiteral survivors on this file) — deep equality per provider is the
// only way to prove a wrong hardcoded name/guidanceUrl/vision/isVisionDefault would be caught, and
// is exactly what @s19 (no-regression pass-through) needs anyway.
const EXPECTED_CATALOG: AiProviderCatalogEntry[] = [
  {
    id: 'groq',
    name: 'Groq',
    guidanceUrl: 'https://console.groq.com/keys',
    enabled: true,
    sortOrder: 1,
    models: [
      {
        modelId: 'openai/gpt-oss-20b',
        label: 'GPT-OSS 20B',
        vision: false,
        isVisionDefault: false,
        sortOrder: 1,
      },
      {
        modelId: 'openai/gpt-oss-120b',
        label: 'GPT-OSS 120B',
        vision: false,
        isVisionDefault: false,
        sortOrder: 2,
      },
      {
        modelId: 'qwen/qwen3.6-27b',
        label: 'Qwen 3.6 27B',
        vision: true,
        isVisionDefault: true,
        sortOrder: 3,
      },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    guidanceUrl: 'https://platform.openai.com/api-keys',
    enabled: true,
    sortOrder: 2,
    models: [
      {
        modelId: 'gpt-5.6-luna',
        label: 'GPT-5.6 Luna',
        vision: true,
        isVisionDefault: true,
        sortOrder: 1,
      },
      {
        modelId: 'gpt-5.6-terra',
        label: 'GPT-5.6 Terra',
        vision: true,
        isVisionDefault: false,
        sortOrder: 2,
      },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    guidanceUrl: 'https://console.anthropic.com/settings/keys',
    enabled: true,
    sortOrder: 3,
    models: [
      {
        modelId: 'claude-haiku-4-5',
        label: 'Claude Haiku 4.5',
        vision: true,
        isVisionDefault: true,
        sortOrder: 1,
      },
      {
        modelId: 'claude-sonnet-5',
        label: 'Claude Sonnet 5',
        vision: true,
        isVisionDefault: false,
        sortOrder: 2,
      },
    ],
  },
  {
    id: 'google',
    name: 'Google',
    guidanceUrl: 'https://aistudio.google.com/app/apikey',
    enabled: true,
    sortOrder: 4,
    models: [
      {
        modelId: 'gemini-3.6-flash',
        label: 'Gemini 3.6 Flash',
        vision: true,
        isVisionDefault: true,
        sortOrder: 1,
      },
      {
        modelId: 'gemini-2.5-flash',
        label: 'Gemini 2.5 Flash',
        vision: true,
        isVisionDefault: false,
        sortOrder: 2,
      },
    ],
  },
  {
    id: 'xai',
    name: 'xAI',
    guidanceUrl: 'https://console.x.ai',
    enabled: true,
    sortOrder: 5,
    models: [
      {
        modelId: 'grok-4.3',
        label: 'Grok 4.3',
        vision: true,
        isVisionDefault: true,
        sortOrder: 1,
      },
      {
        modelId: 'grok-4.5',
        label: 'Grok 4.5',
        vision: true,
        isVisionDefault: false,
        sortOrder: 2,
      },
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    guidanceUrl: 'https://platform.deepseek.com/api_keys',
    enabled: true,
    sortOrder: 6,
    models: [
      {
        modelId: 'deepseek-v4-flash',
        label: 'DeepSeek V4 Flash',
        vision: true,
        isVisionDefault: true,
        sortOrder: 1,
      },
      {
        modelId: 'deepseek-v4-pro',
        label: 'DeepSeek V4 Pro',
        vision: true,
        isVisionDefault: false,
        sortOrder: 2,
      },
    ],
  },
];

describe('AI_PROVIDER_CATALOG_FIXTURE', () => {
  it('has exactly the expected six providers, in order', () => {
    expect(AI_PROVIDER_CATALOG_FIXTURE.map((provider) => provider.id)).toEqual(
      EXPECTED_CATALOG.map((provider) => provider.id),
    );
    expect(AI_PROVIDER_CATALOG_FIXTURE).toHaveLength(6);
  });

  it.each(
    EXPECTED_CATALOG.map((provider) => [provider.id, provider]),
  )('pins every field of provider %s exactly', (_id, expected) => {
    const actual = AI_PROVIDER_CATALOG_FIXTURE.find((provider) => provider.id === expected.id);
    expect(actual).toEqual(expected);
  });

  type ModelCase = [
    label: string,
    providerId: AiProviderCatalogEntry['id'],
    model: AiProviderCatalogModel,
  ];

  const MODEL_CASES: ModelCase[] = EXPECTED_CATALOG.flatMap((provider) =>
    provider.models.map(
      (model): ModelCase => [`${provider.id}/${model.modelId}`, provider.id, model],
    ),
  );

  it.each(
    MODEL_CASES,
  )('pins every field of model %s exactly', (_label, providerId, expectedModel) => {
    const provider = AI_PROVIDER_CATALOG_FIXTURE.find((p) => p.id === providerId);
    const actualModel = provider?.models.find((model) => model.modelId === expectedModel.modelId);
    expect(actualModel).toEqual(expectedModel);
  });
});
