jest.mock('@helsoft/supabase-services', () => ({
  LessonsService: { getLessons: jest.fn(), deleteLesson: jest.fn() },
}));

import { LessonsService } from '@helsoft/supabase-services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { createElement } from 'react';

import { lessonsQueryKey, useLessons } from './use-lessons';

const service = LessonsService as jest.Mocked<typeof LessonsService>;

const createWrapper = (
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } }),
) => {
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
};

const lessons = [
  { id: 'lesson-2', title: 'Newer', createdAt: '2026-07-13T12:00:00.000Z' },
  { id: 'lesson-1', title: 'Older', createdAt: '2026-07-12T12:00:00.000Z' },
];

describe('useLessons', () => {
  beforeEach(() => jest.clearAllMocks());

  // Migration anchor — the hook must read/write through the shared TanStack cache under the
  // exported key, not a private useReducer slice.
  it('caches the loaded lessons under lessonsQueryKey', async () => {
    service.getLessons.mockResolvedValue(lessons);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = createWrapper(queryClient);

    const { result } = renderHook(() => useLessons(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(queryClient.getQueryData(lessonsQueryKey)).toEqual(lessons);
  });

  // @s10 — isLoading starts true before effects flush.
  it('initializes isLoading to true on the first render before effects flush', () => {
    const loadingOnRender: boolean[] = [];
    service.getLessons.mockReturnValue(new Promise(() => {}) as never);

    renderHook(
      () => {
        const value = useLessons();
        loadingOnRender.push(value.isLoading);
        return value;
      },
      { wrapper: createWrapper() },
    );

    expect(loadingOnRender[0]).toBe(true);
  });

  // @s10 — the lesson list loads on mount with no error, once loading finishes.
  it('starts loading and resolves with lessons from LessonsService.getLessons', async () => {
    service.getLessons.mockResolvedValue(lessons);
    const { result } = renderHook(() => useLessons(), { wrapper: createWrapper() });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.lessons).toEqual([]);
    expect(result.current.error).toBeNull();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(service.getLessons).toHaveBeenCalledTimes(1);
    expect(result.current.lessons).toEqual(lessons);
    expect(result.current.error).toBeNull();
  });

  // @s11 — a learner with no saved lessons gets an empty list, not an error.
  it('resolves with an empty lessons array when the service returns none', async () => {
    service.getLessons.mockResolvedValue([]);
    const { result } = renderHook(() => useLessons(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.lessons).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  // @s12 — a failed list read exposes the error and an empty list.
  it('sets error and clears loading when the service rejects', async () => {
    const failure = new Error('LessonsService.getLessons: failed to load lessons');
    service.getLessons.mockRejectedValue(failure);
    const { result } = renderHook(() => useLessons(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe(failure);
    expect(result.current.lessons).toEqual([]);
  });

  // Reload without a prior error — pre-existing coverage, kept alongside s13's error-clearing case.
  it('refetch reloads lessons from the service', async () => {
    service.getLessons.mockResolvedValueOnce([]).mockResolvedValueOnce(lessons);
    const { result } = renderHook(() => useLessons(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.lessons).toEqual([]);

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.lessons).toEqual(lessons));
    expect(service.getLessons).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBeNull();
  });

  // @s13 — refetching after a failed list read clears the error.
  it('refetch clears a prior error on success', async () => {
    service.getLessons.mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce(lessons);
    const { result } = renderHook(() => useLessons(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.error).not.toBeNull());

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.error).toBeNull());
    expect(result.current.lessons).toEqual(lessons);
  });

  // @s14 — deleting a lesson removes it from the cached list without re-reading.
  it('deleteLesson removes the lesson from the list after a successful service delete, without re-reading', async () => {
    service.getLessons.mockResolvedValue(lessons);
    service.deleteLesson.mockResolvedValue(undefined);
    const { result } = renderHook(() => useLessons(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.lessons).toEqual(lessons);

    act(() => {
      result.current.deleteLesson('lesson-2');
    });

    await waitFor(() => expect(service.deleteLesson).toHaveBeenCalledWith('lesson-2'));
    await waitFor(() =>
      expect(result.current.lessons).toEqual([
        { id: 'lesson-1', title: 'Older', createdAt: '2026-07-12T12:00:00.000Z' },
      ]),
    );
    expect(service.getLessons).toHaveBeenCalledTimes(1);
  });

  // @s15 — a failed delete surfaces via error and leaves the list unchanged (mutate is void).
  it('deleteLesson leaves the list unchanged and sets error when the service rejects', async () => {
    const failure = new Error('LessonsService.deleteLesson: failed to delete lesson');
    service.getLessons.mockResolvedValue(lessons);
    service.deleteLesson.mockRejectedValue(failure);
    const { result } = renderHook(() => useLessons(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.deleteLesson('lesson-2');
    });

    await waitFor(() => expect(result.current.error).toBe(failure));
    expect(result.current.lessons).toEqual(lessons);
  });

  // @s16 — deleteError ?? queryError: a stale delete error outranks a later read failure.
  it('keeps a delete error ahead of a later read failure after refetch', async () => {
    const deleteFailure = new Error('LessonsService.deleteLesson: failed to delete lesson');
    const readFailure = new Error('LessonsService.getLessons: failed to load lessons');
    service.getLessons.mockResolvedValueOnce(lessons).mockRejectedValueOnce(readFailure);
    service.deleteLesson.mockRejectedValue(deleteFailure);
    const { result } = renderHook(() => useLessons(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.deleteLesson('lesson-2');
    });
    await waitFor(() => expect(result.current.error).toBe(deleteFailure));

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => expect(service.getLessons).toHaveBeenCalledTimes(2));
    expect(result.current.error).toBe(deleteFailure);
    expect(result.current.lessons).toEqual(lessons);
  });
});
