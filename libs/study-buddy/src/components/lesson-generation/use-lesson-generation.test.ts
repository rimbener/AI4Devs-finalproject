// @ts-nocheck
jest.mock('@helsoft/services', () => ({
  ...jest.requireActual('@helsoft/services'),
  GenerationPreferenceService: {
    getStoredPreference: jest.fn(),
    setStoredPreference: jest.fn(),
  },
}));

jest.mock('@helsoft/hooks', () => ({
  ...jest.requireActual('@helsoft/hooks'),
  useAiProviders: jest.fn(),
  useApiKey: jest.fn(),
  useProfile: jest.fn(),
}));

import { AI_PROVIDER_CATALOG_FIXTURE, useAiProviders, useApiKey, useProfile } from '@helsoft/hooks';
import { GenerationPreferenceService } from '@helsoft/services';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { aiProvidersValue } from '../../test-utils/ai-provider-test-factories';
import { useLessonGenerationForm } from './use-lesson-generation';

const mockUseAiProviders = useAiProviders as jest.Mock;
const mockUseApiKey = useApiKey as jest.Mock;
const mockUseProfile = useProfile as jest.Mock;
const mockGetStoredPreference = GenerationPreferenceService.getStoredPreference as jest.Mock;
// @s19 regression: the fixture-pinned catalog ids, in canonical order — replaces the deleted
// hardcoded provider-id constant this test used to diff against (task-11).
const CATALOG_PROVIDER_IDS = AI_PROVIDER_CATALOG_FIXTURE.map((entry) => entry.id);

