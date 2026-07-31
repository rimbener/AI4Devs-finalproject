import type { Lesson, LessonSummary } from '@helsoft/types';

import { LessonsDao } from '../dao/lessons.dao';
import type { RawLessonRow, RawLessonSummaryRow } from '../dao/lessons.types';

const toLessonSummary = (row: RawLessonSummaryRow): LessonSummary => ({
  id: row.id,
  title: row.title,
  createdAt: row.created_at,
});

const toLesson = (row: RawLessonRow): Lesson => ({
  id: row.id,
  title: row.title,
  slides: row.slides,
  createdAt: row.created_at,
  userId: row.user_id,
});

/**
 * Business logic over LessonsDao: validates inputs, maps raw rows, normalizes DAO failures.
 * Read-only in Slice 1 — the client never inserts lessons (Edge Function owns persist).
 */
export abstract class LessonsService {
  static async getLessons(): Promise<LessonSummary[]> {
    try {
      const rows = await LessonsDao.getLessons();
      return rows.map(toLessonSummary);
    } catch {
      throw new Error('LessonsService.getLessons: failed to load lessons');
    }
  }

  static async getLesson(id: string): Promise<Lesson> {
    if (!id.trim()) {
      return Promise.reject(new Error('LessonsService.getLesson: id must not be empty'));
    }
    try {
      return toLesson(await LessonsDao.getLessonById(id));
    } catch {
      throw new Error('LessonsService.getLesson: failed to load lesson');
    }
  }

  static async deleteLesson(id: string): Promise<void> {
    if (!id.trim()) {
      return Promise.reject(new Error('LessonsService.deleteLesson: id must not be empty'));
    }
    try {
      await LessonsDao.deleteLesson(id);
    } catch {
      throw new Error('LessonsService.deleteLesson: failed to delete lesson');
    }
  }
}
