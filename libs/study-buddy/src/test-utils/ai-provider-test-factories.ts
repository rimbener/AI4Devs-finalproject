import { AI_PROVIDER_CATALOG_FIXTURE, type useAiProviders } from '@helsoft/hooks';

export const aiProvidersValue = (
  overrides: Partial<ReturnType<typeof useAiProviders>> = {},
): ReturnType<typeof useAiProviders> => ({
  providers: AI_PROVIDER_CATALOG_FIXTURE,
  enabledProviders: AI_PROVIDER_CATALOG_FIXTURE.filter((provider) => provider.enabled),
  isLoading: false,
  ...overrides,
});
