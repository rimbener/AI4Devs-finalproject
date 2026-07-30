import { apiKeyManagerReducer, initialApiKeyManagerState } from './use-api-key-manager.reducer';

describe('apiKeyManagerReducer', () => {
  it('modal/open-add opens add mode with a cleared form', () => {
    const prev = {
      ...initialApiKeyManagerState,
      modalOpen: true,
      formMode: 'replace' as const,
      formProvider: 'groq' as const,
      apiKey: 'sk-old',
    };

    expect(apiKeyManagerReducer(prev, { type: 'modal/open-add' })).toEqual({
      ...prev,
      modalOpen: true,
      formMode: 'add',
      formProvider: null,
      apiKey: '',
      dialogIsSubmitting: false,
    });
  });

  it('modal/open-replace locks the provider and clears the key', () => {
    expect(
      apiKeyManagerReducer(initialApiKeyManagerState, {
        type: 'modal/open-replace',
        provider: 'openai',
      }),
    ).toEqual({
      ...initialApiKeyManagerState,
      modalOpen: true,
      formMode: 'replace',
      formProvider: 'openai',
      apiKey: '',
    });
  });

  it('modal/close hides the modal without clearing the draft key', () => {
    const open = apiKeyManagerReducer(initialApiKeyManagerState, {
      type: 'modal/open-replace',
      provider: 'groq',
    });
    const withKey = apiKeyManagerReducer(open, { type: 'form/set-api-key', apiKey: 'sk' });

    expect(apiKeyManagerReducer(withKey, { type: 'modal/close' })).toEqual({
      ...withKey,
      modalOpen: false,
    });
  });

  it('form/select-provider sets provider and clears the draft key', () => {
    const withKey = apiKeyManagerReducer(initialApiKeyManagerState, {
      type: 'form/set-api-key',
      apiKey: 'sk-draft',
    });

    expect(
      apiKeyManagerReducer(withKey, { type: 'form/select-provider', provider: 'anthropic' }),
    ).toEqual({
      ...withKey,
      formProvider: 'anthropic',
      apiKey: '',
    });
  });

  it('form/set-provider leaves the draft key alone', () => {
    const withKey = apiKeyManagerReducer(initialApiKeyManagerState, {
      type: 'form/set-api-key',
      apiKey: 'sk-draft',
    });

    expect(apiKeyManagerReducer(withKey, { type: 'form/set-provider', provider: 'xai' })).toEqual({
      ...withKey,
      formProvider: 'xai',
    });
  });

  it('confirm-remove/open sets the provider and clears the sticky submitting flag', () => {
    expect(
      apiKeyManagerReducer(initialApiKeyManagerState, {
        type: 'confirm-remove/open',
        provider: 'deepseek',
      }),
    ).toEqual({
      ...initialApiKeyManagerState,
      confirmingRemove: 'deepseek',
      dialogIsSubmitting: false,
    });
  });

  it('confirm-remove/close clears the provider', () => {
    const open = apiKeyManagerReducer(initialApiKeyManagerState, {
      type: 'confirm-remove/open',
      provider: 'deepseek',
    });

    expect(
      apiKeyManagerReducer(open, { type: 'confirm-remove/close' }).confirmingRemove,
    ).toBeNull();
  });

  describe('submit/sync', () => {
    it('turns on the sticky submitting flag when a submit starts', () => {
      const state = apiKeyManagerReducer(initialApiKeyManagerState, {
        type: 'submit/sync',
        isSubmitting: true,
        hasError: false,
      });

      expect(state.dialogIsSubmitting).toBe(true);
      expect(state.modalOpen).toBe(false);
    });

    it('closes the modal and keeps the sticky flag on when a submit succeeds', () => {
      const open = apiKeyManagerReducer(initialApiKeyManagerState, { type: 'modal/open-add' });
      const submitting = apiKeyManagerReducer(open, {
        type: 'submit/sync',
        isSubmitting: true,
        hasError: false,
      });

      const settled = apiKeyManagerReducer(submitting, {
        type: 'submit/sync',
        isSubmitting: false,
        hasError: false,
      });

      expect(settled.modalOpen).toBe(false);
      expect(settled.dialogIsSubmitting).toBe(true);
    });

    it('drops the sticky flag and keeps the modal open when a submit fails', () => {
      const open = apiKeyManagerReducer(initialApiKeyManagerState, { type: 'modal/open-add' });
      const submitting = apiKeyManagerReducer(open, {
        type: 'submit/sync',
        isSubmitting: true,
        hasError: false,
      });

      const settled = apiKeyManagerReducer(submitting, {
        type: 'submit/sync',
        isSubmitting: false,
        hasError: true,
      });

      expect(settled.modalOpen).toBe(true);
      expect(settled.dialogIsSubmitting).toBe(false);
    });

    it('closes the remove confirmation and keeps the sticky flag on when a remove succeeds', () => {
      const confirming = apiKeyManagerReducer(initialApiKeyManagerState, {
        type: 'confirm-remove/open',
        provider: 'groq',
      });
      const submitting = apiKeyManagerReducer(confirming, {
        type: 'submit/sync',
        isSubmitting: true,
        hasError: false,
      });

      const settled = apiKeyManagerReducer(submitting, {
        type: 'submit/sync',
        isSubmitting: false,
        hasError: false,
      });

      expect(settled.confirmingRemove).toBeNull();
      expect(settled.dialogIsSubmitting).toBe(true);
    });

    it('drops the sticky flag and keeps the remove confirmation open when a remove fails', () => {
      const confirming = apiKeyManagerReducer(initialApiKeyManagerState, {
        type: 'confirm-remove/open',
        provider: 'groq',
      });
      const submitting = apiKeyManagerReducer(confirming, {
        type: 'submit/sync',
        isSubmitting: true,
        hasError: false,
      });

      const settled = apiKeyManagerReducer(submitting, {
        type: 'submit/sync',
        isSubmitting: false,
        hasError: true,
      });

      expect(settled.confirmingRemove).toBe('groq');
      expect(settled.dialogIsSubmitting).toBe(false);
    });
  });
});
