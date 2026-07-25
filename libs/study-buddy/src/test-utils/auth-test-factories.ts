import type { useAuth, useSignOut } from '@helsoft/hooks';
import type { useLocalization } from '@helsoft/localization';

/**
 * Shared `useAuth()`/`useSignOut()`/`useLocalization()` mock-return factories for study-buddy
 * unit tests.
 */
export const authValue = (overrides: Partial<ReturnType<typeof useAuth>> = {}) => ({
  signIn: jest.fn(),
  isSigningIn: false,
  error: null,
  ...overrides,
});

export const signOutValue = (overrides: Partial<ReturnType<typeof useSignOut>> = {}) => ({
  signOut: jest.fn(),
  isSigningOut: false,
  error: null,
  reset: jest.fn(),
  ...overrides,
});

export const localizationValue = (overrides: Partial<ReturnType<typeof useLocalization>> = {}) => ({
  t: (key: string) => key,
  locale: 'en' as const,
  setLocale: jest.fn(),
  supportedLocales: ['en', 'es', 'pt', 'de'] as const,
  ...overrides,
});
