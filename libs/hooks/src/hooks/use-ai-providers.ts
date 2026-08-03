import { AiProvidersService } from '@helsoft/supabase-services';
import type { AiProviderCatalogEntry } from '@helsoft/types';
import { useQuery } from '@tanstack/react-query';
import { useSessionGate } from './use-session-gate';
/**
 * Query key for the AI-provider catalog (Decision 1). Not user-scoped — the catalog carries no
 * per-user dimension, only *whether* the query runs is gated by the session (`useSessionGate`).
 */
export const AI_PROVIDERS_QUERY_KEY = ['ai-providers', 'catalog'] as const;

const EMPTY_PROVIDERS: AiProviderCatalogEntry[] = [];

/**
 * React integration over `AiProvidersService.getCatalog()` — reference data with no per-user
 * dimension, so `staleTime: Infinity` (mirrors `use-session.ts`, not `useApiKey`'s per-user
 * polling shape). Gated on an authenticated session (catalog RLS is `to authenticated`).
 * `getCatalog()` never rejects (Decision 11), so there is no `error` to expose here — a failed
 * catalog read surfaces as `providers: []`.
 */
export const useAiProviders = () => {
  const { enabled } = useSessionGate();

  const { data, isPending } = useQuery({
    queryKey: AI_PROVIDERS_QUERY_KEY,
    queryFn: AiProvidersService.getCatalog,
    staleTime: Infinity,
    enabled,
  });

  const providers = data ?? EMPTY_PROVIDERS;

  return {
    providers,
    isLoading: isPending,
  };
};
