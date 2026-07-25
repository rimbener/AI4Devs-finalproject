import { LessonsService } from '@helsoft/supabase-services';
import type { LessonSummary } from '@helsoft/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import type { UseLessonsResult } from './use-lessons.types';

/** Query key for the learner's lesson list. */
export const lessonsQueryKey = ['lessons'] as const;

/**
 * React integration over LessonsService. Drives Home Loading/Content/Empty/Error via
 * `{ lessons, isLoading, error, refetch, deleteLesson }`. A successful delete filters the
 * cache directly with `setQueryData` — never `invalidateQueries` — so there is no
 * post-mutation refetch or loading flicker.
 */
export const useLessons = (): UseLessonsResult => {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error: queryError,
    refetch: queryRefetch,
  } = useQuery({
    queryKey: lessonsQueryKey,
    queryFn: () => LessonsService.getLessons(),
  });

  const {
    mutateAsync,
    error: deleteError,
    reset: resetDelete,
  } = useMutation({
    mutationFn: (id: string) => LessonsService.deleteLesson(id),
    onSuccess: (_result, id) => {
      queryClient.setQueryData<LessonSummary[]>(lessonsQueryKey, (current) =>
        (current ?? []).filter((lesson) => lesson.id !== id),
      );
    },
  });

  const refetch = useCallback(() => {
    resetDelete();
    void queryRefetch();
  }, [resetDelete, queryRefetch]);

  const deleteLesson = useCallback((id: string) => mutateAsync(id), [mutateAsync]);

  return {
    lessons: data ?? [],
    isLoading,
    // D4: mutation-first merge reproduces the old reducer's last-writer-wins slot.
    error: deleteError ?? queryError,
    refetch,
    deleteLesson,
  };
};
