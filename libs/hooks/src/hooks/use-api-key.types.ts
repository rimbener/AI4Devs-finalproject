import type { AiProvider, ApiKeyErrorCode, ApiKeyStatus } from '@helsoft/types';

export type UseApiKeyResult = {
  status: ApiKeyStatus;
  /** True while the initial status fetch is in flight. */
  isLoading: boolean;
  /** True while a save/remove call is in flight — drives the ApiKeyManager Loading state. */
  isSubmitting: boolean;
  /** The normalized code from the most recent failed save/remove — null once it succeeds. */
  error: ApiKeyErrorCode | null;
  /** Derived: true when status.keys.length > 0 — keeps useProfile().canCreate unchanged. */
  hasKey: boolean;
  saveApiKey: (provider: AiProvider, rawKey: string) => Promise<void>;
  removeApiKey: (provider: AiProvider) => Promise<void>;
};
