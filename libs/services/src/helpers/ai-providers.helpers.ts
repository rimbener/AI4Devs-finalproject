import type { AiProvider, AiProviderCatalogEntry } from '@helsoft/types';

export const getEnabledProviders = (providers: AiProviderCatalogEntry[]) => {
  return providers.filter((p) => p.enabled);
};

export const getEnabledProviderIds = (providers: AiProviderCatalogEntry[]) => {
  return getEnabledProviders(providers).map((provider) => provider.id);
};

export const getProviderNames = (providers: AiProviderCatalogEntry[]) => {
  return Object.fromEntries(providers.map((provider) => [provider.id, provider.name])) as Record<
    AiProvider,
    string
  >;
};

export const getProviderGuidanceUrls = (providers: AiProviderCatalogEntry[]) => {
  return Object.fromEntries(
    providers
      .filter((provider) => provider.guidanceUrl)
      .map((provider) => [provider.id, provider.guidanceUrl as string]),
  ) as Partial<Record<AiProvider, string>>;
};
