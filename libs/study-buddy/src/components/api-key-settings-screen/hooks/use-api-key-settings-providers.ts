import { useAiProviders } from '@helsoft/hooks';
import {
  getEnabledProviderIds,
  getProviderGuidanceUrls,
  getProviderNames,
} from '@helsoft/services';
import { useMemo } from 'react';

export const useApiKeySettingsProviders = () => {
  const { providers, isLoading } = useAiProviders();

  const enabledProviderIds = useMemo(() => getEnabledProviderIds(providers), [providers]);
  const providerNames = useMemo(() => getProviderNames(providers), [providers]);
  const guidanceUrls = useMemo(() => getProviderGuidanceUrls(providers), [providers]);

  return {
    enabledProviderIds,
    providerNames,
    guidanceUrls,
    isLoading,
  };
};
