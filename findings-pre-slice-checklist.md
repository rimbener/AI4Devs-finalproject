# Findings: pre-slice-checklist.mdc

## Summary
Clean on the two static violations. Loading-announce / flattenStyle notes remain soft observations.

## Fixed
### Spy on global `React.useRef`
- **Was:** `lesson-player.test.tsx` injected a fake `measure` ref via `jest.spyOn(React, 'useRef')`.
- **Now:** `LessonPlayer` reads body height from `ScrollView` `onLayout`; tests `fireEvent(..., 'layout', …)` (same pattern as `slide-image`).

### Regex-as-"integration" over SQL source
- **Was:** `composite-pk-migration.test.ts` `readFileSync` + `toMatch` on migration SQL.
- **Now:** file removed. Multi-provider behavior covered by DAO/service/hook tests against mocked Supabase/Edge invoke (not SQL text).

## Observations (non-violations / ambiguous)
- **Loading UI announced** — no silent `ActivityIndicator` found; live regions used.
- **Layout: prefer containment/behavior over `flattenStyle` alone** — still used; often paired with size/containment asserts.
- **Related but out-of-bullet:** `tabs-layout.test.ts` / `open-ended.test.tsx` regex-read TS source (not SQL/Edge). Other `*-migration.test.ts` files still regex SQL — same class as the removed composite-pk test, not listed as this finding’s open violation.
