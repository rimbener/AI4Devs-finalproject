jest.mock('@helsoft/supabase-services', () => ({
  ApiKeyService: {
    saveApiKey: jest.fn(),
    getApiKeyStatus: jest.fn(),
    removeApiKey: jest.fn(),
  },
}));
jest.mock('./use-session', () => ({ useSession: jest.fn() }));

import { ApiKeyService } from '@helsoft/supabase-services';
import type { AiProvider } from '@helsoft/types';
import { act, render, renderHook, waitFor } from '@testing-library/react-native';
import { createElement } from 'react';

import { ApiKeyProvider, useApiKey } from './use-api-key';
import { useSession } from './use-session';

const service = ApiKeyService as jest.Mocked<typeof ApiKeyService>;
const mockUseSession = useSession as jest.Mock;

const authenticatedSession = {
  session: { access_token: 'tok', user: { id: 'u1' } },
  isLoading: false,
};
const noSession = { session: null, isLoading: false };

const keysStatus = (providers: AiProvider[]) => ({
  keys: providers.map((p) => ({ provider: p, updatedAt: '2026-01-01T00:00:00.000Z' })),
});
const emptyStatus = { keys: [] };

describe('useApiKey', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    service.getApiKeyStatus.mockResolvedValue(emptyStatus);
  });

  // @s1 — on mount for an authenticated user, the status loads and keys reflects the stored state
  it('loads status on mount when authenticated and reflects keys', async () => {
    mockUseSession.mockReturnValue(authenticatedSession);
    const status = keysStatus(['groq']);
    service.getApiKeyStatus.mockResolvedValue(status);

    const { result } = renderHook(() => useApiKey());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.status).toEqual(status);
    expect(result.current.hasKey).toBe(true);
  });

  // @s1 — hasKey is false when there are no saved keys
  it('hasKey is false when status has no keys', async () => {
    mockUseSession.mockReturnValue(authenticatedSession);
    service.getApiKeyStatus.mockResolvedValue(emptyStatus);

    const { result } = renderHook(() => useApiKey());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hasKey).toBe(false);
  });

  // @s7 — isLoading is true during the initial fetch, false once it resolves
  it('sets isLoading true during the initial fetch and false once it resolves', async () => {
    mockUseSession.mockReturnValue(authenticatedSession);
    let resolveStatus: (value: unknown) => void = () => {};
    service.getApiKeyStatus.mockReturnValue(
      new Promise((resolve) => {
        resolveStatus = resolve;
      }) as never,
    );

    const { result } = renderHook(() => useApiKey());
    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveStatus(emptyStatus);
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('does not load the status when there is no session', async () => {
    mockUseSession.mockReturnValue(noSession);

    const { result } = renderHook(() => useApiKey());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(service.getApiKeyStatus).not.toHaveBeenCalled();
    expect(result.current.status).toEqual(emptyStatus);
  });

  it('keeps isLoading true while the session itself is still resolving', async () => {
    mockUseSession.mockReturnValue({ session: null, isLoading: true });

    const { result } = renderHook(() => useApiKey());

    expect(result.current.isLoading).toBe(true);
    expect(service.getApiKeyStatus).not.toHaveBeenCalled();
  });

  it('loads the status once the session resolves from loading to authenticated', async () => {
    const status = keysStatus(['groq']);
    service.getApiKeyStatus.mockResolvedValue(status);
    mockUseSession.mockReturnValue({ session: null, isLoading: true });

    const { result, rerender } = renderHook(() => useApiKey());
    expect(result.current.isLoading).toBe(true);

    mockUseSession.mockReturnValue(authenticatedSession);
    rerender(undefined);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.status).toEqual(status);
  });

  it('reloads the status when the authenticated user changes', async () => {
    mockUseSession.mockReturnValue({
      session: { access_token: 'tok-1', user: { id: 'user-1' } },
      isLoading: false,
    });
    service.getApiKeyStatus.mockResolvedValueOnce(keysStatus(['groq']));
    service.getApiKeyStatus.mockResolvedValueOnce(keysStatus(['openai']));

    const { result, rerender } = renderHook(() => useApiKey());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.status).toEqual(keysStatus(['groq']));
    expect(service.getApiKeyStatus).toHaveBeenCalledTimes(1);

    mockUseSession.mockReturnValue({
      session: { access_token: 'tok-2', user: { id: 'user-2' } },
      isLoading: false,
    });
    rerender(undefined as never);

    await waitFor(() => expect(result.current.status).toEqual(keysStatus(['openai'])));
    expect(service.getApiKeyStatus).toHaveBeenCalledTimes(2);
  });

  it('does not reload the status when the session is replaced for the same user', async () => {
    const sessionForUser1 = { access_token: 'tok-1', user: { id: 'user-1' } };
    mockUseSession.mockReturnValue({ session: sessionForUser1, isLoading: false });
    service.getApiKeyStatus.mockResolvedValue(keysStatus(['groq']));

    const { result, rerender } = renderHook(() => useApiKey());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(service.getApiKeyStatus).toHaveBeenCalledTimes(1);

    const refreshedSessionSameUser = { access_token: 'tok-2', user: { id: 'user-1' } };
    mockUseSession.mockReturnValue({ session: refreshedSessionSameUser, isLoading: false });
    rerender(undefined);

    expect(service.getApiKeyStatus).toHaveBeenCalledTimes(1);
  });

  // @s2 — saveApiKey calls the service with provider + key and updates status on success
  it('saveApiKey calls ApiKeyService.saveApiKey(provider, key) and updates status on success', async () => {
    mockUseSession.mockReturnValue(authenticatedSession);
    const status = keysStatus(['groq']);
    service.saveApiKey.mockResolvedValue(status);
    const { result } = renderHook(() => useApiKey());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.saveApiKey('groq', 'sk-test-key');
    });

    expect(service.saveApiKey).toHaveBeenCalledWith('groq', 'sk-test-key');
    expect(result.current.status).toEqual(status);
    expect(result.current.hasKey).toBe(true);
  });

  // @s7 — isSubmitting true during saveApiKey, false after
  it('sets isSubmitting true during saveApiKey and false after it resolves', async () => {
    mockUseSession.mockReturnValue(authenticatedSession);
    let resolveSave: (value: unknown) => void = () => {};
    service.saveApiKey.mockReturnValue(
      new Promise((resolve) => {
        resolveSave = resolve;
      }) as never,
    );
    const { result } = renderHook(() => useApiKey());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let savePromise!: Promise<void>;
    act(() => {
      savePromise = result.current.saveApiKey('groq', 'sk-test');
    });
    expect(result.current.isSubmitting).toBe(true);

    await act(async () => {
      resolveSave(keysStatus(['groq']));
      await savePromise;
    });

    expect(result.current.isSubmitting).toBe(false);
  });

  it('sets isSubmitting back to false after a failed saveApiKey', async () => {
    mockUseSession.mockReturnValue(authenticatedSession);
    service.saveApiKey.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useApiKey());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await expect(result.current.saveApiKey('groq', 'sk-test')).rejects.toThrow('boom');
    });

    expect(result.current.isSubmitting).toBe(false);
  });

  it('exposes a null error by default and after a successful save', async () => {
    mockUseSession.mockReturnValue(authenticatedSession);
    service.saveApiKey.mockResolvedValue(keysStatus(['groq']));
    const { result } = renderHook(() => useApiKey());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeNull();

    await act(async () => {
      await result.current.saveApiKey('groq', 'sk-test');
    });

    expect(result.current.error).toBeNull();
  });

  // @s8 — failed saveApiKey sets error to the normalized code
  it('sets error to the normalized code after a failed saveApiKey', async () => {
    mockUseSession.mockReturnValue(authenticatedSession);
    service.saveApiKey.mockRejectedValue(
      Object.assign(new Error('bad key'), { code: 'validation_error' }),
    );
    const { result } = renderHook(() => useApiKey());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await expect(result.current.saveApiKey('groq', 'sk-bad')).rejects.toThrow('bad key');
    });

    expect(result.current.error).toBe('validation_error');
  });

  // @s8 — a retry clears a previously set error
  it('clears a previously set error once a retried saveApiKey succeeds', async () => {
    mockUseSession.mockReturnValue(authenticatedSession);
    service.saveApiKey.mockRejectedValueOnce(
      Object.assign(new Error('offline'), { code: 'network_error' }),
    );
    const status = keysStatus(['groq']);
    service.saveApiKey.mockResolvedValueOnce(status);
    const { result } = renderHook(() => useApiKey());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await expect(result.current.saveApiKey('groq', 'sk-test')).rejects.toThrow('offline');
    });
    expect(result.current.error).toBe('network_error');

    await act(async () => {
      await result.current.saveApiKey('groq', 'sk-test');
    });

    expect(result.current.error).toBeNull();
    expect(result.current.status).toEqual(status);
  });

  it('falls back to network_error when the rejection carries no recognized code', async () => {
    mockUseSession.mockReturnValue(authenticatedSession);
    service.saveApiKey.mockRejectedValue(new Error('unexpected'));
    const { result } = renderHook(() => useApiKey());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await expect(result.current.saveApiKey('groq', 'sk-test')).rejects.toThrow('unexpected');
    });

    expect(result.current.error).toBe('network_error');
  });

  it('ignores a status load that resolves after unmount', async () => {
    mockUseSession.mockReturnValue(authenticatedSession);
    let resolveStatus: (value: unknown) => void = () => {};
    service.getApiKeyStatus.mockReturnValue(
      new Promise((resolve) => {
        resolveStatus = resolve;
      }) as never,
    );
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { unmount } = renderHook(() => useApiKey());
    unmount();

    await act(async () => {
      resolveStatus(keysStatus(['groq']));
    });

    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('does not let a status load in flight before logout clobber the reset empty status', async () => {
    const sessionForUser1 = { access_token: 'tok-1', user: { id: 'user-1' } };
    mockUseSession.mockReturnValue({ session: sessionForUser1, isLoading: false });
    let resolveStatus: (value: unknown) => void = () => {};
    service.getApiKeyStatus.mockReturnValue(
      new Promise((resolve) => {
        resolveStatus = resolve;
      }) as never,
    );

    const { result, rerender } = renderHook(() => useApiKey());

    mockUseSession.mockReturnValue({ session: null, isLoading: false });
    rerender(undefined);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.status).toEqual(emptyStatus);

    await act(async () => {
      resolveStatus(keysStatus(['groq']));
    });

    expect(result.current.status).toEqual(emptyStatus);
  });

  // @s9 — raw key never retained in hook state
  it('does not retain the raw key anywhere in the returned hook state', async () => {
    mockUseSession.mockReturnValue(authenticatedSession);
    service.saveApiKey.mockResolvedValue(keysStatus(['groq']));
    const { result } = renderHook(() => useApiKey());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.saveApiKey('groq', 'sk-should-never-be-retained');
    });

    expect(JSON.stringify(result.current)).not.toContain('sk-should-never-be-retained');
  });

  // @s5 — removeApiKey calls the service with provider and updates status
  it('removeApiKey calls ApiKeyService.removeApiKey(provider) and updates status on success', async () => {
    mockUseSession.mockReturnValue(authenticatedSession);
    service.getApiKeyStatus.mockResolvedValue(keysStatus(['groq', 'openai']));
    service.removeApiKey.mockResolvedValue(keysStatus(['openai']));
    const { result } = renderHook(() => useApiKey());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.removeApiKey('groq');
    });

    expect(service.removeApiKey).toHaveBeenCalledWith('groq');
    expect(result.current.status).toEqual(keysStatus(['openai']));
    expect(result.current.error).toBeNull();
  });

  // @s8 — a failed removeApiKey sets the normalized error code and preserves the saved status
  it('sets error and preserves the saved status after a failed removeApiKey', async () => {
    mockUseSession.mockReturnValue(authenticatedSession);
    const savedStatus = keysStatus(['groq', 'openai']);
    service.getApiKeyStatus.mockResolvedValue(savedStatus);
    service.removeApiKey.mockRejectedValue(
      Object.assign(new Error('delete failed'), { code: 'network_error' }),
    );
    const { result } = renderHook(() => useApiKey());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await expect(result.current.removeApiKey('groq')).rejects.toThrow('delete failed');
    });

    expect(result.current.error).toBe('network_error');
    expect(result.current.status).toEqual(savedStatus);
  });

  it('keeps saveApiKey and removeApiKey wired to the current runMutation across rerenders', async () => {
    mockUseSession.mockReturnValue(authenticatedSession);
    service.saveApiKey.mockResolvedValue(keysStatus(['groq']));
    service.removeApiKey.mockResolvedValue(emptyStatus);

    const { result, rerender } = renderHook(() => useApiKey());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.saveApiKey('groq', 'sk-first');
    });
    expect(service.saveApiKey).toHaveBeenCalledWith('groq', 'sk-first');

    rerender(undefined as never);

    await act(async () => {
      await result.current.removeApiKey('groq');
    });
    expect(service.removeApiKey).toHaveBeenCalledWith('groq');
  });

  it('sets isSubmitting true during removeApiKey and false once it resolves', async () => {
    mockUseSession.mockReturnValue(authenticatedSession);
    let resolveRemove: (value: unknown) => void = () => {};
    service.removeApiKey.mockReturnValue(
      new Promise((resolve) => {
        resolveRemove = resolve;
      }) as never,
    );
    const { result } = renderHook(() => useApiKey());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let removePromise!: Promise<void>;
    act(() => {
      removePromise = result.current.removeApiKey('groq');
    });
    expect(result.current.isSubmitting).toBe(true);

    await act(async () => {
      resolveRemove(emptyStatus);
      await removePromise;
    });

    expect(result.current.isSubmitting).toBe(false);
  });
});

