---
id: task-14
title: Final barrel/export sweep and full-workspace regression pass
slice: 3
scenarios: []
status: todo
paths:
  - libs/types/src/index.ts
  - libs/hooks/src/hooks/index.ts
  - libs/supabase-services/src/dao/index.ts
  - libs/supabase-services/src/services/index.ts
---

## Goal
Close out the feature: confirm every new module is barrel-exported, every touched workspace is
still green after all thirteen prior tasks, and the two whole-feature guarantees — no regression
(s19) and no dead code left behind (s23) — hold across the full diff, not just per-task.

## Done criteria
- [ ] No scenario owned directly by this task (wrap-up sweep, not new behavior) — scenario s19
      re-confirmed: task-5's fixture-parity tests still pass after task-11's deletions
      and task-6/task-7's disabled-provider changes (i.e., the six-provider seed still renders
      identically to today; disabled-provider behavior only activates for a row that is actually
      disabled)
- [ ] Scenario s23 re-confirmed: the repo-wide grep from task-11 (`AI_PROVIDERS`,
      `AI_MODEL_REGISTRY`, `PROVIDER_NAME_KEYS`, `API_KEY_SETTINGS_GUIDANCE_URLS`, `aiModel.`,
      `settings.apiKey.provider.`) is re-run against the final diff and still returns zero matches
- [ ] `AiProviderCatalogEntry`/`AiProviderCatalogModel` (task-1), `AiProvidersDao`/
      `AiProvidersService` (task-1), `useAiProviders`/`AI_PROVIDERS_QUERY_KEY` (task-2) are
      all reachable from their workspace's public barrel (`@helsoft/types`, `@helsoft/
      supabase-services`, `@helsoft/hooks`)
- [ ] `pnpm lint` + `pnpm check-types` + `pnpm test` green across every touched workspace in one run
      (`@helsoft/types`, `@helsoft/hooks`, `@helsoft/supabase-services`, `@helsoft/components`,
      `@helsoft/study-buddy`, `@helsoft/localization`) — not just per-task, since a barrel omission
      or a cross-package type mismatch only shows up once everything compiles together
- [ ] No task left with `status: todo`/`in_progress` in `tasks.md`/its own `task-N.md`

## Notes
- Decision 13. This task adds no new behavior — it is the wrap-up sweep `reviews_lead`/
  `mutation_tester`/`dod_validator` expect to find already done, not something they discover missing.
- If either regression (s19 or s23) fails here, the fix belongs in the task that owns that
  behavior (task-5 or task-11), not a patch bolted onto this task.
