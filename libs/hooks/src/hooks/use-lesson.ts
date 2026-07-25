import { LessonsService } from '@helsoft/supabase-services';
import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import type { UseLessonResult } from './use-lesson.types';

/** Query key for a single lesson read, scoped by id so switching lessons never mixes caches. */
export const lessonQueryKey = (id: string) => ['lesson', id] as const;

/**
 * React integration over LessonsService.getLesson. Drives player Loading / Content / Empty /
 * Error via `{ lesson, isLoading, error, refetch }`. Empty = loaded lesson with slides: [].
 */
export const useLesson = (id: string): UseLessonResult => {
  const {
    data,
    isLoading,
    error,
    refetch: queryRefetch,
  } = useQuery({
    queryKey: lessonQueryKey(id),
    queryFn: () => LessonsService.getLesson(id),
  });

  const refetch = useCallback(() => {
    void queryRefetch();
  }, [queryRefetch]);

  return {
    lesson: data ?? null,
    isLoading,
    error,
    refetch,
  };
};
