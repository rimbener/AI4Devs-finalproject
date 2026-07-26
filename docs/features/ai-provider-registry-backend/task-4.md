---
id: task-4
title: Delete the hardcoded model registry, widen AiProvider to string, validate models from the catalog
slice: 1
scenarios: [s12, s19]
status: done
paths:
  - supabase/functions/generate-lesson/_shared/models.ts
  - supabase/functions/generate-lesson/_shared/lesson-generation.validation.ts
  - supabase/functions/generate-lesson/_shared/types.ts
  - supabase/functions/generate-lesson/_shared/lesson-generation.route.ts
  - supabase/functions/generate-lesson/_shared/lesson-generation.provider-factory.ts
  - libs/supabase-services/src/services/lesson-generation.validation.test.ts
---

## Goal
Remove the hand-mirrored provider/model data from the Edge Function and re-point model validation at
the injected catalog entry. This is the change that actually kills the manual-sync liability the
story was written to remove.

## Done criteria
- [ ] Scenarios s12, s19 covered by TDD'd Jest tests
- [ ] `AI_PROVIDERS` and `AI_MODEL_REGISTRY` **deleted** from `models.ts`
- [ ] `models.ts` still exports `PLATFORM_TEXT_MODEL_ID` (unchanged value `'openai/gpt-oss-20b'`);
      `AiModelEntry`/`AiProviderModels` are deleted too (review-slice.md round-1 finding #2 —
      dead after `AI_MODEL_REGISTRY`'s removal, no remaining task-7..12 consumer)
- [ ] `AiProvider` widened from the six-member union to `string` in `models.ts` **and** in
      `_shared/types.ts`, with the widening propagated through `route.ts` and `provider-factory.ts`
- [ ] `isValidModelForProvider` takes the **provider entry** (not a global registry) and decides from
      its `models` (s12); an absent model still yields `invalid_model` (s19)
- [ ] `validateByokGenerationRequest` / `resolveByokGenerationKey` updated to thread the entry
- [ ] Existing `lesson-generation.validation.test.ts` cases still pass, rewritten against fixtures
      instead of the deleted global registry
- [ ] No fallback to any hardcoded provider or model list remains
- [ ] `pnpm --filter @helsoft/supabase-services test` + `pnpm lint` + `pnpm check-types` green

## Notes
- Decisions: **D6** (fail closed, registries deleted, `AiProvider` → `string`, `PLATFORM_TEXT_MODEL_ID`
  stays hardcoded), **D7** (no SDK-capability guard). Rationale lives in `spec.md`.
- **D7 is an accepted risk — do not "fix" it** (risks.md R4): after widening,
  `provider-factory.ts`'s `providerCreators[provider]` can be `undefined` for a catalog row with no
  wired `@ai-sdk` factory, producing an opaque `generation_failed` 502. Verified it compiles:
  `tsconfig.base.json` sets `strict: true` but **not** `noUncheckedIndexedAccess`, so the index
  access type-checks.
- Unknown provider and uncurated model both keep yielding `invalid_model` 422 — byte-identical to
  today. Only the *disabled* case gets a new code, in task-7.
- Keep `models.ts`'s header comment honest: it is no longer a hand-mirrored registry.
