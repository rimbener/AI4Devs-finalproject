import type { AiProvider } from '@helsoft/types';

export type ApiKeyFormMode = 'add' | 'replace';

export type ApiKeyManagerState = {
  modalOpen: boolean;
  formMode: ApiKeyFormMode;
  formProvider: AiProvider | null;
  apiKey: string;
  confirmingRemove: AiProvider | null;
  /**
   * Sticky "does the open dialog (add/replace form, or the remove confirmation) look like
   * it's submitting" flag. Stays true from submit-start all the way through the auto-close on
   * success (see `submit/sync`), so neither dialog ever renders its normal content again
   * mid-close — it only drops on a failed submit, so the form reappears for the user to retry
   * (the remove confirmation has nothing to retry, so a failed remove just drops the flag too;
   * the top-level error banner covers reporting the failure).
   */
  dialogIsSubmitting: boolean;
};

export type ApiKeyManagerAction =
  | { type: 'modal/open-add' }
  | { type: 'modal/open-replace'; provider: AiProvider }
  | { type: 'modal/close' }
  | { type: 'form/set-provider'; provider: AiProvider }
  | { type: 'form/select-provider'; provider: AiProvider }
  | { type: 'form/set-api-key'; apiKey: string }
  | { type: 'confirm-remove/open'; provider: AiProvider }
  | { type: 'confirm-remove/close' }
  /**
   * Dispatched by the hook only when its externally-reported `isSubmitting` prop actually
   * changes (guarded there via a ref — an unconditional render-phase dispatch here would
   * re-trigger on every render and trip React's nested-update limit). Because it only ever
   * fires on a real true↔false transition, the reducer doesn't need to re-derive that itself.
   * Only one of the add/replace form or the remove confirmation is ever open at a time, so
   * this can tell which one just settled by checking which container is open.
   */
  | { type: 'submit/sync'; isSubmitting: boolean; hasError: boolean };

export const initialApiKeyManagerState: ApiKeyManagerState = {
  modalOpen: false,
  formMode: 'add',
  formProvider: null,
  apiKey: '',
  confirmingRemove: null,
  dialogIsSubmitting: false,
};

export const apiKeyManagerReducer = (
  state: ApiKeyManagerState,
  action: ApiKeyManagerAction,
): ApiKeyManagerState => {
  switch (action.type) {
    case 'modal/open-add':
      return {
        ...state,
        modalOpen: true,
        formMode: 'add',
        formProvider: null,
        apiKey: '',
        dialogIsSubmitting: false,
      };
    case 'modal/open-replace':
      return {
        ...state,
        modalOpen: true,
        formMode: 'replace',
        formProvider: action.provider,
        apiKey: '',
        dialogIsSubmitting: false,
      };
    case 'modal/close':
      return {
        ...state,
        modalOpen: false,
        // Keep form fields — open-add/replace reset them. Clearing here flashes
        // an empty form if the modal paints one more frame on close.
      };
    case 'form/set-provider':
      return { ...state, formProvider: action.provider };
    case 'form/select-provider':
      // Add-flow radio change: pick provider and clear any draft key for the previous one.
      return { ...state, formProvider: action.provider, apiKey: '' };
    case 'form/set-api-key':
      return { ...state, apiKey: action.apiKey };
    case 'confirm-remove/open':
      return { ...state, confirmingRemove: action.provider, dialogIsSubmitting: false };
    case 'confirm-remove/close':
      return { ...state, confirmingRemove: null };
    case 'submit/sync':
      if (action.isSubmitting) {
        return { ...state, dialogIsSubmitting: true };
      }
      // The external submit just settled.
      if (action.hasError) {
        return { ...state, dialogIsSubmitting: false };
      }
      // Success: stay in the submitting look and close whichever container was open, in the
      // same transition — no frame in between where a dialog is open but no longer looks like
      // it's submitting.
      if (state.modalOpen) {
        return { ...state, dialogIsSubmitting: true, modalOpen: false };
      }
      if (state.confirmingRemove !== null) {
        return { ...state, dialogIsSubmitting: true, confirmingRemove: null };
      }
      return { ...state, dialogIsSubmitting: false };
  }
};
