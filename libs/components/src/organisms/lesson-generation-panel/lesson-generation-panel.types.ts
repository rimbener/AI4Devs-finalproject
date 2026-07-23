import type { AiProvider, GenerationProgressStep, LessonComposition } from '@helsoft/types';

export type LessonGenerationPanelState = 'empty' | 'loading' | 'content' | 'error';

export type LessonGenerationModelOption = {
  id: string;
  labelKey: string;
};

export type LessonGenerationPanelProps = {
  state: LessonGenerationPanelState;
  /** When true, provider + model pickers render above composition (free-BYOK only, @s10/@s19). */
  showPickers?: boolean;
  /** Saved providers in fixed order — only these appear in the provider picker (@s10). */
  savedProviders?: AiProvider[];
  /** Curated models for the selected provider (@s10). */
  modelOptions?: LessonGenerationModelOption[];
  selectedProvider?: AiProvider;
  selectedModel?: string;
  onProviderChange?: (value: string) => void;
  onModelChange?: (value: string) => void;
  /** When true (free-BYOK, no saved keys), show ApiKeyRequiredNotice instead of pickers (@s16). */
  showMissingKeyGate?: boolean;
  /** Handler for the missing-key notice action — wiring navigates to Settings. */
  onMissingKeyAction?: () => void;
  /** i18n keys for provider display names (mirrors ApiKeyManager). */
  providerNameKeys?: Record<AiProvider, string>;
  /** The selected composition — 'both' is pre-selected by the wiring layer (@s1). */
  composition: LessonComposition;
  /** RadioGroup's own contract is a plain string; the wiring layer narrows it back to
   * `LessonComposition` (spec.md's picker note). */
  onCompositionChange: (value: string) => void;
  /** Generate is disabled until an extracted document is available (@s16). */
  canGenerate: boolean;
  onGenerate: () => void;
  /** Loading-state current step (@s14) — undefined outside the Loading state. */
  currentStep?: GenerationProgressStep;
  /** Content-state summary — the generated deck's slide count (@s17). */
  slideCount?: number;
  /** Content-state primary CTA (@s17). */
  onOpenInPlayer?: () => void;
  /** Error-state message for the current `GenerationErrorCode` (@s15, task-13) — already
   * localized by the wiring layer. */
  errorMessage?: string;
  /** Error-state recovery-affordance label (@s15) — already localized by the wiring layer.
   * Omitted for a code with no actionable affordance here (`document_not_ready` — the actual
   * re-upload control is the sibling `PdfUpload` panel, already visible on the same screen). */
  errorActionLabel?: string;
  /** Error-state recovery affordance handler — the wiring layer decides whether pressing it
   * means retry(), navigating to Settings, or navigating to sign-in, per `GenerationErrorCode`
   * (spec.md's Error contract table). */
  onErrorAction?: () => void;
};
