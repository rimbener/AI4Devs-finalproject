import type { Lesson, LessonSummary, LessonsError, LessonsErrorCode } from '@helsoft/types';

import { LessonsDao } from '../dao/lessons.dao';
import type { RawLessonRow, RawLessonSummaryRow } from '../dao/lessons.types';
import { toTypedError } from '../utils/typed-error';

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

const toLessonsError = (code: LessonsErrorCode, message: string): Error & LessonsError =>
  toTypedError(code, message);

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
      throw toLessonsError('network_error', 'LessonsService.getLessons: failed to load lessons');
    }
  }

  static async getLesson(id: string): Promise<Lesson> {
    if (!id.trim()) {
      return Promise.reject(
        toLessonsError('validation_error', 'LessonsService.getLesson: id must not be empty'),
      );
    }
    try {
      return toLesson(await LessonsDao.getLessonById(id));
    } catch {
      throw toLessonsError('network_error', 'LessonsService.getLesson: failed to load lesson');
    }
  }

  static async deleteLesson(id: string): Promise<void> {
    if (!id.trim()) {
      return Promise.reject(
        toLessonsError('validation_error', 'LessonsService.deleteLesson: id must not be empty'),
      );
    }
    try {
      await LessonsDao.deleteLesson(id);
    } catch {
      throw toLessonsError('network_error', 'LessonsService.deleteLesson: failed to delete lesson');
    }
  }
}
