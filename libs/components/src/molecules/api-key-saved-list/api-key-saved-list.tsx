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
  enabledProviders,
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
          const isDisabled = !enabledProviders.includes(p);
          return (
            <View key={p} style={styles.row}>
              <View style={styles.statusRow}>
                <Text style={styles.savedStatusLabel}>{getSavedStatusLabel(p, key.updatedAt)}</Text>
                {isDisabled ? (
                  // @s5/@s22 — a real text label, not a color swatch/icon alone (WCAG 1.4.1):
                  // conveyed to sighted users and assistive tech alike via its own text content.
                  <Text style={styles.disabledIndicator}>
                    {t('settings.apiKey.manager.disabled')}
                  </Text>
                ) : null}
              </View>
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.s2,
  },
  savedStatusLabel: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
  },
  // @s5/@s22 — a bordered text chip, not a color-only dot: the "Disabled" word itself is what
  // conveys the state (WCAG 1.4.1), the border/shape is purely a visual affordance on top.
  disabledIndicator: {
    ...theme.typography.labelSmall,
    color: theme.colors.onSurfaceVariant,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: theme.shape.chip,
    paddingHorizontal: theme.spacing.s2,
    paddingVertical: theme.spacing.s0,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.s3,
  },
}));
