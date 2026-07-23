import type { AiProvider, ApiKeyStatus, SaveApiKeyParams, SavedProviderKey } from '@helsoft/types';

import { getSupabase } from '../supabase/supabase-client';

const isApiKeyStatus = (value: unknown): value is ApiKeyStatus =>
  typeof value === 'object' &&
  value !== null &&
  Array.isArray((value as ApiKeyStatus).keys) &&
  (value as ApiKeyStatus).keys.every(
    (entry) =>
      typeof entry.provider === 'string' &&
      typeof (entry as SavedProviderKey).updatedAt === 'string',
  );

/**
 * Raw data access for the AI-key store. No validation, no error mapping — the service layer
 * decides what a failure means to the UI (`.agents/rules/hooks-service-dao.mdc`).
 *
 * Write methods return the full `ApiKeyStatus` from the Edge Function response body so the
 * client avoids a second round-trip re-select after each mutation.
 */
export abstract class ApiKeyDao {
  static async saveApiKey({ provider, apiKey }: SaveApiKeyParams): Promise<ApiKeyStatus> {
    const { data, error } = await getSupabase().functions.invoke('manage-api-key', {
      body: { action: 'save', provider, apiKey },
    });
    if (error) throw error;
    if (!isApiKeyStatus(data)) {
      throw new Error('manage-api-key save returned an invalid status payload');
    }
    return data;
  }

  static async getApiKeyStatus(): Promise<ApiKeyStatus> {
    // Non-secret columns only (@s9) — RLS already scopes this to the caller's own rows.
    const { data, error } = await getSupabase().from('user_ai_keys').select('provider, updated_at');
    if (error) throw error;
    return {
      keys: (data ?? []).map(
        (row: { provider: string; updated_at: string }): SavedProviderKey => ({
          provider: row.provider as AiProvider,
          updatedAt: row.updated_at,
        }),
      ),
    };
  }

  static async removeApiKey(provider: AiProvider): Promise<ApiKeyStatus> {
    const { data, error } = await getSupabase().functions.invoke('manage-api-key', {
      body: { action: 'remove', provider },
    });
    if (error) throw error;
    if (!isApiKeyStatus(data)) {
      throw new Error('manage-api-key remove returned an invalid status payload');
    }
    return data;
  }
}
