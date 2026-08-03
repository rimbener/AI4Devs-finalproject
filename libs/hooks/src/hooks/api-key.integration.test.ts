import type { Session, SupabaseClient } from '@helsoft/supabase-services';
import { initSupabase } from '@helsoft/supabase-services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { useApiKey } from './use-api-key';
import { useGetApiKey } from './use-get-api-key';

const createWrapper = (queryClient = new QueryClient()) => {
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
};

/**
 * Integration (ai-key-management): useGetApiKey (read) + useApiKey (mutate) -> ApiKeyService ->
 * ApiKeyDao, exercised for real, against a mocked Supabase client boundary (only
 * `auth.getSession`, `from(...).select(...)`, and `functions.invoke` are stubbed).
 */
let client: SupabaseClient;

const authenticatedSession = { access_token: 'tok-1', user: { id: 'user-1' } } as Session;

const mockInvoke = (impl: (...args: unknown[]) => unknown) =>
  jest.spyOn(Object.getPrototypeOf(client.functions), 'invoke').mockImplementation(impl as never);

const groqRow = { provider: 'groq', updated_at: '2026-01-01T00:00:00.000Z' };
const groqKeyStatus = { keys: [{ provider: 'groq', updatedAt: '2026-01-01T00:00:00.000Z' }] };

