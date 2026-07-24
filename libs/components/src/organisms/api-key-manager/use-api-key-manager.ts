import { AI_PROVIDERS, type AiProvider, type SavedProviderKey } from '@helsoft/types';
import { useCallback, useMemo, useReducer } from 'react';

import {
  type ApiKeyFormMode,
  apiKeyManagerReducer,
  initialApiKeyManagerState,
} from './use-api-key-manager.reducer';

export type { ApiKeyFormMode };

type UseApiKeyManagerArgs = {
  savedKeys: SavedProviderKey[];
  isSubmitting?: boolean;
};

/**
 * Local add/replace/remove form state + derived provider lists for ApiKeyManager.
 * Add/Replace open a modal; empty screen shows only message + Add button.
 */
export const useApiKeyManager = ({ savedKeys, isSubmitting = false }: UseApiKeyManagerArgs) => {
  const [state, dispatch] = useReducer(apiKeyManagerReducer, initialApiKeyManagerState);

  const savedProviders = useMemo(() => new Set(savedKeys.map((k) => k.provider)), [savedKeys]);
  const unsavedProviders = useMemo(
    () => AI_PROVIDERS.filter((p) => !savedProviders.has(p)),
    [savedProviders],
  );
  const allSaved = unsavedProviders.length === 0;
  const isEmpty = savedKeys.length === 0;
  const isSaveDisabled = isSubmitting || !state.formProvider || !state.apiKey.trim();

  const openAddModal = useCallback(() => {
    dispatch({ type: 'modal/open-add' });
  }, []);

  const openReplaceModal = useCallback((provider: AiProvider) => {
    dispatch({ type: 'modal/open-replace', provider });
  }, []);

  const closeModal = useCallback(() => {
    dispatch({ type: 'modal/close' });
  }, []);

  const setFormProvider = useCallback((provider: AiProvider) => {
    dispatch({ type: 'form/set-provider', provider });
  }, []);

  const selectProvider = useCallback((provider: AiProvider) => {
    dispatch({ type: 'form/select-provider', provider });
  }, []);

  const setApiKey = useCallback((apiKey: string) => {
    dispatch({ type: 'form/set-api-key', apiKey });
  }, []);

  const setConfirmingRemove = useCallback((provider: AiProvider | null) => {
    if (provider === null) {
      dispatch({ type: 'confirm-remove/close' });
      return;
    }
    dispatch({ type: 'confirm-remove/open', provider });
  }, []);

  return {
    modalOpen: state.modalOpen,
    formMode: state.formMode,
    formProvider: state.formProvider,
    setFormProvider,
    selectProvider,
    apiKey: state.apiKey,
    setApiKey,
    confirmingRemove: state.confirmingRemove,
    setConfirmingRemove,
    savedProviders,
    unsavedProviders,
    allSaved,
    isEmpty,
    isSaveDisabled,
    openAddModal,
    openReplaceModal,
    closeModal,
  };
};
