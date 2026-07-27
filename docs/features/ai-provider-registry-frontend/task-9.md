---
id: task-9
title: Widen GenerationErrorCode with provider_disabled (422), keep adjacent codes unchanged
slice: 2
scenarios: [s12, s14, s15]
status: done
paths:
  - libs/types/src/lesson-generation.ts
  - libs/types/src/lesson-generation.test.ts
  - libs/supabase-services/src/services/lesson-generation.service.ts
  - libs/supabase-services/src/services/lesson-generation.service.test.ts
  - libs/study-buddy/src/components/lesson-generation/lesson-generation.helpers.ts
  - libs/study-buddy/src/components/lesson-generation/lesson-generation.helpers.test.ts
  - libs/localization/src/resources/en.ts
  - libs/localization/src/resources/es.ts
  - libs/localization/src/resources/pt.ts
  - libs/localization/src/resources/de.ts
---

## Goal
`generate-lesson` already returns HTTP 422 `{ errorCode: 'provider_disabled' }` for a BYOK request
naming a disabled provider (backend D13) — today's `GENERATION_ERROR_CODES` guard doesn't recognize
it, so `isKnownErrorCode` silently degrades it to `generation_failed` before the UI ever sees it.
Widen the union and give the learner distinct copy, while confirming the two adjacent 422 paths
(unknown provider, uncurated model) and the platform path stay exactly as they are today.

## Done criteria
- [ ] Scenario s12 covered: a mocked 422 `{ errorCode: 'provider_disabled' }` response resolves to
      `toGenerationError('provider_disabled')` out of `LessonGenerationService.generate`, and
      `lesson-generation.helpers.ts`'s `GENERATION_ERROR_KEYS['provider_disabled']` renders distinct
      copy from `invalid_model`'s
- [ ] Scenario s14 covered (regression): a mocked 422 `{ errorCode: 'invalid_model' }` response for
      an uncurated model still maps to `invalid_model`, unaffected by the widening
- [ ] Scenario s15 covered (regression): a mocked 503 `{ errorCode: 'platform_key_unavailable' }`
      response still maps to `platform_key_unavailable`, unaffected by the widening — no new copy
      added for this path (Decision 10)
- [ ] `GenerationErrorCode` widened with `'provider_disabled'` (`libs/types/src/
      lesson-generation.ts` + its test)
- [ ] `GENERATION_ERROR_CODES` (`lesson-generation.service.ts`) gains `provider_disabled: true`
- [ ] `GENERATION_ERROR_KEYS`/`GENERATION_ERROR_RECOVERY` (`lesson-generation.helpers.ts`) gain a
      `provider_disabled` row: message key `generation.error.providerDisabled`, recovery `'none'`
      (Decision 9 — same family as `invalid_model`, nothing to retry)
- [ ] New locale key added, translated, to all four bundles in the same commit
- [ ] `pnpm lint` + `pnpm check-types` + `pnpm test` green for `@helsoft/types`,
      `@helsoft/supabase-services`, `@helsoft/study-buddy`

## Notes
- Decisions 9, 10 (mirrors backend D13/D14). `GENERATION_ERROR_RECOVERY['provider_disabled'] =
  'none'` means no action button — the copy itself should point the learner at picking a different
  saved provider, matching `invalid_model`'s wording pattern ("Choose another and try again"),
  distinct enough not to be mistaken for it.
- Scenario s13 (unknown provider stays `invalid_model`) and s17/s18 (manage-api-key's unknown-
  provider paths) are deliberately **not** this task's — task-10 owns the cross-cutting "unknown
  provider is unaffected by either widening" regression proof, so it isn't duplicated here and in
  task-8.
