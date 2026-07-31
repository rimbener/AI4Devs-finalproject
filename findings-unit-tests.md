# Findings: unit-tests.mdc

## Summary
Listed violations closed: app suites co-located, reducer/helpers suites present, sleep waits removed, transport-mocking profile “integration” deleted (covered by `profile.service.test.ts` + DAO mock).

## Fixed
### Shared `__tests__/` folder
- **Was:** `apps/app-study-buddy/src/__tests__/app/(app)/…`
- **Now:** beside routes — `(app)/_layout.test.tsx`, `(tabs)/_layout.test.tsx`, `_layout.web.test.tsx`, `tabs-layout.test.ts`.

### Missing reducer suites
- `use-lesson-generation.reducer.test.ts`, `use-pdf-extraction.reducer.test.ts`

### Missing helpers suites
- `use-auth.helpers.test.ts`, `open-ended-activity.helpers.test.ts`, `results-summary.helpers.test.ts`, `slide-view.helpers.test.ts`, `lesson-results.helpers.test.ts`, `card-list-with-abm-dialog.helpers.test.ts`

### Sleep-based waits
- `use-session.test.ts` — fake timers + `advanceTimersByTimeAsync`
- `use-lesson-generation.test.ts` — `await Promise.resolve()` microtask flush

### Service suite mocks transport
- **Was:** `profile.integration.test.ts` mocked `getSupabase` while calling `ProfileService`
- **Now:** removed; `profile.service.test.ts` mocks `ProfileDao`