describe('ai-key-management integration (hook -> service -> DAO)', () => {
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
  });

  afterEach(() => jest.restoreAllMocks());

  // @s3 — on mount, the status loads through the real hook -> service -> DAO chain and
  // reflects a previously-saved key from the mocked metadata select.
  it('loads the status on mount, reflecting a previously-saved key', async () => {
    const select = jest.fn().mockResolvedValue({ data: [groqRow], error: null });
    jest.spyOn(client, 'from').mockReturnValue({ select } as never);

    const { result } = renderHook(() => useGetApiKey(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(select).toHaveBeenCalledWith('provider, updated_at');
    expect(result.current.status).toEqual(groqKeyStatus);
    expect(result.current.hasKey).toBe(true);
  });

  // @s1 — saving a key end-to-end reflects the new multi-key status.
  it('saves a key end-to-end and reflects the masked status the Edge Function returns', async () => {
    jest.spyOn(client, 'from').mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
    } as never);
    const invoke = mockInvoke(() => Promise.resolve({ data: groqKeyStatus, error: null }));

    const queryClient = new QueryClient();
    const { result: read } = renderHook(() => useGetApiKey(), {
      wrapper: createWrapper(queryClient),
    });
    const { result: mutate } = renderHook(() => useApiKey(), {
      wrapper: createWrapper(queryClient),
    });
    await waitFor(() => expect(read.current.isLoading).toBe(false));
    expect(read.current.status).toEqual({ keys: [] });

    act(() => {
      mutate.current.saveApiKey('groq', 'sk-test-key');
    });

    await waitFor(() =>
      expect(invoke).toHaveBeenCalledWith('manage-api-key', {
        body: { action: 'save', provider: 'groq', apiKey: 'sk-test-key' },
      }),
    );
    await waitFor(() => expect(read.current.status).toEqual(groqKeyStatus));
  });

  // @s4 — replacing one provider leaves the other provider's key unchanged.
  it('leaves the other provider key unchanged when replacing one provider', async () => {
    const openaiRow = { provider: 'openai', updated_at: '2026-02-01T00:00:00.000Z' };
    jest.spyOn(client, 'from').mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: [groqRow, openaiRow], error: null }),
    } as never);
    mockInvoke(() =>
      Promise.resolve({
        data: {
          keys: [
            { provider: 'groq', updatedAt: '2026-03-01T00:00:00.000Z' },
            { provider: 'openai', updatedAt: '2026-02-01T00:00:00.000Z' },
          ],
        },
        error: null,
      }),
    );

    const queryClient = new QueryClient();
    const { result: read } = renderHook(() => useGetApiKey(), {
      wrapper: createWrapper(queryClient),
    });
    const { result: mutate } = renderHook(() => useApiKey(), {
      wrapper: createWrapper(queryClient),
    });
    await waitFor(() => expect(read.current.isLoading).toBe(false));
    expect(read.current.status.keys).toHaveLength(2);

    act(() => {
      mutate.current.saveApiKey('groq', 'sk-replacement-key');
    });

    await waitFor(() =>
      expect(read.current.status.keys.find((k) => k.provider === 'groq')?.updatedAt).toBe(
        '2026-03-01T00:00:00.000Z',
      ),
    );
    expect(read.current.status.keys).toHaveLength(2);
    expect(read.current.status.keys.find((k) => k.provider === 'openai')).toEqual({
      provider: 'openai',
      updatedAt: '2026-02-01T00:00:00.000Z',
    });
  });

  // @s4 — replacing an already-saved key reflects the updated status.
  it('replaces an already-saved key end-to-end and reflects the updated masked status', async () => {
    jest.spyOn(client, 'from').mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: [groqRow], error: null }),
    } as never);
    mockInvoke(() =>
      Promise.resolve({
        data: { keys: [{ provider: 'groq', updatedAt: '2026-03-01T00:00:00.000Z' }] },
        error: null,
      }),
    );

    const queryClient = new QueryClient();
    const { result: read } = renderHook(() => useGetApiKey(), {
      wrapper: createWrapper(queryClient),
    });
    const { result: mutate } = renderHook(() => useApiKey(), {
      wrapper: createWrapper(queryClient),
    });
    await waitFor(() => expect(read.current.isLoading).toBe(false));
    expect(read.current.status.keys[0]?.updatedAt).toBe('2026-01-01T00:00:00.000Z');

    act(() => {
      mutate.current.saveApiKey('groq', 'sk-replacement-key');
    });

    await waitFor(() =>
      expect(read.current.status.keys[0]?.updatedAt).toBe('2026-03-01T00:00:00.000Z'),
    );
  });

  // @s8 — removing a saved key end-to-end reflects the no-key status.
  it('removes a saved key end-to-end and reflects the no-key status', async () => {
    jest.spyOn(client, 'from').mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: [groqRow], error: null }),
    } as never);
    const invoke = mockInvoke(() => Promise.resolve({ data: { keys: [] }, error: null }));

    const queryClient = new QueryClient();
    const { result: read } = renderHook(() => useGetApiKey(), {
      wrapper: createWrapper(queryClient),
    });
    const { result: mutate } = renderHook(() => useApiKey(), {
      wrapper: createWrapper(queryClient),
    });
    await waitFor(() => expect(read.current.isLoading).toBe(false));
    expect(read.current.hasKey).toBe(true);

    act(() => {
      mutate.current.removeApiKey('groq');
    });

    await waitFor(() =>
      expect(invoke).toHaveBeenCalledWith('manage-api-key', {
        body: { action: 'remove', provider: 'groq' },
      }),
    );
    await waitFor(() => expect(read.current.status).toEqual({ keys: [] }));
    expect(mutate.current.error).toBeNull();
  });

  // @s9 — a failed remove normalizes to network_error and preserves the saved status.
  it('normalizes a failed remove end-to-end and preserves the saved status', async () => {
    jest.spyOn(client, 'from').mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: [groqRow], error: null }),
    } as never);
    mockInvoke(() => Promise.reject(new Error('edge unreachable')));

    const queryClient = new QueryClient();
    const { result: read } = renderHook(() => useGetApiKey(), {
      wrapper: createWrapper(queryClient),
    });
    const { result: mutate } = renderHook(() => useApiKey(), {
      wrapper: createWrapper(queryClient),
    });
    await waitFor(() => expect(read.current.isLoading).toBe(false));

    act(() => {
      // removeApiKey (react-query's `mutate`) is fire-and-forget — it doesn't return a
      // rejectable promise. The failure surfaces through the hook's `error` state instead.
      mutate.current.removeApiKey('groq');
    });

    await waitFor(() => expect(mutate.current.error).toBe('network_error'));
    expect(read.current.status).toEqual(groqKeyStatus);
  });
});
