import type { AiProvider, SavedProviderKey } from '@helsoft/types';

export type ApiKeySavedListProps = {
  savedKeys: SavedProviderKey[];
  /** Ordered provider ids (catalog order) — drives row order (Decision 4: no client re-sort). */
  providers: readonly AiProvider[];
  /** Providers that currently have a saved key (drives which rows render). */
  savedProviders: ReadonlySet<AiProvider>;
  /** Providers currently enabled in the catalog (task-6, Decision 5). A saved provider absent
   * from this list is never removed from the row list — it renders with a "Disabled" indicator
   * instead. Never filters `savedProviders` — that stays the sole "does this row render" rule. */
  enabledProviders: readonly AiProvider[];
  getSavedStatusLabel: (provider: AiProvider, updatedAt: string) => string;
  /** Plain catalog display names — no i18n key indirection. */
  providerNames: Record<AiProvider, string>;
  isSubmitting?: boolean;
  onReplace: (provider: AiProvider) => void;
  onRemove: (provider: AiProvider) => void;
  children?: React.ReactNode;
};
