import type { AiProviderCatalogEntry } from '@helsoft/types';

/**
 * The exact seeded AI-provider catalog — six providers, thirteen models, in canonical
 * `sortOrder` — pinned verbatim from the backend feature's contract
 * (`docs/features/ai-provider-registry-backend/gherkin-scenarios.md` `@s5`), which itself pins
 * today's pre-migration hardcoded provider/model values (`@helsoft/types`'s `ai-provider.ts`,
 * deleted outright by task-11) exactly.
 *
 * This is the single source every migrated consumer's `@s19` "no regression" test diffs
 * against (ai-provider-registry-frontend task-5, spec.md Decision 13) — a second,
 * independently-typed mock catalog would be exactly the kind of drift risk this fixture exists
 * to prevent. Do not hand-copy these values elsewhere; import this instead.
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
