import { useAuth } from '@helsoft/hooks';
import { SignInForm as SignInFormView } from '@helsoft/logging-in-out';
import { AuthService } from '@helsoft/supabase-services';
import { useRouter } from 'expo-router';

/**
 * App wiring: useAuth + router + AuthService.isValidEmail → prop-driven SignInFormView.
 * No navigation on success — root Stack.Protected reacts to the session change.
 */
export const SignInForm = () => {
  const { signIn, isSigningIn, error } = useAuth();
  const router = useRouter();

  return (
    <SignInFormView
      onSignIn={signIn}
      isSigningIn={isSigningIn}
      error={error}
      onNavigateToSignUp={() => router.push('/sign-up')}
      isValidEmail={AuthService.isValidEmail}
    />
  );
};
