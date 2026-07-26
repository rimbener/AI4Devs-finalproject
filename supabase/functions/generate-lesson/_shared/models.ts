// Provider/model metadata now lives in the ai_providers/ai_provider_models catalog tables
// (ai-provider-registry-backend), loaded per request via ../../_shared/provider-catalog.ts's
// loadProviderCatalog — no longer a hand-mirrored registry. `AiProvider` is intentionally a plain
// `string`: any id in the catalog is valid, so no hardcoded allow-list can go stale or block a
// provider added purely via SQL (D6).

export type AiProvider = string;

/** One curated model entry (kept for type-shape compatibility with older seams; no longer
 * populated by a static registry — see provider-catalog.ts's `ProviderModel` for the live shape). */
export type AiModelEntry = {
  id: string;
  labelKey: string;
  vision: boolean;
};

export type AiProviderModels = {
  models: AiModelEntry[];
  visionDefault: string | null;
};

/** Platform path still uses Groq for text generation (@s19). */
export const PLATFORM_TEXT_MODEL_ID = 'openai/gpt-oss-20b';
