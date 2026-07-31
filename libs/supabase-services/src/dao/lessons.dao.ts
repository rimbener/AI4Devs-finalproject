import { getSupabase } from '../supabase/supabase-client';

import type { RawLessonRow, RawLessonSummaryRow } from './lessons.types';

/**
 * Raw Supabase data access for `lessons`. Read-only in Slice 1 — the Edge Function inserts;
 * the client never inserts. RLS scopes every query to `auth.uid()`; the DAO never filters by a
 * client-supplied user id (@s11).
 */
export abstract class LessonsDao {
  static async getLessons(): Promise<RawLessonSummaryRow[]> {
    const { data, error } = await getSupabase()
      .from('lessons')
      .select('id, title, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as RawLessonSummaryRow[];
  }

  /** Full lesson by id (incl. slides JSON). RLS scopes ownership — never filter by client user id. */
  static async getLessonById(id: string): Promise<RawLessonRow> {
    const { data, error } = await getSupabase()
      .from('lessons')
      .select('id, title, slides, created_at, user_id')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as RawLessonRow;
  }

  /** Deletes by id only — RLS scopes to `auth.uid()`; never filter by a client-supplied user id (@s12). */
  static async deleteLesson(id: string): Promise<void> {
    const { error } = await getSupabase().from('lessons').delete().eq('id', id);
    if (error) throw error;
  }
}
