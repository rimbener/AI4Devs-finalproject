import { LESSONS_ERROR_CODES, toLessonsErrorCode } from './use-lessons.helpers';

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
