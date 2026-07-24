import type { AiProvider } from '@helsoft/types';

export type ApiKeyFormMode = 'add' | 'replace';

export type ApiKeyManagerState = {
  modalOpen: boolean;
  formMode: ApiKeyFormMode;
  formProvider: AiProvider | null;
  apiKey: string;
  confirmingRemove: AiProvider | null;
};

export type ApiKeyManagerAction =
  | { type: 'modal/open-add' }
  | { type: 'modal/open-replace'; provider: AiProvider }
  | { type: 'modal/close' }
  | { type: 'form/set-provider'; provider: AiProvider }
  | { type: 'form/select-provider'; provider: AiProvider }
  | { type: 'form/set-api-key'; apiKey: string }
  | { type: 'confirm-remove/open'; provider: AiProvider }
  | { type: 'confirm-remove/close' };

export const initialApiKeyManagerState: ApiKeyManagerState = {
  modalOpen: false,
  formMode: 'add',
  formProvider: null,
  apiKey: '',
  confirmingRemove: null,
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
      };
    case 'modal/open-replace':
      return {
        ...state,
        modalOpen: true,
        formMode: 'replace',
        formProvider: action.provider,
        apiKey: '',
      };
    case 'modal/close':
      return {
        ...state,
        modalOpen: false,
        apiKey: '',
      };
    case 'form/set-provider':
      return { ...state, formProvider: action.provider };
    case 'form/select-provider':
      // Add-flow radio change: pick provider and clear any draft key for the previous one.
      return { ...state, formProvider: action.provider, apiKey: '' };
    case 'form/set-api-key':
      return { ...state, apiKey: action.apiKey };
    case 'confirm-remove/open':
      return { ...state, confirmingRemove: action.provider };
    case 'confirm-remove/close':
      return { ...state, confirmingRemove: null };
  }
};
