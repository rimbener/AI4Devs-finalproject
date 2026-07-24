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

  it('modal/close resets modal fields', () => {
    const open = apiKeyManagerReducer(initialApiKeyManagerState, {
      type: 'modal/open-replace',
      provider: 'groq',
    });
    const withKey = apiKeyManagerReducer(open, { type: 'form/set-api-key', apiKey: 'sk' });

    expect(apiKeyManagerReducer(withKey, { type: 'modal/close' })).toEqual({
      ...withKey,
      modalOpen: false,
      apiKey: '',
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

  it('confirm-remove open/close tracks the provider', () => {
    const open = apiKeyManagerReducer(initialApiKeyManagerState, {
      type: 'confirm-remove/open',
      provider: 'deepseek',
    });
    expect(open.confirmingRemove).toBe('deepseek');
    expect(
      apiKeyManagerReducer(open, { type: 'confirm-remove/close' }).confirmingRemove,
    ).toBeNull();
  });
});
