import { useLocalization } from '@helsoft/localization';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

type ApiKeyManagerEmptyProps = {
  children: React.ReactNode;
};
export const ApiKeyManagerEmpty = ({ children }: ApiKeyManagerEmptyProps) => {
  const { t } = useLocalization();

  return (
    <View style={styles.empty}>
      <Text style={styles.emptyMessage}>{t('settings.apiKey.manager.emptyMessage')}</Text>
      {children}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  empty: {
    gap: theme.spacing.s4,
  },
  emptyMessage: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
  },
}));
