import type { LessonsErrorCode } from '@helsoft/types';

import { toErrorCode } from './error-code.helpers';

export const LESSONS_ERROR_CODES: ReadonlySet<LessonsErrorCode> = new Set([
  'network_error',
  'validation_error',
]);

export const toLessonsErrorCode = (cause: unknown): LessonsErrorCode =>
  toErrorCode(LESSONS_ERROR_CODES, cause, 'network_error');
