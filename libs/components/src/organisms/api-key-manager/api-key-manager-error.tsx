import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

type ApiKeyManagerErrorProps = {
  errorMessage: string;
};

export const ApiKeyManagerError = ({ errorMessage }: ApiKeyManagerErrorProps) => {
  return (
    <View style={styles.errorBanner} accessibilityRole="alert">
      <Text style={styles.errorBannerText} accessibilityLiveRegion="assertive">
        {errorMessage}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  errorBanner: {
    backgroundColor: theme.colors.errorContainer,
    borderRadius: theme.shape.card,
    padding: theme.spacing.s3,
  },
  errorBannerText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onErrorContainer,
  },
}));
