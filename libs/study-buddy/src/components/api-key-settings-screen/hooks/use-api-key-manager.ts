import type { AiProvider, SavedProviderKey } from '@helsoft/types';
import { useMemo, useReducer, useRef } from 'react';

import { apiKeyManagerReducer, initialApiKeyManagerState } from './use-api-key-manager.reducer';

type UseApiKeyManagerArgs = {
  savedKeys: SavedProviderKey[];
  /** Providers currently enabled in the catalog (task-7, Decision 5/12) — threaded in from the
   * wiring layer's `useAiProviders().enabledProviders`; this hook never re-derives an `enabled`
   * check itself. Drives `unsavedProviders`' order and membership: intersected with "not already
   * saved" only, so a disabled, unsaved provider is excluded because it's already absent here,
   * never via a second condition. The saved-list's own row order/membership (task-6) comes from
   * `ApiKeyManager`'s separate, unfiltered `providers` prop, passed straight to
   * `ApiKeySavedList` — this hook has no notion of the full catalog list. */
  enabledProviders: readonly AiProvider[];
  isSubmitting?: boolean;
  hasError?: boolean;
};

/**
 * Local add/replace/remove form state + derived provider lists for ApiKeyManager.
 * Add/Replace open a modal; empty screen shows only message + Add button.
 */
export const useApiKeyManager = ({
  savedKeys,
  enabledProviders,
  isSubmitting = false,
  hasError = false,
}: UseApiKeyManagerArgs) => {
  // Lazy init: seed dialogIsSubmitting from the current prop, not the reducer's hardcoded
  // `false` — otherwise mounting with isSubmitting already true (e.g. a submit already in
  // flight on first render) would never get flagged, since submit/sync only reacts to changes.
  const [state, dispatch] = useReducer(apiKeyManagerReducer, initialApiKeyManagerState, (init) => ({
    ...init,
    dialogIsSubmitting: isSubmitting,
  }));

  // Render-phase sync, not a useEffect: a ref (not state) guards the dispatch itself, so this
  // never fires unless `isSubmitting` actually changed (an unconditional dispatch every render
  // trips React's nested-update limit). The transition *handling* still lives entirely in the
  // reducer (`submit/sync`) — this only decides *whether* to notify it, which is exactly the
  // "adjusting state during rendering" pattern React recommends in place of an effect: it lets
  // React redo the render before committing, so the dialog can never paint a frame where the
  // submit has settled but the sticky "still submitting" flag hasn't caught up yet.
  const lastIsSubmittingRef = useRef(isSubmitting);
  if (lastIsSubmittingRef.current !== isSubmitting) {
    lastIsSubmittingRef.current = isSubmitting;
    dispatch({ type: 'submit/sync', isSubmitting, hasError });
  }

  const savedProviders = useMemo(() => new Set(savedKeys.map((k) => k.provider)), [savedKeys]);
  // task-7, @s8 — intersects the given enabledProviders with "not already saved" only; a
  // disabled, unsaved provider is excluded because it's already absent from enabledProviders,
  // never via a `p.enabled` check re-derived here.
  const unsavedProviders = useMemo(
    () => enabledProviders.filter((p) => !savedProviders.has(p)),
    [enabledProviders, savedProviders],
  );
  const allSaved = unsavedProviders.length === 0;
  const isEmpty = savedKeys.length === 0;
  const isSaveDisabled = state.dialogIsSubmitting || !state.formProvider || !state.apiKey.trim();

  const openAddModal = () => {
    dispatch({ type: 'modal/open-add' });
  };

  const openReplaceModal = (provider: AiProvider) => {
    dispatch({ type: 'modal/open-replace', provider });
  };

  const closeModal = () => {
    dispatch({ type: 'modal/close' });
  };

  const selectProvider = (provider: AiProvider) => {
    dispatch({ type: 'form/select-provider', provider });
  };

  const setApiKey = (apiKey: string) => {
    dispatch({ type: 'form/set-api-key', apiKey });
  };

  const setConfirmingRemove = (provider: AiProvider | null) => {
    if (provider === null) {
      dispatch({ type: 'confirm-remove/close' });
      return;
    }
    dispatch({ type: 'confirm-remove/open', provider });
  };

  const openRemoveModal = (provider: AiProvider) => {
    dispatch({ type: 'confirm-remove/open', provider });
  };

  const closeRemoveModal = () => {
    dispatch({ type: 'confirm-remove/close' });
  };

  return {
    modalOpen: state.modalOpen,
    formMode: state.formMode,
    formProvider: state.formProvider,
    selectProvider,
    apiKey: state.apiKey,
    setApiKey,
    dialogIsSubmitting: state.dialogIsSubmitting,
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
    openRemoveModal,
    closeRemoveModal,
  };
};
