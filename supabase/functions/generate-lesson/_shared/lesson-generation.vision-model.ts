// Vision-placement model auto-selection (@s13/@s14/@s15) — Jest-tested via import (task-10).
import {
  AI_MODEL_REGISTRY,
  type AiProvider,
  type AiProviderModels,
} from './models.ts';

export type VisionModelRegistry = Readonly<Record<string, AiProviderModels>>;

/** Pure helper — selected-if-vision → visionDefault → null (skip vision, degrade to text-only). */
export const resolveVisionModelFromRegistry = (
  registry: VisionModelRegistry,
  provider: AiProvider,
  selectedModelId: string,
): string | null => {
  const providerEntry = registry[provider];
  if (!providerEntry) return null;

  const selected = providerEntry.models.find((entry) => entry.id === selectedModelId);
  if (selected?.vision) return selectedModelId;
  return providerEntry.visionDefault;
};

/** Resolves the vision model for image placement using the live curated registry. */
export const resolveVisionModelForPlacement = (
  provider: AiProvider,
  selectedModelId: string,
): string | null => resolveVisionModelFromRegistry(AI_MODEL_REGISTRY, provider, selectedModelId);
