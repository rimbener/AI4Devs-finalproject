---
id: task-8
title: Keep unknown-provider rejection unchanged and fail closed when the catalog read fails
slice: 2
scenarios: [s18, s21]
status: todo
paths:
  - supabase/functions/generate-lesson/_shared/lesson-generation.route.ts
  - supabase/functions/generate-lesson/index.ts
  - libs/supabase-services/src/services/lesson-generation.validation.test.ts
---

## Goal
Pin the two remaining `generate-lesson` outcomes: an unknown provider behaves exactly as it did
before this feature, and a failed or empty catalog read refuses generation rather than falling back
to any hardcoded list.

## Done criteria
- [ ] Scenarios s18, s21 covered by TDD'd Jest tests
- [ ] Unknown provider (loader returned `null`) → `invalid_model` **422**, byte-identical to today (s18)
- [ ] A throwing catalog read → generation refused via the existing `generation_failed` **500**
      catch-all around route resolution; **no** SDK call, **no** fallback list (s21)
- [ ] An empty/absent provider row is treated as unknown, not as enabled
- [ ] No hardcoded provider list remains anywhere in `generate-lesson`
- [ ] `pnpm --filter @helsoft/supabase-services test` + `pnpm lint` + `pnpm check-types` green

## Notes
- Decisions: **D12** (unknown stays `invalid_model`; only disabled gets the new code), **D6** (fail
  closed, never assume enabled). Rationale lives in `spec.md`.
- Fail-closed needs **no new code path**: `index.ts` already wraps `handleLessonGenerationRoute` in
  `try { … } catch { return errorResponse(req, 'generation_failed', 500) }`. Letting the loader's
  rejection propagate into that catch is the whole implementation. Assert it rather than adding a
  branch.
- Distinguish carefully: `null` from the loader (row absent → `invalid_model` 422) is **not** the same
  as the loader throwing (read failure → `generation_failed` 500). Both are pinned; keep them apart.
