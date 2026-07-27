// Vision-placement model auto-selection (@s13/@s14/@s15) — Jest-tested via import (task-10).
// Resolves entirely from the caller-injected catalog `ProviderEntry` (task-3) instead of the
// deleted module-level hardcoded model registry (task-4) — a request's entry is loaded once and
// threaded down (D9), so this stays a pure function of its input, never re-reading anything
// itself.
import type { ProviderEntry } from '../../_shared/provider-catalog.types.ts';

/** Pure resolver — selected-if-vision → entry's isVisionDefault model → null (skip vision, degrade
 * to text-only). At most one model per provider can carry `isVisionDefault` (task-1's partial
 * unique index), so the first match needs no tie-breaking. */
export const resolveVisionModelForPlacement = (
  entry: ProviderEntry | null,
  selectedModelId: string,
): string | null => {
  if (!entry) return null;

  const selected = entry.models.find((model) => model.modelId === selectedModelId);
  if (selected?.vision) return selectedModelId;

  return entry.models.find((model) => model.isVisionDefault)?.modelId ?? null;
};
