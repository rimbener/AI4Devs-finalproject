import { Button } from '@helsoft/components';
import { useProfile } from '@helsoft/hooks';
import { useLocalization } from '@helsoft/localization';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { AccessibilityInfo, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

/**
 * ApiKeySettingsSection — Settings entry: button to open the dedicated API keys screen.
 */
export const ApiKeySettingsSection = () => {
  const router = useRouter();
  const { profile, isLoading: isProfileLoading, error: profileError, retry } = useProfile();
  const { t } = useLocalization();

  useEffect(() => {
    if (isProfileLoading) {
      AccessibilityInfo.announceForAccessibility(t('entitlements.loading'));
    }
  }, [isProfileLoading, t]);

  if (isProfileLoading) {
    return (
      <Text accessibilityLiveRegion="polite" style={styles.visuallyHidden}>
        {t('entitlements.loading')}
      </Text>
    );
  }

  if (profileError) {
    return (
      <View style={styles.error}>
        <Text accessibilityRole="alert" style={styles.errorMessage}>
          {t('entitlements.error.message')}
        </Text>
        <Button onPress={retry}>{t('entitlements.error.retry')}</Button>
      </View>
    );
  }

  if (!profile?.showKeySettings) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('settings.apiKey.title')}</Text>
      <Button onPress={() => router.push('/settings/api-keys')}>
        {t('settings.apiKey.showSettings')}
      </Button>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  section: {
    marginBottom: theme.spacing.s6,
    gap: theme.spacing.s4,
  },
  sectionTitle: {
    ...theme.typography.titleMedium,
    color: theme.colors.onSurface,
  },
  error: {
    gap: theme.spacing.s4,
  },
  errorMessage: {
    ...theme.typography.bodyMedium,
    color: theme.colors.error,
  },
  visuallyHidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
  },
}));
