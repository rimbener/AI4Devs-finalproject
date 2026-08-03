jest.mock('@helsoft/supabase-services', () => ({
  ProfileService: { getProfile: jest.fn() },
}));
jest.mock('./use-session', () => ({ useSession: jest.fn() }));

import { ProfileService } from '@helsoft/supabase-services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { createElement } from 'react';

import { profileQueryKey, useProfile } from './use-profile';
import { useSession } from './use-session';

const service = ProfileService as jest.Mocked<typeof ProfileService>;
const mockUseSession = useSession as jest.Mock;

const createWrapper = (
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } }),
) => {
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
};

const authenticatedSession = { session: { user: { id: 'user-1' } }, isLoading: false };
const noSession = { session: null, isLoading: false };

const freePlan = { plan: 'free', keySource: 'user', showKeySettings: true, showAds: true } as const;
const paidPlan = {
  plan: 'paid',
  keySource: 'platform',
  showKeySettings: false,
  showAds: false,
} as const;

describe('useProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue(authenticatedSession);
  });

  // Migration anchor — cached under the user-scoped key, not a private reducer slice.
  it('caches the loaded profile under profileQueryKey(userId)', async () => {
    service.getProfile.mockResolvedValue(freePlan);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper(queryClient) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(queryClient.getQueryData(profileQueryKey('user-1'))).toEqual(freePlan);
  });

  // @s51 — an authenticated learner's profile loads under their own cache key.
  it('loads the profile on mount when authenticated', async () => {
    service.getProfile.mockResolvedValue(freePlan);

    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.profile).toEqual(freePlan);
    expect(result.current.error).toBeNull();
  });

  // @s52 — an unauthenticated visitor has no profile and the profile service is never called.
  // isLoading is the query's own pending state: the disabled query never settles (TanStack v5
  // gotcha), so it stays true — the app bootstrap owns the signed-out resolution (it branches on
  // the session before trusting this flag).
  it('exposes no profile and never calls the service when there is no session', async () => {
    mockUseSession.mockReturnValue(noSession);

    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.profile).toBeNull();
    expect(service.getProfile).not.toHaveBeenCalled();
  });

  // Mutation-kill — the disabled query for an unauthenticated visitor registers under the exact
  // empty-string-scoped key, not some other placeholder.
  it("registers the disabled query under profileQueryKey('') when there is no session", () => {
    mockUseSession.mockReturnValue(noSession);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    renderHook(() => useProfile(), { wrapper: createWrapper(queryClient) });

    expect(queryClient.getQueryCache().find({ queryKey: profileQueryKey('') })).toBeDefined();
  });

  // @s53 (example: the session) — loading is true while the session is still resolving.
  it('reports loading while the session is still resolving', () => {
    mockUseSession.mockReturnValue({ session: null, isLoading: true });

    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() });

    expect(result.current.isLoading).toBe(true);
    expect(service.getProfile).not.toHaveBeenCalled();
  });

  // @s53 (example: the profile read) — loading is true while the profile read is still pending.
  it('reports loading while the profile read is still pending', () => {
    service.getProfile.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.profile).toBeNull();
  });

  // @s54 — the profile is withheld while loading and while errored.
  it('never exposes a profile when the read fails, and exposes the error', async () => {
    const error = new Error('Profile not found');
    service.getProfile.mockRejectedValue(error);

    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.profile).toBeNull();
    expect(result.current.error).toBe(error);
  });

  // @s54 (non-Error rejection) — a raw Postgrest-shaped rejection (not an Error instance) still
  // surfaces through the contract as a real Error, matching the deleted reducer's guard.
  it('normalizes a non-Error rejection into a real Error', async () => {
    const postgrestError = { message: 'Profile not found', code: 'PGRST116', details: null };
    service.getProfile.mockRejectedValue(postgrestError);

    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe(String(postgrestError));
  });

  // @s56 — retry re-reads a failed profile and clears the error.
  it('retry re-reads a failed profile and clears the error', async () => {
    service.getProfile
      .mockRejectedValueOnce(new Error('read failed'))
      .mockResolvedValueOnce(paidPlan);

    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.error).not.toBeNull());

    await act(async () => {
      result.current.retry();
    });

    await waitFor(() => expect(result.current.profile).toEqual(paidPlan));
    expect(result.current.error).toBeNull();
  });

  // @s57 — a session becoming unauthenticated resets the profile.
  it('resets the profile when the session becomes unauthenticated', async () => {
    service.getProfile.mockResolvedValue(freePlan);

    const { result, rerender } = renderHook(() => useProfile(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.profile?.plan).toBe('free'));

    mockUseSession.mockReturnValue(noSession);
    rerender(undefined as never);

    await waitFor(() => expect(result.current.profile).toBeNull());
  });

  // @s58 — two profile consumers share one read with no provider in the tree: the shared
  // QueryClient cache is the only thing deduping the read now that ProfileProvider is gone.
  it('calls the profile service once when two consumers mount under the same QueryClient', async () => {
    service.getProfile.mockResolvedValue(freePlan);
    const wrapper = createWrapper();

    const renders1: Array<ReturnType<typeof useProfile>> = [];
    const renders2: Array<ReturnType<typeof useProfile>> = [];
    const Consumer = ({
      onRender,
    }: {
      onRender: (result: ReturnType<typeof useProfile>) => void;
    }) => {
      onRender(useProfile());
      return null;
    };

    render(
      createElement(
        wrapper,
        null,
        createElement(Consumer, { onRender: (r) => renders1.push(r) }),
        createElement(Consumer, { onRender: (r) => renders2.push(r) }),
      ),
    );

    await waitFor(() => expect(renders1.at(-1)?.isLoading).toBe(false));

    expect(service.getProfile).toHaveBeenCalledTimes(1);
    expect(renders1.at(-1)?.profile).toEqual(renders2.at(-1)?.profile);
  });
});
