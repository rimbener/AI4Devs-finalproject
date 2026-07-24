import type { AiProvider } from './provider.ts';

export type SaveApiKeyParams = {
  userId: string;
  provider: AiProvider;
  apiKey: string;
};

export type ApiKeyStatus = {
  keys: Array<{ provider: AiProvider; updatedAt: string }>;
};

export type SaveApiKeyErrorResult = { code: 'validation_error' };

export type SaveApiKeyResult = ApiKeyStatus | SaveApiKeyErrorResult;

export type SaveApiKeyDeps = {
  storeApiKey: (params: SaveApiKeyParams) => Promise<ApiKeyStatus>;
  log: (event: { action: 'save'; outcome: string; userId: string }) => void;
};

/**
 * Stores the submitted key and replies with the masked multi-key status only -- never the raw key.
 * Blank/whitespace keys are rejected before any store call (engineering review, OWASP input validation).
 * A store failure propagates to index.ts's catch-all, which responds 502 network_error without
 * logging the request body (@s12).
 */
export const handleSaveApiKey = async (
  params: SaveApiKeyParams,
  deps: SaveApiKeyDeps,
): Promise<SaveApiKeyResult> => {
  if (!params.apiKey.trim()) {
    deps.log({ action: 'save', outcome: 'validation_error', userId: params.userId });
    return { code: 'validation_error' };
  }

  const status = await deps.storeApiKey(params);
  deps.log({ action: 'save', outcome: 'success', userId: params.userId });
  return status;
};
