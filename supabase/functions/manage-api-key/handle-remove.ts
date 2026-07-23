import type { AiProvider } from './provider.ts';

export type RemoveApiKeyParams = {
  userId: string;
  provider: AiProvider;
};

export type ApiKeyStatus = {
  keys: Array<{ provider: AiProvider; updatedAt: string }>;
};

export type RemoveApiKeyErrorResult = { code: 'network_error' };

export type RemoveApiKeyResult = ApiKeyStatus | RemoveApiKeyErrorResult;

export type RemoveApiKeyDeps = {
  removeApiKey: (params: RemoveApiKeyParams) => Promise<ApiKeyStatus>;
  log: (event: { action: 'remove'; outcome: string; userId: string }) => void;
};

/**
 * Deletes the named provider's stored key (Vault secret + metadata row, via the injected
 * `removeApiKey`) and replies with the updated multi-key status. A failure normalizes to
 * `network_error` and leaves the stored key untouched.
 */
export const handleRemoveApiKey = async (
  params: RemoveApiKeyParams,
  deps: RemoveApiKeyDeps,
): Promise<RemoveApiKeyResult> => {
  try {
    const status = await deps.removeApiKey(params);
    deps.log({ action: 'remove', outcome: 'success', userId: params.userId });
    return status;
  } catch {
    deps.log({ action: 'remove', outcome: 'network_error', userId: params.userId });
    return { code: 'network_error' };
  }
};
