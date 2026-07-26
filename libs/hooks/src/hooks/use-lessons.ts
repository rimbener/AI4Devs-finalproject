import { LessonsService } from '@helsoft/supabase-services';
import type { LessonSummary } from '@helsoft/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseLessonsResult } from './use-lessons.types';

export const lessonsQueryKey = ['lessons'] as const;

export const useLessons = (): UseLessonsResult => {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: lessonsQueryKey,
    queryFn: () => LessonsService.getLessons(),
  });

  const {
    mutate: deleteLesson,
    error: deleteError,
    reset: deleteMutationReset,
  } = useMutation({
    mutationFn: (id: string) => LessonsService.deleteLesson(id),
    onSuccess: (_result, id) => {
      queryClient.setQueryData<LessonSummary[]>(lessonsQueryKey, (current) =>
        (current ?? []).filter((lesson) => lesson.id !== id),
      );
    },
  });

  // @s16 — the delete error is cleared before the read starts, so a later read failure (not the
  // stale delete error) is what ends up exposed.
  const refetchAndClearDeleteError = () => {
    deleteMutationReset();
    return refetch();
  };

  return {
    lessons: data ?? [],
    isLoading,
    error: deleteError ?? queryError,
    refetch: refetchAndClearDeleteError,
    deleteLesson,
  };
};
