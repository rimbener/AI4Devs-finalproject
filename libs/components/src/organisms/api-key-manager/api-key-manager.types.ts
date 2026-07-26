import type { AiProvider, SavedProviderKey } from '@helsoft/types';

export type ApiKeyManagerProps = {
  savedKeys: SavedProviderKey[];
  /** Ordered provider ids (catalog order) driving the saved-list, add-picker, and
   * replace-picker order — the wiring layer's `useAiProviders()` catalog, unchanged. */
  providers: readonly AiProvider[];
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
