import { AI_PROVIDERS, type AiProvider, type SavedProviderKey } from '@helsoft/types';
import { useCallback, useMemo, useState } from 'react';

type UseApiKeyManagerArgs = {
  savedKeys: SavedProviderKey[];
  isSubmitting?: boolean;
};

export type ApiKeyFormMode = 'add' | 'replace';

/**
 * Local add/replace/remove form state + derived provider lists for ApiKeyManager.
 * Add/Replace open a modal; empty screen shows only message + Add button.
 */
export const useApiKeyManager = ({ savedKeys, isSubmitting = false }: UseApiKeyManagerArgs) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<ApiKeyFormMode>('add');
  const [formProvider, setFormProvider] = useState<AiProvider | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [confirmingRemove, setConfirmingRemove] = useState<AiProvider | null>(null);

  const savedProviders = useMemo(() => new Set(savedKeys.map((k) => k.provider)), [savedKeys]);
  const unsavedProviders = useMemo(
    () => AI_PROVIDERS.filter((p) => !savedProviders.has(p)),
    [savedProviders],
  );
  const allSaved = unsavedProviders.length === 0;
  const isEmpty = savedKeys.length === 0;
  const isSaveDisabled = isSubmitting || !formProvider || !apiKey.trim();

  const openAddModal = useCallback(() => {
    setFormMode('add');
    setFormProvider(null);
    setApiKey('');
    setModalOpen(true);
  }, []);

  const openReplaceModal = useCallback((provider: AiProvider) => {
    setFormMode('replace');
    setFormProvider(provider);
    setApiKey('');
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setFormProvider(null);
    setApiKey('');
    setFormMode('add');
  }, []);

  return {
    modalOpen,
    formMode,
    formProvider,
    setFormProvider,
    apiKey,
    setApiKey,
    confirmingRemove,
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
