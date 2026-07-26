import { loadProviderCatalog } from '../../../../supabase/functions/_shared/provider-catalog';
import {
  callProviderWithResolvedKey,
  resolveLessonGenerationKeyForPlan,
} from '../../../../supabase/functions/generate-lesson/_shared/lesson-generation.key-source';
import { handleLessonGenerationRoute } from '../../../../supabase/functions/generate-lesson/_shared/lesson-generation.route';

const anthropicEntry = {
  id: 'anthropic',
  name: 'Anthropic',
  guidanceUrl: null,
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
  ],
};

const groqEntry = {
  id: 'groq',
  name: 'Groq',
  guidanceUrl: null,
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

const openaiEntry = {
  id: 'openai',
  name: 'OpenAI',
  guidanceUrl: null,
  enabled: true,
  sortOrder: 2,
  models: [
    {
      modelId: 'gpt-5.6-luna',
      label: 'GPT-5.6 Luna',
      vision: true,
      isVisionDefault: true,
      sortOrder: 1,
    },
  ],
};

describe('generate-lesson key routing integration', () => {
  // @s16 — the catalog entry is loaded exactly once for a BYOK request, and generation proceeds
  // entirely on that entry's provider/model metadata.
  it('loads the provider catalog entry once and resolves BYOK generation from it', async () => {
    const loadProviderEntry = jest.fn().mockResolvedValue(anthropicEntry);
    const readUserApiKey = jest.fn().mockResolvedValue('secret-key');

    await expect(
      handleLessonGenerationRoute({
        userId: 'user-1',
        requestBody: {
          documentId: 'doc-1',
          composition: 'both',
          provider: 'anthropic',
          model: 'claude-haiku-4-5',
        },
        readPlanFlags: jest.fn().mockResolvedValue({ usePlatformKey: false }),
        readUserApiKey,
        loadProviderEntry,
        platformApiKey: 'platform-secret',
        acquirePlatformSlot: jest.fn().mockResolvedValue(true),
      }),
    ).resolves.toMatchObject({
      ok: true,
      source: 'user',
      apiKey: 'secret-key',
      provider: 'anthropic',
      model: 'claude-haiku-4-5',
    });
    expect(loadProviderEntry).toHaveBeenCalledTimes(1);
    expect(loadProviderEntry).toHaveBeenCalledWith('anthropic');
  });

  // @s10/@s18 — the platform control flow never executes the Vault reader and the provider
  // receives the platform key selected by the resolver.
  it('routes platform generation exclusively through the platform key', async () => {
    const readUserApiKey = jest.fn().mockResolvedValue('saved-user-secret');
    const providerCall = jest.fn().mockResolvedValue('generated');

    const resolvedKey = await resolveLessonGenerationKeyForPlan({
      usePlatformKey: true,
      readUserApiKey,
      platformApiKey: 'platform-secret',
    });

    expect(readUserApiKey).not.toHaveBeenCalled();
    expect(resolvedKey).toEqual({
      ok: true,
      apiKey: 'platform-secret',
      source: 'platform',
    });
    if (!resolvedKey.ok) throw new Error('expected a resolved platform key');
    await callProviderWithResolvedKey(resolvedKey, providerCall);
    expect(providerCall).toHaveBeenCalledWith('platform-secret');
  });

  // @s7/@s15 — server flags win over extra crafted selector fields; BYOK executes Vault exactly
  // once and the provider receives the user key even when a platform key is available.
  it('routes user-key generation through Vault despite crafted platform selectors', async () => {
    const readUserApiKey = jest.fn().mockResolvedValue('saved-user-secret');
    const providerCall = jest.fn().mockResolvedValue('generated');

    const route = await handleLessonGenerationRoute({
      userId: 'user-1',
      requestBody: {
        documentId: 'doc-1',
        composition: 'both',
        provider: 'groq',
        model: 'openai/gpt-oss-20b',
        plan: 'paid',
        entitlements: { keySource: 'platform' },
        keySource: 'platform',
      },
      readPlanFlags: jest.fn().mockResolvedValue({ usePlatformKey: false }),
      readUserApiKey,
      loadProviderEntry: jest.fn().mockResolvedValue(groqEntry),
      platformApiKey: 'platform-secret',
      acquirePlatformSlot: jest.fn().mockResolvedValue(true),
    });

    expect(readUserApiKey).toHaveBeenCalledWith('groq');
    expect(route).toMatchObject({
      ok: true,
      apiKey: 'saved-user-secret',
      source: 'user',
      provider: 'groq',
      model: 'openai/gpt-oss-20b',
    });
    if (!route.ok) throw new Error('expected a resolved user key');
    await callProviderWithResolvedKey(route, providerCall);
    expect(providerCall).toHaveBeenCalled();
  });

  // @s14 — the executable Edge routing seam reads live plan flags for each request.
  it('applies a dashboard plan flip to the next generation route', async () => {
    let usePlatformKey = true;
    const readPlanFlags = jest.fn(async () => ({ usePlatformKey }));
    const readUserApiKey = jest.fn().mockResolvedValue('saved-user-secret');

    await expect(
      handleLessonGenerationRoute({
        userId: 'user-1',
        requestBody: { documentId: 'doc-1', composition: 'both' },
        readPlanFlags,
        readUserApiKey,
        platformApiKey: 'platform-secret',
        acquirePlatformSlot: jest.fn().mockResolvedValue(true),
      }),
    ).resolves.toMatchObject({ ok: true, source: 'platform', apiKey: 'platform-secret' });

    usePlatformKey = false;

    await expect(
      handleLessonGenerationRoute({
        userId: 'user-1',
        requestBody: {
          documentId: 'doc-1',
          composition: 'both',
          provider: 'openai',
          model: 'gpt-5.6-luna',
        },
        readPlanFlags,
        readUserApiKey,
        loadProviderEntry: jest.fn().mockResolvedValue(openaiEntry),
        platformApiKey: 'platform-secret',
        acquirePlatformSlot: jest.fn().mockResolvedValue(true),
      }),
    ).resolves.toMatchObject({
      ok: true,
      source: 'user',
      apiKey: 'saved-user-secret',
      provider: 'openai',
      model: 'gpt-5.6-luna',
    });
    expect(readPlanFlags).toHaveBeenCalledTimes(2);
  });

  // @s15 — crafted client route selectors are inert at the executable Edge routing seam.
  it('uses live user-key flags when crafted route fields claim platform access', async () => {
    const readUserApiKey = jest.fn().mockResolvedValue('saved-user-secret');

    await expect(
      handleLessonGenerationRoute({
        userId: 'user-1',
        requestBody: {
          documentId: 'doc-1',
          composition: 'both',
          provider: 'groq',
          model: 'openai/gpt-oss-20b',
          plan: 'paid',
          entitlements: { keySource: 'platform' },
          keySource: 'platform',
        },
        readPlanFlags: jest.fn().mockResolvedValue({ usePlatformKey: false }),
        readUserApiKey,
        loadProviderEntry: jest.fn().mockResolvedValue(groqEntry),
        platformApiKey: 'platform-secret',
        acquirePlatformSlot: jest.fn().mockResolvedValue(true),
      }),
    ).resolves.toMatchObject({
      ok: true,
      source: 'user',
      apiKey: 'saved-user-secret',
      provider: 'groq',
      model: 'openai/gpt-oss-20b',
    });
    expect(readUserApiKey).toHaveBeenCalledWith('groq');
  });

  it('acquires a server-funded inference slot before returning the platform key', async () => {
    const acquirePlatformSlot = jest.fn().mockResolvedValue(true);

    await expect(
      handleLessonGenerationRoute({
        userId: 'user-1',
        requestBody: { documentId: 'doc-1', composition: 'both' },
        readPlanFlags: jest.fn().mockResolvedValue({ usePlatformKey: true }),
        readUserApiKey: jest.fn(),
        platformApiKey: 'platform-secret',
        acquirePlatformSlot,
      }),
    ).resolves.toMatchObject({ ok: true, source: 'platform' });
    expect(acquirePlatformSlot).toHaveBeenCalledWith('user-1');
  });

  it('returns a release callback for an acquired funded inference slot', async () => {
    const releasePlatformSlot = jest.fn().mockResolvedValue(undefined);
    const route = await handleLessonGenerationRoute({
      userId: 'user-1',
      requestBody: { documentId: 'doc-1', composition: 'both' },
      readPlanFlags: jest.fn().mockResolvedValue({ usePlatformKey: true }),
      readUserApiKey: jest.fn(),
      platformApiKey: 'platform-secret',
      acquirePlatformSlot: jest.fn().mockResolvedValue(true),
      releasePlatformSlot,
    });

    expect(route.ok).toBe(true);
    if (!route.ok || route.source !== 'platform') throw new Error('expected funded route');
    await route.release();
    expect(releasePlatformSlot).toHaveBeenCalledWith('user-1');
  });

  it('rejects funded inference when the server-side slot is denied', async () => {
    await expect(
      handleLessonGenerationRoute({
        userId: 'user-1',
        requestBody: { documentId: 'doc-1', composition: 'both' },
        readPlanFlags: jest.fn().mockResolvedValue({ usePlatformKey: true }),
        readUserApiKey: jest.fn(),
        platformApiKey: 'platform-secret',
        acquirePlatformSlot: jest.fn().mockResolvedValue(false),
      }),
    ).resolves.toEqual({ ok: false, errorCode: 'rate_limited' });
  });

  // @s20 — the platform provider's own catalog entry being disabled refuses platform generation
  // as platform_key_unavailable, before any slot is acquired or key resolved.
  it('rejects platform generation when the platform provider entry is disabled', async () => {
    const acquirePlatformSlot = jest.fn().mockResolvedValue(true);
    const loadProviderEntry = jest.fn().mockResolvedValue({ ...groqEntry, enabled: false });

    await expect(
      handleLessonGenerationRoute({
        userId: 'user-1',
        requestBody: { documentId: 'doc-1', composition: 'both' },
        readPlanFlags: jest.fn().mockResolvedValue({ usePlatformKey: true }),
        readUserApiKey: jest.fn(),
        loadProviderEntry,
        platformApiKey: 'platform-secret',
        acquirePlatformSlot,
      }),
    ).resolves.toEqual({ ok: false, errorCode: 'platform_key_unavailable' });
    expect(loadProviderEntry).toHaveBeenCalledWith('groq');
    expect(acquirePlatformSlot).not.toHaveBeenCalled();
  });

  // @s20 — an enabled platform provider entry is a no-op for the existing platform success path.
  it('still resolves platform generation when the platform provider entry is enabled', async () => {
    const loadProviderEntry = jest.fn().mockResolvedValue(groqEntry);

    await expect(
      handleLessonGenerationRoute({
        userId: 'user-1',
        requestBody: { documentId: 'doc-1', composition: 'both' },
        readPlanFlags: jest.fn().mockResolvedValue({ usePlatformKey: true }),
        readUserApiKey: jest.fn(),
        loadProviderEntry,
        platformApiKey: 'platform-secret',
        acquirePlatformSlot: jest.fn().mockResolvedValue(true),
      }),
    ).resolves.toMatchObject({ ok: true, source: 'platform' });
  });

  it('rejects an unresolved key before loading image metadata', async () => {
    const readImageMetadata = jest.fn().mockResolvedValue([]);

    await expect(
      handleLessonGenerationRoute({
        userId: 'user-1',
        requestBody: {
          documentId: 'doc-1',
          composition: 'both',
          provider: 'openai',
          model: 'gpt-5.6-luna',
        },
        readPlanFlags: jest.fn().mockResolvedValue({ usePlatformKey: false }),
        readUserApiKey: jest.fn().mockResolvedValue(null),
        loadProviderEntry: jest.fn().mockResolvedValue(openaiEntry),
        platformApiKey: 'platform-secret',
        acquirePlatformSlot: jest.fn().mockResolvedValue(true),
        readImageMetadata,
      }),
    ).resolves.toEqual({ ok: false, errorCode: 'missing_key' });
    expect(readImageMetadata).not.toHaveBeenCalled();
  });

  // @s18 — BYOK without provider/model is rejected before Vault/metadata work.
  it('rejects BYOK requests with invalid provider/model before loading image metadata', async () => {
    const readImageMetadata = jest.fn().mockResolvedValue([]);

    await expect(
      handleLessonGenerationRoute({
        userId: 'user-1',
        requestBody: { documentId: 'doc-1', composition: 'both' },
        readPlanFlags: jest.fn().mockResolvedValue({ usePlatformKey: false }),
        readUserApiKey: jest.fn(),
        platformApiKey: 'platform-secret',
        acquirePlatformSlot: jest.fn().mockResolvedValue(true),
        readImageMetadata,
      }),
    ).resolves.toEqual({ ok: false, errorCode: 'invalid_model' });
    expect(readImageMetadata).not.toHaveBeenCalled();
  });

  // @s21 — a failed catalog read propagates rather than being swallowed into a fallback list;
  // index.ts's existing try/catch around this call is what turns the rejection into
  // generation_failed 500 (task-8 note: no new branch, just verified propagation here).
  it('propagates a catalog read failure instead of falling back to any hardcoded list', async () => {
    const readUserApiKey = jest.fn();
    const loadProviderEntry = jest.fn().mockRejectedValue(new Error('catalog read failed'));

    await expect(
      handleLessonGenerationRoute({
        userId: 'user-1',
        requestBody: {
          documentId: 'doc-1',
          composition: 'both',
          provider: 'anthropic',
          model: 'claude-haiku-4-5',
        },
        readPlanFlags: jest.fn().mockResolvedValue({ usePlatformKey: false }),
        readUserApiKey,
        loadProviderEntry,
        platformApiKey: 'platform-secret',
        acquirePlatformSlot: jest.fn().mockResolvedValue(true),
      }),
    ).rejects.toThrow('catalog read failed');
    expect(readUserApiKey).not.toHaveBeenCalled();
  });

  // @s21 (reviewer_slice round-1 fix) — the mock above simulates a rejected promise, which is
  // not how a real Supabase/postgrest query failure surfaces (it resolves `{ data: null, error
  // }`; only `.throwOnError()`, unused in this repo, or a genuinely exceptional client bug
  // rejects). This case runs the real `loadProviderCatalog` against that real resolved-error
  // shape, proving the propagation claim actually holds for the failure mode s21 names.
  it('propagates a real resolved-error catalog read (not just a rejected promise)', async () => {
    const readUserApiKey = jest.fn();
    const failingClient = {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({ data: null, error: new Error('catalog read failed') }),
          }),
        }),
      }),
    };
    const loadProviderEntry = (providerId: string) =>
      loadProviderCatalog(failingClient, providerId);

    await expect(
      handleLessonGenerationRoute({
        userId: 'user-1',
        requestBody: {
          documentId: 'doc-1',
          composition: 'both',
          provider: 'anthropic',
          model: 'claude-haiku-4-5',
        },
        readPlanFlags: jest.fn().mockResolvedValue({ usePlatformKey: false }),
        readUserApiKey,
        loadProviderEntry,
        platformApiKey: 'platform-secret',
        acquirePlatformSlot: jest.fn().mockResolvedValue(true),
      }),
    ).rejects.toThrow('catalog read failed');
    expect(readUserApiKey).not.toHaveBeenCalled();
  });
});
