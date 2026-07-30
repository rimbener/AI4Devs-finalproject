jest.mock('@helsoft/supabase-services', () => ({
  AiProvidersService: { getCatalog: jest.fn() },
}));
jest.mock('./use-session', () => ({ useSession: jest.fn() }));

import { AiProvidersService } from '@helsoft/supabase-services';
import type { AiProviderCatalogEntry } from '@helsoft/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { createElement } from 'react';

import { AI_PROVIDERS_QUERY_KEY, useAiProviders } from './use-ai-providers';
import { AI_PROVIDER_CATALOG_FIXTURE } from './use-ai-providers.fixture';
import { useSession } from './use-session';

const service = AiProvidersService as jest.Mocked<typeof AiProvidersService>;
const mockUseSession = useSession as jest.Mock;

const createWrapper = (
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } }),
) => {
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
};

const authenticatedSession = { session: { user: { id: 'user-1' } }, isLoading: false };
const noSession = { session: null, isLoading: false };

const groq: AiProviderCatalogEntry = {
  id: 'groq',
  name: 'Groq',
  guidanceUrl: null,
  enabled: true,
  sortOrder: 1,
  models: [],
};
const openai: AiProviderCatalogEntry = {
  id: 'openai',
  name: 'OpenAI',
  guidanceUrl: null,
  enabled: false,
  sortOrder: 2,
  models: [],
};

describe('useAiProviders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue(authenticatedSession);
  });

  // Foundation for s1/s2/s3/s4 (task-3/task-4) — the service's ordered array passes through
  // unchanged, identity and order preserved (Decision 4: no client-side re-sort).
  it('returns the service catalog unchanged (identity/order pass-through)', async () => {
    service.getCatalog.mockResolvedValue([groq, openai]);

    const { result } = renderHook(() => useAiProviders(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.providers).toEqual([groq, openai]);
  });

  it('defaults providers/enabledProviders to [] while data is undefined', () => {
    service.getCatalog.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useAiProviders(), { wrapper: createWrapper() });

    expect(result.current.providers).toEqual([]);
  });

  // s11 (task-3) — isLoading is true before the query resolves.
  it('reports isLoading true before the query resolves', () => {
    service.getCatalog.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useAiProviders(), { wrapper: createWrapper() });

    expect(result.current.isLoading).toBe(true);
  });

  // deriveIsLoading (not raw isPending) — a signed-out session resolves isLoading to false
  // instead of staying stuck true forever.
  it('resolves isLoading to false for a signed-out session, and never calls the service', () => {
    mockUseSession.mockReturnValue(noSession);

    const { result } = renderHook(() => useAiProviders(), { wrapper: createWrapper() });

    expect(result.current.isLoading).toBe(false);
    expect(service.getCatalog).not.toHaveBeenCalled();
  });

  it('registers the query under the exported AI_PROVIDERS_QUERY_KEY', () => {
    service.getCatalog.mockResolvedValue([]);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    renderHook(() => useAiProviders(), { wrapper: createWrapper(queryClient) });

    expect(queryClient.getQueryCache().find({ queryKey: AI_PROVIDERS_QUERY_KEY })).toBeDefined();
    expect(AI_PROVIDERS_QUERY_KEY).toEqual(['ai-providers', 'catalog']);
  });

  // @s19 — today's six seeded providers (backend gherkin-scenarios.md @s5) regress zero: the
  // pinned fixture passes through the hook completely unchanged (identity, order, model count).
  it('passes the pinned six-provider/thirteen-model fixture through unchanged (@s19)', async () => {
    service.getCatalog.mockResolvedValue(AI_PROVIDER_CATALOG_FIXTURE);

    const { result } = renderHook(() => useAiProviders(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.providers).toBe(AI_PROVIDER_CATALOG_FIXTURE);
    expect(result.current.providers.map((provider) => provider.id)).toEqual([
      'groq',
      'openai',
      'anthropic',
      'google',
      'xai',
      'deepseek',
    ]);
    expect(
      result.current.providers.reduce((total, provider) => total + provider.models.length, 0),
    ).toBe(13);
  });

  // @s20 — a catalog reorder propagates through the same mounted hook instance with no remount
  // and no new QueryClient: only an explicit refetch (staleTime: Infinity means it never happens
  // on its own), mirroring the backend story's @s28 intent at the client layer. A future
  // module-level cache added ahead of useQuery (e.g. memoizing the mapped array) would make this
  // assertion fail, since the second `getCatalog` resolution would never reach `result.current`.
  it('reflects a reordered catalog after an explicit refetch, with no remount (@s20)', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    service.getCatalog.mockResolvedValueOnce([groq, openai]);

    const { result } = renderHook(() => useAiProviders(), { wrapper: createWrapper(queryClient) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.providers.map((provider) => provider.id)).toEqual(['groq', 'openai']);

    const reordered = [
      { ...openai, sortOrder: 1 },
      { ...groq, sortOrder: 2 },
    ];
    service.getCatalog.mockResolvedValueOnce(reordered);

    await queryClient.invalidateQueries({ queryKey: AI_PROVIDERS_QUERY_KEY });

    await waitFor(() =>
      expect(result.current.providers.map((provider) => provider.id)).toEqual(['openai', 'groq']),
    );
  });

  // @s20 — a provider rename/guidanceUrl edit propagates the same way: same mounted hook, same
  // QueryClient, only an explicit refetch surfaces the change.
  it('reflects a provider rename and guidanceUrl edit after an explicit refetch, with no remount (@s20)', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    service.getCatalog.mockResolvedValueOnce([groq]);

    const { result } = renderHook(() => useAiProviders(), { wrapper: createWrapper(queryClient) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.providers[0]).toMatchObject({ name: 'Groq', guidanceUrl: null });

    const renamed = [{ ...groq, name: 'Groq Cloud', guidanceUrl: 'https://console.groq.com/keys' }];
    service.getCatalog.mockResolvedValueOnce(renamed);

    await queryClient.invalidateQueries({ queryKey: AI_PROVIDERS_QUERY_KEY });

    await waitFor(() =>
      expect(result.current.providers[0]).toMatchObject({
        name: 'Groq Cloud',
        guidanceUrl: 'https://console.groq.com/keys',
      }),
    );
  });
});
