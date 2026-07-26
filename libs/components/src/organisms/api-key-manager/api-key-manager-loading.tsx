import { useLocalization } from '@helsoft/localization';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { ProgressIndicator } from '../../atoms/progress-indicator/progress-indicator';

export const ApiKeyManagerLoading = () => {
  const { t } = useLocalization();
  return (
    <View>
      <ProgressIndicator variant="circular" />
      <Text accessibilityLiveRegion="polite" style={styles.visuallyHidden}>
        {t('settings.apiKey.loadingStatus')} he
      </Text>
    </View>
  );
};

const styles = StyleSheet.create(() => ({
  visuallyHidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
  },
}));
