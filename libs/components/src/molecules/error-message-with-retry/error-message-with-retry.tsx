import { useLocalization } from '@helsoft/localization';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Button } from '../../atoms/button/button';

import type { ErrorMessageWithRetryProps } from './error-message-with-retry.types';

/**
 * ErrorMessageWithRetry — alert + retry button for recoverable failures.
 * Resolves copy via optional localization keys; falls back to English defaults.
 */
export const ErrorMessageWithRetry = ({
  messageKey,
  retryKey,
  onRetry,
}: ErrorMessageWithRetryProps) => {
  const { t } = useLocalization();
  const message = messageKey ? t(messageKey) : t('general.errorMessage');
  const retryLabel = retryKey ? t(retryKey) : t('general.errorRetry');

  return (
    <View style={styles.root}>
      <Text accessibilityRole="alert" style={styles.message}>
        {message}
      </Text>
      {onRetry && <Button onPress={onRetry}>{retryLabel}</Button>}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  root: {
    gap: theme.spacing.s4,
  },
  message: {
    ...theme.typography.bodyMedium,
    color: theme.colors.error,
  },
}));
