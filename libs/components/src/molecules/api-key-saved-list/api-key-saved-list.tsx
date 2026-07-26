import { useLocalization } from '@helsoft/localization';
import type { AiProvider } from '@helsoft/types';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Button } from '../../atoms/button/button';
import type { ApiKeySavedListProps } from './api-key-saved-list.types';

/**
 * ApiKeySavedList — masked rows for every saved provider (catalog order) with Replace/Remove.
 */
export const ApiKeySavedList = ({
  savedKeys,
  providers,
  savedProviders,
  getSavedStatusLabel,
  providerNames,
  isSubmitting = false,
  onReplace,
  onRemove,
  children,
}: ApiKeySavedListProps) => {
  const { t } = useLocalization();
  const providerLabel = (p: AiProvider) => providerNames[p];

  return (
    <>
      {providers
        .filter((p) => savedProviders.has(p))
        .map((p) => {
          const key = savedKeys.find((k) => k.provider === p);
          if (!key) return null;
          const name = providerLabel(p);
          return (
            <View key={p} style={styles.row}>
              <Text style={styles.savedStatusLabel}>{getSavedStatusLabel(p, key.updatedAt)}</Text>
              <View style={styles.actionsRow}>
                <Button
                  disabled={isSubmitting}
                  variant="outlined"
                  accessibilityLabel={`${t('settings.apiKey.replace')} ${name}`}
                  onPress={() => onReplace(p)}
                >
                  {t('settings.apiKey.replace')}
                </Button>
                <Button
                  disabled={isSubmitting}
                  variant="text"
                  accessibilityLabel={`${t('settings.apiKey.remove')} ${name}`}
                  onPress={() => onRemove(p)}
                >
                  {t('settings.apiKey.remove')}
                </Button>
              </View>
            </View>
          );
        })}
      {children}
    </>
  );
};

const styles = StyleSheet.create((theme) => ({
  row: {
    gap: theme.spacing.s2,
  },
  savedStatusLabel: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.s3,
  },
}));
