import { ApiKeyManager, Button } from '@helsoft/components';
import { useApiKey, useProfile } from '@helsoft/hooks';
import { useLocalization } from '@helsoft/localization';
import type { AiProvider, ApiKeyErrorCode } from '@helsoft/types';
import { useEffect } from 'react';
import { AccessibilityInfo, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

/** Provider brand names via i18n keys. */
const PROVIDER_NAME_KEYS: Record<AiProvider, string> = {
  groq: 'settings.apiKey.provider.groq',
  openai: 'settings.apiKey.provider.openai',
  anthropic: 'settings.apiKey.provider.anthropic',
  google: 'settings.apiKey.provider.google',
  xai: 'settings.apiKey.provider.xai',
  deepseek: 'settings.apiKey.provider.deepseek',
};

/** Per-provider guidance URLs. */
const GUIDANCE_URLS: Partial<Record<AiProvider, string>> = {
  groq: 'https://console.groq.com/keys',
  openai: 'https://platform.openai.com/api-keys',
  anthropic: 'https://console.anthropic.com/settings/keys',
  google: 'https://aistudio.google.com/app/apikey',
  xai: 'https://console.x.ai',
  deepseek: 'https://platform.deepseek.com/api_keys',
};

/**
 * Maps useApiKey()'s normalized ApiKeyErrorCode to its i18n banner key (@s7/@s9).
 */
const API_KEY_ERROR_KEYS: Partial<Record<ApiKeyErrorCode, string>> = {
  network_error: 'settings.apiKey.error.network',
  validation_error: 'settings.apiKey.error.empty',
};

/**
 * ApiKeySettings — feature component wiring useApiKey()/useLocalization() to the
 * presentational ApiKeyManager. Keeps the Settings screen a thin shell.
 */
export const ApiKeySettings = () => {
  const { status, isLoading, isSubmitting, error, saveApiKey, removeApiKey } = useApiKey();
  const { profile, isLoading: isProfileLoading, error: profileError, retry } = useProfile();
  const { t, locale } = useLocalization();

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

  const getSavedStatusLabel = (provider: AiProvider, updatedAt: string) =>
    t('settings.apiKey.savedStatus', {
      provider: t(PROVIDER_NAME_KEYS[provider]),
      date: new Date(updatedAt).toLocaleDateString(locale),
    });

  const errorKey = error ? API_KEY_ERROR_KEYS[error] : undefined;
  const errorMessage = errorKey ? t(errorKey) : undefined;

  return (
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
      guidanceUrls={GUIDANCE_URLS}
      getSavedStatusLabel={getSavedStatusLabel}
      providerNameKeys={PROVIDER_NAME_KEYS}
    />
  );
};

export const apiKeySettingsStyles = StyleSheet.create((theme) => ({
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

const styles = apiKeySettingsStyles;
