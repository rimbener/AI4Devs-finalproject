import { hasErrorCode, toErrorCode } from './error-code.helpers';

const CODES: ReadonlySet<'network_error' | 'validation_error'> = new Set([
  'network_error',
  'validation_error',
]);

describe('hasErrorCode', () => {
  it.each([
    'network_error',
    'validation_error',
  ] as const)('returns true for a cause carrying code %s', (code) => {
    expect(hasErrorCode(CODES, { code })).toBe(true);
  });

  it('returns false for a cause with an unrecognized code', () => {
    expect(hasErrorCode(CODES, { code: 'some_other_code' })).toBe(false);
  });

  it('returns false when cause has no code property', () => {
    expect(hasErrorCode(CODES, {})).toBe(false);
  });

  it('returns false for null', () => {
    expect(hasErrorCode(CODES, null)).toBe(false);
  });

  it('returns false for a raw Error instance', () => {
    expect(hasErrorCode(CODES, new Error('boom'))).toBe(false);
  });
});

describe('toErrorCode', () => {
  it.each([
    'network_error',
    'validation_error',
  ] as const)('passes through code %s when cause carries a known code', (code) => {
    expect(toErrorCode(CODES, { code }, 'network_error')).toBe(code);
  });

  it('falls back for a raw Error instance', () => {
    expect(toErrorCode(CODES, new Error('boom'), 'network_error')).toBe('network_error');
  });

  it('falls back for null', () => {
    expect(toErrorCode(CODES, null, 'network_error')).toBe('network_error');
  });
});
