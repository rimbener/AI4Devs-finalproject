import type { AuthError } from '@helsoft/types';

import { AUTH_ERROR_CODES, isAuthErrorShape, toErrorCode } from './use-auth.helpers';

describe('isAuthErrorShape', () => {
  it.each([
    'invalid_credentials',
    'network_error',
    'validation_error',
  ] as const)('returns true for a cause carrying code %s', (code) => {
    const cause: AuthError = { code };

    expect(isAuthErrorShape(cause)).toBe(true);
  });

  it('returns false for a cause with an unrecognized code', () => {
    expect(isAuthErrorShape({ code: 'some_other_code' })).toBe(false);
  });

  it('returns false when cause has no code property', () => {
    expect(isAuthErrorShape({})).toBe(false);
  });

  it('returns false for null', () => {
    expect(isAuthErrorShape(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isAuthErrorShape(undefined)).toBe(false);
  });

  it('returns false for a raw Error instance', () => {
    expect(isAuthErrorShape(new Error('boom'))).toBe(false);
  });
});

describe('AUTH_ERROR_CODES', () => {
  it('contains exactly the three normalized auth error codes', () => {
    expect(AUTH_ERROR_CODES).toEqual(
      new Set(['invalid_credentials', 'network_error', 'validation_error']),
    );
  });
});

describe('toErrorCode', () => {
  it.each([
    'invalid_credentials',
    'network_error',
    'validation_error',
  ] as const)('passes through code %s when cause has AuthError shape', (code) => {
    expect(toErrorCode({ code })).toBe(code);
  });

  it('falls back to network_error for a cause with an unrecognized code', () => {
    expect(toErrorCode({ code: 'some_other_code' })).toBe('network_error');
  });

  it('falls back to network_error for a raw Error instance', () => {
    expect(toErrorCode(new Error('boom'))).toBe('network_error');
  });

  it('falls back to network_error for null', () => {
    expect(toErrorCode(null)).toBe('network_error');
  });
});
