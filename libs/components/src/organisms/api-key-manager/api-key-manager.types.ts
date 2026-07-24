import type { AiProvider, SavedProviderKey } from '@helsoft/types';

export type ApiKeyManagerProps = {
  savedKeys: SavedProviderKey[];
  isLoading?: boolean;
  isSubmitting?: boolean;
  errorMessage?: string;
  onSave: (provider: AiProvider, rawKey: string) => void;
  onRemove: (provider: AiProvider) => void;
  /** Per-provider guidance URL (wiring layer owns the destination). */
  guidanceUrls: Partial<Record<AiProvider, string>>;
  /** Build the masked saved-status label for a row (provider name + formatted date). */
  getSavedStatusLabel: (provider: AiProvider, updatedAt: string) => string;
  /** i18n keys for provider display names (resolved via useLocalization in the organism). */
  providerNameKeys: Record<AiProvider, string>;
};
