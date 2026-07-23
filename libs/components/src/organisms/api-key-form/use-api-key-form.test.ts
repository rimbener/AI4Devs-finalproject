jest.mock('@helsoft/localization', () => ({
  useLocalization: jest.fn(),
}));

import { useLocalization } from '@helsoft/localization';
import type { SavedProviderKey } from '@helsoft/types';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

import { useApiKeyForm } from './use-api-key-form';

const mockUseLocalization = useLocalization as jest.Mock;

const t = (key: string) => {
  const map: Record<string, string> = {
    'settings.apiKey.loadingStatus': 'loading status',
    'settings.apiKey.saving': 'saving key',
  };
  return map[key] ?? key;
};

type HookProps = {
  savedKey: SavedProviderKey | null;
  isLoadingStatus?: boolean;
  isSubmitting?: boolean;
  errorMessage?: string;
};

const savedProviderKey: SavedProviderKey = { provider: 'groq', updatedAt: '2026-01-01T00:00:00Z' };

const renderFormHook = (initialProps: HookProps) =>
  renderHook((props: HookProps) => useApiKeyForm(props), { initialProps });

describe('useApiKeyForm', () => {
  beforeEach(() => {
    mockUseLocalization.mockReturnValue({ t });
  });

  it('starts with empty key, showInput true when no key, save disabled', async () => {
    const { result } = await renderFormHook({ savedKey: null });

    expect(result.current?.apiKey).toBe('');
    expect(result.current?.showInput).toBe(true);
    expect(result.current?.isSaveDisabled).toBe(true);
    expect(result.current?.isReplacing).toBe(false);
    expect(result.current?.isConfirmingRemove).toBe(false);
  });

  it('hides input when a key is saved and not replacing', async () => {
    const { result } = await renderFormHook({ savedKey: savedProviderKey });

    expect(result.current?.showInput).toBe(false);
  });

  it('shows input once replacing is toggled on', async () => {
    const { result } = await renderFormHook({ savedKey: savedProviderKey });

    await act(async () => {
      result.current?.setIsReplacing(true);
    });
    expect(result.current?.showInput).toBe(true);
  });

  // Mutation — `if (isReplacing)` → `if (true)`: false must not dispatch start-replace.
  it('does not start replace when setIsReplacing(false)', async () => {
    const { result } = await renderFormHook({ savedKey: savedProviderKey });

    await act(async () => {
      result.current?.setIsReplacing(false);
    });

    expect(result.current?.isReplacing).toBe(false);
    expect(result.current?.showInput).toBe(false);
  });

  // Mutation-kill — `.trim()` on save-disabled; whitespace-only must stay disabled.
  it('keeps save disabled for whitespace-only keys', async () => {
    const { result } = await renderFormHook({ savedKey: null });

    await act(async () => {
      result.current?.setApiKey('   ');
    });
    expect(result.current?.isSaveDisabled).toBe(true);

    await act(async () => {
      result.current?.setApiKey('sk-live');
    });
    expect(result.current?.isSaveDisabled).toBe(false);
  });

  it('disables save while submitting even with a non-blank key', async () => {
    const { result } = await renderFormHook({
      savedKey: null,
      isSubmitting: true,
    });

    await act(async () => {
      result.current?.setApiKey('sk-live');
    });
    expect(result.current?.isSaveDisabled).toBe(true);
  });

  it('clears replace mode + key after a successful replace-save', async () => {
    const { result, rerender } = await renderFormHook({
      savedKey: savedProviderKey,
      isSubmitting: true,
    });

    await act(async () => {
      result.current?.setIsReplacing(true);
      result.current?.setApiKey('sk-new');
    });
    expect(result.current?.isReplacing).toBe(true);

    await act(async () => {
      await rerender({ savedKey: savedProviderKey, isSubmitting: false });
    });

    expect(result.current?.isReplacing).toBe(false);
    expect(result.current?.apiKey).toBe('');
  });

  it('announces errorMessage via AccessibilityInfo when set', async () => {
    const announceSpy = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => {});
    announceSpy.mockClear();

    const { rerender } = await renderFormHook({
      savedKey: null,
      errorMessage: undefined,
    });
    expect(announceSpy).not.toHaveBeenCalled();

    await act(async () => {
      await rerender({ savedKey: null, errorMessage: 'network failed' });
    });

    await waitFor(() => expect(announceSpy).toHaveBeenCalledWith('network failed'));
    announceSpy.mockRestore();
  });

  it('announces loadingStatus when isLoadingStatus becomes true', async () => {
    const announceSpy = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => {});
    announceSpy.mockClear();

    const { rerender } = await renderFormHook({
      savedKey: null,
      isLoadingStatus: false,
    });
    expect(announceSpy).not.toHaveBeenCalled();

    await act(async () => {
      await rerender({
        savedKey: null,
        isLoadingStatus: true,
      });
    });

    await waitFor(() => expect(announceSpy).toHaveBeenCalledWith('loading status'));
    announceSpy.mockRestore();
  });

  it('announces saving label when isSubmitting becomes true', async () => {
    const announceSpy = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => {});
    announceSpy.mockClear();

    const { rerender } = await renderFormHook({
      savedKey: null,
      isSubmitting: false,
    });
    expect(announceSpy).not.toHaveBeenCalled();

    await act(async () => {
      await rerender({
        savedKey: null,
        isSubmitting: true,
      });
    });

    await waitFor(() => expect(announceSpy).toHaveBeenCalledWith('saving key'));
    announceSpy.mockRestore();
  });
});
