import type { LessonsError, LessonsErrorCode } from '@helsoft/types';

export const LESSONS_ERROR_CODES: ReadonlySet<LessonsErrorCode> = new Set([
  'network_error',
  'validation_error',
]);

export const isLessonsErrorShape = (cause: unknown): cause is LessonsError =>
  LESSONS_ERROR_CODES.has((cause as { code?: unknown } | null)?.code as LessonsErrorCode);

export const toLessonsErrorCode = (cause: unknown): LessonsErrorCode =>
  isLessonsErrorShape(cause) ? cause.code : 'network_error';
