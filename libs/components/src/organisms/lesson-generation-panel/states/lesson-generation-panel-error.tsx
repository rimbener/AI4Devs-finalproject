import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Button } from '../../../atoms/button/button';
import { LessonGenerationPanelControls } from '../components/lesson-generation-panel-controls';
import { useLessonGenerationPanel } from '../lesson-generation-panel.context';

export const LessonGenerationPanelError = () => {
  const { errorMessage, errorActionLabel, onErrorAction } = useLessonGenerationPanel();

  return (
    <>
      <LessonGenerationPanelControls />
      <View style={styles.errorBanner} accessibilityRole="alert">
        <Text style={styles.errorBannerText} accessibilityLiveRegion="assertive">
          {errorMessage}
        </Text>
        {errorActionLabel ? <Button onPress={onErrorAction}>{errorActionLabel}</Button> : null}
      </View>
    </>
  );
};

const styles = StyleSheet.create((theme) => ({
  errorBanner: {
    gap: theme.spacing.s3,
    backgroundColor: theme.colors.errorContainer,
    borderRadius: theme.shape.card,
    padding: theme.spacing.s3,
  },
  errorBannerText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onErrorContainer,
  },
}));
