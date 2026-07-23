import { useApiKey, useProfile } from '@helsoft/hooks';
import {
  AI_MODEL_REGISTRY,
  AI_PROVIDERS,
  type AiProvider,
  type GenerateLessonRequest,
  type LessonComposition,
} from '@helsoft/types';
import { useEffect, useMemo, useState } from 'react';

type UseLessonGenerationArgs = {
  documentId?: string;
  composition: LessonComposition;
};

/**
 * Local picker + missing-key gate state for the LessonGeneration feature component.
 * Handlers stay in lesson-generation.tsx (component-split.mdc).
 */
export const useLessonGenerationForm = ({ documentId, composition }: UseLessonGenerationArgs) => {
  const { status, hasKey } = useApiKey();
  const { profile } = useProfile();
  const [selectedProvider, setSelectedProvider] = useState<AiProvider | undefined>();
  const [selectedModel, setSelectedModel] = useState<string | undefined>();

  const savedProviders = useMemo(() => {
    const saved = new Set(status.keys.map((entry) => entry.provider));
    return AI_PROVIDERS.filter((provider) => saved.has(provider));
  }, [status.keys]);

  const isFreeByok = profile?.keySource === 'user';
  const showPickers = isFreeByok && savedProviders.length > 0;
  const showMissingKeyGate = isFreeByok && !hasKey;
  const canGenerate = Boolean(documentId) && !showMissingKeyGate;

  useEffect(() => {
    if (!showPickers) return;
    if (!selectedProvider || !savedProviders.includes(selectedProvider)) {
      const firstProvider = savedProviders[0];
      setSelectedProvider(firstProvider);
      setSelectedModel(AI_MODEL_REGISTRY[firstProvider].models[0]?.id);
    }
  }, [showPickers, savedProviders, selectedProvider]);

  const modelOptions = selectedProvider ? AI_MODEL_REGISTRY[selectedProvider].models : [];

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
    setSelectedModel(AI_MODEL_REGISTRY[provider].models[0]?.id);
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
