import { useAiProviders, useApiKey, useProfile } from '@helsoft/hooks';
import { GenerationPreferenceService } from '@helsoft/services';
import type { AiProvider, GenerateLessonRequest, LessonComposition } from '@helsoft/types';
import { useEffect, useMemo, useState } from 'react';

import { resolveGenerationSelection } from './lesson-generation.helpers';

type UseLessonGenerationArgs = {
  documentId?: string;
  composition: LessonComposition;
};

/**
 * Local picker + missing-key gate state for the LessonGeneration feature component.
 * Handlers stay in lesson-generation.tsx (component-split.mdc). Exempt from `useQuery` — see
 * `.agents/rules/tanstack-query.mdc`'s Exemptions section: `GenerationPreferenceService`'s stored
 * preference is read once, to seed local picker state, not as an ongoing server-state read.
 *
 * Provider/model identity, order, and curated list all come from `useAiProviders()`'s live
 * catalog (task-4, Decisions 1/4/6) — `savedProviders` still means "has a saved key" (unchanged
 * filter), just ordered/sourced by the catalog instead of the hardcoded `AI_PROVIDERS` registry.
 *
 * task-9, @s9 (Decision 5) — `savedProviderEntries` is derived from `enabledProviders`, not the
 * full `providers` list: a disabled provider is excluded from the generate-flow picker even when
 * the learner holds a saved key for it (unlike the settings list, task-6, which keeps it visible).
 */
export const useLessonGenerationForm = ({ documentId, composition }: UseLessonGenerationArgs) => {
  const { enabledProviders } = useAiProviders();
  const { status, hasKey } = useApiKey();
  const { profile } = useProfile();
  const [selectedProvider, setSelectedProvider] = useState<AiProvider | undefined>();
  const [selectedModel, setSelectedModel] = useState<string | undefined>();

  const savedProviderEntries = useMemo(() => {
    const saved = new Set(status.keys.map((entry) => entry.provider));
    return enabledProviders.filter((provider) => saved.has(provider.id));
  }, [enabledProviders, status.keys]);

  const savedProviders = useMemo(
    () => savedProviderEntries.map((entry) => ({ id: entry.id, name: entry.name })),
    [savedProviderEntries],
  );

  const isFreeByok = profile?.keySource === 'user';
  const showPickers = isFreeByok && savedProviderEntries.length > 0;
  const showMissingKeyGate = isFreeByok && !hasKey;
  const hasPickerSelection = !showPickers || (Boolean(selectedProvider) && Boolean(selectedModel));
  const canGenerate = Boolean(documentId) && !showMissingKeyGate && hasPickerSelection;

  useEffect(() => {
    if (!showPickers || savedProviderEntries.length === 0) return;

    let cancelled = false;

    void (async () => {
      const stored = await GenerationPreferenceService.getStoredPreference();
      if (cancelled) return;

      const { provider, model } = resolveGenerationSelection(savedProviderEntries, stored);
      setSelectedProvider(provider);
      setSelectedModel(model);
    })();

    return () => {
      cancelled = true;
    };
  }, [showPickers, savedProviderEntries]);

  const selectedEntry = savedProviderEntries.find((entry) => entry.id === selectedProvider);
  const modelOptions = selectedEntry
    ? selectedEntry.models.map((model) => ({ id: model.modelId, label: model.label }))
    : [];

  const buildGenerateRequest = (): GenerateLessonRequest | null => {
    if (!documentId || showMissingKeyGate) return null;
    const request: GenerateLessonRequest = { documentId, composition };
    if (showPickers && selectedProvider && selectedModel) {
      request.provider = selectedProvider;
      request.model = selectedModel;
    }
    return request;
  };

  const selectProvider = (provider: AiProvider) => {
    setSelectedProvider(provider);
    const entry = savedProviderEntries.find((candidate) => candidate.id === provider);
    setSelectedModel(entry?.models[0]?.modelId);
  };

  return {
    savedProviders,
    showPickers,
    showMissingKeyGate,
    canGenerate,
    modelOptions,
    selectedProvider,
    selectedModel,
    setSelectedModel,
    selectProvider,
    buildGenerateRequest,
  };
};
