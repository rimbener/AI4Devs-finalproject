import { AuthService } from '@helsoft/supabase-services';
import { useMutation } from '@tanstack/react-query';
import { toErrorCode } from './use-auth.helpers';
import type { UseSignOutResult } from './use-sign-out.types';

export const useSignOut = (): UseSignOutResult => {
  const {
    mutate: signOut,
    isPending: isSigningOut,
    error,
    reset,
  } = useMutation({
    mutationFn: () => AuthService.signOut(),
  });

  return {
    signOut,
    isSigningOut,
    error: error ? toErrorCode(error) : null,
    reset,
  };
};
