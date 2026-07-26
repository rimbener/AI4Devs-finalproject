import type { AiProvider, SavedProviderKey } from '@helsoft/types';

export type ApiKeySavedListProps = {
  savedKeys: SavedProviderKey[];
  /** Ordered provider ids (catalog order) — drives row order (Decision 4: no client re-sort). */
  providers: readonly AiProvider[];
  /** Providers that currently have a saved key (drives which rows render). */
  savedProviders: ReadonlySet<AiProvider>;
  getSavedStatusLabel: (provider: AiProvider, updatedAt: string) => string;
  /** Plain catalog display names — no i18n key indirection. */
  providerNames: Record<AiProvider, string>;
  isSubmitting?: boolean;
  onReplace: (provider: AiProvider) => void;
  onRemove: (provider: AiProvider) => void;
  children?: React.ReactNode;
};
