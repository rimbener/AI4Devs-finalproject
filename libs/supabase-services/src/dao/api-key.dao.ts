import type { AiProvider, ApiKeyStatus, SaveApiKeyParams, SavedProviderKey } from '@helsoft/types';

import { getSupabase } from '../supabase/supabase-client';

type UserAiKeyRow = { provider: string; updated_at: string };

const rowsToStatus = (rows: UserAiKeyRow[] | null): ApiKeyStatus => ({
  keys: (rows ?? []).map(
    (row): SavedProviderKey => ({
      provider: row.provider as AiProvider,
      updatedAt: row.updated_at,
    }),
  ),
});

/**
 * Raw data access for the AI-key store. No validation, no error mapping — the service layer
 * decides what a failure means to the UI (`.agents/rules/hooks-service-dao.mdc`).
 *
 * Both write methods (save/remove) call the service-role Edge Function for the mutation then
 * select all RLS rows to return the full updated `ApiKeyStatus` — ensuring the UI's key list
 * is always consistent after any mutation without a separate re-fetch.
 */
export abstract class ApiKeyDao {
  static async saveApiKey({ provider, apiKey }: SaveApiKeyParams): Promise<ApiKeyStatus> {
    const { error } = await getSupabase().functions.invoke('manage-api-key', {
      body: { action: 'save', provider, apiKey },
    });
    if (error) throw error;
    const { data, error: selectError } = await getSupabase()
      .from('user_ai_keys')
      .select('provider, updated_at');
    if (selectError) throw selectError;
    return rowsToStatus(data as UserAiKeyRow[]);
  }

  static async getApiKeyStatus(): Promise<ApiKeyStatus> {
    // Non-secret columns only (@s9) — RLS already scopes this to the caller's own rows.
    const { data, error } = await getSupabase().from('user_ai_keys').select('provider, updated_at');
    if (error) throw error;
    return rowsToStatus(data as UserAiKeyRow[]);
  }

  static async removeApiKey(provider: AiProvider): Promise<ApiKeyStatus> {
    const { error } = await getSupabase().functions.invoke('manage-api-key', {
      body: { action: 'remove', provider },
    });
    if (error) throw error;
    const { data, error: selectError } = await getSupabase()
      .from('user_ai_keys')
      .select('provider, updated_at');
    if (selectError) throw selectError;
    return rowsToStatus(data as UserAiKeyRow[]);
  }
}
