// task-11 — the one integration test across the whole vertical slice (tdd.mdc): a mocked
// Supabase client boundary drives the real `loadProviderCatalog` (task-3), whose entry feeds the
// real pure predicates (`isValidModelForProvider`, `resolveVisionModelForPlacement`, task-4/task-5)
// and the real `handleLessonGenerationRoute` (task-6/task-7) — proving catalog rows alone decide
// usability, model validity and vision placement (@s27), and that no cross-invocation cache masks
// an `enabled` flip (@s28, D9). Mocked at the client boundary per task-11's note, not at
// `loadProviderCatalog`, so the query wiring itself is exercised too.
import { loadProviderCatalog } from '../../../../supabase/functions/_shared/provider-catalog';
import { handleLessonGenerationRoute } from '../../../../supabase/functions/generate-lesson/_shared/lesson-generation.route';
import { isValidModelForProvider } from '../../../../supabase/functions/generate-lesson/_shared/lesson-generation.validation';
import { resolveVisionModelForPlacement } from '../../../../supabase/functions/generate-lesson/_shared/lesson-generation.vision-model';

type CatalogRow = {
  id: string;
  name: string;
  guidance_url: string | null;
  enabled: boolean;
  sort_order: number;
  ai_provider_models: {
    model_id: string;
    label: string;
    vision: boolean;
    is_vision_default: boolean;
    sort_order: number;
  }[];
};

/** One mocked client instance, at the `from(...).select(...).eq(...).maybeSingle()` chain — the
 * same boundary `provider-catalog.test.ts` mocks. `setRow` swaps the row the *next* query
 * resolves to without ever constructing a new client, so a test can prove `loadProviderCatalog`
 * re-queries every call instead of remembering anything across invocations (@s28/D9). */
const buildCatalogClient = () => {
  let row: CatalogRow | null = null;
  const maybeSingle = jest.fn(async () => ({ data: row, error: null }));
  const eq = jest.fn().mockReturnValue({ maybeSingle });
  const select = jest.fn().mockReturnValue({ eq });
  const from = jest.fn().mockReturnValue({ select });
  return { client: { from }, setRow: (next: CatalogRow | null) => (row = next) };
};

const acmeRowV1: CatalogRow = {
  id: 'acme',
  name: 'Acme AI',
  guidance_url: 'https://acme.example/keys',
  enabled: true,
  sort_order: 1,
  ai_provider_models: [
    {
      model_id: 'acme-text',
      label: 'Acme Text',
      vision: false,
      is_vision_default: false,
      sort_order: 1,
    },
    {
      model_id: 'acme-vision',
      label: 'Acme Vision',
      vision: true,
      is_vision_default: true,
      sort_order: 2,
    },
  ],
};

