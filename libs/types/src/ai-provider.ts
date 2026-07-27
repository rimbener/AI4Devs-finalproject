/**
 * The supported AI-provider union (spec.md Open decision 2 — multi-provider-ai-keys).
 * Fixed canonical order used in UIs: groq, openai, anthropic, google, xai, deepseek.
 */
export type AiProvider = 'groq' | 'openai' | 'anthropic' | 'google' | 'xai' | 'deepseek';

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
