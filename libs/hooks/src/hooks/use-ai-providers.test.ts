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

  it('derives enabledProviders as exactly the enabled === true subset, in the same order', async () => {
    service.getCatalog.mockResolvedValue([groq, openai]);

    const { result } = renderHook(() => useAiProviders(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.enabledProviders).toEqual([groq]);
  });

  it('defaults providers/enabledProviders to [] while data is undefined', () => {
    service.getCatalog.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useAiProviders(), { wrapper: createWrapper() });

    expect(result.current.providers).toEqual([]);
    expect(result.current.enabledProviders).toEqual([]);
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
});
