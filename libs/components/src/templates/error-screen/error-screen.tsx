import { StyleSheet } from 'react-native-unistyles';

import { ErrorMessageWithRetry } from '../../molecules/error-message-with-retry/error-message-with-retry';
import { ScreenContainer } from '../screen-container/screen-container';

import type { ErrorScreenProps } from './error-screen.types';

/**
 * ErrorScreen — full-screen recoverable error. SafeAreaView via ScreenContainer;
 * copy/retry via ErrorMessageWithRetry.
 */
export const ErrorScreen = ({ edges, testID, ...errorProps }: ErrorScreenProps) => (
  <ScreenContainer edges={edges} testID={testID} style={styles.container}>
    <ErrorMessageWithRetry {...errorProps} />
  </ScreenContainer>
);

const styles = StyleSheet.create((theme) => ({
  container: {
    justifyContent: 'flex-start',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.s10,
  },
}));
