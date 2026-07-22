export type ApiKeyFormState = {
  apiKey: string;
  isReplacing: boolean;
  isConfirmingRemove: boolean;
};

export type ApiKeyFormAction =
  | { type: 'set-api-key'; apiKey: string }
  | { type: 'start-replace' }
  | { type: 'replace-save/success' }
  | { type: 'confirm-remove/open' }
  | { type: 'confirm-remove/close' };

export const initialApiKeyFormState: ApiKeyFormState = {
  apiKey: '',
  isReplacing: false,
  isConfirmingRemove: false,
};

export const apiKeyFormReducer = (
  state: ApiKeyFormState,
  action: ApiKeyFormAction,
): ApiKeyFormState => {
  switch (action.type) {
    case 'set-api-key':
      return { ...state, apiKey: action.apiKey };
    case 'start-replace':
      return { ...state, isReplacing: true };
    case 'replace-save/success':
      return { ...state, isReplacing: false, apiKey: '' };
    case 'confirm-remove/open':
      return { ...state, isConfirmingRemove: true };
    case 'confirm-remove/close':
      return { ...state, isConfirmingRemove: false };
  }
};
