import type { ProviderEntry } from '../../_shared/provider-catalog.ts';
import { resolveLessonGenerationKeyForPlan } from './lesson-generation.key-source.ts';
import { resolveByokGenerationKey } from './lesson-generation.validation.ts';
import type { AiProvider } from './models.ts';
import type { GenerateLessonRequest } from './types.ts';

export type PlanFlags = {
  usePlatformKey: boolean;
};

type HandleLessonGenerationRouteInput = {
  userId: string;
  requestBody: unknown;
  readPlanFlags: (userId: string) => Promise<PlanFlags | null>;
  readUserApiKey: (provider: AiProvider) => Promise<string | null>;
  // Loads the requested provider's catalog entry once per request (D9 — no cache, no re-read);
  // `null` when the id is unknown to the catalog. Optional so BYOK-agnostic call sites (platform
  // path, malformed-request tests) needn't wire it — omitting it fails closed (@s21/D6).
  loadProviderEntry?: (providerId: string) => Promise<ProviderEntry | null>;
  platformApiKey?: string | null;
  acquirePlatformSlot: (userId: string) => Promise<boolean>;
  releasePlatformSlot?: (userId: string) => Promise<void>;
  readImageMetadata?: () => Promise<unknown>;
};

export const handleLessonGenerationRoute = async ({
  userId,
  requestBody,
  readPlanFlags,
  readUserApiKey,
  loadProviderEntry,
  platformApiKey,
  acquirePlatformSlot,
  releasePlatformSlot,
  readImageMetadata,
}: HandleLessonGenerationRouteInput) => {
  const body = requestBody as Partial<GenerateLessonRequest>;
  const planFlags = await readPlanFlags(userId);
  if (!planFlags) {
    return { ok: false as const, errorCode: 'generation_failed' as const };
  }

  if (!planFlags.usePlatformKey) {
    // The catalog is read once, right here, for the named provider (@s16) — never re-read within
    // the request (D9). An unstringly-typed/absent provider never reaches the loader.
    const providerId = typeof body.provider === 'string' ? body.provider : null;
    const entry = providerId ? ((await loadProviderEntry?.(providerId)) ?? null) : null;
    const byok = await resolveByokGenerationKey({
      entry,
      model: body.model,
      readUserApiKey,
    });
    if (!byok.ok) return byok;
    return {
      ok: true as const,
      apiKey: byok.apiKey,
      source: 'user' as const,
      provider: byok.provider,
      model: byok.model,
      imageMetadata: await readImageMetadata?.(),
    };
  }

  const resolvedKey = await resolveLessonGenerationKeyForPlan({
    usePlatformKey: true,
    readUserApiKey: async () => null,
    platformApiKey,
  });
  if (!resolvedKey.ok) {
    return resolvedKey;
  }
  if (!(await acquirePlatformSlot(userId))) {
    return { ok: false as const, errorCode: 'rate_limited' as const };
  }
  const release = () => releasePlatformSlot?.(userId) ?? Promise.resolve();
  try {
    return {
      ...resolvedKey,
      provider: 'groq' as const,
      model: undefined,
      imageMetadata: await readImageMetadata?.(),
      release,
    };
  } catch (cause) {
    await release();
    throw cause;
  }
};
