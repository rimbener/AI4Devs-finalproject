# Findings: app-e2e.mdc

## Summary
Originally **no hard violations**. Soft drifts + process gap fixed 2026-07-31.

## Violations
_None._

## Fixed (was Observations)
- `lesson-player.e2e.js` imports `multipleChoiceOptionTestId` from `@helsoft/activities/test-ids` (no golden-path re-export).
- `mockLessonGeneration` JSDoc updated — list query is fulfilled, not `route.continue()`.
- `login.e2e.js` / `pdf-upload-and-generate.e2e.js` dropped redundant re-asserts (helpers already wait/assert).
- Supabase prerequisites enforced by `scripts/run-e2e.sh` → `e2e-prepare-supabase.sh` (`start`, sync `.env`, `db reset`) on `test:e2e` / `:ci` / `:ui`. Escape: `SKIP_E2E_SUPABASE_PREPARE=1`.

## Remaining Observations (out of scope)
- Only `apps/app-study-buddy` has app-level e2e.

## Clean areas
- testID-first locators; shared `@helsoft/*/test-ids`; CJS `test-ids.js`; no `frameLocator`; interaction-only; filechooser pattern; paid-call mock at network boundary; unique fixtures.
