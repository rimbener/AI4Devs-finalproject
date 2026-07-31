jest.mock('@helsoft/hooks', () => ({
  ...jest.requireActual('@helsoft/hooks'),
  useAiProviders: jest.fn(),
}));

import { AI_PROVIDER_CATALOG_FIXTURE, useAiProviders } from '@helsoft/hooks';
import { renderHook } from '@testing-library/react-native';

import { useApiKeySettingsProviders } from './use-api-key-settings-providers';

const mockUseAiProviders = useAiProviders as jest.Mock;

describe('useApiKeySettingsProviders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAiProviders.mockReturnValue({
      providers: AI_PROVIDER_CATALOG_FIXTURE,
      isLoading: false,
    });
  });

  it('derives enabledProviderIds, providerNames, and guidanceUrls from the catalog', async () => {
    const { result } = await renderHook(() => useApiKeySettingsProviders());

    expect(result.current.enabledProviderIds).toEqual(
      AI_PROVIDER_CATALOG_FIXTURE.filter((p) => p.enabled).map((p) => p.id),
    );
    expect(result.current.providerNames.groq).toBe(
      AI_PROVIDER_CATALOG_FIXTURE.find((p) => p.id === 'groq')?.name,
    );
  });

  // Mutation coverage: each derived value's `useMemo(..., [providers])` must recompute when the
  // catalog itself changes on rerender, not keep serving the first render's memoized value.
  it('recomputes enabledProviderIds, providerNames, and guidanceUrls when providers changes', async () => {
    const { result, rerender } = await renderHook(() => useApiKeySettingsProviders());

    expect(result.current.enabledProviderIds).toContain('groq');

    const catalogWithDisabledGroqAndNewName = AI_PROVIDER_CATALOG_FIXTURE.map((provider) =>
      provider.id === 'groq'
        ? {
            ...provider,
            enabled: false,
            name: 'Groq (renamed)',
            guidanceUrl: 'https://example.com/groq-guidance',
          }
        : provider,
    );
    mockUseAiProviders.mockReturnValue({
      providers: catalogWithDisabledGroqAndNewName,
      isLoading: false,
    });

    await rerender(undefined);

    expect(result.current.enabledProviderIds).not.toContain('groq');
    expect(result.current.providerNames.groq).toBe('Groq (renamed)');
    expect(result.current.guidanceUrls.groq).toBe('https://example.com/groq-guidance');
  });

  it('reflects isLoading from useAiProviders', async () => {
    mockUseAiProviders.mockReturnValue({ providers: [], isLoading: true });

    const { result } = await renderHook(() => useApiKeySettingsProviders());

    expect(result.current.isLoading).toBe(true);
  });
});
