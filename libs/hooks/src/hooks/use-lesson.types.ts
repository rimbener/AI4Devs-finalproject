import type { Lesson, LessonsErrorCode } from '@helsoft/types';

export type UseLessonResult = {
  lesson: Lesson | null;
  isLoading: boolean;
  error: LessonsErrorCode | null;
  refetch: () => void;
};
