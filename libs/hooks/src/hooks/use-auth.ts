import { AuthService } from '@helsoft/supabase-services';
import type { SignInParams } from '@helsoft/types';
import { useMutation } from '@tanstack/react-query';

import { toErrorCode } from './use-auth.helpers';
import type { UseAuthResult } from './use-auth.types';

export const useAuth = (): UseAuthResult => {
  const {
    mutate: signIn,
    isPending: isSigningIn,
    error: signInError,
  } = useMutation({
    mutationFn: (params: SignInParams) => AuthService.signIn(params.email, params.password),
  });

  return {
    signIn,
    isSigningIn,
    error: signInError ? toErrorCode(signInError) : null,
  };
};
