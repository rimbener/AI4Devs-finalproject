/**
 * Provider validity for manage-api-key now comes from the shared catalog (ai_providers table),
 * never a hardcoded allow-list (ai-provider-registry-backend, task-9, D6). `AiProvider` is
 * intentionally a plain string -- any id known to the catalog is valid; the old six-value
 * hardcoded allow-list and its guard function are gone outright, matching generate-lesson's own
 * D6 widening.
 */
import type { ProviderEntry } from '../_shared/provider-catalog.types.ts';

export type AiProvider = string;

export type ProviderGuardOutcome =
  | { ok: true }
  | { ok: false; code: 'network_error' }
  | { ok: false; code: 'provider_disabled' };

/**
 * Save is refused for a genuinely disabled provider (D10) -- a new key choice, so it can wait
 * for re-enablement. An unknown (`null`, catalog row absent) entry stays `network_error`,
 * byte-identical to today (D12) -- this is not the frontend-scoped `ApiKeyErrorCode` union
 * (D11); it is this Edge Function's own wire-level `{ code }` body shape only.
 */
export const guardSaveProvider = (entry: ProviderEntry | null): ProviderGuardOutcome => {
  if (!entry) return { ok: false, code: 'network_error' };
  if (!entry.enabled) return { ok: false, code: 'provider_disabled' };
  return { ok: true };
};

/**
 * Remove only cares whether the provider is known to the catalog at all (D10) -- `enabled` is
 * irrelevant to revoking a credential the learner already gave us, so a disabled provider's key
 * can still be removed. Unknown stays `network_error`, byte-identical to today (D12).
 */
export const guardRemoveProvider = (entry: ProviderEntry | null): ProviderGuardOutcome => {
  if (!entry) return { ok: false, code: 'network_error' };
  return { ok: true };
};
