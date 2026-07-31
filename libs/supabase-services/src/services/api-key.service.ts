import type {
  AiProvider,
  ApiKeyError,
  ApiKeyErrorCode,
  ApiKeyStatus,
  SavedProviderKey,
} from '@helsoft/types';
import { FunctionsHttpError } from '@supabase/supabase-js';

import { ApiKeyDao } from '../dao/api-key.dao';
import type { RawUserAiKeyRow } from '../dao/api-key.types';
import { toTypedError } from '../utils/typed-error';

const toApiKeyError = (code: ApiKeyErrorCode, message: string): Error & ApiKeyError =>
  toTypedError(code, message);

/** One message per closed code (task-8) — a full (not partial) `Record` so TypeScript enforces
 * exhaustiveness against `ApiKeyErrorCode`, mirroring `lesson-generation.helpers.ts`'s
 * `GENERATION_ERROR_KEYS` precedent for the same "every code has a message" guarantee. */
const API_KEY_ERROR_MESSAGES: Record<ApiKeyErrorCode, string> = {
  network_error: 'Network error',
  validation_error: 'API key is required',
  provider_disabled: 'Provider disabled',
};

const validationError = () =>
  toApiKeyError('validation_error', API_KEY_ERROR_MESSAGES.validation_error);
const networkError = () => toApiKeyError('network_error', API_KEY_ERROR_MESSAGES.network_error);

/** The closed set of codes `manage-api-key` may legitimately return over the wire — a full
 * `Record`, matching `lesson-generation.service.ts`'s `GENERATION_ERROR_CODES` precedent, so a
 * malformed/unrecognized `{ code }` body falls back to `network_error` instead of leaking a raw
 * shape (task-8; mirrors backend D12's "one code, one meaning"). */
const API_KEY_ERROR_CODES: Record<ApiKeyErrorCode, true> = {
  network_error: true,
  validation_error: true,
  provider_disabled: true,
};

const isKnownApiKeyErrorCode = (code: unknown): code is ApiKeyErrorCode =>
  typeof code === 'string' && Object.hasOwn(API_KEY_ERROR_CODES, code);

const errorCodeFromBody = (body: unknown): ApiKeyErrorCode => {
  if (typeof body !== 'object' || body === null) return 'network_error';
  const code = (body as { code?: unknown }).code;
  return isKnownApiKeyErrorCode(code) ? code : 'network_error';
};

/** Reads the Edge Function's typed `{ code }` body off a non-2xx invoke response — the raw body
 * is only reachable via `FunctionsHttpError.context` (an unread Response), never parsed by
 * supabase-js itself for error responses (mirrors `lesson-generation.service.ts`'s
 * `readFunctionErrorCode`). Falls back to `network_error` for a malformed/absent body. */
const readFunctionErrorCode = (error: FunctionsHttpError): Promise<ApiKeyErrorCode> =>
  error.context.json().then(errorCodeFromBody, () => 'network_error');

/** Normalizes every DAO-thrown cause — the Edge Function's typed result or a transport failure —
 * into the typed `ApiKeyErrorCode` union so the UI never branches on a raw Supabase/function
 * error (task-8, @s16; mirrors `lesson-generation.service.ts`'s `normalizeGenerationError`). */
const normalizeApiKeyError = async (cause: unknown): Promise<Error & ApiKeyError> => {
  if (cause instanceof FunctionsHttpError) {
    const code = await readFunctionErrorCode(cause);
    return toApiKeyError(code, API_KEY_ERROR_MESSAGES[code]);
  }
  // Unlike lesson-generation.service.ts's normalizeGenerationError (which distinguishes
  // FunctionsFetchError/FunctionsRelayError from other causes with a *different* fallback code),
  // ApiKeyErrorCode has no third "unexpected cause" code to fall back to beyond network_error —
  // validation_error and provider_disabled are only ever produced above, from a real HTTP
  // response. So every non-HTTP cause (transport failure or anything else) is already
  // network_error either way; a dedicated FunctionsFetchError/FunctionsRelayError branch here
  // would be genuinely dead code, not just untested.
  return networkError();
};

const isApiKeyStatus = (value: unknown): value is ApiKeyStatus =>
  typeof value === 'object' &&
  value !== null &&
  Array.isArray((value as ApiKeyStatus).keys) &&
  (value as ApiKeyStatus).keys.every(
    (entry) =>
      typeof entry.provider === 'string' &&
      typeof (entry as SavedProviderKey).updatedAt === 'string',
  );

const parseManageApiKeyStatus = (data: unknown): ApiKeyStatus => {
  if (!isApiKeyStatus(data)) {
    throw new Error('manage-api-key returned an invalid status payload');
  }
  return data;
};

const toApiKeyStatus = (rows: RawUserAiKeyRow[]): ApiKeyStatus => ({
  keys: rows.map(
    (row): SavedProviderKey => ({
      provider: row.provider as AiProvider,
      updatedAt: row.updated_at,
    }),
  ),
});

/**
 * Business logic over ApiKeyDao: validates the key before ever calling the DAO, maps raw rows /
 * Edge payloads into ApiKeyStatus, normalizes every save/remove failure into the typed
 * ApiKeyErrorCode contract, and shields a status read from crashing the UI on failure.
 */
export abstract class ApiKeyService {
  static async saveApiKey(provider: AiProvider, rawKey: string): Promise<ApiKeyStatus> {
    if (!rawKey.trim()) {
      throw validationError();
    }
    try {
      return parseManageApiKeyStatus(await ApiKeyDao.saveApiKey({ provider, apiKey: rawKey }));
    } catch (cause) {
      throw await normalizeApiKeyError(cause);
    }
  }

  static async getApiKeyStatus(): Promise<ApiKeyStatus> {
    try {
      return toApiKeyStatus(await ApiKeyDao.getApiKeyStatus());
    } catch {
      return { keys: [] };
    }
  }

  static async removeApiKey(provider: AiProvider): Promise<ApiKeyStatus> {
    try {
      return parseManageApiKeyStatus(await ApiKeyDao.removeApiKey(provider));
    } catch (cause) {
      throw await normalizeApiKeyError(cause);
    }
  }
}
