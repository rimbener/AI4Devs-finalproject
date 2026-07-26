import type { AiProvider, SavedProviderKey } from '@helsoft/types';

export type ApiKeyManagerProps = {
  savedKeys: SavedProviderKey[];
  /** Ordered provider ids (catalog order) driving the saved-list, add-picker, and
   * replace-picker order — the wiring layer's `useAiProviders()` catalog, unchanged. */
  providers: readonly AiProvider[];
  /** Providers currently enabled in the catalog (task-6/task-7, Decision 5) — the wiring
   * layer's `useAiProviders().enabledProviders`. Drives two independent things: the saved-list's
   * per-row "Disabled" indicator (never filters which rows render), and the add-picker's
   * `unsavedProviders` (a disabled, unsaved provider is excluded from the add-picker entirely). */
  enabledProviders: readonly AiProvider[];
  isLoading?: boolean;
  isSubmitting?: boolean;
  errorMessage?: string;
  onSave: (provider: AiProvider, rawKey: string) => void;
  onRemove: (provider: AiProvider) => void;
  /** Per-provider guidance URL (wiring layer owns the destination). */
  guidanceUrls: Partial<Record<AiProvider, string>>;
  /** Build the masked saved-status label for a row (provider name + formatted date). */
  getSavedStatusLabel: (provider: AiProvider, updatedAt: string) => string;
  /** Plain catalog display names — no i18n key indirection (the catalog's `name` is already a
   * display string, not a translation key). */
  providerNames: Record<AiProvider, string>;
};
