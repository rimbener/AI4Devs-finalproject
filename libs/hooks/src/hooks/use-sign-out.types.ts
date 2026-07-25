import type { AuthErrorCode } from '@helsoft/types';

export type UseSignOutResult = {
  isSigningOut: boolean;
  error: AuthErrorCode | null;
  signOut: () => void;
  reset: () => void;
};
