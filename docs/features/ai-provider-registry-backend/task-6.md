---
id: task-6
title: Wire generate-lesson to load the catalog entry once per request (BYOK happy path)
slice: 1
scenarios: [s16]
status: todo
paths:
  - supabase/functions/generate-lesson/index.ts
  - supabase/functions/generate-lesson/_shared/lesson-generation.route.ts
---

## Goal
Close slice 1 end to end: `generate-lesson` loads the requested provider's catalog entry **once** via
the service-role client and threads it into model validation and vision resolution, so a BYOK
generation succeeds entirely on catalog metadata.

## Done criteria
- [ ] Scenario s16 covered by a test asserting the loader is invoked once and generation proceeds
- [ ] `handleLessonGenerationRoute` accepts a `loadProviderEntry` dependency (injected seam, matching
      the file's existing `readPlanFlags` / `readUserApiKey` / `acquirePlatformSlot` style)
- [ ] `index.ts` supplies that dependency using the **existing service-role `adminClient`**
- [ ] The loaded entry is threaded to task-4's model validation and task-5's vision resolution —
      **loaded once, never re-read** within a request
- [ ] BYOK happy path unchanged from the caller's perspective (same 200 body shape)
- [ ] `pnpm --filter @helsoft/supabase-services test` + `pnpm lint` + `pnpm check-types` green

## Notes
- **Service-role `adminClient`, not the caller JWT** (decision D4): the catalog is global reference
  data with no per-user dimension, and `index.ts` already reads `plans` this way
  (`.from('profiles').select('plan_id, plans(use_platform_key)')` on `adminClient`). No new client.
- **Consequence to carry into the DoD:** with D4 nothing server-side exercises the
  `select to authenticated` RLS policy from task-1 — its only consumer is the paired frontend story.
  Task-12 owns the manual check so we don't ship an unverified policy.
- Keep the dependency-injection discipline of `route.ts`. Do **not** import `supabase-js` into the
  pure `_shared` decision modules; only `index.ts` knows about clients.
- **No caching** (decision D9). One load per request, threaded down. `@s28` in task-11 pins this.
- `index.ts` is outside both test harnesses (no `npm:` imports are Jest-loadable) — verify manually
  after `supabase functions deploy`, per the existing `risks.md R1/R2` convention in this repo. Never
  run a deploy from the pipeline.
