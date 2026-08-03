import { useCanCreate } from '@helsoft/hooks';
import { useLocalization } from '@helsoft/localization';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import type { ApiKeyGateProps } from './api-key-gate.types';

/**
 * ApiKeyGate — guards create/upload affordances while always mounting `children` so existing
 * lessons stay reachable (@s13). Creation is available for a platform-key plan or a learner who
 * holds a saved user key — one shared `useCanCreate()` derivation, not a local re-derivation.
 */
export const ApiKeyGate = ({ children }: ApiKeyGateProps) => {
  const { canCreate } = useCanCreate();
  const { t } = useLocalization();

  return (
    <>
      {!canCreate ? (
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
