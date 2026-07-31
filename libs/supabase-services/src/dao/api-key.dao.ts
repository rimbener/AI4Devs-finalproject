import type { AiProvider, SaveApiKeyParams } from '@helsoft/types';

import { getSupabase } from '../supabase/supabase-client';

import type { RawUserAiKeyRow } from './api-key.types';

/**
 * Raw data access for the AI-key store. No validation, no error mapping — the service layer
 * decides what a failure means to the UI (`.agents/rules/hooks-service-dao.mdc`).
 *
 * Write methods return the Edge Function response body unvalidated so the client avoids a
 * second round-trip re-select after each mutation; the service validates the shape.
 */
export abstract class ApiKeyDao {
  static async saveApiKey({ provider, apiKey }: SaveApiKeyParams): Promise<unknown> {
    const { data, error } = await getSupabase().functions.invoke('manage-api-key', {
      body: { action: 'save', provider, apiKey },
    });
    if (error) throw error;
    return data;
  }

  static async getApiKeyStatus(): Promise<RawUserAiKeyRow[]> {
    // Non-secret columns only (@s9) — RLS already scopes this to the caller's own rows.
    const { data, error } = await getSupabase().from('user_ai_keys').select('provider, updated_at');
    if (error) throw error;
    return (data ?? []) as RawUserAiKeyRow[];
  }

  static async removeApiKey(provider: AiProvider): Promise<unknown> {
    const { data, error } = await getSupabase().functions.invoke('manage-api-key', {
      body: { action: 'remove', provider },
    });
    if (error) throw error;
    return data;
  }
}
