import type { LessonGenerationPanelState } from '@helsoft/components';
import type { LessonGenerationStage } from '@helsoft/hooks';
import type {
  AiProvider,
  AiProviderCatalogEntry,
  GenerationErrorCode,
  LessonComposition,
} from '@helsoft/types';

/** Narrow runtime guard for provider RadioGroup values, resourced against the catalog-backed
 * saved-provider list (Decision 1/4) instead of the hardcoded `AI_PROVIDERS` registry — that
 * constant is deleted outright by task-11, so this guard must not depend on it. */
export const isAiProvider = (
  providers: readonly AiProvider[],
  value: string,
): value is AiProvider => (providers as readonly string[]).includes(value);

/** Whether `modelId` is still listed under `entry`'s catalog models (Decision 6) — replaces the
 * `AI_MODEL_REGISTRY[provider]` lookup with the selected provider's own catalog entry. */
export const isCuratedModel = (entry: AiProviderCatalogEntry, modelId: string): boolean =>
  entry.models.some((model) => model.modelId === modelId);

type GenerationSelection = {
  provider: AiProvider;
  model: string;
};

/**
 * Resolve picker defaults from the catalog-backed saved-provider entries (already in catalog
 * order, Decision 4) + optional stored preference (@s20/@s21). Valid stored preference wins;
 * otherwise the first saved provider + its first catalog model (Decision 6).
 */
export const resolveGenerationSelection = (
  savedProviders: readonly AiProviderCatalogEntry[],
  stored: GenerationSelection | null,
): GenerationSelection => {
  const fallbackEntry = savedProviders[0];
  const fallbackModel = fallbackEntry?.models[0]?.modelId ?? '';

  const storedEntry = stored
    ? savedProviders.find((entry) => entry.id === stored.provider)
    : undefined;

  if (stored && storedEntry && isCuratedModel(storedEntry, stored.model)) {
    return stored;
  }

  return { provider: fallbackEntry?.id as AiProvider, model: fallbackModel };
};

/** Narrow runtime guard: `LessonGenerationPanel.onCompositionChange` hands back a plain string
 * (RadioGroup's own contract) — only forward it to `setComposition` when it is actually a member
 * of the closed `LessonComposition` union (mirrors `LanguageSettings`'s `isSupportedLocale` guard). */
export const isLessonComposition = (value: string): value is LessonComposition =>
  value === 'instructional-only' || value === 'activity-only' || value === 'both';

/** Maps `useLessonGeneration()`'s stage to `LessonGenerationPanel`'s state (@s14/@s15/@s16/@s17). */
export const toPanelState = (stage: LessonGenerationStage): LessonGenerationPanelState => {
  if (stage === 'generating') return 'loading';
  if (stage === 'content') return 'content';
  if (stage === 'error') return 'error';
  return 'empty';
};

/** Maps every `GenerationErrorCode` to its `t()` message key (@s15/@s18, task-13) — a full (not
 * partial) `Record` naming spec.md's Error contract table keys verbatim, mirroring
 * `pdf-upload.helpers.ts`'s `UPLOAD_ERROR_KEYS` so TypeScript enforces exhaustiveness. */
export const GENERATION_ERROR_KEYS: Record<GenerationErrorCode, string> = {
  missing_key: 'generation.error.missingKey',
  invalid_key: 'generation.error.invalidKey',
  invalid_model: 'generation.error.invalidModel',
  platform_key_unavailable: 'generation.error.platformKeyUnavailable',
  rate_limited: 'generation.error.rateLimited',
  timeout: 'generation.error.timeout',
  generation_failed: 'generation.error.generationFailed',
  document_not_ready: 'generation.error.documentNotReady',
  network_error: 'error.network',
  unauthenticated: 'generation.error.unauthenticated',
  persist_failed: 'generation.error.persistFailed',
};

/** The recovery-affordance category per code (task-13.md's "Recovery per code" table): `'none'`
 * for `document_not_ready` — the actual re-upload control is the sibling `PdfUpload` panel,
 * already visible on the same screen, so `LessonGenerationPanel` shows guidance text only. */
export type GenerationErrorRecovery = 'retry' | 'settings' | 'signIn' | 'none';

export const GENERATION_ERROR_RECOVERY: Record<GenerationErrorCode, GenerationErrorRecovery> = {
  missing_key: 'settings',
  invalid_key: 'settings',
  invalid_model: 'none',
  platform_key_unavailable: 'retry',
  rate_limited: 'retry',
  timeout: 'retry',
  generation_failed: 'retry',
  document_not_ready: 'none',
  network_error: 'retry',
  unauthenticated: 'signIn',
  persist_failed: 'retry',
};

/** The recovery action's `t()` label key per actionable category (`'none'` has no button, so no
 * label). */
export const GENERATION_ERROR_ACTION_LABEL_KEYS: Record<
  Exclude<GenerationErrorRecovery, 'none'>,
  string
> = {
  retry: 'generation.error.action.retry',
  settings: 'generation.error.action.settings',
  signIn: 'generation.error.action.signIn',
};
