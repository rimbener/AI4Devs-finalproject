/**
 * Nested `ai_provider_models` row as PostgREST returns it (snake_case, unsorted).
 * Part of the raw catalog DTO; mapped by the service layer.
 */
export type RawProviderModelRow = {
  model_id: string;
  label: string;
  vision: boolean;
  is_vision_default: boolean;
  sort_order: number;
};

/**
 * Raw, untransformed `ai_providers` row joined to nested `ai_provider_models`, exactly as
 * Supabase/PostgREST returns them — snake_case, unsorted. Distinct from the Service's mapped,
 * sorted `AiProviderCatalogEntry` output type (ai-provider-registry-frontend task-1, Decision 2).
 */
export type RawProviderRow = {
  id: string;
  name: string;
  guidance_url: string | null;
  enabled: boolean;
  sort_order: number;
  ai_provider_models: RawProviderModelRow[];
};
