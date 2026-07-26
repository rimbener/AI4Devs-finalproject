import type { AiProvider, SavedProviderKey } from '@helsoft/types';
import { act, renderHook } from '@testing-library/react-native';

import { useApiKeyManager } from './use-api-key-manager';

const groqKey: SavedProviderKey = { provider: 'groq', updatedAt: '2026-01-01T00:00:00.000Z' };

const providers: readonly AiProvider[] = [
  'groq',
  'openai',
  'anthropic',
  'google',
  'xai',
  'deepseek',
];

describe('useApiKeyManager', () => {
  it('starts with modal closed, no form provider, and save disabled', async () => {
    const { result } = await renderHook(() => useApiKeyManager({ savedKeys: [], providers }));

    expect(result.current?.modalOpen).toBe(false);
    expect(result.current?.formProvider).toBeNull();
    expect(result.current?.apiKey).toBe('');
    expect(result.current?.confirmingRemove).toBeNull();
    expect(result.current?.isSaveDisabled).toBe(true);
    expect(result.current?.allSaved).toBe(false);
    expect(result.current?.isEmpty).toBe(true);
  });

  it('derives unsaved providers from savedKeys', async () => {
    const { result } = await renderHook(() =>
      useApiKeyManager({ savedKeys: [groqKey], providers }),
    );

    expect(result.current?.savedProviders.has('groq')).toBe(true);
    expect(result.current?.unsavedProviders).not.toContain('groq');
    expect(result.current?.unsavedProviders).toContain('openai');
  });

  // Decision 4 — unsavedProviders iterates the passed-in catalog order, not a hardcoded registry.
  it('orders unsavedProviders by the passed-in providers list, not alphabetically', async () => {
    const reordered: readonly AiProvider[] = ['xai', 'groq', 'deepseek'];

    const { result } = await renderHook(() =>
      useApiKeyManager({ savedKeys: [], providers: reordered }),
    );

    expect(result.current?.unsavedProviders).toEqual(['xai', 'groq', 'deepseek']);
  });

  // Reordering the catalog reorders unsavedProviders with no other code change (@s20 analog).
  it('recomputes unsavedProviders order when the providers list itself reorders', async () => {
    const { result, rerender } = await renderHook(
      ({ providers: p }: { providers: readonly AiProvider[] }) =>
        useApiKeyManager({ savedKeys: [], providers: p }),
      { initialProps: { providers } },
    );

    expect(result.current?.unsavedProviders[0]).toBe('groq');

    await rerender({ providers: ['deepseek', 'groq', 'openai', 'anthropic', 'google', 'xai'] });

    expect(result.current?.unsavedProviders[0]).toBe('deepseek');
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

    const { result } = await renderHook(() => useApiKeyManager({ savedKeys: allKeys, providers }));

    expect(result.current?.allSaved).toBe(true);
    expect(result.current?.unsavedProviders).toHaveLength(0);
  });

  it('enables save once a non-blank key is entered', async () => {
    const { result } = await renderHook(() => useApiKeyManager({ savedKeys: [], providers }));

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
      useApiKeyManager({ savedKeys: [], providers, isSubmitting: true }),
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
    const { result } = await renderHook(() =>
      useApiKeyManager({ savedKeys: [groqKey], providers }),
    );

    await act(async () => {
      result.current?.setConfirmingRemove('groq');
    });
    expect(result.current?.confirmingRemove).toBe('groq');

    await act(async () => {
      result.current?.setConfirmingRemove(null);
    });
    expect(result.current?.confirmingRemove).toBeNull();
  });

  it('recomputes unsaved providers when savedKeys changes', async () => {
    const openaiKey: SavedProviderKey = {
      provider: 'openai',
      updatedAt: '2026-02-01T00:00:00.000Z',
    };
    const { result, rerender } = await renderHook(
      ({ savedKeys }: { savedKeys: SavedProviderKey[] }) =>
        useApiKeyManager({ savedKeys, providers }),
      { initialProps: { savedKeys: [groqKey] } },
    );

    expect(result.current?.unsavedProviders).not.toContain('groq');
    expect(result.current?.unsavedProviders).toContain('openai');

    await rerender({ savedKeys: [groqKey, openaiKey] });

    expect(result.current?.unsavedProviders).not.toContain('openai');
    expect(result.current?.savedProviders.has('openai')).toBe(true);
  });

  it('keeps save disabled for whitespace-only keys', async () => {
    const { result } = await renderHook(() => useApiKeyManager({ savedKeys: [], providers }));

    await act(async () => {
      result.current?.setFormProvider('groq');
    });
    await act(async () => {
      result.current?.setApiKey('   ');
    });

    expect(result.current?.isSaveDisabled).toBe(true);
  });

  it('openAddModal opens the modal in add mode with a cleared form', async () => {
    const { result } = await renderHook(() =>
      useApiKeyManager({ savedKeys: [groqKey], providers }),
    );

    await act(async () => {
      result.current?.openReplaceModal('groq');
    });
    await act(async () => {
      result.current?.setApiKey('sk-old');
    });
    await act(async () => {
      result.current?.openAddModal();
    });

    expect(result.current?.modalOpen).toBe(true);
    expect(result.current?.formMode).toBe('add');
    expect(result.current?.formProvider).toBeNull();
    expect(result.current?.apiKey).toBe('');
  });

  it('openReplaceModal opens the modal with the provider fixed', async () => {
    const { result } = await renderHook(() =>
      useApiKeyManager({ savedKeys: [groqKey], providers }),
    );

    await act(async () => {
      result.current?.openReplaceModal('groq');
    });

    expect(result.current?.modalOpen).toBe(true);
    expect(result.current?.formMode).toBe('replace');
    expect(result.current?.formProvider).toBe('groq');
    expect(result.current?.apiKey).toBe('');
  });

  it('closeModal clears modal state', async () => {
    const { result } = await renderHook(() => useApiKeyManager({ savedKeys: [], providers }));

    await act(async () => {
      result.current?.openAddModal();
    });
    await act(async () => {
      result.current?.setFormProvider('openai');
    });
    await act(async () => {
      result.current?.closeModal();
    });

    expect(result.current?.modalOpen).toBe(false);
    expect(result.current?.formMode).toBe('add');
  });

  it('selectProvider sets the provider and clears a draft key', async () => {
    const { result } = await renderHook(() => useApiKeyManager({ savedKeys: [], providers }));

    await act(async () => {
      result.current?.openAddModal();
    });
    await act(async () => {
      result.current?.setApiKey('sk-draft');
    });
    await act(async () => {
      result.current?.selectProvider('google');
    });

    expect(result.current?.formProvider).toBe('google');
    expect(result.current?.apiKey).toBe('');
  });

  it('keeps dialogIsSubmitting true and closes the modal when a submit succeeds', async () => {
    const { result, rerender } = await renderHook(
      ({ savedKeys, isSubmitting }: { savedKeys: SavedProviderKey[]; isSubmitting: boolean }) =>
        useApiKeyManager({ savedKeys, providers, isSubmitting }),
      { initialProps: { savedKeys: [], isSubmitting: false } },
    );

    await act(async () => {
      result.current?.openAddModal();
    });

    await rerender({ savedKeys: [], isSubmitting: true });
    expect(result.current?.dialogIsSubmitting).toBe(true);

    await rerender({ savedKeys: [groqKey], isSubmitting: false });

    expect(result.current?.modalOpen).toBe(false);
    expect(result.current?.dialogIsSubmitting).toBe(true);
  });

  it('drops dialogIsSubmitting and keeps the modal open when a submit fails', async () => {
    const { result, rerender } = await renderHook(
      ({ isSubmitting, hasError }: { isSubmitting: boolean; hasError: boolean }) =>
        useApiKeyManager({ savedKeys: [], providers, isSubmitting, hasError }),
      { initialProps: { isSubmitting: false, hasError: false } },
    );

    await act(async () => {
      result.current?.openAddModal();
    });

    await rerender({ isSubmitting: true, hasError: false });
    await rerender({ isSubmitting: false, hasError: true });

    expect(result.current?.modalOpen).toBe(true);
    expect(result.current?.dialogIsSubmitting).toBe(false);
  });
});
