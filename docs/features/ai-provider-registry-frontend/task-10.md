---
id: task-10
title: Prove the "unknown provider" paths are unaffected by both widenings
slice: 2
scenarios: [s13, s17, s18]
status: todo
paths:
  - libs/supabase-services/src/services/lesson-generation.service.test.ts
  - libs/supabase-services/src/services/api-key.service.test.ts
  - libs/supabase-services/src/dao/api-key.dao.test.ts
---

## Goal
Widening two closed unions in the same slice is exactly where an "unknown provider" response could
accidentally get reclassified. Add the regression tests proving it doesn't, across all three
call sites the story names.

## Done criteria
- [ ] Scenario s13 covered: `generate-lesson`'s existing 422 `{ errorCode: 'invalid_model' }` for a
      provider id absent from the catalog still maps to `invalid_model` after task-9's widening —
      never `provider_disabled`
- [ ] Scenario s17 covered: `manage-api-key`'s existing 400/502 `{ code: 'network_error' }` for a
      **save** against a provider id absent from the catalog still maps to `network_error` after
      task-8's widening — never `provider_disabled` or `validation_error`
- [ ] Scenario s18 covered: `manage-api-key`'s existing 400/502 `{ code: 'network_error' }` for a
      **remove** against a provider id absent from the catalog still maps to `network_error`,
      unaffected by task-8 (remove was never gated by `enabled` to begin with, backend D10)
- [ ] Each test asserts on the mapped `ApiKeyErrorCode`/`GenerationErrorCode` value itself, not just
      "no exception thrown" — a silent misclassification must fail the test
- [ ] `pnpm test` green for `@helsoft/supabase-services`

## Notes
- Decisions 8, 9 (mirrors backend D12's "one code, one meaning" — `provider_disabled` only ever
  names a genuinely disabled provider, never an unknown one). This task adds no new production
  code — it is the regression net for task-8/task-9's change, split out as its own task so those two
  tasks each stay focused on their own single new code path.
- If any of these three assertions fails against task-8/task-9's implementation, the fix belongs in
  those tasks (their `isKnownErrorCode`-style guard or catch-branch), not here.
