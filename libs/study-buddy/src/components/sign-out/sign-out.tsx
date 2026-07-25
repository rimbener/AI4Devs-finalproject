import { useSignOut } from '@helsoft/hooks';
import { SignOut as SignOutView } from '@helsoft/logging-in-out';

import type { SignOutProps } from './sign-out.types';

export const SignOut = ({ open, onOpenChange, style }: SignOutProps) => {
  const { signOut, isSigningOut, error, reset } = useSignOut();

  return (
    <SignOutView
      onSignOut={signOut}
      isSigningOut={isSigningOut}
      error={error}
      onSignOutError={reset}
      open={open}
      onOpenChange={onOpenChange}
      style={style}
    />
  );
};