describe('ApiKeyProvider', () => {
  beforeEach(() => jest.clearAllMocks());

  const Consumer = ({ onRender }: { onRender: (result: ReturnType<typeof useApiKey>) => void }) => {
    onRender(useApiKey());
    return null;
  };

  it('shares one underlying status fetch across multiple useApiKey() consumers nested under one ApiKeyProvider', async () => {
    mockUseSession.mockReturnValue(authenticatedSession);
    const status = keysStatus(['groq']);
    service.getApiKeyStatus.mockResolvedValue(status);

    const renders1: Array<ReturnType<typeof useApiKey>> = [];
    const renders2: Array<ReturnType<typeof useApiKey>> = [];
    render(
      createElement(
        ApiKeyProvider,
        null,
        createElement(Consumer, { onRender: (r) => renders1.push(r) }),
        createElement(Consumer, { onRender: (r) => renders2.push(r) }),
      ),
    );

    await waitFor(() => expect(renders1.at(-1)?.isLoading).toBe(false));

    expect(service.getApiKeyStatus).toHaveBeenCalledTimes(1);
    expect(renders1.at(-1)?.status).toEqual(status);
    expect(renders2.at(-1)?.status).toEqual(status);
  });

  it('falls back to its own independent state when rendered without an ApiKeyProvider ancestor', async () => {
    mockUseSession.mockReturnValue(authenticatedSession);
    service.getApiKeyStatus.mockResolvedValue(emptyStatus);

    const { result } = renderHook(() => useApiKey());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(service.getApiKeyStatus).toHaveBeenCalledTimes(1);
  });

  it('returns a referentially stable context value across an unrelated parent re-render', async () => {
    mockUseSession.mockReturnValue(authenticatedSession);
    service.getApiKeyStatus.mockResolvedValue(emptyStatus);

    const renders: Array<ReturnType<typeof useApiKey>> = [];
    const tree = (label: string) =>
      createElement(
        ApiKeyProvider,
        null,
        createElement(Consumer, { onRender: (r) => renders.push(r) }),
        createElement('span', null, label),
      );

    const { rerender } = render(tree('first'));
    await waitFor(() => expect(renders.at(-1)?.isLoading).toBe(false));
    const stableValue = renders.at(-1);

    rerender(tree('second'));

    expect(renders.at(-1)).toBe(stableValue);
  });
});
