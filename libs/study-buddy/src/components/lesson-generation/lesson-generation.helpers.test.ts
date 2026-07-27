// @ts-nocheck
import type { AiProviderCatalogEntry } from '@helsoft/types';

import {
  GENERATION_ERROR_KEYS,
  GENERATION_ERROR_RECOVERY,
  isAiProvider,
  isCuratedModel,
  isLessonComposition,
  resolveGenerationSelection,
  toPanelState,
} from './lesson-generation.helpers';

const groqEntry: AiProviderCatalogEntry = {
  id: 'groq',
  name: 'Groq',
  guidanceUrl: 'https://console.groq.com/keys',
  enabled: true,
  sortOrder: 1,
  models: [
    {
      modelId: 'openai/gpt-oss-20b',
      label: 'GPT OSS 20B',
      vision: false,
      isVisionDefault: false,
      sortOrder: 1,
    },
    {
      modelId: 'openai/gpt-oss-120b',
      label: 'GPT OSS 120B',
      vision: false,
      isVisionDefault: false,
      sortOrder: 2,
    },
  ],
};

const openaiEntry: AiProviderCatalogEntry = {
  id: 'openai',
  name: 'OpenAI',
  guidanceUrl: 'https://platform.openai.com/api-keys',
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
    {
      modelId: 'gpt-5.6-terra',
      label: 'GPT-5.6 Terra',
      vision: true,
      isVisionDefault: false,
      sortOrder: 2,
    },
  ],
};

describe('isLessonComposition', () => {
  it('accepts every LessonComposition value', () => {
    expect(isLessonComposition('instructional-only')).toBe(true);
    expect(isLessonComposition('activity-only')).toBe(true);
    expect(isLessonComposition('both')).toBe(true);
  });

  it('rejects any other string', () => {
    expect(isLessonComposition('everything')).toBe(false);
  });
});

describe('isAiProvider (task-4) — resourced against a catalog-backed provider list', () => {
  it('accepts a value present in the passed-in provider list', () => {
    expect(isAiProvider(['groq', 'openai'], 'groq')).toBe(true);
  });

  it('rejects a value absent from the passed-in provider list', () => {
    expect(isAiProvider(['groq', 'openai'], 'anthropic')).toBe(false);
  });

  it('rejects any non-provider string', () => {
    expect(isAiProvider(['groq', 'openai'], 'not-a-provider')).toBe(false);
  });
});

describe('isCuratedModel (task-4) — resourced against a provider catalog entry', () => {
  it('accepts a modelId present in the entry.models list', () => {
    expect(isCuratedModel(groqEntry, 'openai/gpt-oss-20b')).toBe(true);
  });

  it('rejects a modelId absent from the entry.models list', () => {
    expect(isCuratedModel(groqEntry, 'retired-model')).toBe(false);
  });
});

describe('toPanelState', () => {
  // @s14 — the hook's 'generating' stage drives the panel's Loading state.
  it('maps generating to loading', () => {
    expect(toPanelState('generating')).toBe('loading');
  });

  // @s17 — the hook's 'content' stage drives the panel's Content state.
  it('maps content to content', () => {
    expect(toPanelState('content')).toBe('content');
  });

  // @s16 — idle (no generation yet) drives the panel's Empty state.
  it('maps idle to empty', () => {
    expect(toPanelState('idle')).toBe('empty');
  });

  // @s15 (task-13) — the hook's 'error' stage now drives the panel's own Error state.
  it('maps error to error', () => {
    expect(toPanelState('error')).toBe('error');
  });
});

describe('GENERATION_ERROR_KEYS (task-13)', () => {
  // @s15/@s18 — every GenerationErrorCode maps to its own i18n message key (spec.md's Error
  // contract table names these keys verbatim), so a missing mapping fails to compile.
  // `provider_disabled` (task-9, @s12) added, distinct from `invalid_model`'s key.
  it('maps every GenerationErrorCode to its spec.md i18n key', () => {
    expect(GENERATION_ERROR_KEYS).toEqual({
      missing_key: 'generation.error.missingKey',
      invalid_key: 'generation.error.invalidKey',
      invalid_model: 'generation.error.invalidModel',
      platform_key_unavailable: 'generation.error.platformKeyUnavailable',
      rate_limited: 'generation.error.rateLimited',
      timeout: 'generation.error.timeout',
      generation_failed: 'generation.error.generationFailed',
      document_not_ready: 'generation.error.documentNotReady',
      network_error: 'error.network',
      unauthenticated: 'generation.error.unauthenticated',
      persist_failed: 'generation.error.persistFailed',
      provider_disabled: 'generation.error.providerDisabled',
    });
    expect(GENERATION_ERROR_KEYS.provider_disabled).not.toBe(GENERATION_ERROR_KEYS.invalid_model);
  });
});

