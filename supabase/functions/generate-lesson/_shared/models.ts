// Hand-mirrored from libs/types/src/ai-provider.ts (task-9 parity note) — Deno can't import
// the workspace package, so keep this file manually in sync with that source.

export type AiProvider = 'groq' | 'openai' | 'anthropic' | 'google' | 'xai' | 'deepseek';

export const AI_PROVIDERS: readonly AiProvider[] = [
  'groq',
  'openai',
  'anthropic',
  'google',
  'xai',
  'deepseek',
];

export type AiModelEntry = {
  id: string;
  labelKey: string;
  vision: boolean;
};

export type AiProviderModels = {
  models: AiModelEntry[];
  visionDefault: string | null;
};

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

/** Platform path still uses Groq for text generation (@s19). */
export const PLATFORM_TEXT_MODEL_ID = 'openai/gpt-oss-20b';
