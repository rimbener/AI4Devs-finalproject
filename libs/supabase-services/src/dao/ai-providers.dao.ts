import { getSupabase } from '../supabase/supabase-client';

import type { RawProviderRow } from './ai-providers.types';

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
