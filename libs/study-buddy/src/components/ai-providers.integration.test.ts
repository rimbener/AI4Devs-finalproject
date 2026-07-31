jest.mock('@helsoft/hooks', () => ({
  ...jest.requireActual('@helsoft/hooks'),
  useApiKey: jest.fn(),
  useProfile: jest.fn(),
}));
jest.mock('@helsoft/services', () => ({
  ...jest.requireActual('@helsoft/services'),
  GenerationPreferenceService: {
    getStoredPreference: jest.fn(),
    setStoredPreference: jest.fn(),
  },
}));

import { useAiProviders, useApiKey, useProfile } from '@helsoft/hooks';
import { GenerationPreferenceService } from '@helsoft/services';
import type { Session, SupabaseClient } from '@helsoft/supabase-services';
import { initSupabase } from '@helsoft/supabase-services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { createElement } from 'react';

import { useApiKeyManager } from './api-key-settings-screen/hooks/use-api-key-manager';
import { useLessonGenerationForm } from './lesson-generation/use-lesson-generation';

/**
 * ai-provider-registry-frontend task-13, @s21 — the one cross-layer integration test spanning
 * this whole vertical slice (`tdd.mdc`): one mocked catalog fixture — renamed, reordered, one
 * provider disabled — read through the real `AiProvidersService` -> real `useAiProviders` -> the
 * real derivations `useApiKeyManager` and `useLessonGenerationForm` build on top of it. Only the
 * Supabase client boundary is mocked (`client.from('ai_providers').select(...)`, mirrors
 * `libs/supabase-services/src/dao/ai-providers.dao.test.ts`'s raw-row shape and
 * `libs/hooks/src/hooks/api-key.integration.test.ts`'s session-mocking convention) — `useAiProviders`
 * itself, `useApiKeyManager`, and `useLessonGenerationForm` are never mocked, so the wiring between
 * them is what's actually exercised. `useApiKey`/`useProfile`/`GenerationPreferenceService` are
 * mocked as incidental collaborators `useLessonGenerationForm` also depends on — unrelated to the
 * catalog-driven identity/order/visibility behavior this test proves.
 */
const mockUseApiKey = useApiKey as jest.Mock;
const mockUseProfile = useProfile as jest.Mock;
const mockGetStoredPreference = GenerationPreferenceService.getStoredPreference as jest.Mock;

const createWrapper = (queryClient: QueryClient) => {
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
};

let client: SupabaseClient;
const authenticatedSession = { access_token: 'tok-1', user: { id: 'user-1' } } as Session;

// Renamed, reordered, one-disabled fixture — raw snake_case rows exactly as Supabase/PostgREST
// returns them (mirrors ai-providers.dao.test.ts's rawRows shape). `anthropic` is disabled and
// sorts first, proving order/visibility come from the rows alone, never a hardcoded/alphabetical
// list.
const rawRows = [
  {
    id: 'openai',
    name: 'OpenAI Renamed',
    guidance_url: null,
    enabled: true,
    sort_order: 2,
    ai_provider_models: [],
  },
  {
    id: 'anthropic',
    name: 'Anthropic Renamed',
    guidance_url: null,
    enabled: false,
    sort_order: 1,
    ai_provider_models: [],
  },
  {
    id: 'groq',
    name: 'Groq Renamed',
    guidance_url: null,
    enabled: true,
    sort_order: 3,
    ai_provider_models: [
      {
        model_id: 'model-1',
        label: 'Model 1',
        vision: false,
        is_vision_default: false,
        sort_order: 1,
      },
    ],
  },
];

describe('ai-providers integration (catalog -> useAiProviders -> useApiKeyManager / useLessonGenerationForm)', () => {
  beforeAll(() => {
    client = initSupabase({ url: 'https://example.supabase.co', anonKey: 'anon-key' });
  });

  beforeEach(() => {
    jest.spyOn(client.auth, 'getSession').mockResolvedValue({
      data: { session: authenticatedSession },
      error: null,
    } as never);
    jest
      .spyOn(client.auth, 'onAuthStateChange')
      .mockImplementation(() => ({ data: { subscription: { unsubscribe: jest.fn() } } }) as never);
    jest.spyOn(client, 'from').mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: rawRows, error: null }),
    } as never);

    mockUseProfile.mockReturnValue({
      profile: { keySource: 'user', canCreate: false },
      isLoading: false,
      error: null,
      retry: jest.fn(),
    });
    mockGetStoredPreference.mockResolvedValue(null);
  });

  afterEach(() => jest.restoreAllMocks());

  it('drives identity, order, and visibility end to end from a single catalog fixture (@s21)', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = createWrapper(queryClient);

    // 2 — real useAiProviders(), real AiProvidersService/AiProvidersDao underneath, only the
    // Supabase client boundary mocked above.
    const { result: catalog } = await renderHook(() => useAiProviders(), { wrapper });
    await waitFor(() => expect(catalog.current.isLoading).toBe(false));

    expect(
      catalog.current.providers.map((provider) => ({ id: provider.id, name: provider.name })),
    ).toEqual([
      { id: 'anthropic', name: 'Anthropic Renamed' },
      { id: 'openai', name: 'OpenAI Renamed' },
      { id: 'groq', name: 'Groq Renamed' },
    ]);
    const enabledProviders = catalog.current.providers.filter((provider) => provider.enabled);
    expect(enabledProviders.map((provider) => provider.id)).toEqual(['openai', 'groq']);

    const enabledProviderIds = enabledProviders.map((provider) => provider.id);

    // 3 — real useApiKeyManager, fed `enabledProviders` (ids), not the raw `providers` array.
    const { result: manager } = await renderHook(
      () => useApiKeyManager({ savedKeys: [], enabledProviders: enabledProviderIds }),
      { wrapper },
    );
    expect(manager.current.unsavedProviders).toEqual(['openai', 'groq']);

    // Even with a saved key for the disabled provider, it never appears in unsavedProviders —
    // excluded because it is already absent from enabledProviders, never via a re-derived
    // `enabled` check (task-7).
    const { result: managerWithDisabledSaved } = await renderHook(
      () =>
        useApiKeyManager({
          savedKeys: [{ provider: 'anthropic', updatedAt: '2026-01-01T00:00:00.000Z' }],
          enabledProviders: enabledProviderIds,
        }),
      { wrapper },
    );
    expect(managerWithDisabledSaved.current.unsavedProviders).toEqual(['openai', 'groq']);

    // 4 — real useLessonGenerationForm, backed by the same real useAiProviders()/QueryClient. Both
    // anthropic (disabled) and groq (enabled) have saved keys; only groq should survive into
    // savedProviders, proving the exclusion holds even when a key exists (task-7/task-9).
    mockUseApiKey.mockReturnValue({
      status: {
        keys: [
          { provider: 'anthropic', updatedAt: '2026-01-01T00:00:00.000Z' },
          { provider: 'groq', updatedAt: '2026-01-02T00:00:00.000Z' },
        ],
      },
      hasKey: true,
    });

    const { result: generation } = await renderHook(
      () => useLessonGenerationForm({ documentId: 'doc-1', composition: 'both' }),
      { wrapper },
    );

    await waitFor(() =>
      expect(generation.current.savedProviders).toEqual([{ id: 'groq', name: 'Groq Renamed' }]),
    );
  });
});
