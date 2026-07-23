jest.mock('@helsoft/services', () => ({
  GenerationPreferenceService: {
    getStoredPreference: jest.fn(),
    setStoredPreference: jest.fn(),
  },
}));

jest.mock('@helsoft/hooks', () => ({
  ...jest.requireActual('@helsoft/hooks'),
  useApiKey: jest.fn(),
  useProfile: jest.fn(),
}));

import { useApiKey, useProfile } from '@helsoft/hooks';
import { GenerationPreferenceService } from '@helsoft/services';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useLessonGenerationForm } from './use-lesson-generation';

const mockUseApiKey = useApiKey as jest.Mock;
const mockUseProfile = useProfile as jest.Mock;
const mockGetStoredPreference = GenerationPreferenceService.getStoredPreference as jest.Mock;

describe('useLessonGenerationForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetStoredPreference.mockResolvedValue(null);
    mockUseProfile.mockReturnValue({
      profile: { keySource: 'user', canCreate: false },
    });
    mockUseApiKey.mockReturnValue({
      status: { keys: [] },
      hasKey: false,
    });
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
  it('falls back when the stored model is no longer in the registry', async () => {
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
});
