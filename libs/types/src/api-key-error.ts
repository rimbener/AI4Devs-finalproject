/**
 * Normalized outcome codes for `ApiKeyService.saveApiKey`/`removeApiKey`/`getApiKeyStatus`
 * failures (spec.md's error & security contract). The service maps every raw Edge
 * Function/Supabase/network failure onto one of these so the UI never branches on raw
 * provider/Supabase/Vault error shapes. Message copy is deliberately not part of this
 * contract — the UI layer maps `code` -> an i18n key (mirrors `AuthErrorCode`).
 *
 * `provider_disabled` (ai-provider-registry-frontend task-8, mirrors backend D11/D12): the
 * `manage-api-key` Edge Function's distinct 400 wire code for a save against a provider that is
 * currently disabled in the catalog — named instead of collapsing into `network_error`.
 */
export type ApiKeyErrorCode = 'network_error' | 'validation_error' | 'provider_disabled';

/** The minimal shape a normalized API-key failure carries upward from the service layer. */
export type ApiKeyError = {
  code: ApiKeyErrorCode;
};
