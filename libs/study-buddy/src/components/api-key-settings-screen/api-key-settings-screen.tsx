import { ApiKeyManager } from '@helsoft/components';
import { useApiKey } from '@helsoft/hooks';
import { useLocalization } from '@helsoft/localization';
import {
  type AiProvider,
  API_KEY_SETTINGS_GUIDANCE_URLS,
  type ApiKeyErrorCode,
  PROVIDER_NAME_KEYS,
} from '@helsoft/types';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

/**
 * Maps useApiKey()'s normalized ApiKeyErrorCode to its i18n banner key (@s7/@s9).
 */
const API_KEY_ERROR_KEYS: Partial<Record<ApiKeyErrorCode, string>> = {
  network_error: 'error.network',
  validation_error: 'settings.apiKey.error.empty',
};

/**
 * ApiKeySettingsScreen — dedicated API keys screen (title + ApiKeyManager).
 */
export const ApiKeySettingsScreen = () => {
  const { status, isLoading, isSubmitting, error, saveApiKey, removeApiKey } = useApiKey();
  const { t, locale } = useLocalization();

  const getSavedStatusLabel = (provider: AiProvider, updatedAt: string) =>
    t('settings.apiKey.savedStatus', {
      provider: t(PROVIDER_NAME_KEYS[provider]),
      date: new Date(updatedAt).toLocaleDateString(locale),
    });

  const errorKey = error ? API_KEY_ERROR_KEYS[error] : undefined;
  const errorMessage = errorKey ? t(errorKey) : undefined;

  return (
    <View style={styles.screen}>
      <Text accessibilityRole="header" style={styles.title}>
        {t('settings.apiKey.screenTitle')}
      </Text>
      <ApiKeyManager
        savedKeys={status.keys}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
        onSave={(provider, rawKey) => {
          void saveApiKey(provider, rawKey).catch(() => {});
        }}
        onRemove={(provider) => {
          void removeApiKey(provider).catch(() => {});
        }}
        guidanceUrls={API_KEY_SETTINGS_GUIDANCE_URLS}
        getSavedStatusLabel={getSavedStatusLabel}
        providerNameKeys={PROVIDER_NAME_KEYS}
      />
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  screen: {
    gap: theme.spacing.s4,
  },
  title: {
    ...theme.typography.titleLarge,
    color: theme.colors.onSurface,
  },
}));
