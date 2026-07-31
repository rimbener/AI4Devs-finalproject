import type { NewLessonAttempt } from '@helsoft/types';

import { getSupabase } from '../supabase/supabase-client';

import type { RawLessonAttemptRow } from './lesson-attempt.types';

/**
 * Raw Supabase data access for `lesson_attempts`. Insert-only — no update/delete path;
 * `user_id` is never sent from the client (the column default + RLS `with check` set/enforce it).
 */
export abstract class LessonAttemptDao {
  static async insertAttempt(input: NewLessonAttempt): Promise<RawLessonAttemptRow> {
    const { data, error } = await getSupabase()
      .from('lesson_attempts')
      .insert({ lesson_id: input.lessonId, score: input.score, total: input.total })
      .select()
      .single();
    if (error) throw error;
    return data as RawLessonAttemptRow;
  }
}
