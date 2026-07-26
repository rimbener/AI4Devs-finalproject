// Pure BYOK provider/model validation — Jest-tested via import from this path (task-9). Model
// validity is decided from the caller-supplied catalog `ProviderEntry` (task-3/task-4) rather
// than any hardcoded registry — a `null` entry means the provider is unknown to the catalog.
import type { ProviderEntry } from '../../_shared/provider-catalog.types.ts';

/** Decides model validity from the entry's own catalog models (@s12/@s19) — no global registry. */
export const isValidModelForProvider = (entry: ProviderEntry, model: string): boolean =>
  entry.models.some((providerModel) => providerModel.modelId === model);

export type ValidatedByokRequest = {
  provider: string;
  model: string;
};

export type ByokValidationResult =
  | { ok: true; request: ValidatedByokRequest }
  | { ok: false; errorCode: 'invalid_model' | 'provider_disabled' };

/** Validates a free-BYOK generation request's catalog entry + curated model (@s12/@s17/@s18/@s19).
 * A disabled entry (@s17, D13) is refused before its model is even considered -- unknown (`null`)
 * stays `invalid_model`, byte-identical to before this feature (D12). */
export const validateByokGenerationRequest = (
  entry: ProviderEntry | null,
  model: unknown,
): ByokValidationResult => {
  if (!entry) {
    return { ok: false, errorCode: 'invalid_model' };
  }
  if (!entry.enabled) {
    return { ok: false, errorCode: 'provider_disabled' };
  }
  if (typeof model !== 'string' || !model.trim() || !isValidModelForProvider(entry, model)) {
    return { ok: false, errorCode: 'invalid_model' };
  }
  return { ok: true, request: { provider: entry.id, model } };
};

export type ByokKeyResolutionResult =
  | { ok: true; apiKey: string; provider: string; model: string }
  | { ok: false; errorCode: 'missing_key' | 'invalid_model' | 'provider_disabled' };

/** Validates then resolves the named provider's Vault key (@s12/@s17). */
export const resolveByokGenerationKey = async ({
  entry,
  model,
  readUserApiKey,
}: {
  entry: ProviderEntry | null;
  model: unknown;
  readUserApiKey: (provider: string) => Promise<string | null>;
}): Promise<ByokKeyResolutionResult> => {
  const validated = validateByokGenerationRequest(entry, model);
  if (!validated.ok) return validated;

  const apiKey = await readUserApiKey(validated.request.provider);
  if (!apiKey?.trim()) {
    return { ok: false, errorCode: 'missing_key' };
  }

  return { ok: true, apiKey, provider: validated.request.provider, model: validated.request.model };
};
