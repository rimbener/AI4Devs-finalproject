import { useProfile } from '@helsoft/hooks';
import { useLocalization } from '@helsoft/localization';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import type { ApiKeyGateProps } from './api-key-gate.types';

/**
 * ApiKeyGate — guards create/upload affordances while always mounting `children` so existing
 * lessons stay reachable (@s13)
 * Consumers gate create/upload via `useProfile().profile?.canCreate`.
 */
export const ApiKeyGate = ({ children }: ApiKeyGateProps) => {
  const { profile } = useProfile();
  const { t } = useLocalization();

  return (
    <>
      {!profile?.canCreate ? (
        <View style={styles.gatedContent}>
          <Text accessibilityRole="alert" style={styles.cannotCreate}>
            {t('upload.cannotCreate')}
          </Text>
        </View>
      ) : null}

      {children}
    </>
  );
};

const styles = StyleSheet.create((theme) => ({
  gatedContent: {
    gap: theme.spacing.s4,
  },
  cannotCreate: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
  },
}));
