import type { ApiKeyErrorCode } from '@helsoft/types';

/**
 * Maps useApiKey()'s normalized ApiKeyErrorCode to its i18n banner key (@s7/@s9). A code with no
 * entry here (e.g. one the catalog doesn't need a distinct banner for) intentionally resolves to
 * no message.
 */
const API_KEY_ERROR_KEYS: Partial<Record<ApiKeyErrorCode, string>> = {
  network_error: 'error.network',
  validation_error: 'settings.apiKey.error.empty',
  // task-8, @s16 — a save against a disabled provider gets distinct copy from network_error.
  provider_disabled: 'settings.apiKey.error.providerDisabled',
};

export const getApiKeyErrorMessageKey = (
  error: ApiKeyErrorCode | null | undefined,
): string | undefined => (error ? API_KEY_ERROR_KEYS[error] : undefined);
