import type { AuthError, AuthErrorCode } from '@helsoft/types';

export const AUTH_ERROR_CODES: ReadonlySet<AuthErrorCode> = new Set([
  'invalid_credentials',
  'network_error',
  'validation_error',
]);

export const isAuthErrorShape = (cause: unknown): cause is AuthError =>
  AUTH_ERROR_CODES.has((cause as { code?: unknown } | null)?.code as AuthErrorCode);

export const toErrorCode = (cause: unknown): AuthErrorCode =>
  isAuthErrorShape(cause) ? cause.code : 'network_error';