describe('provider catalog integration — rows -> loader -> predicates -> route decision', () => {
  // @s27 — catalog rows alone decide usability, model validity and vision placement, end to end,
  // through the real `loadProviderCatalog` + the real BYOK route (no re-implementation here).
  it('resolves usability, model validity and vision placement entirely from mocked catalog rows', async () => {
    const { client, setRow } = buildCatalogClient();
    setRow(acmeRowV1);
    const loadProviderEntry = (providerId: string) => loadProviderCatalog(client, providerId);

    const entry = await loadProviderEntry('acme');
    expect(entry).not.toBeNull();
    if (!entry) throw new Error('expected a resolved catalog entry');

    // Model validity decided from the entry's own rows.
    expect(isValidModelForProvider(entry, 'acme-text')).toBe(true);
    expect(isValidModelForProvider(entry, 'ghost-model')).toBe(false);

    // Vision placement: a vision-capable selection is used as-is; a text-only selection falls
    // back to the entry's vision-default model (@s13/@s14).
    expect(resolveVisionModelForPlacement(entry, 'acme-vision')).toBe('acme-vision');
    expect(resolveVisionModelForPlacement(entry, 'acme-text')).toBe('acme-vision');

    // The full route decision for a valid provider/model, and for a model absent from the entry.
    const readUserApiKey = jest.fn().mockResolvedValue('secret-key');
    await expect(
      handleLessonGenerationRoute({
        userId: 'user-1',
        requestBody: {
          documentId: 'doc-1',
          composition: 'both',
          provider: 'acme',
          model: 'acme-text',
        },
        readPlanFlags: jest.fn().mockResolvedValue({ usePlatformKey: false }),
        readUserApiKey,
        loadProviderEntry,
        acquirePlatformSlot: jest.fn().mockResolvedValue(true),
      }),
    ).resolves.toMatchObject({ ok: true, provider: 'acme', model: 'acme-text' });

    await expect(
      handleLessonGenerationRoute({
        userId: 'user-1',
        requestBody: {
          documentId: 'doc-1',
          composition: 'both',
          provider: 'acme',
          model: 'ghost-model',
        },
        readPlanFlags: jest.fn().mockResolvedValue({ usePlatformKey: false }),
        readUserApiKey,
        loadProviderEntry,
        acquirePlatformSlot: jest.fn().mockResolvedValue(true),
      }),
    ).resolves.toEqual({ ok: false, errorCode: 'invalid_model' });

    // The no-deploy promise, proven mechanically: edit the mocked rows only (rename the
    // provider, drop `acme-text`, add `acme-text-v2`) — no code changes anywhere above — and the
    // exact same call chain flips its decision.
    setRow({
      ...acmeRowV1,
      name: 'Acme AI Renamed',
      ai_provider_models: [
        {
          model_id: 'acme-text-v2',
          label: 'Acme Text v2',
          vision: false,
          is_vision_default: false,
          sort_order: 1,
        },
        acmeRowV1.ai_provider_models[1],
      ],
    });
    const renamedEntry = await loadProviderEntry('acme');
    expect(renamedEntry?.name).toBe('Acme AI Renamed');
    expect(isValidModelForProvider(renamedEntry!, 'acme-text')).toBe(false);
    expect(isValidModelForProvider(renamedEntry!, 'acme-text-v2')).toBe(true);

    await expect(
      handleLessonGenerationRoute({
        userId: 'user-1',
        requestBody: {
          documentId: 'doc-1',
          composition: 'both',
          provider: 'acme',
          model: 'acme-text',
        },
        readPlanFlags: jest.fn().mockResolvedValue({ usePlatformKey: false }),
        readUserApiKey,
        loadProviderEntry,
        acquirePlatformSlot: jest.fn().mockResolvedValue(true),
      }),
    ).resolves.toEqual({ ok: false, errorCode: 'invalid_model' });
  });

  // @s28 — the entry is loaded fresh on every request; disabling the provider takes effect on
  // the very next call with no code change and no cache invalidation step. Written so a future
  // module-level TTL cache added to `loadProviderCatalog` would make this test fail: the second
  // call reuses the same `client` instance and the same `loadProviderEntry` closure as the first,
  // so any memoisation between the two calls would still return the first (enabled) decision.
  it('refuses the very next request once the mocked rows report the provider disabled', async () => {
    const { client, setRow } = buildCatalogClient();
    const readUserApiKey = jest.fn().mockResolvedValue('secret-key');
    const loadProviderEntry = (providerId: string) => loadProviderCatalog(client, providerId);

    setRow(acmeRowV1);
    const firstDecision = await handleLessonGenerationRoute({
      userId: 'user-1',
      requestBody: {
        documentId: 'doc-1',
        composition: 'both',
        provider: 'acme',
        model: 'acme-text',
      },
      readPlanFlags: jest.fn().mockResolvedValue({ usePlatformKey: false }),
      readUserApiKey,
      loadProviderEntry,
      acquirePlatformSlot: jest.fn().mockResolvedValue(true),
    });
    expect(firstDecision).toMatchObject({ ok: true, provider: 'acme' });

    setRow({ ...acmeRowV1, enabled: false });
    const secondDecision = await handleLessonGenerationRoute({
      userId: 'user-1',
      requestBody: {
        documentId: 'doc-1',
        composition: 'both',
        provider: 'acme',
        model: 'acme-text',
      },
      readPlanFlags: jest.fn().mockResolvedValue({ usePlatformKey: false }),
      readUserApiKey,
      loadProviderEntry,
      acquirePlatformSlot: jest.fn().mockResolvedValue(true),
    });

    expect(secondDecision).toEqual({ ok: false, errorCode: 'provider_disabled' });
    expect(secondDecision).not.toEqual(firstDecision);
    // The disabled gate short-circuits before Vault is ever read for the second request — an
    // observable consequence of D9's request-scoped, no-cache load, not an internal call-order
    // assertion.
    expect(readUserApiKey).toHaveBeenCalledTimes(1);
  });
});
