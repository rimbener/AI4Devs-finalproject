import type { SavedProviderKey } from '@helsoft/types';

export type ApiKeyFormProps = {
  /** The currently saved key for this provider — null means no key saved yet (empty state). */
  savedKey: SavedProviderKey | null;
  /** True while the initial status fetch is in flight (task-7 Loading state). */
  isLoadingStatus?: boolean;
  /** True while a save is in flight (@s2). */
  isSubmitting?: boolean;
  onSave: (rawKey: string) => void;
  onRemove?: () => void;
  /** Where the Empty state's guidance link sends the user (@s5). */
  guidanceUrl: string;
  /**
   * Save/remove failure banner (network_error, @s7/@s9). Rendered alongside whichever state
   * is showing (input or masked saved) — the input stays editable and the masked state stays
   * visible; retry is just resubmitting/re-confirming.
   */
  errorMessage?: string;
  /** Label for the saved status text (provider + last-updated) — the wiring layer builds
   * this via `t()` so ApiKeyForm stays free of i18n/date-formatting concerns. */
  keySavedStatusLabel: string;
};
