import {
  apiKeyFormReducer,
  initialApiKeyFormState,
} from './use-api-key-form.reducer';

describe('apiKeyFormReducer', () => {
  it('sets api key', () => {
    expect(
      apiKeyFormReducer(initialApiKeyFormState, {
        type: 'set-api-key',
        apiKey: 'sk-live',
      }),
    ).toEqual({ ...initialApiKeyFormState, apiKey: 'sk-live' });
  });

  it('starts replace mode', () => {
    expect(apiKeyFormReducer(initialApiKeyFormState, { type: 'start-replace' })).toEqual({
      ...initialApiKeyFormState,
      isReplacing: true,
    });
  });

  it('clears replace mode + key after successful replace-save', () => {
    const replacing = {
      apiKey: 'sk-new',
      isReplacing: true,
      isConfirmingRemove: false,
    };
    expect(apiKeyFormReducer(replacing, { type: 'replace-save/success' })).toEqual({
      apiKey: '',
      isReplacing: false,
      isConfirmingRemove: false,
    });
  });

  it('opens and closes remove confirm', () => {
    const open = apiKeyFormReducer(initialApiKeyFormState, { type: 'confirm-remove/open' });
    expect(open.isConfirmingRemove).toBe(true);

    expect(apiKeyFormReducer(open, { type: 'confirm-remove/close' }).isConfirmingRemove).toBe(
      false,
    );
  });
});
