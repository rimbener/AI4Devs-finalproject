import { ScreenContainer } from '@helsoft/components';
import { SignInForm } from '@helsoft/study-buddy';

export default function LoginScreen() {
  return (
    // The Stack header already consumes the top inset.
    <ScreenContainer edges={['left', 'right', 'bottom']}>
      <SignInForm />
    </ScreenContainer>
  );
}
