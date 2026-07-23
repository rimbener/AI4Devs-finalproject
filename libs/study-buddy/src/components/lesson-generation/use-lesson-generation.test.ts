jest.mock('@helsoft/hooks', () => ({
  ...jest.requireActual('@helsoft/hooks'),
  useApiKey: jest.fn(),
  useProfile: jest.fn(),
}));

import { useApiKey, useProfile } from '@helsoft/hooks';
import { act, renderHook } from '@testing-library/react-native';

import { useLessonGenerationForm } from './use-lesson-generation';

const mockUseApiKey = useApiKey as jest.Mock;
const mockUseProfile = useProfile as jest.Mock;

describe('useLessonGenerationForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

    await act(async () => {
      result.current.selectProvider('openai');
    });

    expect(result.current.selectedProvider).toBe('openai');
    expect(result.current.selectedModel).toBe('gpt-5.6-luna');
  });
});
