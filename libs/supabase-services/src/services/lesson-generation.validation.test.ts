import {
  resolveByokGenerationKey,
  validateByokGenerationRequest,
} from '../../../../supabase/functions/generate-lesson/_shared/lesson-generation.validation';

describe('validateByokGenerationRequest', () => {
  // @s18 — unknown provider or model is rejected with invalid_model.
  it.each([
    ['unknown', 'gpt-5.6-luna'],
    ['openai', 'not-a-model'],
    [undefined, 'gpt-5.6-luna'],
    ['openai', undefined],
    ['openai', ''],
  ] as const)('rejects invalid provider/model pair (%p, %p)', (provider, model) => {
    expect(validateByokGenerationRequest(provider, model)).toEqual({
      ok: false,
      errorCode: 'invalid_model',
    });
  });

  // @s12 — a curated provider/model pair passes validation.
  it('accepts a curated provider and model', () => {
    expect(validateByokGenerationRequest('anthropic', 'claude-haiku-4-5')).toEqual({
      ok: true,
      request: { provider: 'anthropic', model: 'claude-haiku-4-5' },
    });
  });
});

describe('resolveByokGenerationKey', () => {
  // @s17 — named provider with no stored key → missing_key.
  it('returns missing_key when the named provider has no saved key', async () => {
    const readUserApiKey = jest.fn().mockResolvedValue(null);

    await expect(
      resolveByokGenerationKey({
        provider: 'openai',
        model: 'gpt-5.6-luna',
        readUserApiKey,
      }),
    ).resolves.toEqual({ ok: false, errorCode: 'missing_key' });
    expect(readUserApiKey).toHaveBeenCalledWith('openai');
  });

  // @s12 — resolves the provider-scoped key without returning it to callers beyond the seam.
  it('returns the provider key and validated model when a key exists', async () => {
    const readUserApiKey = jest.fn().mockResolvedValue('secret-key');

    await expect(
      resolveByokGenerationKey({
        provider: 'groq',
        model: 'openai/gpt-oss-20b',
        readUserApiKey,
      }),
    ).resolves.toEqual({
      ok: true,
      apiKey: 'secret-key',
      provider: 'groq',
      model: 'openai/gpt-oss-20b',
    });
  });

  // @s18 — invalid model never reaches the Vault reader.
  it('returns invalid_model without reading a key for an unknown model', async () => {
    const readUserApiKey = jest.fn();

    await expect(
      resolveByokGenerationKey({
        provider: 'groq',
        model: 'unknown-model',
        readUserApiKey,
      }),
    ).resolves.toEqual({ ok: false, errorCode: 'invalid_model' });
    expect(readUserApiKey).not.toHaveBeenCalled();
  });
});
