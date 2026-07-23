import { AI_PROVIDERS, type AiProvider, type SavedProviderKey } from '@helsoft/types';
import { useMemo, useState } from 'react';

type UseApiKeyManagerArgs = {
  savedKeys: SavedProviderKey[];
  isSubmitting?: boolean;
};

/**
 * Local add/replace/remove form state + derived provider lists for ApiKeyManager.
 */
export const useApiKeyManager = ({ savedKeys, isSubmitting = false }: UseApiKeyManagerArgs) => {
  const [formProvider, setFormProvider] = useState<AiProvider | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [confirmingRemove, setConfirmingRemove] = useState<AiProvider | null>(null);

  const savedProviders = useMemo(() => new Set(savedKeys.map((k) => k.provider)), [savedKeys]);
  const unsavedProviders = useMemo(
    () => AI_PROVIDERS.filter((p) => !savedProviders.has(p)),
    [savedProviders],
  );
  const allSaved = unsavedProviders.length === 0;
  const isSaveDisabled = isSubmitting || !apiKey.trim();

  return {
    formProvider,
    setFormProvider,
    apiKey,
    setApiKey,
    confirmingRemove,
    setConfirmingRemove,
    savedProviders,
    unsavedProviders,
    allSaved,
    isSaveDisabled,
  };
};
