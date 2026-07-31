jest.mock('@helsoft/supabase-services', () => ({
  LessonsService: { getLesson: jest.fn() },
}));

import { LessonsService } from '@helsoft/supabase-services';
import type { Lesson } from '@helsoft/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { createElement } from 'react';

import { lessonQueryKey, useLesson } from './use-lesson';
import type { UseLessonResult } from './use-lesson.types';

type LessonIdProps = { id: string };

const service = LessonsService as jest.Mocked<typeof LessonsService>;

const createWrapper = (
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } }),
) => {
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
};

const lesson: Lesson = {
  id: 'lesson-1',
  userId: 'user-1',
  title: 'Capitals',
  createdAt: '2026-07-12T12:00:00.000Z',
  slides: [
    {
      id: 'slide-1',
      lessonId: 'lesson-1',
      title: 'Intro',
      content: 'Hello',
      position: 0,
      kind: 'instructional',
    },
  ],
};

describe('useLesson', () => {
  beforeEach(() => jest.clearAllMocks());

  // Migration anchor — the hook must read/write through the shared TanStack cache under the
  // exported key, not a private useReducer slice.
  it('caches the loaded lesson under lessonQueryKey(id)', async () => {
    service.getLesson.mockResolvedValue(lesson);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = createWrapper(queryClient);

    const { result } = renderHook(() => useLesson('lesson-1'), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(queryClient.getQueryData(lessonQueryKey('lesson-1'))).toEqual(lesson);
  });

  // @s5 — first render is loading before effects flush.
  it('initializes isLoading to true on the first render before effects flush', () => {
    const loadingOnRender: boolean[] = [];
    service.getLesson.mockReturnValue(new Promise(() => {}) as never);

    renderHook(
      () => {
        const value = useLesson('lesson-1');
        loadingOnRender.push(value.isLoading);
        return value;
      },
      { wrapper: createWrapper() },
    );

    expect(loadingOnRender[0]).toBe(true);
  });

  // @s5 — a lesson loads on mount with no error, once loading finishes.
  it('starts loading and resolves with the lesson from LessonsService.getLesson', async () => {
    service.getLesson.mockResolvedValue(lesson);
    const { result } = renderHook(() => useLesson('lesson-1'), { wrapper: createWrapper() });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.lesson).toBeNull();
    expect(result.current.error).toBeNull();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(service.getLesson).toHaveBeenCalledWith('lesson-1');
    expect(result.current.lesson).toEqual(lesson);
    expect(result.current.error).toBeNull();
  });

  // @s6 — a lesson with no slides is an empty result, not an error.
  it('resolves with a lesson that has zero slides', async () => {
    const empty: Lesson = { ...lesson, slides: [] };
    service.getLesson.mockResolvedValue(empty);
    const { result } = renderHook(() => useLesson('lesson-1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.lesson).toEqual(empty);
    expect(result.current.error).toBeNull();
  });

  // @s7 — a failed lesson read exposes the error and no lesson, loading finished.
  it('sets error and clears loading when the service rejects', async () => {
    service.getLesson.mockRejectedValue(
      Object.assign(new Error('LessonsService.getLesson: failed to load lesson'), {
        code: 'network_error',
      }),
    );
    const { result } = renderHook(() => useLesson('lesson-1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe('network_error');
    expect(result.current.lesson).toBeNull();
  });

  // @s8 — refetching after a failed read clears the error once it succeeds.
  it('refetch after a failed read clears the error and exposes the lesson', async () => {
    service.getLesson
      .mockRejectedValueOnce(new Error('LessonsService.getLesson: failed to load lesson'))
      .mockResolvedValueOnce(lesson);
    const { result } = renderHook(() => useLesson('lesson-1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.lesson).toBeNull();

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.lesson).toEqual(lesson));
    expect(result.current.error).toBeNull();
    expect(service.getLesson).toHaveBeenCalledTimes(2);
  });

  // @s9 — requesting a different lesson id never shows the previous one.
  it('reloads when the lesson id changes', async () => {
    const other: Lesson = { ...lesson, id: 'lesson-2', title: 'Other' };
    service.getLesson.mockResolvedValueOnce(lesson).mockResolvedValueOnce(other);

    const { result, rerender } = renderHook<UseLessonResult, LessonIdProps>(
      ({ id }) => useLesson(id),
      { initialProps: { id: 'lesson-1' }, wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.lesson).toEqual(lesson));

    rerender({ id: 'lesson-2' });

    await waitFor(() => expect(result.current.lesson).toEqual(other));
    expect(service.getLesson).toHaveBeenCalledWith('lesson-2');
    expect(service.getLesson).toHaveBeenCalledTimes(2);
  });

  // @s9 — a late response for a previous id (still in flight when the id changed) never
  // replaces the newly requested lesson.
  it('never lets a stale response for a previous lesson id replace the newly requested one', async () => {
    const other: Lesson = { ...lesson, id: 'lesson-2', title: 'Other' };
    let resolveFirst: (value: Lesson) => void = () => {};
    service.getLesson.mockImplementation((requestedId: string) =>
      requestedId === 'lesson-1'
        ? new Promise((resolve) => {
            resolveFirst = resolve;
          })
        : (Promise.resolve(other) as never),
    );

    const { result, rerender } = renderHook<UseLessonResult, LessonIdProps>(
      ({ id }) => useLesson(id),
      { initialProps: { id: 'lesson-1' }, wrapper: createWrapper() },
    );

    rerender({ id: 'lesson-2' });
    await waitFor(() => expect(result.current.lesson).toEqual(other));

    await act(async () => {
      resolveFirst(lesson);
    });

    expect(result.current.lesson).toEqual(other);
  });
});
