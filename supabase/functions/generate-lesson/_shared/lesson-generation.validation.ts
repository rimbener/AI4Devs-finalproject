// Pure BYOK provider/model validation — Jest-tested via import from this path (task-9).
import { AI_MODEL_REGISTRY, AI_PROVIDERS, type AiProvider } from './models.ts';

export const isAiProvider = (value: unknown): value is AiProvider =>
  typeof value === 'string' && (AI_PROVIDERS as readonly string[]).includes(value);

export const isValidModelForProvider = (provider: AiProvider, model: string): boolean =>
  AI_MODEL_REGISTRY[provider].models.some((entry) => entry.id === model);

export type ValidatedByokRequest = {
  provider: AiProvider;
  model: string;
};

export type ByokValidationResult =
  | { ok: true; request: ValidatedByokRequest }
  | { ok: false; errorCode: 'invalid_model' };

/** Validates a free-BYOK generation request's provider + curated model (@s17/@s18). */
export const validateByokGenerationRequest = (
  provider: unknown,
  model: unknown,
): ByokValidationResult => {
  if (!isAiProvider(provider) || typeof model !== 'string' || !model.trim()) {
    return { ok: false, errorCode: 'invalid_model' };
  }
  if (!isValidModelForProvider(provider, model)) {
    return { ok: false, errorCode: 'invalid_model' };
  }
  return { ok: true, request: { provider, model } };
};

export type ByokKeyResolutionResult =
  | { ok: true; apiKey: string; provider: AiProvider; model: string }
  | { ok: false; errorCode: 'missing_key' | 'invalid_model' };

/** Validates then resolves the named provider's Vault key (@s12/@s17). */
export const resolveByokGenerationKey = async ({
  provider,
  model,
  readUserApiKey,
}: {
  provider: unknown;
  model: unknown;
  readUserApiKey: (provider: AiProvider) => Promise<string | null>;
}): Promise<ByokKeyResolutionResult> => {
  const validated = validateByokGenerationRequest(provider, model);
  if (!validated.ok) return validated;

  const apiKey = await readUserApiKey(validated.request.provider);
  if (!apiKey?.trim()) {
    return { ok: false, errorCode: 'missing_key' };
  }

  return { ok: true, apiKey, provider: validated.request.provider, model: validated.request.model };
};
