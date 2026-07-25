---
id: task-5
title: Export SIGNED_URL_TTL_SECONDS from @helsoft/supabase-services
slice: 4
scenarios: []
status: todo
paths: [libs/supabase-services/src/services/lesson-image.service.ts, libs/supabase-services/src/index.ts]
---

## Goal
`SIGNED_URL_TTL_SECONDS = 300` is currently a module-private `const` in `lesson-image.service.ts`. Export it and re-export it through the `@helsoft/supabase-services` barrel so task-6 can derive `useSlideImageUrl`'s cache window from it instead of hard-coding `240_000` (**D6**).

## Done criteria
- [ ] `SIGNED_URL_TTL_SECONDS` exported from `lesson-image.service.ts` and through the lib barrel
- [ ] Its value and every existing use inside the service are unchanged — export only, no behavior change
- [ ] `pnpm turbo run check-types --filter=@helsoft/supabase-services` green
- [ ] `pnpm lint` + `pnpm check-types` + `pnpm test` green

## Notes
Why: the story's `240_000` is coupled to the 300 s TTL by nothing but a code comment. Drop the TTL to 120 s later and the cache silently serves dead URLs. Exporting makes the invariant structural — task-6 computes the window from this constant, so the two can never drift.

**No `@s` scenario.** This is a pure prerequisite with no behavior to assert: `s24` (both cache windows derived from the TTL and strictly under it) is only observable on the hook, so **task-6 is its sole owner**. Per finding 1 of `review-spec.md`.

This is the only task in the feature that touches `@helsoft/supabase-services`. It is split out from task-6 because it is a cross-lib change that leaves the repo green on its own and is worth reviewing separately. No service logic changes here.
