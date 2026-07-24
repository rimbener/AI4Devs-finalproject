import type { AiProvider, ApiKeyErrorCode, ApiKeyStatus } from '@helsoft/types';

import { ApiKeyDao } from '../dao/api-key.dao';
import { toTypedError } from '../utils/typed-error';

const toApiKeyError = (code: ApiKeyErrorCode, message: string): Error & { code: ApiKeyErrorCode } =>
  toTypedError(code, message);

const validationError = (message: string) => toApiKeyError('validation_error', message);
const networkError = () => toApiKeyError('network_error', 'Network error');

/**
 * Business logic over ApiKeyDao: validates the key before ever calling the DAO, normalizes
 * every save/remove failure into the typed ApiKeyErrorCode contract, and shields a status
 * read from crashing the UI on failure.
 */
export abstract class ApiKeyService {
  static async saveApiKey(provider: AiProvider, rawKey: string): Promise<ApiKeyStatus> {
    if (!rawKey.trim()) {
      throw validationError('API key is required');
    }
    try {
      return await ApiKeyDao.saveApiKey({ provider, apiKey: rawKey });
    } catch {
      throw networkError();
    }
  }

  static async getApiKeyStatus(): Promise<ApiKeyStatus> {
    try {
      return await ApiKeyDao.getApiKeyStatus();
    } catch {
      return { keys: [] };
    }
  }

  static async removeApiKey(provider: AiProvider): Promise<ApiKeyStatus> {
    try {
      return await ApiKeyDao.removeApiKey(provider);
    } catch {
      throw networkError();
    }
  }
}
