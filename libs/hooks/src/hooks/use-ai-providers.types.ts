import type { AiProviderCatalogEntry } from '@helsoft/types';

export type UseAiProvidersResult = {
  /** The full catalog, already ordered by sort_order (Decision 4 — no client re-sort). */
  providers: AiProviderCatalogEntry[];
  /** `providers` filtered to `enabled === true`, computed once here so every consumer that
   * needs "only choosable providers" reads this instead of re-deriving its own filter. */
  enabledProviders: AiProviderCatalogEntry[];
  /** True while the session or the catalog query itself is still resolving. */
  isLoading: boolean;
};
