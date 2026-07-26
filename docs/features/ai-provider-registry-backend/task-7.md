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
- [ ] `libs/types/` is **not** touched by this task
- [ ] `pnpm --filter @helsoft/supabase-services test` + `pnpm lint` + `pnpm check-types` green

## Notes
- Decisions: **D13** (new `provider_disabled` `GenerationErrorCode` at 422, Edge-side mirror only),
  **D14** (platform route reuses `platform_key_unavailable` 503). Rationale lives in `spec.md`.
- **Scope boundary:** widen only `supabase/functions/generate-lesson/_shared/types.ts`. The
  `libs/types/src/lesson-generation.ts` union, its `lesson-generation.test.ts` guard, the four locale
  bundles and the client-side error mapping are owned by the paired frontend story
  (`user-stories/pending/ai-provider-registry-frontend.md`, amended to cite D13 and D14 explicitly).
- `provider_disabled` means exactly "the provider *you chose* is retired" — BYOK only. Do not route
  the platform path through it.
- Blast radius is recorded in risks.md R3; the operator-facing warning is authored by task-1's
  migration header, not here.
