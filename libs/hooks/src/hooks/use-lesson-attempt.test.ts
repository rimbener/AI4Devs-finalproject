jest.mock('@helsoft/supabase-services', () => ({
  LessonAttemptService: { saveAttempt: jest.fn() },
}));

import { LessonAttemptService } from '@helsoft/supabase-services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { createElement } from 'react';

import { useLessonAttempt } from './use-lesson-attempt';

const service = LessonAttemptService as jest.Mocked<typeof LessonAttemptService>;
const input = { lessonId: 'lesson-1', score: 3, total: 3 };

const createWrapper = (
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } }),
) => {
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useLessonAttempt', () => {
  beforeEach(() => jest.clearAllMocks());

  // Migration anchor — the save must run through a registered TanStack mutation, not a private
  // useState/promise-chain slice.
  it('registers the save as a mutation in the shared TanStack mutation cache', async () => {
    const savedAttempt = { id: 'attempt-1', ...input, createdAt: '2026-07-11T00:00:00.000Z' };
    service.saveAttempt.mockResolvedValue(savedAttempt);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useLessonAttempt(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.saveAttempt(input);
    });

    expect(queryClient.getMutationCache().getAll().length).toBeGreaterThan(0);
  });

  // @s30 — status moves from idle to saving while the save is in flight.
  it('sets status to saving while saveAttempt is in flight', async () => {
    let resolveSave: (value: unknown) => void = () => {};
    service.saveAttempt.mockReturnValue(new Promise((resolve) => (resolveSave = resolve)) as never);
    const { result } = renderHook(() => useLessonAttempt(), { wrapper: createWrapper() });

    expect(result.current.status).toBe('idle');

    act(() => {
      result.current.saveAttempt(input);
    });

    await waitFor(() => expect(result.current.status).toBe('saving'));

    await act(async () => {
      resolveSave({ id: 'attempt-1', ...input, createdAt: '2026-07-11T00:00:00.000Z' });
    });
  });

  // @s30 — a successful save moves to saved and exposes the returned LessonAttempt.
  it('transitions to saved with the returned LessonAttempt on a successful save', async () => {
    const savedAttempt = { id: 'attempt-1', ...input, createdAt: '2026-07-11T00:00:00.000Z' };
    service.saveAttempt.mockResolvedValue(savedAttempt);
    const { result } = renderHook(() => useLessonAttempt(), { wrapper: createWrapper() });

    act(() => {
      result.current.saveAttempt(input);
    });

    await waitFor(() => expect(result.current.status).toBe('saved'));
    expect(result.current.attempt).toEqual(savedAttempt);
  });

  // @s31 — a failed save moves to error with no attempt retained.
  it('sets status to error and exposes no attempt when the save rejects', async () => {
    service.saveAttempt.mockRejectedValue(new Error('insert failed'));
    const { result } = renderHook(() => useLessonAttempt(), { wrapper: createWrapper() });

    act(() => {
      result.current.saveAttempt(input);
    });

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.attempt).toBeNull();
  });

  // @s32 — a later separate save (after the first has settled) is a fresh insert.
  it('calls the service again on a later separate saveAttempt call once the first has settled', async () => {
    const firstAttempt = { id: 'attempt-1', ...input, createdAt: '2026-07-11T00:00:00.000Z' };
    const secondAttempt = { id: 'attempt-2', ...input, createdAt: '2026-07-11T01:00:00.000Z' };
    service.saveAttempt.mockResolvedValueOnce(firstAttempt).mockResolvedValueOnce(secondAttempt);
    const { result } = renderHook(() => useLessonAttempt(), { wrapper: createWrapper() });

    act(() => {
      result.current.saveAttempt(input);
    });
    await waitFor(() => expect(result.current.attempt).toEqual(firstAttempt));

    act(() => {
      result.current.saveAttempt(input);
    });
    await waitFor(() => expect(result.current.attempt).toEqual(secondAttempt));

    expect(service.saveAttempt).toHaveBeenCalledTimes(2);
  });

  // @s33 (NEW) — two saveAttempt calls in the same tick insert only once. `isPending` only
  // becomes true after a re-render, so both calls here would read it as `false` if the ref
  // weren't there; the isSaving ref closes that window synchronously, inside a single act().
  it('calls the service exactly once when saveAttempt is called twice in the same tick', async () => {
    let resolveSave: (value: unknown) => void = () => {};
    service.saveAttempt.mockReturnValue(new Promise((resolve) => (resolveSave = resolve)) as never);
    const { result } = renderHook(() => useLessonAttempt(), { wrapper: createWrapper() });

    act(() => {
      result.current.saveAttempt(input);
      result.current.saveAttempt(input);
    });

    await waitFor(() => expect(service.saveAttempt).toHaveBeenCalledTimes(1));
    expect(service.saveAttempt).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveSave({ id: 'attempt-1', ...input, createdAt: '2026-07-11T00:00:00.000Z' });
    });
  });

  // @s34 — a save while another is in flight is refused, not queued for once the first settles.
  it('refuses saveAttempt while a save is already in flight, and never runs it once that settles', async () => {
    let resolveSave: (value: unknown) => void = () => {};
    service.saveAttempt.mockReturnValue(new Promise((resolve) => (resolveSave = resolve)) as never);
    const { result } = renderHook(() => useLessonAttempt(), { wrapper: createWrapper() });

    act(() => {
      result.current.saveAttempt(input);
    });
    await waitFor(() => expect(service.saveAttempt).toHaveBeenCalledTimes(1));

    act(() => {
      result.current.saveAttempt(input);
    });
    // The refusal happens synchronously (before any scheduling), so no wait is needed here.
    expect(service.saveAttempt).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveSave({ id: 'attempt-1', ...input, createdAt: '2026-07-11T00:00:00.000Z' });
    });

    expect(service.saveAttempt).toHaveBeenCalledTimes(1);
  });

  // @s35 — retry replays the last submitted attempt and becomes saved with the returned attempt.
  it('retry re-invokes the service with the last input and eventually saves', async () => {
    service.saveAttempt.mockRejectedValueOnce(new Error('insert failed'));
    const { result } = renderHook(() => useLessonAttempt(), { wrapper: createWrapper() });

    act(() => {
      result.current.saveAttempt(input);
    });
    await waitFor(() => expect(result.current.status).toBe('error'));

    const savedAttempt = { id: 'attempt-1', ...input, createdAt: '2026-07-11T00:00:00.000Z' };
    service.saveAttempt.mockResolvedValueOnce(savedAttempt);

    act(() => {
      result.current.retry();
    });

    await waitFor(() => expect(result.current.status).toBe('saved'));
    expect(service.saveAttempt).toHaveBeenCalledTimes(2);
    expect(service.saveAttempt).toHaveBeenNthCalledWith(2, input);
    expect(result.current.attempt).toEqual(savedAttempt);
  });

  // @s36 (example 1) — retry is a no-op when there is nothing to replay. The extra microtask
  // flushes below are load-bearing: `mutate()`'s actual invocation of the mutationFn lands a
  // tick after the synchronous call, so a bare `act(() => {...})` here would pass even if the
  // `variables === undefined` guard were removed entirely.
  it('retry does nothing when there is no prior saveAttempt call', async () => {
    const { result } = renderHook(() => useLessonAttempt(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.retry();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(service.saveAttempt).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
  });

  // @s36 (example 2) — retry is a no-op while a save is already in flight.
  it('does not call the service again when retry is called while a save is already in flight', async () => {
    service.saveAttempt.mockRejectedValueOnce(new Error('insert failed'));
    const { result } = renderHook(() => useLessonAttempt(), { wrapper: createWrapper() });

    act(() => {
      result.current.saveAttempt(input);
    });
    await waitFor(() => expect(result.current.status).toBe('error'));

    let resolveRetry: (value: unknown) => void = () => {};
    service.saveAttempt.mockReturnValue(
      new Promise((resolve) => (resolveRetry = resolve)) as never,
    );

    act(() => {
      result.current.retry();
    });
    await waitFor(() => expect(service.saveAttempt).toHaveBeenCalledTimes(2));

    // The refusal itself is synchronous, but confirming the service was NOT called a third
    // time needs a flush too: without it, a broken guard (e.g. the in-flight ref never actually
    // flipping true) would still read as "only 2 calls" here purely because `mutate()`'s
    // mutationFn invocation hasn't landed yet, not because it was refused.
    await act(async () => {
      result.current.retry();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(service.saveAttempt).toHaveBeenCalledTimes(2);

    await act(async () => {
      resolveRetry({ id: 'attempt-1', ...input, createdAt: '2026-07-11T00:00:00.000Z' });
    });
  });

  // Regression — no state-update-after-unmount warning once an in-flight save resolves after
  // the component has already unmounted. TanStack unsubscribes the mutation observer on
  // unmount internally; no isMounted ref is needed for this.
  it('does not log a state-update-after-unmount warning once the in-flight save resolves post-unmount', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    let resolveSave: (value: unknown) => void = () => {};
    service.saveAttempt.mockReturnValue(new Promise((resolve) => (resolveSave = resolve)) as never);
    const { result, unmount } = renderHook(() => useLessonAttempt(), { wrapper: createWrapper() });

    act(() => {
      result.current.saveAttempt(input);
    });
    unmount();

    await act(async () => {
      resolveSave({ id: 'attempt-1', ...input, createdAt: '2026-07-11T00:00:00.000Z' });
    });

    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
