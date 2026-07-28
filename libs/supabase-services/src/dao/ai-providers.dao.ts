import { getSupabase } from '../supabase/supabase-client';

type RawProviderModelRow = {
  model_id: string;
  label: string;
  vision: boolean;
  is_vision_default: boolean;
  sort_order: number;
};

/**
 * Raw, untransformed `ai_providers` row joined to its nested `ai_provider_models` rows, exactly
 * as Supabase/PostgREST returns them — snake_case, unsorted. Distinct from the Service's mapped,
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

/**
 * Raw data access for the AI-provider catalog. No mapping, no sorting, no error mapping — the
 * service layer decides what a failure means to the UI (`.agents/rules/hooks-service-dao.mdc`).
 * A single query reads `ai_providers` with a nested `ai_provider_models` select — every client
 * consumer needs the full catalog at once (Decision 2), unlike the Edge Functions' scoped
 * single-provider `loadProviderCatalog`.
 */
export abstract class AiProvidersDao {
  static async getCatalog(): Promise<RawProviderRow[]> {
    const { data, error } = await getSupabase()
      .from('ai_providers')
      .select('*, ai_provider_models(*)');
    if (error) throw error;
    return (data ?? []) as RawProviderRow[];
  }
}
