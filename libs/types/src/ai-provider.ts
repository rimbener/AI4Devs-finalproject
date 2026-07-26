/**
 * The supported AI-provider union (spec.md Open decision 2 — multi-provider-ai-keys).
 * Fixed canonical order used in UIs: groq, openai, anthropic, google, xai, deepseek.
 */
export type AiProvider = 'groq' | 'openai' | 'anthropic' | 'google' | 'xai' | 'deepseek';

/** Fixed canonical provider order (settings list, add-picker, generate picker). */
export const AI_PROVIDERS: readonly AiProvider[] = [
  'groq',
  'openai',
  'anthropic',
  'google',
  'xai',
  'deepseek',
];

/**
 * Curated model registry (spec.md Open decisions, Jul 2026 docs).
 * `*` = vision-capable; `→` = visionDefault.
 * Consumed by settings add-picker, generate pickers, and hand-mirrored into Deno (task-9).
 * (ai-provider-registry-frontend task-1: the old named `AiModelEntry`/`AiProviderModels` types
 * are gone — this constant keeps an equivalent inline shape until task-11 deletes it outright.)
 */
export const AI_MODEL_REGISTRY: Record<
  AiProvider,
  {
    models: { id: string; labelKey: string; vision: boolean }[];
    visionDefault: string | null;
  }
> = {
  groq: {
    models: [
      { id: 'openai/gpt-oss-20b', labelKey: 'aiModel.groq.gptOss20b', vision: false },
      { id: 'openai/gpt-oss-120b', labelKey: 'aiModel.groq.gptOss120b', vision: false },
      { id: 'qwen/qwen3.6-27b', labelKey: 'aiModel.groq.qwen36_27b', vision: true },
    ],
    visionDefault: 'qwen/qwen3.6-27b',
  },
  openai: {
    models: [
      { id: 'gpt-5.6-luna', labelKey: 'aiModel.openai.gpt56Luna', vision: true },
      { id: 'gpt-5.6-terra', labelKey: 'aiModel.openai.gpt56Terra', vision: true },
    ],
    visionDefault: 'gpt-5.6-luna',
  },
  anthropic: {
    models: [
      { id: 'claude-haiku-4-5', labelKey: 'aiModel.anthropic.claudeHaiku45', vision: true },
      { id: 'claude-sonnet-5', labelKey: 'aiModel.anthropic.claudeSonnet5', vision: true },
    ],
    visionDefault: 'claude-haiku-4-5',
  },
  google: {
    models: [
      { id: 'gemini-3.6-flash', labelKey: 'aiModel.google.gemini36Flash', vision: true },
      { id: 'gemini-2.5-flash', labelKey: 'aiModel.google.gemini25Flash', vision: true },
    ],
    visionDefault: 'gemini-3.6-flash',
  },
  xai: {
    models: [
      { id: 'grok-4.3', labelKey: 'aiModel.xai.grok43', vision: true },
      { id: 'grok-4.5', labelKey: 'aiModel.xai.grok45', vision: true },
    ],
    visionDefault: 'grok-4.3',
  },
  deepseek: {
    models: [
      { id: 'deepseek-v4-flash', labelKey: 'aiModel.deepseek.v4Flash', vision: true },
      { id: 'deepseek-v4-pro', labelKey: 'aiModel.deepseek.v4Pro', vision: true },
    ],
    visionDefault: 'deepseek-v4-flash',
  },
};

/**
 * One catalog model row, camelCase-mapped by `AiProvidersService.getCatalog()`
 * (ai-provider-registry-frontend task-1, Decision 2) — the client-side read shape for a row of
 * `ai_provider_models`. This is the Service's output type, never the DAO's.
 */
export type AiProviderCatalogModel = {
  modelId: string;
  label: string;
  vision: boolean;
  isVisionDefault: boolean;
  sortOrder: number;
};

/**
 * One catalog provider row + its `sort_order`-ordered models, camelCase-mapped by
 * `AiProvidersService.getCatalog()` (ai-provider-registry-frontend task-1, Decisions 1–2) — the
 * Service's output type, never the DAO's.
 */
export type AiProviderCatalogEntry = {
  id: AiProvider;
  name: string;
  guidanceUrl: string | null;
  enabled: boolean;
  sortOrder: number;
  models: AiProviderCatalogModel[];
};
