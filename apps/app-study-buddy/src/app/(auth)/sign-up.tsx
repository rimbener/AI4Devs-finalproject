import { ScreenContainer } from '@helsoft/components';
import { useLocalization } from '@helsoft/localization';
import { Link } from 'expo-router';
import { Text } from 'react-native';

export default function SignUpScreen() {
  const { t } = useLocalization();

  return (
    // The Stack header already consumes the top inset.
    <ScreenContainer edges={['left', 'right', 'bottom']}>
      <Text>{t('nav.signUp')}</Text>
      <Link href="/login">
        <Text>{t('auth.toLogIn')}</Text>
      </Link>
    </ScreenContainer>
  );
}
