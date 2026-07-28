import type { AiProvider } from '@helsoft/types';

export type ApiKeyFormDialogMode = 'add' | 'replace';

export type ApiKeyFormDialogProps = {
  open: boolean;
  onClose: () => void;
  formMode: ApiKeyFormDialogMode;
  formProvider: AiProvider | null;
  /** Providers offered in add-mode RadioGroup (already filtered to unsaved). */
  unsavedProviders: readonly AiProvider[];
  apiKey: string;
  onApiKeyChange: (apiKey: string) => void;
  onSelectProvider: (provider: AiProvider) => void;
  isSubmitting?: boolean;
  isSaveDisabled: boolean;
  onSave: () => void;
  guidanceUrls: Partial<Record<AiProvider, string>>;
  /** Plain catalog display names — no i18n key indirection. */
  providerNames: Record<AiProvider, string>;
};
