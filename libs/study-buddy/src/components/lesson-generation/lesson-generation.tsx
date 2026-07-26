import { LessonGenerationPanel, LessonGenerationPanelProvider } from '@helsoft/components';
import { useLessonGeneration } from '@helsoft/hooks';
import { useLocalization } from '@helsoft/localization';
import { GenerationPreferenceService } from '@helsoft/services';
import type { LessonComposition } from '@helsoft/types';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  GENERATION_ERROR_ACTION_LABEL_KEYS,
  GENERATION_ERROR_KEYS,
  GENERATION_ERROR_RECOVERY,
  isAiProvider,
  isLessonComposition,
  toPanelState,
} from './lesson-generation.helpers';
import type { LessonGenerationProps } from './lesson-generation.types';
import { useLessonGenerationForm } from './use-lesson-generation';

/**
 * LessonGeneration — feature component that puts the composition picker on the upload screen
 * (spec.md decision #3) and drives generation. Owns composition state (default `both`), calls
 * `useLessonGeneration`, receives the extracted `documentId` as a prop (decision #9), and hands
 * the returned deck to the player entry point (placeholder nav until R4). Chrome copy (picker
 * labels, Generate, progress steps, ready summary) is owned by the presentational
 * `LessonGenerationPanel` itself (mirrors `LanguageSettings`'s precedent); the Error state's
 * per-code message + recovery affordance (task-13, @s15) is the one thing this wiring layer
 * translates and dispatches, mirroring `pdf-upload.tsx`'s `UPLOAD_ERROR_KEYS` pattern.
 *
 * `onGenerated` (pending-pdfs-generate decision #5) is additive/optional: fires once when
 * generation reaches Content/ready with a persisted lessonId, so a sibling (`PdfDocuments`)
 * can refetch without owning the generation lifecycle.
 */
export const LessonGeneration = ({ documentId, onGenerated }: LessonGenerationProps) => {
  const [composition, setComposition] = useState<LessonComposition>('both');
  const { stage, currentStep, result, error, generate, retry } = useLessonGeneration();
  const {
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
  } = useLessonGenerationForm({ documentId, composition });
  const { t } = useLocalization();
  const router = useRouter();
  const lastAnnouncedLessonId = useRef<string | undefined>(undefined);
  // isAiProvider's guard is resourced against the catalog-backed savedProviders list (task-4)
  // instead of the hardcoded AI_PROVIDERS registry — only ever-offered ids narrow the raw
  // RadioGroup string value.
  const savedProviderIds = useMemo(
    () => savedProviders.map((provider) => provider.id),
    [savedProviders],
  );

  useEffect(() => {
    const lessonId = result?.lessonId?.trim();
    if (!lessonId || lessonId === lastAnnouncedLessonId.current) return;
    lastAnnouncedLessonId.current = lessonId;
    onGenerated?.();
  }, [result?.lessonId, onGenerated]);

  const handleGenerate = useCallback(() => {
    const request = buildGenerateRequest();
    if (!request) return;
    if (showPickers && selectedProvider && selectedModel) {
      void GenerationPreferenceService.setStoredPreference({
        provider: selectedProvider,
        model: selectedModel,
      });
    }
    void generate(request);
  }, [buildGenerateRequest, generate, selectedModel, selectedProvider, showPickers]);

  const handleOpenInPlayer = useCallback(() => {
    const lessonId = result?.lessonId?.trim();
    if (!lessonId) return;
    router.push({ pathname: '/lesson/[id]/player', params: { id: lessonId } });
  }, [result, router]);

  const recovery = error ? GENERATION_ERROR_RECOVERY[error] : 'none';

  const handleErrorAction = useCallback(() => {
    if (recovery === 'retry') void retry();
    else if (recovery === 'settings') router.push('/settings/api-keys');
    else if (recovery === 'signIn') router.push('/login');
  }, [recovery, retry, router]);

  const handleCompositionChange = useCallback((value: string) => {
    if (isLessonComposition(value)) setComposition(value);
  }, []);

  const handleProviderChange = useCallback(
    (value: string) => {
      if (isAiProvider(savedProviderIds, value)) selectProvider(value);
    },
    [savedProviderIds, selectProvider],
  );

  const handleModelChange = useCallback(
    (value: string) => {
      setSelectedModel(value);
    },
    [setSelectedModel],
  );

  const handleMissingKeyAction = useCallback(() => {
    router.push('/settings/api-keys');
  }, [router]);

  return (
    <LessonGenerationPanelProvider
      value={{
        state: showMissingKeyGate ? 'missing-key' : toPanelState(stage),
        showPickers,
        onMissingKeyAction: handleMissingKeyAction,
        savedProviders,
        modelOptions,
        selectedProvider,
        selectedModel,
        onProviderChange: handleProviderChange,
        onModelChange: handleModelChange,
        composition,
        onCompositionChange: handleCompositionChange,
        canGenerate,
        onGenerate: handleGenerate,
        currentStep,
        slideCount: result?.slides.length,
        onOpenInPlayer: handleOpenInPlayer,
        errorMessage: error ? t(GENERATION_ERROR_KEYS[error]) : undefined,
        errorActionLabel:
          recovery === 'none' ? undefined : t(GENERATION_ERROR_ACTION_LABEL_KEYS[recovery]),
        onErrorAction: handleErrorAction,
      }}
    >
      <LessonGenerationPanel />
    </LessonGenerationPanelProvider>
  );
};
