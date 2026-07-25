import type { AuthErrorCode, SignInParams } from '@helsoft/types';

export type SignInFormProps = {
  /**
   * Called with validated credentials; parent owns auth (e.g. useAuth().signIn — a
   * fire-and-forget mutation). The parent surfaces failures through the `error` prop, not
   * through a rejection.
   */
  onSignIn: (params: SignInParams) => void;
  /** True while the parent's sign-in is in flight — drives LoginForm Loading (@s3). */
  isSigningIn?: boolean;
  /** Normalized auth failure from the parent; mapped to a banner via i18n (@s5/@s6). */
  error?: AuthErrorCode | null;
  onNavigateToSignUp?: () => void;
  /** Injected so this lib stays free of AuthService / supabase-services. */
  isValidEmail: (email: string) => boolean;
};
