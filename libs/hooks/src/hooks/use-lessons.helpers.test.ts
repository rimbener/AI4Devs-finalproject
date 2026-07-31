import type { LessonsError } from '@helsoft/types';

import {
  isLessonsErrorShape,
  LESSONS_ERROR_CODES,
  toLessonsErrorCode,
} from './use-lessons.helpers';

describe('isLessonsErrorShape', () => {
  it.each([
    'network_error',
    'validation_error',
  ] as const)('returns true for a cause carrying code %s', (code) => {
    const cause: LessonsError = { code };

    expect(isLessonsErrorShape(cause)).toBe(true);
  });

  it('returns false for a cause with an unrecognized code', () => {
    expect(isLessonsErrorShape({ code: 'some_other_code' })).toBe(false);
  });

  it('returns false when cause has no code property', () => {
    expect(isLessonsErrorShape({})).toBe(false);
  });

  it('returns false for null', () => {
    expect(isLessonsErrorShape(null)).toBe(false);
  });

  it('returns false for a raw Error instance', () => {
    expect(isLessonsErrorShape(new Error('boom'))).toBe(false);
  });
});

describe('LESSONS_ERROR_CODES', () => {
  it('contains exactly the two normalized lessons error codes', () => {
    expect(LESSONS_ERROR_CODES).toEqual(new Set(['network_error', 'validation_error']));
  });
});

describe('toLessonsErrorCode', () => {
  it.each([
    'network_error',
    'validation_error',
  ] as const)('passes through code %s when cause has LessonsError shape', (code) => {
    expect(toLessonsErrorCode({ code })).toBe(code);
  });

  it('falls back to network_error for a raw Error instance', () => {
    expect(toLessonsErrorCode(new Error('boom'))).toBe('network_error');
  });

  it('falls back to network_error for null', () => {
    expect(toLessonsErrorCode(null)).toBe('network_error');
  });
});
