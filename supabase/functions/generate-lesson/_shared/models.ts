// Provider/model metadata now lives in the ai_providers/ai_provider_models catalog tables
// (ai-provider-registry-backend), loaded per request via ../../_shared/provider-catalog.ts's
// loadProviderCatalog — no longer a hand-mirrored registry. `AiProvider` is intentionally a plain
// `string`: any id in the catalog is valid, so no hardcoded allow-list can go stale or block a
// provider added purely via SQL (D6). The old `AiModelEntry`/`AiProviderModels` shapes (and the
// registry they described) are gone outright, not kept around — see
// `supabase/functions/_shared/provider-catalog.types.ts`'s `ProviderModel`/`ProviderEntry` for
// the live, catalog-backed replacement.

export type AiProvider = string;

/** Platform path still uses Groq for text generation (@s19). */
export const PLATFORM_TEXT_MODEL_ID = 'openai/gpt-oss-20b';
