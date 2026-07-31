import type { Slide } from '@helsoft/types';

/** Raw `lessons` list row (snake_case, as Supabase returns it). */
export type RawLessonSummaryRow = {
  id: string;
  title: string;
  created_at: string;
};

/** Raw full `lessons` row including the `slides` JSON column. */
export type RawLessonRow = {
  id: string;
  title: string;
  slides: Slide[];
  created_at: string;
  user_id: string;
};
