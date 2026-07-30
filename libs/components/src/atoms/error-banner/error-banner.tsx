import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

type ErrorBannerProps = {
  errorMessage: string;
};

export const ErrorBanner = ({ errorMessage }: ErrorBannerProps) => (
  <View style={styles.container} accessibilityRole="alert">
    <Text style={styles.text} accessibilityLiveRegion="assertive">
      {errorMessage}
    </Text>
  </View>
);

const styles = StyleSheet.create((theme) => ({
  container: {
    backgroundColor: theme.colors.errorContainer,
    borderRadius: theme.shape.card,
    padding: theme.spacing.s3,
  },
  text: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onErrorContainer,
  },
}));
