import type { SavedProviderKey } from '@helsoft/types';
import { act, renderHook } from '@testing-library/react-native';

import { useApiKeyManager } from './use-api-key-manager';

const groqKey: SavedProviderKey = { provider: 'groq', updatedAt: '2026-01-01T00:00:00.000Z' };

describe('useApiKeyManager', () => {
  it('starts with no active form provider and save disabled', async () => {
    const { result } = await renderHook(() => useApiKeyManager({ savedKeys: [] }));

    expect(result.current?.formProvider).toBeNull();
    expect(result.current?.apiKey).toBe('');
    expect(result.current?.confirmingRemove).toBeNull();
    expect(result.current?.isSaveDisabled).toBe(true);
    expect(result.current?.allSaved).toBe(false);
  });

  it('derives unsaved providers from savedKeys', async () => {
    const { result } = await renderHook(() => useApiKeyManager({ savedKeys: [groqKey] }));

    expect(result.current?.savedProviders.has('groq')).toBe(true);
    expect(result.current?.unsavedProviders).not.toContain('groq');
    expect(result.current?.unsavedProviders).toContain('openai');
  });

  it('marks allSaved when every provider has a saved key', async () => {
    const allKeys: SavedProviderKey[] = [
      { provider: 'groq', updatedAt: '2026-01-01T00:00:00.000Z' },
      { provider: 'openai', updatedAt: '2026-01-01T00:00:00.000Z' },
      { provider: 'anthropic', updatedAt: '2026-01-01T00:00:00.000Z' },
      { provider: 'google', updatedAt: '2026-01-01T00:00:00.000Z' },
      { provider: 'xai', updatedAt: '2026-01-01T00:00:00.000Z' },
      { provider: 'deepseek', updatedAt: '2026-01-01T00:00:00.000Z' },
    ];

    const { result } = await renderHook(() => useApiKeyManager({ savedKeys: allKeys }));

    expect(result.current?.allSaved).toBe(true);
    expect(result.current?.unsavedProviders).toHaveLength(0);
  });

  it('enables save once a non-blank key is entered', async () => {
    const { result } = await renderHook(() => useApiKeyManager({ savedKeys: [] }));

    await act(async () => {
      result.current?.setFormProvider('groq');
    });
    await act(async () => {
      result.current?.setApiKey('sk-test');
    });

    expect(result.current?.isSaveDisabled).toBe(false);
  });

  it('keeps save disabled while submitting', async () => {
    const { result } = await renderHook(() =>
      useApiKeyManager({ savedKeys: [], isSubmitting: true }),
    );

    await act(async () => {
      result.current?.setFormProvider('groq');
    });
    await act(async () => {
      result.current?.setApiKey('sk-test');
    });

    expect(result.current?.isSaveDisabled).toBe(true);
  });

  it('tracks confirmingRemove via setConfirmingRemove', async () => {
    const { result } = await renderHook(() => useApiKeyManager({ savedKeys: [groqKey] }));

    await act(async () => {
      result.current?.setConfirmingRemove('groq');
    });
    expect(result.current?.confirmingRemove).toBe('groq');

    await act(async () => {
      result.current?.setConfirmingRemove(null);
    });
    expect(result.current?.confirmingRemove).toBeNull();
  });
});
