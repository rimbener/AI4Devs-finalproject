import { ApiKeyManager } from '@helsoft/components';
import { useAiProviders, useApiKey } from '@helsoft/hooks';
import { useLocalization } from '@helsoft/localization';
import type { AiProvider, ApiKeyErrorCode } from '@helsoft/types';
import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

/**
 * Maps useApiKey()'s normalized ApiKeyErrorCode to its i18n banner key (@s7/@s9).
 */
const API_KEY_ERROR_KEYS: Partial<Record<ApiKeyErrorCode, string>> = {
  network_error: 'error.network',
  validation_error: 'settings.apiKey.error.empty',
  // task-8, @s16 — a save against a disabled provider gets distinct copy from network_error.
  provider_disabled: 'settings.apiKey.error.providerDisabled',
};

/**
 * ApiKeySettingsScreen — dedicated API keys screen (title + ApiKeyManager). Provider identity,
 * guidance links, and order come from the live catalog (@s1/@s2/@s3) via `useAiProviders()`,
 * never a hardcoded constant. `useAiProviders()` degrades to an empty ordered list on a catalog
 * read failure (Decision 11), so this screen just keeps its existing loading affordance until
 * both the catalog and the key status settle (@s11) — no new loading UI.
 */
export const ApiKeySettingsScreen = () => {
  const { providers, enabledProviders, isLoading: isCatalogLoading } = useAiProviders();
  const {
    status,
    isLoading: isKeyLoading,
    isSubmitting,
    error,
    saveApiKey,
    removeApiKey,
  } = useApiKey();
  const { t, locale } = useLocalization();

  const providerIds = useMemo(() => providers.map((provider) => provider.id), [providers]);
  // task-6/task-7, Decision 5/12 — the catalog's enabled subset, threaded to ApiKeyManager as
  // plain ids (mirrors providerIds above): drives the saved-list's "Disabled" indicator (task-6)
  // and the add-picker's unsavedProviders filter (task-7), never re-derived from `providers`
  // downstream.
  const enabledProviderIds = useMemo(
    () => enabledProviders.map((provider) => provider.id),
    [enabledProviders],
  );
  const providerNames = useMemo(
    () =>
      Object.fromEntries(providers.map((provider) => [provider.id, provider.name])) as Record<
        AiProvider,
        string
      >,
    [providers],
  );
  const guidanceUrls = useMemo(
    () =>
      Object.fromEntries(
        providers
          .filter((provider) => provider.guidanceUrl)
          .map((provider) => [provider.id, provider.guidanceUrl as string]),
      ) as Partial<Record<AiProvider, string>>,
    [providers],
  );

  const getSavedStatusLabel = (provider: AiProvider, updatedAt: string) =>
    t('settings.apiKey.savedStatus', {
      provider: providerNames[provider],
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
        providers={providerIds}
        enabledProviders={enabledProviderIds}
        isLoading={isCatalogLoading || isKeyLoading}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
        onSave={saveApiKey}
        onRemove={removeApiKey}
        guidanceUrls={guidanceUrls}
        getSavedStatusLabel={getSavedStatusLabel}
        providerNames={providerNames}
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
