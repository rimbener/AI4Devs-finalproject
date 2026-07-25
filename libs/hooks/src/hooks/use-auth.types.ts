import type { AuthErrorCode, SignInParams } from '@helsoft/types';

export type UseAuthResult = {
  isSigningIn: boolean;
  error: AuthErrorCode | null;
  signIn: (params: SignInParams) => void;
};
