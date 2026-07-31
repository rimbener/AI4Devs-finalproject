/** Raw `lesson_attempts` row (snake_case, as Supabase returns it). */
export type RawLessonAttemptRow = {
  id: string;
  lesson_id: string;
  score: number;
  total: number;
  created_at: string;
};
