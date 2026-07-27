import { AI_PROVIDER_CATALOG_FIXTURE, type useAiProviders } from '@helsoft/hooks';

// Re-exported for existing consumers of this test-utils module — the catalog data itself is
// owned by `@helsoft/hooks`'s `use-ai-providers.fixture.ts`; do not hand-copy it here again.
export { AI_PROVIDER_CATALOG_FIXTURE };

export const aiProvidersValue = (
  overrides: Partial<ReturnType<typeof useAiProviders>> = {},
): ReturnType<typeof useAiProviders> => ({
  providers: AI_PROVIDER_CATALOG_FIXTURE,
  enabledProviders: AI_PROVIDER_CATALOG_FIXTURE.filter((provider) => provider.enabled),
  isLoading: false,
  ...overrides,
});
