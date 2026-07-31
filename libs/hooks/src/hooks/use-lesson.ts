import { LessonsService } from '@helsoft/supabase-services';
import { useQuery } from '@tanstack/react-query';
import type { UseLessonResult } from './use-lesson.types';
import { toLessonsErrorCode } from './use-lessons.helpers';

export const lessonQueryKey = (id: string) => ['lesson', id] as const;

export const useLesson = (id: string): UseLessonResult => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: lessonQueryKey(id),
    queryFn: () => LessonsService.getLesson(id),
  });

  return {
    lesson: data ?? null,
    isLoading,
    error: error ? toLessonsErrorCode(error) : null,
    refetch,
  };
};
