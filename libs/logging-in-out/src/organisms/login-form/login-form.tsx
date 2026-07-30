import { Button, ProgressIndicator, TextField } from '@helsoft/components';
import {
  LOGIN_EMAIL_FIELD_TEST_ID,
  LOGIN_PASSWORD_FIELD_TEST_ID,
  LOGIN_SUBMIT_BUTTON_TEST_ID,
} from '@helsoft/logging-in-out/test-ids';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import type { LoginFormProps } from './login-form.types';
import { useLoginForm } from './use-login-form';

const SUBMIT_SPINNER_SIZE = 18;
const SUBMIT_SPINNER_THICKNESS = 2;
/** testID for the Loading-state affordance (@s3) — the a11y announcement lives on the live-region Text node and the AccessibilityInfo call in the hook. */
export const LOADING_INDICATOR_TEST_ID = 'login-form-loading-indicator';

/**
 * LoginForm — presentational organism (Content + Loading states). Pure/controlled:
 * owns only the local field values, reports submissions up via `onSubmit`.
 * Chrome copy comes from `useLocalization` (`auth.*` keys); error/field messages stay injected.
 */
export const LoginForm = ({
  onSubmit,
  isSubmitting = false,
  onNavigateToSignUp,
  errorMessage,
  emailError,
  passwordError,
  onEmailChange,
}: LoginFormProps) => {
  const { t, email, password, setEmail, setPassword, isPristine, hasFieldError } = useLoginForm({
    isSubmitting,
    errorMessage,
    emailError,
    passwordError,
  });

  const canSubmit = !isSubmitting && !isPristine && !hasFieldError;
  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({ email, password });
  };

  return (
    <View style={styles.form}>
      {errorMessage ? (
        <View style={styles.errorBanner} accessibilityRole="alert">
          <Text style={styles.errorBannerText} accessibilityLiveRegion="assertive">
            {errorMessage}
          </Text>
        </View>
      ) : null}
      <TextField
        testID={LOGIN_EMAIL_FIELD_TEST_ID}
        label={t('auth.email')}
        accessibilityLabel={t('auth.email')}
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          onEmailChange?.(value);
        }}
        disabled={isSubmitting}
        accessibilityState={{ disabled: isSubmitting }}
        autoCapitalize="none"
        keyboardType="email-address"
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
        error={!!emailError}
        supportingText={emailError}
        accessibilityHint={emailError}
      />
      <TextField
        testID={LOGIN_PASSWORD_FIELD_TEST_ID}
        label={t('auth.password')}
        accessibilityLabel={t('auth.password')}
        value={password}
        onChangeText={setPassword}
        disabled={isSubmitting}
        accessibilityState={{ disabled: isSubmitting }}
        secureTextEntry
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
        error={!!passwordError}
        supportingText={passwordError}
        accessibilityHint={passwordError}
      />
      <View style={styles.submitRow}>
        <Button testID={LOGIN_SUBMIT_BUTTON_TEST_ID} disabled={!canSubmit} onPress={handleSubmit}>
          {t('auth.submit')}
        </Button>
        {isSubmitting ? (
          <View testID={LOADING_INDICATOR_TEST_ID}>
            <ProgressIndicator
              variant="circular"
              size={SUBMIT_SPINNER_SIZE}
              thickness={SUBMIT_SPINNER_THICKNESS}
            />
            <Text accessibilityLiveRegion="polite" style={styles.visuallyHidden}>
              {t('auth.signingIn')}
            </Text>
          </View>
        ) : null}
      </View>
      {onNavigateToSignUp ? (
        <Button variant="text" onPress={onNavigateToSignUp}>
          {t('auth.toSignUp')}
        </Button>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  form: {
    gap: theme.spacing.s4,
    width: '100%',
    maxWidth: theme.layout.contentReading,
    alignSelf: 'center',
  },
  submitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s3,
  },
  errorBanner: {
    backgroundColor: theme.colors.errorContainer,
    borderRadius: theme.shape.card,
    padding: theme.spacing.s3,
  },
  errorBannerText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onErrorContainer,
  },
  /** Off-screen but still mounted, so screen readers pick up the live-region announcement. */
  visuallyHidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
  },
}));
