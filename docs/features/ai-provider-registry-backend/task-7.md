---
id: task-7
title: Enforce the enabled flag in generate-lesson (BYOK 422 provider_disabled, platform 503)
slice: 2
scenarios: [s17, s20]
status: todo
paths:
  - supabase/functions/generate-lesson/_shared/types.ts
  - supabase/functions/generate-lesson/_shared/lesson-generation.route.ts
  - supabase/functions/generate-lesson/index.ts
  - libs/supabase-services/src/services/lesson-generation.validation.test.ts
---

## Goal
Make `enabled = false` actually stop generation on both routes: a learner's own provider yields the
new `provider_disabled` code at 422, while the platform route reuses the existing
`platform_key_unavailable` at 503.

## Done criteria
- [ ] Scenarios s17, s20 covered by TDD'd Jest tests
- [ ] `GenerationErrorCode` in the **Edge-side mirror** `_shared/types.ts` widened with
      `'provider_disabled'`
- [ ] BYOK route: entry with `enabled === false` → `provider_disabled`, mapped to **422** in
      `index.ts`'s status ladder; **no** provider SDK call, no Vault key use (s17)
- [ ] Platform route: the platform provider's entry with `enabled === false` →
      `platform_key_unavailable`, **503**, no SDK call (s20)
- [ ] The `enabled` check runs **before** any key resolution or SDK factory call on both routes
- [ ] Platform route still acquires/releases its generation slot correctly when it rejects early
- [ ] `pnpm --filter @helsoft/supabase-services test` + `pnpm lint` + `pnpm check-types` green

## Notes
- **Scope boundary (decision D11/D13):** this task widens **only** the Edge-side mirror
  `supabase/functions/generate-lesson/_shared/types.ts`. The `libs/types/src/lesson-generation.ts`
  union, its `lesson-generation.test.ts` guard, the four locale bundles and the client-side error
  mapping are **owned by the paired frontend story** (`user-stories/pending/ai-provider-registry-frontend.md`,
  amended for exactly this). Do not touch `libs/types` here.
- 422 matches `invalid_model`'s existing status — it is a request-validation refusal.
- **The platform route deliberately reuses `platform_key_unavailable` 503** (decision D14) rather
  than `provider_disabled`: the learner's request is not invalid and they cannot fix it, and 503 +
  the existing copy ("Lesson generation is temporarily unavailable. Try again.") is already correct,
  so this branch needs **no new vocabulary and no new copy**.
- `provider_disabled` therefore means exactly "the provider *you chose* is retired" — BYOK only.
- **Blast radius, documented in risks.md R3:** `update ai_providers set enabled = false where id = 'groq'`
  disables platform generation for every paid learner, because `route.ts` hardcodes `provider: 'groq'`
  for that route. Mitigation is the migration-header warning from task-1, not code.