describe('useLessonGenerationForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetStoredPreference.mockResolvedValue(null);
    mockUseAiProviders.mockReturnValue(aiProvidersValue());
    mockUseProfile.mockReturnValue({
      profile: { keySource: 'user', canCreate: false },
    });
    mockUseApiKey.mockReturnValue({
      status: { keys: [] },
      hasKey: false,
    });
  });

  // @s19 — today's six seeded providers (backend gherkin-scenarios.md @s5) regress zero:
  // fixture-driven savedProviders/modelOptions match today's pre-migration hardcoded
  // provider/model order and content exactly, provider by provider.
  it('matches the seeded catalog fixture order and content for every provider (@s19)', async () => {
    mockUseAiProviders.mockReturnValue({
      providers: AI_PROVIDER_CATALOG_FIXTURE,
      enabledProviders: AI_PROVIDER_CATALOG_FIXTURE,
      isLoading: false,
    });
    mockUseApiKey.mockReturnValue({
      status: {
        keys: CATALOG_PROVIDER_IDS.map((provider) => ({ provider, updatedAt: '2026-01-01' })),
      },
      hasKey: true,
    });

    const { result } = await renderHook(() =>
      useLessonGenerationForm({ documentId: 'doc-1', composition: 'both' }),
    );

    await waitFor(() => expect(result.current.selectedProvider).toBeDefined());

    expect(result.current.savedProviders).toEqual(
      AI_PROVIDER_CATALOG_FIXTURE.map((entry) => ({ id: entry.id, name: entry.name })),
    );
    expect(result.current.savedProviders.map((provider) => provider.id)).toEqual(
      CATALOG_PROVIDER_IDS,
    );

    for (const provider of AI_PROVIDER_CATALOG_FIXTURE) {
      await act(async () => {
        result.current.selectProvider(provider.id);
      });

      expect(result.current.modelOptions).toEqual(
        provider.models.map((model) => ({ id: model.modelId, label: model.label })),
      );
    }
  });

  // task-7/task-9, @s9 — a disabled provider is excluded from the generate-flow picker even when
  // the learner holds a saved key for it (Decision 5's asymmetry vs. task-6's settings list).
  it('excludes a disabled provider from savedProviders even when a key exists (@s9)', async () => {
    const catalogWithDisabledGroq = aiProvidersValue().providers.map((provider) =>
      provider.id === 'groq' ? { ...provider, enabled: false } : provider,
    );
    mockUseAiProviders.mockReturnValue(
      aiProvidersValue({
        providers: catalogWithDisabledGroq,
        enabledProviders: catalogWithDisabledGroq.filter((provider) => provider.enabled),
      }),
    );
    mockUseApiKey.mockReturnValue({
      status: { keys: [{ provider: 'groq', updatedAt: '2026-01-01' }] },
      hasKey: true,
    });

    const { result } = await renderHook(() =>
      useLessonGenerationForm({ documentId: 'doc-1', composition: 'both' }),
    );

    await waitFor(() => expect(result.current.showPickers).toBe(false));
    expect(result.current.savedProviders).toEqual([]);
    // hasKey reflects "holds any key at all" (useApiKey, unrelated to the catalog) — still true
    // here, so the missing-key gate itself is unaffected by the provider being disabled.
    expect(result.current.showMissingKeyGate).toBe(false);
  });

  // task-9, @s9 — a disabled provider is excluded from savedProviders even alongside another,
  // still-enabled saved provider.
  it('keeps an enabled saved provider while excluding a disabled one from the same list', async () => {
    const catalogWithDisabledGroq = aiProvidersValue().providers.map((provider) =>
      provider.id === 'groq' ? { ...provider, enabled: false } : provider,
    );
    mockUseAiProviders.mockReturnValue(
      aiProvidersValue({
        providers: catalogWithDisabledGroq,
        enabledProviders: catalogWithDisabledGroq.filter((provider) => provider.enabled),
      }),
    );
    mockUseApiKey.mockReturnValue({
      status: {
        keys: [
          { provider: 'groq', updatedAt: '2026-01-01' },
          { provider: 'openai', updatedAt: '2026-01-02' },
        ],
      },
      hasKey: true,
    });

    const { result } = await renderHook(() =>
      useLessonGenerationForm({ documentId: 'doc-1', composition: 'both' }),
    );

    await waitFor(() =>
      expect(result.current.savedProviders).toEqual([{ id: 'openai', name: 'OpenAI' }]),
    );
  });

  // @s16 — free-BYOK without keys exposes missing-key gate and blocks generate body.
  it('sets showMissingKeyGate and omits provider/model from the generate request', async () => {
    const { result } = await renderHook(() =>
      useLessonGenerationForm({ documentId: 'doc-1', composition: 'both' }),
    );

    expect(result.current.showMissingKeyGate).toBe(true);
    expect(result.current.showPickers).toBe(false);
    expect(result.current.canGenerate).toBe(false);
    expect(result.current.buildGenerateRequest()).toBeNull();
  });

  // s3 (task-3, re-exercised here) — savedProviders carries the catalog's plain display name,
  // in catalog order, not an AiProvider[] of bare ids.
  it('exposes savedProviders as { id, name } pairs in catalog order', async () => {
    mockUseApiKey.mockReturnValue({
      status: {
        keys: [
          { provider: 'openai', updatedAt: '2026-01-02' },
          { provider: 'groq', updatedAt: '2026-01-01' },
        ],
      },
      hasKey: true,
    });

    const { result } = await renderHook(() =>
      useLessonGenerationForm({ documentId: 'doc-1', composition: 'both' }),
    );

    await waitFor(() => expect(result.current.selectedProvider).toBeDefined());

    expect(result.current.savedProviders).toEqual([
      { id: 'groq', name: 'Groq' },
      { id: 'openai', name: 'OpenAI' },
    ]);
  });

  // @s11 — switching provider resets model via selectProvider.
  it('selectProvider resets model to the first curated model', async () => {
    mockUseApiKey.mockReturnValue({
      status: {
        keys: [
          { provider: 'groq', updatedAt: '2026-01-01' },
          { provider: 'openai', updatedAt: '2026-01-02' },
        ],
      },
      hasKey: true,
    });

    const { result } = await renderHook(() =>
      useLessonGenerationForm({ documentId: 'doc-1', composition: 'both' }),
    );

    await waitFor(() => {
      expect(result.current.selectedProvider).toBe('groq');
    });

    await act(async () => {
      result.current.selectProvider('openai');
    });

    expect(result.current.selectedProvider).toBe('openai');
    expect(result.current.selectedModel).toBe('gpt-5.6-luna');
  });

  // @s4/@s10 — modelOptions for the selected provider come from that provider's catalog entry,
  // in sortOrder, with label as a plain string (no labelKey).
  it('exposes modelOptions from the selected provider catalog entry', async () => {
    mockUseApiKey.mockReturnValue({
      status: { keys: [{ provider: 'groq', updatedAt: '2026-01-01' }] },
      hasKey: true,
    });

    const { result } = await renderHook(() =>
      useLessonGenerationForm({ documentId: 'doc-1', composition: 'both' }),
    );

    await waitFor(() => expect(result.current.selectedProvider).toBe('groq'));

    expect(result.current.modelOptions).toEqual([
      { id: 'openai/gpt-oss-20b', label: 'GPT-OSS 20B' },
      { id: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B' },
      { id: 'qwen/qwen3.6-27b', label: 'Qwen 3.6 27B' },
    ]);
  });

  // @s10 — a model added to the provider's catalog entry appears with no other change.
  it('reflects a newly added model in modelOptions with no app update', async () => {
    const catalogWithNewModel = aiProvidersValue().providers.map((provider) =>
      provider.id === 'groq'
        ? {
            ...provider,
            models: [
              ...provider.models,
              {
                modelId: 'openai/gpt-oss-brand-new',
                label: 'Brand New Model',
                vision: false,
                isVisionDefault: false,
                sortOrder: 4,
              },
            ],
          }
        : provider,
    );
    mockUseAiProviders.mockReturnValue(
      aiProvidersValue({
        providers: catalogWithNewModel,
        enabledProviders: catalogWithNewModel,
      }),
    );
    mockUseApiKey.mockReturnValue({
      status: { keys: [{ provider: 'groq', updatedAt: '2026-01-01' }] },
      hasKey: true,
    });

    const { result } = await renderHook(() =>
      useLessonGenerationForm({ documentId: 'doc-1', composition: 'both' }),
    );

    await waitFor(() => expect(result.current.selectedProvider).toBe('groq'));

    expect(result.current.modelOptions).toEqual(
      expect.arrayContaining([{ id: 'openai/gpt-oss-brand-new', label: 'Brand New Model' }]),
    );
  });

  // @s20 — valid stored preference preselects provider and model on open.
  it('preselects a valid stored provider and model on open', async () => {
    mockGetStoredPreference.mockResolvedValue({
      provider: 'openai',
      model: 'gpt-5.6-terra',
    });
    mockUseApiKey.mockReturnValue({
      status: {
        keys: [
          { provider: 'groq', updatedAt: '2026-01-01' },
          { provider: 'openai', updatedAt: '2026-01-02' },
        ],
      },
      hasKey: true,
    });

    const { result } = await renderHook(() =>
      useLessonGenerationForm({ documentId: 'doc-1', composition: 'both' }),
    );

    await waitFor(() => {
      expect(result.current.selectedProvider).toBe('openai');
      expect(result.current.selectedModel).toBe('gpt-5.6-terra');
    });
  });

  // @s21 — deleted-key preference falls back to first saved provider + first curated model.
  it('falls back when the stored provider key was deleted', async () => {
    mockGetStoredPreference.mockResolvedValue({
      provider: 'anthropic',
      model: 'claude-haiku-4-5',
    });
    mockUseApiKey.mockReturnValue({
      status: {
        keys: [
          { provider: 'groq', updatedAt: '2026-01-01' },
          { provider: 'openai', updatedAt: '2026-01-02' },
        ],
      },
      hasKey: true,
    });

    const { result } = await renderHook(() =>
      useLessonGenerationForm({ documentId: 'doc-1', composition: 'both' }),
    );

    await waitFor(() => {
      expect(result.current.selectedProvider).toBe('groq');
      expect(result.current.selectedModel).toBe('openai/gpt-oss-20b');
    });
  });

  // @s21 — retired model falls back quietly.
  it('falls back when the stored model is no longer in the catalog entry', async () => {
    mockGetStoredPreference.mockResolvedValue({
      provider: 'openai',
      model: 'retired-model',
    });
    mockUseApiKey.mockReturnValue({
      status: {
        keys: [
          { provider: 'groq', updatedAt: '2026-01-01' },
          { provider: 'openai', updatedAt: '2026-01-02' },
        ],
      },
      hasKey: true,
    });

    const { result } = await renderHook(() =>
      useLessonGenerationForm({ documentId: 'doc-1', composition: 'both' }),
    );

    await waitFor(() => {
      expect(result.current.selectedProvider).toBe('groq');
      expect(result.current.selectedModel).toBe('openai/gpt-oss-20b');
    });
  });

  // @s21 — missing/corrupt preference falls back without crashing.
  it('falls back when no preference is stored', async () => {
    mockGetStoredPreference.mockResolvedValue(null);
    mockUseApiKey.mockReturnValue({
      status: {
        keys: [{ provider: 'openai', updatedAt: '2026-01-02' }],
      },
      hasKey: true,
    });

    const { result } = await renderHook(() =>
      useLessonGenerationForm({ documentId: 'doc-1', composition: 'both' }),
    );

    await waitFor(() => {
      expect(result.current.selectedProvider).toBe('openai');
      expect(result.current.selectedModel).toBe('gpt-5.6-luna');
    });
  });

  // Engineering review — block Generate until async picker preselect finishes (@s20 race).
  it('blocks canGenerate until picker preselect completes', async () => {
    let resolvePref!: (value: null) => void;
    mockGetStoredPreference.mockReturnValue(
      new Promise<null>((resolve) => {
        resolvePref = resolve;
      }),
    );
    mockUseApiKey.mockReturnValue({
      status: {
        keys: [{ provider: 'groq', updatedAt: '2026-01-01' }],
      },
      hasKey: true,
    });

    const { result } = await renderHook(() =>
      useLessonGenerationForm({ documentId: 'doc-1', composition: 'both' }),
    );

    expect(result.current.showPickers).toBe(true);
    expect(result.current.canGenerate).toBe(false);
    expect(result.current.buildGenerateRequest()).toEqual({
      documentId: 'doc-1',
      composition: 'both',
    });

    await act(async () => {
      resolvePref(null);
    });

    await waitFor(() => {
      expect(result.current.selectedProvider).toBe('groq');
      expect(result.current.canGenerate).toBe(true);
    });
    expect(result.current.buildGenerateRequest()).toEqual({
      documentId: 'doc-1',
      composition: 'both',
      provider: 'groq',
      model: 'openai/gpt-oss-20b',
    });
  });

  it('ignores a stale preference load after savedProviders changes', async () => {
    let resolvePref!: (value: { provider: string; model: string }) => void;
    mockGetStoredPreference.mockReturnValue(
      new Promise((resolve) => {
        resolvePref = resolve;
      }),
    );
    mockUseApiKey.mockReturnValue({
      status: {
        keys: [{ provider: 'groq', updatedAt: '2026-01-01' }],
      },
      hasKey: true,
    });

    const { result, rerender } = await renderHook(
      ({ documentId }: { documentId?: string }) =>
        useLessonGenerationForm({ documentId, composition: 'both' }),
      { initialProps: { documentId: 'doc-1' } },
    );

    mockUseApiKey.mockReturnValue({
      status: {
        keys: [{ provider: 'openai', updatedAt: '2026-01-02' }],
      },
      hasKey: true,
    });
    await rerender({ documentId: 'doc-1' });

    await act(async () => {
      resolvePref({ provider: 'groq', model: 'openai/gpt-oss-20b' });
    });

    await waitFor(() => {
      expect(result.current.selectedProvider).toBe('openai');
    });
  });

  it('blocks canGenerate until both provider and model are selected', async () => {
    mockGetStoredPreference.mockResolvedValue(null);
    mockUseApiKey.mockReturnValue({
      status: {
        keys: [{ provider: 'groq', updatedAt: '2026-01-01' }],
      },
      hasKey: true,
    });

    const { result } = await renderHook(() =>
      useLessonGenerationForm({ documentId: 'doc-1', composition: 'both' }),
    );

    await waitFor(() => expect(result.current.selectedProvider).toBe('groq'));

    await act(async () => {
      result.current.setSelectedModel(undefined);
    });

    expect(result.current.canGenerate).toBe(false);

    await act(async () => {
      result.current.setSelectedModel('openai/gpt-oss-20b');
    });

    expect(result.current.canGenerate).toBe(true);
  });

  it('does not load a stored preference when pickers are hidden', async () => {
    mockUseProfile.mockReturnValue({
      profile: { keySource: 'platform', canCreate: true },
    });
    mockUseApiKey.mockReturnValue({
      status: {
        keys: [{ provider: 'groq', updatedAt: '2026-01-01' }],
      },
      hasKey: true,
    });

    await renderHook(() => useLessonGenerationForm({ documentId: 'doc-1', composition: 'both' }));

    expect(mockGetStoredPreference).not.toHaveBeenCalled();
  });

  it('omits provider and model from the generate request when the model is cleared', async () => {
    mockGetStoredPreference.mockResolvedValue(null);
    mockUseApiKey.mockReturnValue({
      status: {
        keys: [{ provider: 'groq', updatedAt: '2026-01-01' }],
      },
      hasKey: true,
    });

    const { result } = await renderHook(() =>
      useLessonGenerationForm({ documentId: 'doc-1', composition: 'both' }),
    );

    await waitFor(() => expect(result.current.selectedProvider).toBe('groq'));

    await act(async () => {
      result.current.setSelectedModel(undefined);
    });

    expect(result.current.buildGenerateRequest()).toEqual({
      documentId: 'doc-1',
      composition: 'both',
    });
  });

  // Mutation: `profile?.keySource` → `profile.keySource` — a missing profile must not throw.
  it('does not throw and treats isFreeByok as false when profile is undefined', async () => {
    mockUseProfile.mockReturnValue({ profile: undefined });

    const { result } = await renderHook(() =>
      useLessonGenerationForm({ documentId: 'doc-1', composition: 'both' }),
    );

    expect(result.current.showPickers).toBe(false);
    expect(result.current.showMissingKeyGate).toBe(false);
  });

  // Mutation: `entry.models.map(...) : []` → `: ["Stryker was here"]` — no selected provider yet
  // must yield a real empty array, not a placeholder-filled one.
  it('exposes an empty modelOptions array before any provider is selected', async () => {
    mockUseProfile.mockReturnValue({
      profile: { keySource: 'platform', canCreate: true },
    });

    const { result } = await renderHook(() =>
      useLessonGenerationForm({ documentId: 'doc-1', composition: 'both' }),
    );

    expect(result.current.selectedProvider).toBeUndefined();
    expect(result.current.modelOptions).toEqual([]);
  });

  // Mutation: `showPickers && selectedProvider && selectedModel` in buildGenerateRequest →
  // `showPickers || (...)`/`true`. `selectProvider` sets provider/model regardless of
  // showPickers, so a platform (non-BYOK) user with a saved key can force provider+model truthy
  // while showPickers stays false — the only combination that tells `&&` apart from `||`.
  it('omits provider and model from the generate request when showPickers is false even if selectProvider was called', async () => {
    mockUseProfile.mockReturnValue({
      profile: { keySource: 'platform', canCreate: true },
    });
    mockUseApiKey.mockReturnValue({
      status: { keys: [{ provider: 'groq', updatedAt: '2026-01-01' }] },
      hasKey: true,
    });

    const { result } = await renderHook(() =>
      useLessonGenerationForm({ documentId: 'doc-1', composition: 'both' }),
    );

    expect(result.current.showPickers).toBe(false);

    await act(async () => {
      result.current.selectProvider('groq');
    });

    expect(result.current.selectedProvider).toBe('groq');
    expect(result.current.selectedModel).toBe('openai/gpt-oss-20b');
    expect(result.current.buildGenerateRequest()).toEqual({
      documentId: 'doc-1',
      composition: 'both',
    });
  });

  // Mutation: `entry?.models[0]?.modelId`'s FIRST `?.` — selecting a provider absent from
  // savedProviderEntries (no `entry`) must not throw and must clear the model.
  it('does not throw and clears the model when selectProvider is called with an unsaved provider', async () => {
    mockUseApiKey.mockReturnValue({
      status: { keys: [{ provider: 'groq', updatedAt: '2026-01-01' }] },
      hasKey: true,
    });

    const { result } = await renderHook(() =>
      useLessonGenerationForm({ documentId: 'doc-1', composition: 'both' }),
    );

    await waitFor(() => expect(result.current.selectedProvider).toBe('groq'));

    await act(async () => {
      result.current.selectProvider('openai');
    });

    expect(result.current.selectedProvider).toBe('openai');
    expect(result.current.selectedModel).toBeUndefined();
  });

  // Mutation: `entry?.models[0]?.modelId`'s SECOND `?.` — a saved provider with no catalog
  // models must not throw and must clear the model.
  it('does not throw and clears the model when the selected provider has no models', async () => {
    const catalogWithEmptyModels = aiProvidersValue().providers.map((provider) =>
      provider.id === 'groq' ? { ...provider, models: [] } : provider,
    );
    mockUseAiProviders.mockReturnValue(
      aiProvidersValue({
        providers: catalogWithEmptyModels,
        enabledProviders: catalogWithEmptyModels,
      }),
    );
    mockUseApiKey.mockReturnValue({
      status: { keys: [{ provider: 'groq', updatedAt: '2026-01-01' }] },
      hasKey: true,
    });

    const { result } = await renderHook(() =>
      useLessonGenerationForm({ documentId: 'doc-1', composition: 'both' }),
    );

    await act(async () => {
      result.current.selectProvider('groq');
    });

    expect(result.current.selectedProvider).toBe('groq');
    expect(result.current.selectedModel).toBeUndefined();
  });

  // Mutation: the stored-preference effect's `if (cancelled) return;` → `if (false) return;`,
  // and the cleanup's `cancelled = true` → a no-op `{}`/`false`. A rerender that changes
  // savedProviderEntries must cancel the stale in-flight preference load: only the OLD promise
  // resolves here (the new effect's promise is left pending), so a working cancel guard leaves
  // selectedProvider untouched, while a disabled one would apply the stale, entry-mismatched
  // result.
  it('ignores a stale preference resolution from a superseded effect run', async () => {
    let resolveOld!: (value: { provider: string; model: string }) => void;
    mockGetStoredPreference.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveOld = resolve;
        }),
    );
    mockGetStoredPreference.mockImplementationOnce(() => new Promise(() => {}));
    mockUseApiKey.mockReturnValue({
      status: { keys: [{ provider: 'groq', updatedAt: '2026-01-01' }] },
      hasKey: true,
    });

    const { result, rerender } = await renderHook(
      ({ documentId }: { documentId?: string }) =>
        useLessonGenerationForm({ documentId, composition: 'both' }),
      { initialProps: { documentId: 'doc-1' } },
    );

    mockUseApiKey.mockReturnValue({
      status: { keys: [{ provider: 'openai', updatedAt: '2026-01-02' }] },
      hasKey: true,
    });
    await rerender({ documentId: 'doc-1' });

    await act(async () => {
      resolveOld({ provider: 'groq', model: 'openai/gpt-oss-20b' });
    });

    expect(result.current.selectedProvider).toBeUndefined();
  });

  it('ignores preference resolution after the hook unmounts', async () => {
    let resolvePref!: (value: null) => void;
    mockGetStoredPreference.mockReturnValue(
      new Promise<null>((resolve) => {
        resolvePref = resolve;
      }),
    );
    mockUseApiKey.mockReturnValue({
      status: {
        keys: [{ provider: 'groq', updatedAt: '2026-01-01' }],
      },
      hasKey: true,
    });

    const { unmount } = await renderHook(() =>
      useLessonGenerationForm({ documentId: 'doc-1', composition: 'both' }),
    );

    await act(async () => {
      unmount();
    });

    await act(async () => {
      resolvePref(null);
      // Flush the effect's `await getStoredPreference()` continuation (which checks `cancelled`
      // and returns) fully within this act() so it can't leak an update into the next test.
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  });

  // Mutation: `hasPickerSelection = !showPickers || (...)` — when pickers are hidden (platform
  // keySource), hasPickerSelection must be true regardless of provider/model selection, so
  // canGenerate depends only on documentId/showMissingKeyGate here.
  it('treats hasPickerSelection as true when pickers are hidden, independent of selection', async () => {
    mockUseProfile.mockReturnValue({ profile: { keySource: 'platform', canCreate: true } });
    mockUseApiKey.mockReturnValue({ status: { keys: [] }, hasKey: false });

    const { result } = await renderHook(() =>
      useLessonGenerationForm({ documentId: 'doc-1', composition: 'both' }),
    );

    expect(result.current.showPickers).toBe(false);
    expect(result.current.showMissingKeyGate).toBe(false);
    expect(result.current.canGenerate).toBe(true);
  });

  // Mutation: `hasPickerSelection` requires BOTH selectedProvider and selectedModel — a model
  // selected with no provider (the asymmetric half not covered by the "both selected" test)
  // must still block canGenerate.
  it('blocks canGenerate when only a model is selected and the provider is not', async () => {
    mockGetStoredPreference.mockReturnValue(new Promise(() => {})); // never resolves
    mockUseApiKey.mockReturnValue({
      status: { keys: [{ provider: 'groq', updatedAt: '2026-01-01' }] },
      hasKey: true,
    });

    const { result } = await renderHook(() =>
      useLessonGenerationForm({ documentId: 'doc-1', composition: 'both' }),
    );

    expect(result.current.selectedProvider).toBeUndefined();

    await act(async () => {
      result.current.setSelectedModel('openai/gpt-oss-20b');
    });

    expect(result.current.selectedProvider).toBeUndefined();
    expect(result.current.selectedModel).toBe('openai/gpt-oss-20b');
    expect(result.current.canGenerate).toBe(false);
  });

  // Mutation: `canGenerate = Boolean(documentId) && !showMissingKeyGate && hasPickerSelection`
  // — isolates the documentId term by holding the other two true (platform path: no gate, no
  // pickers so hasPickerSelection is trivially true).
  it('requires a documentId for canGenerate independently of the gate/picker terms', async () => {
    mockUseProfile.mockReturnValue({ profile: { keySource: 'platform', canCreate: true } });
    mockUseApiKey.mockReturnValue({ status: { keys: [] }, hasKey: false });

    const { result, rerender } = await renderHook(
      ({ documentId }: { documentId?: string }) =>
        useLessonGenerationForm({ documentId, composition: 'both' }),
      { initialProps: { documentId: undefined } },
    );

    expect(result.current.canGenerate).toBe(false);

    await rerender({ documentId: 'doc-1' });

    expect(result.current.canGenerate).toBe(true);
  });

  // Mutation: `if (!showPickers || savedProviderEntries.length === 0) return;` — the positive
  // path (showPickers true, entries non-empty) must actually call getStoredPreference, not just
  // "not be blocked" (covered separately by the hidden-pickers test above).
  it('calls getStoredPreference when pickers are shown with at least one saved provider', async () => {
    mockUseApiKey.mockReturnValue({
      status: { keys: [{ provider: 'groq', updatedAt: '2026-01-01' }] },
      hasKey: true,
    });

    await renderHook(() => useLessonGenerationForm({ documentId: 'doc-1', composition: 'both' }));

    await waitFor(() => expect(mockGetStoredPreference).toHaveBeenCalledTimes(1));
  });

  // Mutation: effect dep array `[showPickers, savedProviderEntries]` → `[]` — the preference
  // load must re-run (a fresh getStoredPreference call) when savedProviderEntries changes.
  it('reruns the preference-load effect when savedProviderEntries changes', async () => {
    mockGetStoredPreference.mockResolvedValue(null);
    mockUseApiKey.mockReturnValue({
      status: { keys: [{ provider: 'groq', updatedAt: '2026-01-01' }] },
      hasKey: true,
    });

    const { rerender } = await renderHook(
      ({ documentId }: { documentId?: string }) =>
        useLessonGenerationForm({ documentId, composition: 'both' }),
      { initialProps: { documentId: 'doc-1' } },
    );
    await waitFor(() => expect(mockGetStoredPreference).toHaveBeenCalledTimes(1));

    mockUseApiKey.mockReturnValue({
      status: { keys: [{ provider: 'openai', updatedAt: '2026-01-02' }] },
      hasKey: true,
    });
    await rerender({ documentId: 'doc-1' });

    await waitFor(() => expect(mockGetStoredPreference).toHaveBeenCalledTimes(2));
  });

  // Mutation: `if (cancelled) return;` inside the async IIFE — a stale in-flight load that
  // resolves AFTER savedProviders has already changed (and a fresh load has already settled)
  // must not clobber state with its now-outdated resolution.
  it('ignores a stale in-flight preference resolution that settles after a fresh one already applied', async () => {
    let resolveStale!: (value: { provider: string; model: string }) => void;
    mockGetStoredPreference.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveStale = resolve;
        }),
    );
    mockGetStoredPreference.mockImplementationOnce(() => Promise.resolve(null));
    mockUseApiKey.mockReturnValue({
      status: { keys: [{ provider: 'groq', updatedAt: '2026-01-01' }] },
      hasKey: true,
    });

    const { result, rerender } = await renderHook(
      ({ documentId }: { documentId?: string }) =>
        useLessonGenerationForm({ documentId, composition: 'both' }),
      { initialProps: { documentId: 'doc-1' } },
    );

    mockUseApiKey.mockReturnValue({
      status: { keys: [{ provider: 'openai', updatedAt: '2026-01-02' }] },
      hasKey: true,
    });
    await act(async () => {
      await rerender({ documentId: 'doc-1' });
    });

    await waitFor(() => expect(result.current.selectedProvider).toBe('openai'));

    await act(async () => {
      resolveStale({ provider: 'anthropic', model: 'claude-haiku-4-5' });
    });

    expect(result.current.selectedProvider).toBe('openai');
  });

  // Mutation: `setSelectedModel(entry?.models[0]?.modelId)` — selecting a provider absent from
  // savedProviderEntries (no matching entry) must clear the model to undefined, not throw.
  it('sets selectedModel to undefined when selecting a provider with no saved entry', async () => {
    mockUseApiKey.mockReturnValue({
      status: { keys: [{ provider: 'groq', updatedAt: '2026-01-01' }] },
      hasKey: true,
    });

    const { result } = await renderHook(() =>
      useLessonGenerationForm({ documentId: 'doc-1', composition: 'both' }),
    );
    await waitFor(() => expect(result.current.selectedProvider).toBe('groq'));

    await act(async () => {
      result.current.selectProvider('openai');
    });

    expect(result.current.selectedProvider).toBe('openai');
    expect(result.current.selectedModel).toBeUndefined();
  });

  // Code review finding: a manual `selectProvider` choice must survive `savedProviderEntries`
  // getting a new reference (e.g. a key added for a different provider while this screen stays
  // mounted) — the seeding effect must not silently reset it back to the resolved default.
  it('keeps a manual provider selection when savedProviderEntries changes reference afterwards', async () => {
    mockUseApiKey.mockReturnValue({
      status: {
        keys: [
          { provider: 'groq', updatedAt: '2026-01-01' },
          { provider: 'openai', updatedAt: '2026-01-02' },
        ],
      },
      hasKey: true,
    });

    const { result, rerender } = await renderHook(
      ({ documentId }: { documentId?: string }) =>
        useLessonGenerationForm({ documentId, composition: 'both' }),
      { initialProps: { documentId: 'doc-1' } },
    );

    await waitFor(() => expect(result.current.selectedProvider).toBe('groq'));

    await act(async () => {
      result.current.selectProvider('openai');
    });
    expect(result.current.selectedProvider).toBe('openai');

    mockUseApiKey.mockReturnValue({
      status: {
        keys: [
          { provider: 'groq', updatedAt: '2026-01-01' },
          { provider: 'openai', updatedAt: '2026-01-03' },
          { provider: 'anthropic', updatedAt: '2026-01-03' },
        ],
      },
      hasKey: true,
    });
    await rerender({ documentId: 'doc-1' });

    expect(result.current.selectedProvider).toBe('openai');
  });
});