describe('GENERATION_ERROR_RECOVERY (task-13)', () => {
  // @s15 — recovery per code (task-13.md's "Recovery per code" table).
  it('maps each code to its recovery-affordance category', () => {
    expect(GENERATION_ERROR_RECOVERY).toEqual({
      missing_key: 'settings',
      invalid_key: 'settings',
      invalid_model: 'none',
      platform_key_unavailable: 'retry',
      rate_limited: 'retry',
      timeout: 'retry',
      generation_failed: 'retry',
      document_not_ready: 'none',
      network_error: 'retry',
      unauthenticated: 'signIn',
      persist_failed: 'retry',
      provider_disabled: 'none',
    });
  });

  // task-9, Decision 9 — same "none" recovery family as invalid_model, since there's nothing to
  // retry, just a different saved provider to pick.
  it('maps provider_disabled to no recovery action, same family as invalid_model', () => {
    expect(GENERATION_ERROR_RECOVERY.provider_disabled).toBe('none');
    expect(GENERATION_ERROR_RECOVERY.provider_disabled).toBe(
      GENERATION_ERROR_RECOVERY.invalid_model,
    );
  });

  // @s11/@s19 — platform failures are retryable server errors, never Settings/BYOK actions.
  it('maps platform key unavailability to server copy and retry recovery', () => {
    expect(GENERATION_ERROR_KEYS.platform_key_unavailable).toBe(
      'generation.error.platformKeyUnavailable',
    );
    expect(GENERATION_ERROR_RECOVERY.platform_key_unavailable).toBe('retry');
  });
});

describe('resolveGenerationSelection (@s20/@s21, task-4: catalog-backed)', () => {
  const savedProviders = [groqEntry, openaiEntry];

  // @s20 — valid stored preference wins.
  it('returns the stored provider and model when still valid', () => {
    expect(
      resolveGenerationSelection(savedProviders, {
        provider: 'openai',
        model: 'gpt-5.6-terra',
      }),
    ).toEqual({ provider: 'openai', model: 'gpt-5.6-terra' });
  });

  // @s21 — deleted provider key falls back to first saved + first curated model.
  it('falls back when the stored provider is not saved', () => {
    expect(
      resolveGenerationSelection(savedProviders, {
        provider: 'anthropic',
        model: 'claude-haiku-4-5',
      }),
    ).toEqual({ provider: 'groq', model: 'openai/gpt-oss-20b' });
  });

  // @s21 — retired model falls back quietly.
  it('falls back when the stored model is not in the catalog entry', () => {
    expect(
      resolveGenerationSelection(savedProviders, {
        provider: 'openai',
        model: 'retired-model',
      }),
    ).toEqual({ provider: 'groq', model: 'openai/gpt-oss-20b' });
  });

  // @s21 — missing preference falls back without crashing.
  it('falls back when no preference is stored', () => {
    expect(resolveGenerationSelection(savedProviders, null)).toEqual({
      provider: 'groq',
      model: 'openai/gpt-oss-20b',
    });
  });

  it('falls back safely when the saved provider has no models registered', () => {
    expect(resolveGenerationSelection([openaiEntry], null)).toEqual({
      provider: 'openai',
      model: 'gpt-5.6-luna',
    });
  });

  // @s10 — a model added to (or removed from) the catalog entry is reflected with no other
  // change: the fallback model comes from whatever entry.models currently holds.
  it('falls back to an empty model id when the entry has no models', () => {
    expect(resolveGenerationSelection([{ ...openaiEntry, models: [] }], null)).toEqual({
      provider: 'openai',
      model: '',
    });
  });

  // Mutation — `fallbackEntry?.models[0]?.modelId ?? ''`'s FIRST `?.` (guarding `fallbackEntry`
  // itself, distinct from the second `?.` guarding `models[0]` covered above): when
  // `savedProviders` is empty, `fallbackEntry` is `undefined`. Without this `?.`,
  // `undefined.models` throws instead of falling back to `''`.
  it('does not throw and falls back to an empty model id when savedProviders is empty', () => {
    expect(() => resolveGenerationSelection([], null)).not.toThrow();
    expect(resolveGenerationSelection([], null)).toEqual({
      provider: undefined,
      model: '',
    });
  });
});
