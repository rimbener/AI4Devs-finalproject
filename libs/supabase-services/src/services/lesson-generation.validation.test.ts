import type { ProviderEntry } from '../../../../supabase/functions/_shared/provider-catalog.types';
import {
  resolveByokGenerationKey,
  validateByokGenerationRequest,
} from '../../../../supabase/functions/generate-lesson/_shared/lesson-generation.validation';

const anthropicEntry: ProviderEntry = {
  id: 'anthropic',
  name: 'Anthropic',
  guidanceUrl: 'https://console.anthropic.com/settings/keys',
  enabled: true,
  sortOrder: 3,
  models: [
    {
      modelId: 'claude-haiku-4-5',
      label: 'Claude Haiku 4.5',
      vision: true,
      isVisionDefault: true,
      sortOrder: 1,
    },
    {
      modelId: 'claude-sonnet-5',
      label: 'Claude Sonnet 5',
      vision: true,
      isVisionDefault: false,
      sortOrder: 2,
    },
  ],
};

const groqEntry: ProviderEntry = {
  id: 'groq',
  name: 'Groq',
  guidanceUrl: 'https://console.groq.com/keys',
  enabled: true,
  sortOrder: 1,
  models: [
    {
      modelId: 'openai/gpt-oss-20b',
      label: 'GPT-OSS 20B',
      vision: false,
      isVisionDefault: false,
      sortOrder: 1,
    },
  ],
};

describe('validateByokGenerationRequest', () => {
  // @s19 — a model absent from the entry's catalog models is rejected, and no entry (unknown
  // provider) or a missing/blank model string are rejected the same way.
  it.each([
    [anthropicEntry, 'not-a-model'],
    [null, 'claude-haiku-4-5'],
    [anthropicEntry, undefined],
    [anthropicEntry, ''],
  ] as const)('rejects an invalid entry/model pair (%p, %p)', (entry, model) => {
    expect(validateByokGenerationRequest(entry, model)).toEqual({
      ok: false,
      errorCode: 'invalid_model',
    });
  });

  // @s12 — a model present in the entry's catalog models is accepted.
  it('accepts a model that belongs to the provider entry', () => {
    expect(validateByokGenerationRequest(anthropicEntry, 'claude-haiku-4-5')).toEqual({
      ok: true,
      request: { provider: 'anthropic', model: 'claude-haiku-4-5' },
    });
  });
});

describe('resolveByokGenerationKey', () => {
  // @s12 — named provider with no stored key → missing_key, even for a curated model.
  it('returns missing_key when the entry has no saved key', async () => {
    const readUserApiKey = jest.fn().mockResolvedValue(null);

    await expect(
      resolveByokGenerationKey({
        entry: anthropicEntry,
        model: 'claude-haiku-4-5',
        readUserApiKey,
      }),
    ).resolves.toEqual({ ok: false, errorCode: 'missing_key' });
    expect(readUserApiKey).toHaveBeenCalledWith('anthropic');
  });

  // @s12 — resolves the provider-scoped key without returning it to callers beyond the seam.
  it('returns the provider key and validated model when a key exists', async () => {
    const readUserApiKey = jest.fn().mockResolvedValue('secret-key');

    await expect(
      resolveByokGenerationKey({
        entry: groqEntry,
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

  // @s19 — an invalid model never reaches the Vault reader.
  it('returns invalid_model without reading a key for an unknown model', async () => {
    const readUserApiKey = jest.fn();

    await expect(
      resolveByokGenerationKey({
        entry: groqEntry,
        model: 'unknown-model',
        readUserApiKey,
      }),
    ).resolves.toEqual({ ok: false, errorCode: 'invalid_model' });
    expect(readUserApiKey).not.toHaveBeenCalled();
  });
});
