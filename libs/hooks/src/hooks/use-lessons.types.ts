import type { LessonSummary, LessonsErrorCode } from '@helsoft/types';

export type UseLessonsResult = {
  lessons: LessonSummary[];
  isLoading: boolean;
  error: LessonsErrorCode | null;
  refetch: () => void;
  deleteLesson: (id: string) => void;
};
