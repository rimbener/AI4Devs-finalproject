import type { useAiProviders } from '@helsoft/hooks';
import type { AiProviderCatalogEntry } from '@helsoft/types';

/**
 * Ai-provider catalog fixture pinned to today's exact seeded values (spec.md Decision 13's
 * no-deploy regression proof) — reused across `ApiKeySettingsScreen` and `LessonGeneration`
 * tests so every consumer agrees on "what the live catalog looks like today", mirroring
 * `AI_PROVIDERS`/`AI_MODEL_REGISTRY`'s pre-migration values exactly.
 */
export const AI_PROVIDER_CATALOG_FIXTURE: AiProviderCatalogEntry[] = [
  {
    id: 'groq',
    name: 'Groq',
    guidanceUrl: 'https://console.groq.com/keys',
    enabled: true,
    sortOrder: 1,
    models: [
      {
        modelId: 'openai/gpt-oss-20b',
        label: 'GPT OSS 20B',
        vision: false,
        isVisionDefault: false,
        sortOrder: 1,
      },
      {
        modelId: 'openai/gpt-oss-120b',
        label: 'GPT OSS 120B',
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
      { modelId: 'grok-4.3', label: 'Grok 4.3', vision: true, isVisionDefault: true, sortOrder: 1 },
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
        label: 'DeepSeek v4 Flash',
        vision: true,
        isVisionDefault: true,
        sortOrder: 1,
      },
      {
        modelId: 'deepseek-v4-pro',
        label: 'DeepSeek v4 Pro',
        vision: true,
        isVisionDefault: false,
        sortOrder: 2,
      },
    ],
  },
];

export const aiProvidersValue = (
  overrides: Partial<ReturnType<typeof useAiProviders>> = {},
): ReturnType<typeof useAiProviders> => ({
  providers: AI_PROVIDER_CATALOG_FIXTURE,
  enabledProviders: AI_PROVIDER_CATALOG_FIXTURE.filter((provider) => provider.enabled),
  isLoading: false,
  ...overrides,
});
