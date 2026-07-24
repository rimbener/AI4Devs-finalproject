import type { AiProvider, SavedProviderKey } from '@helsoft/types';

export type ApiKeySavedListProps = {
  savedKeys: SavedProviderKey[];
  /** Providers that currently have a saved key (drives which rows render). */
  savedProviders: ReadonlySet<AiProvider>;
  getSavedStatusLabel: (provider: AiProvider, updatedAt: string) => string;
  providerNameKeys: Record<AiProvider, string>;
  isSubmitting?: boolean;
  onReplace: (provider: AiProvider) => void;
  onRemove: (provider: AiProvider) => void;
};
