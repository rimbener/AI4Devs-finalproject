import { useLocalization } from '@helsoft/localization';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { ProgressIndicator } from '../../atoms/progress-indicator/progress-indicator';

export const SubmittingIndicator = () => {
  const { t } = useLocalization();

  return (
    <View>
      <ProgressIndicator variant="linear" />
      <Text accessibilityLiveRegion="polite" style={styles.progressLabel}>
        {t('general.saving')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  progressLabel: {
    marginTop: theme.spacing.s4,
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
  },
}));
