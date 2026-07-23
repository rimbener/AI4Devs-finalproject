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

/** One curated model entry. `labelKey` is an i18n key; `vision` flags image-placement support. */
export type AiModelEntry = {
  id: string;
  labelKey: string;
  vision: boolean;
};

/** One provider's curated model list + nullable vision-default (null = degrade to text-only). */
export type AiProviderModels = {
  models: AiModelEntry[];
  visionDefault: string | null;
};

/**
 * Curated model registry (spec.md Open decisions, Jul 2026 docs).
 * `*` = vision-capable; `→` = visionDefault.
 * Consumed by settings add-picker, generate pickers, and hand-mirrored into Deno (task-9).
 */
export const AI_MODEL_REGISTRY: Record<AiProvider, AiProviderModels> = {
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
