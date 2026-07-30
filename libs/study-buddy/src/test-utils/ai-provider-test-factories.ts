import { AI_PROVIDER_CATALOG_FIXTURE, type useAiProviders } from '@helsoft/hooks';

export const aiProvidersValue = (
  overrides: Partial<ReturnType<typeof useAiProviders>> = {},
): ReturnType<typeof useAiProviders> => ({
  providers: AI_PROVIDER_CATALOG_FIXTURE,
  isLoading: false,
  ...overrides,
});
