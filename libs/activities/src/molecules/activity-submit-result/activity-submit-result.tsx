import { Button, Card } from '@helsoft/components';
import { Animated, Platform, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import type { ActivitySubmitResultProps } from './activity-submit-result.types';
import { useActivitySubmitResult } from './use-activity-submit-result';

/**
 * ActivitySubmitResult — shared activity footer.
 * The submit button stays hidden until the activity is complete (`canSubmit`),
 * then slides up from the bottom; once `hasResult` flips true the button is
 * replaced by the `children` result and scrolled into view.
 */
export const ActivitySubmitResult = ({
  submitLabel,
  canSubmit,
  onSubmit,
  hasResult,
  children,
  submitTestID,
  resultTestID,
}: ActivitySubmitResultProps) => {
  const { submitRef, resultRef, animatedStyle } = useActivitySubmitResult(hasResult, canSubmit);

  if (hasResult) {
    return (
      <Animated.View style={animatedStyle}>
        <View ref={resultRef} testID={resultTestID} collapsable={false}>
          <Card style={styles.resultContainer}>{children}</Card>
        </View>
      </Animated.View>
    );
  }

  if (!canSubmit) return null;

  return (
    <Animated.View style={animatedStyle}>
      <View ref={submitRef} collapsable={false}>
        <Card style={styles.resultContainer}>
          <Button testID={submitTestID} fullWidth onPress={onSubmit}>
            {submitLabel}
          </Button>
        </Card>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create((theme) => ({
  resultContainer: {
    marginTop: Platform.OS === 'web' ? theme.spacing.s3 : theme.spacing.s1,
  },
}));
