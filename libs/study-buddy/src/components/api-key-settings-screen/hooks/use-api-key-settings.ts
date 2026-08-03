import { useApiKey, useGetApiKey } from '@helsoft/hooks';
import { useLocalization } from '@helsoft/localization';
import type { AiProvider } from '@helsoft/types';
import { useCallback } from 'react';
import { useApiKeySettingsProviders } from './use-api-key-settings-providers';

/**
 * All derived state and wiring behind `ApiKeySettingsScreen` (provider catalog, saved-key
 * status, and the add/replace/remove dialog state machine) — the screen itself stays render +
 * event wiring only (`component-split.mdc`). Provider identity, guidance links, and order come
 * from the live catalog (@s1/@s2/@s3) via `useAiProviders()`, never a hardcoded constant.
 * `useAiProviders()` degrades to an empty ordered list on a catalog read failure (Decision 11).
 */
export const useApiKeySettings = () => {
  const { t, locale } = useLocalization();

  const { status, isLoading: isLoadingApiKey } = useGetApiKey();
  const { isSubmitting, isError, errorKey, saveApiKey, removeApiKey, resetSave, resetRemove } =
    useApiKey();
  const errorMessage = errorKey ? t(errorKey) : undefined;

  const {
    enabledProviderIds,
    providerNames,
    guidanceUrls,
    isLoading: isLoadingProviders,
  } = useApiKeySettingsProviders();

  const getSavedStatusLabel = useCallback(
    (provider: AiProvider, updatedAt: string) =>
      t('settings.apiKey.savedStatus', {
        provider: providerNames[provider],
        date: new Date(updatedAt).toLocaleDateString(locale),
      }),
    [locale, providerNames, t],
  );

  return {
    enabledProviderIds,
    savedKeys: status.keys,
    providerNames,
    guidanceUrls,
    isError,
    getSavedStatusLabel,
    isSubmitting,
    errorMessage,
    isLoading: isLoadingApiKey || isLoadingProviders,
    saveApiKey,
    removeApiKey,
    resetSave,
    resetRemove,
  };
};
